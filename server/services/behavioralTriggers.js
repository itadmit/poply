const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const emailService = require('./emailService');
const smsQueueService = require('./smsQueueService');

class BehavioralTriggers {

  // יצירת טריגר התנהגותי חדש
  async createBehavioralTrigger(userId, triggerData) {
    try {
      const {
        name,
        description,
        triggerType,
        conditions,
        actions,
        isActive = true,
        cooldownPeriod = 24, // שעות
        maxExecutions = null,
        priority = 'medium'
      } = triggerData;

      const trigger = await prisma.behavioralTrigger.create({
        data: {
          userId,
          name,
          description,
          triggerType,
          conditions,
          actions,
          isActive,
          cooldownPeriod,
          maxExecutions,
          priority,
          executionCount: 0
        }
      });

      return trigger;

    } catch (error) {
      console.error('Error creating behavioral trigger:', error);
      throw error;
    }
  }

  // עיבוד אירוע ובדיקת טריגרים
  async processEvent(eventData) {
    try {
      const { userId, contactId, eventType, data } = eventData;

      // קבלת כל הטריגרים הפעילים של המשתמש
      const triggers = await prisma.behavioralTrigger.findMany({
        where: {
          userId,
          isActive: true,
          OR: [
            { maxExecutions: null },
            { executionCount: { lt: prisma.behavioralTrigger.fields.maxExecutions } }
          ]
        }
      });

      const executedTriggers = [];

      for (const trigger of triggers) {
        try {
          // בדיקה אם הטריגר מתאים לאירוע
          if (await this.shouldExecuteTrigger(trigger, eventType, data, contactId)) {
            // בדיקת cooldown
            if (await this.isCooldownActive(trigger.id, contactId)) {
              continue;
            }

            // הפעלת הטריגר
            await this.executeTrigger(trigger, contactId, eventData);
            executedTriggers.push(trigger);

            // עדכון מונה הפעלות
            await prisma.behavioralTrigger.update({
              where: { id: trigger.id },
              data: { executionCount: { increment: 1 } }
            });

            // רישום הפעלה
            await this.logTriggerExecution(trigger.id, contactId, eventData);
          }
        } catch (error) {
          console.error(`Error executing trigger ${trigger.id}:`, error);
        }
      }

      return executedTriggers;

    } catch (error) {
      console.error('Error processing behavioral event:', error);
      throw error;
    }
  }

  // בדיקה אם יש להפעיל טריגר
  async shouldExecuteTrigger(trigger, eventType, eventData, contactId) {
    try {
      const conditions = trigger.conditions;

      // בדיקת סוג אירוע
      if (conditions.eventTypes && !conditions.eventTypes.includes(eventType)) {
        return false;
      }

      // בדיקת תנאים מתקדמים
      if (conditions.advanced) {
        return await this.evaluateAdvancedConditions(conditions.advanced, contactId, eventType, eventData);
      }

      return true;

    } catch (error) {
      console.error('Error evaluating trigger conditions:', error);
      return false;
    }
  }

  // הערכת תנאים מתקדמים
  async evaluateAdvancedConditions(conditions, contactId, eventType, eventData) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          orders: true,
          events: {
            where: {
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      });

      if (!contact) return false;

      // בדיקת תנאי זמן
      if (conditions.timeConditions) {
        if (!this.evaluateTimeConditions(conditions.timeConditions)) {
          return false;
        }
      }

      // בדיקת תנאי לקוח
      if (conditions.customerConditions) {
        if (!this.evaluateCustomerConditions(conditions.customerConditions, contact)) {
          return false;
        }
      }

      // בדיקת תנאי התנהגות
      if (conditions.behaviorConditions) {
        if (!this.evaluateBehaviorConditions(conditions.behaviorConditions, contact, eventType, eventData)) {
          return false;
        }
      }

      // בדיקת תנאי רכישות
      if (conditions.purchaseConditions) {
        if (!this.evaluatePurchaseConditions(conditions.purchaseConditions, contact)) {
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Error evaluating advanced conditions:', error);
      return false;
    }
  }

  // הערכת תנאי זמן
  evaluateTimeConditions(timeConditions) {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // בדיקת שעות
    if (timeConditions.hours) {
      const { start, end } = timeConditions.hours;
      if (hour < start || hour > end) {
        return false;
      }
    }

    // בדיקת ימים בשבוע
    if (timeConditions.daysOfWeek && !timeConditions.daysOfWeek.includes(day)) {
      return false;
    }

    return true;
  }

  // הערכת תנאי לקוח
  evaluateCustomerConditions(customerConditions, contact) {
    // בדיקת סגמנט לקוח
    if (customerConditions.segments) {
      // כאן ניתן להוסיף לוגיקה לבדיקת סגמנטים
    }

    // בדיקת תגיות
    if (customerConditions.tags) {
      const hasRequiredTags = customerConditions.tags.every(tag => 
        contact.tags.includes(tag)
      );
      if (!hasRequiredTags) return false;
    }

    // בדיקת זמן הרשמה
    if (customerConditions.registrationDate) {
      const daysSinceRegistration = Math.floor(
        (Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const { operator, value } = customerConditions.registrationDate;
      if (!this.evaluateNumericCondition(daysSinceRegistration, operator, value)) {
        return false;
      }
    }

    return true;
  }

  // הערכת תנאי התנהגות
  evaluateBehaviorConditions(behaviorConditions, contact, eventType, eventData) {
    // בדיקת מספר אירועים
    if (behaviorConditions.eventCount) {
      const { eventType: targetEventType, operator, value, timeframe } = behaviorConditions.eventCount;
      
      const startDate = timeframe 
        ? new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000)
        : new Date(0);

      const eventCount = contact.events.filter(e => 
        e.type === targetEventType && new Date(e.createdAt) >= startDate
      ).length;

      if (!this.evaluateNumericCondition(eventCount, operator, value)) {
        return false;
      }
    }

    // בדיקת רצף אירועים
    if (behaviorConditions.eventSequence) {
      if (!this.evaluateEventSequence(behaviorConditions.eventSequence, contact.events)) {
        return false;
      }
    }

    // בדיקת נתוני אירוע ספציפיים
    if (behaviorConditions.eventData) {
      if (!this.evaluateEventData(behaviorConditions.eventData, eventData)) {
        return false;
      }
    }

    return true;
  }

  // הערכת תנאי רכישות
  evaluatePurchaseConditions(purchaseConditions, contact) {
    const totalSpent = contact.orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const orderCount = contact.orders.length;

    // בדיקת סכום כולל
    if (purchaseConditions.totalSpent) {
      const { operator, value } = purchaseConditions.totalSpent;
      if (!this.evaluateNumericCondition(totalSpent, operator, value)) {
        return false;
      }
    }

    // בדיקת מספר הזמנות
    if (purchaseConditions.orderCount) {
      const { operator, value } = purchaseConditions.orderCount;
      if (!this.evaluateNumericCondition(orderCount, operator, value)) {
        return false;
      }
    }

    // בדיקת זמן מאז הזמנה אחרונה
    if (purchaseConditions.daysSinceLastOrder && contact.orders.length > 0) {
      const lastOrder = contact.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const daysSinceLastOrder = Math.floor(
        (Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const { operator, value } = purchaseConditions.daysSinceLastOrder;
      if (!this.evaluateNumericCondition(daysSinceLastOrder, operator, value)) {
        return false;
      }
    }

    return true;
  }

  // הערכת תנאי מספרי
  evaluateNumericCondition(actualValue, operator, expectedValue) {
    switch (operator) {
      case 'equals': return actualValue === expectedValue;
      case 'greater_than': return actualValue > expectedValue;
      case 'less_than': return actualValue < expectedValue;
      case 'greater_equal': return actualValue >= expectedValue;
      case 'less_equal': return actualValue <= expectedValue;
      case 'not_equals': return actualValue !== expectedValue;
      default: return false;
    }
  }

  // הערכת רצף אירועים
  evaluateEventSequence(sequenceCondition, events) {
    const { sequence, timeframe } = sequenceCondition;
    const startDate = timeframe 
      ? new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000)
      : new Date(0);

    const recentEvents = events
      .filter(e => new Date(e.createdAt) >= startDate)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // בדיקה אם הרצף קיים באירועים האחרונים
    let sequenceIndex = 0;
    for (const event of recentEvents) {
      if (event.type === sequence[sequenceIndex]) {
        sequenceIndex++;
        if (sequenceIndex === sequence.length) {
          return true;
        }
      }
    }

    return false;
  }

  // הערכת נתוני אירוע
  evaluateEventData(eventDataCondition, actualEventData) {
    for (const [key, condition] of Object.entries(eventDataCondition)) {
      const actualValue = actualEventData[key];
      
      if (condition.operator === 'contains' && typeof actualValue === 'string') {
        if (!actualValue.includes(condition.value)) return false;
      } else if (condition.operator === 'equals') {
        if (actualValue !== condition.value) return false;
      }
    }

    return true;
  }

  // בדיקת cooldown
  async isCooldownActive(triggerId, contactId) {
    try {
      const trigger = await prisma.behavioralTrigger.findUnique({
        where: { id: triggerId }
      });

      if (!trigger || !trigger.cooldownPeriod) return false;

      const lastExecution = await prisma.triggerExecution.findFirst({
        where: { triggerId, contactId },
        orderBy: { executedAt: 'desc' }
      });

      if (!lastExecution) return false;

      const cooldownEnd = new Date(lastExecution.executedAt.getTime() + trigger.cooldownPeriod * 60 * 60 * 1000);
      return new Date() < cooldownEnd;

    } catch (error) {
      console.error('Error checking cooldown:', error);
      return false;
    }
  }

  // הפעלת טריגר
  async executeTrigger(trigger, contactId, eventData) {
    try {
      const actions = trigger.actions;

      for (const action of actions) {
        await this.executeAction(action, contactId, eventData, trigger);
      }

    } catch (error) {
      console.error('Error executing trigger actions:', error);
      throw error;
    }
  }

  // הפעלת פעולה ספציפית
  async executeAction(action, contactId, eventData, trigger) {
    try {
      switch (action.type) {
        case 'send_email':
          await this.sendTriggeredEmail(action, contactId, eventData);
          break;
        
        case 'send_sms':
          await this.sendTriggeredSMS(action, contactId, eventData);
          break;
        
        case 'add_tag':
          await this.addTagToContact(action, contactId);
          break;
        
        case 'remove_tag':
          await this.removeTagFromContact(action, contactId);
          break;
        
        case 'update_segment':
          await this.updateContactSegment(action, contactId);
          break;
        
        case 'create_task':
          await this.createTask(action, contactId, trigger);
          break;
        
        case 'webhook':
          await this.callWebhook(action, contactId, eventData);
          break;
        
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }

    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
    }
  }

  // שליחת מייל מופעל
  async sendTriggeredEmail(action, contactId, eventData) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      });

      if (!contact || !contact.email) return;

      const emailData = {
        to: contact.email,
        subject: action.subject || 'הודעה אוטומטית',
        content: action.content || 'תוכן ברירת מחדל',
        contactId
      };

      // אם יש תבנית דינמית, השתמש בה
      if (action.templateId) {
        const dynamicContent = require('./dynamicContent');
        const template = await prisma.dynamicTemplate.findUnique({
          where: { id: action.templateId }
        });
        
        if (template) {
          const personalizedEmail = await dynamicContent.generateDynamicEmail(contactId, template);
          emailData.subject = personalizedEmail.subject;
          emailData.content = personalizedEmail.content;
        }
      }

      await emailService.sendEmail(emailData);

    } catch (error) {
      console.error('Error sending triggered email:', error);
    }
  }

  // שליחת SMS מופעל
  async sendTriggeredSMS(action, contactId, eventData) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: { user: true }
      });

      if (!contact || !contact.phone) return;

      const smsData = {
        recipient: contact.phone,
        content: action.content || 'הודעה אוטומטית',
        sender: action.sender || contact.user.smsSenderName || 'Poply'
      };

              await smsQueueService.sendSms(contact.userId, contact.phone, smsData.content, smsData.sender, null, contact.id);

    } catch (error) {
      console.error('Error sending triggered SMS:', error);
    }
  }

  // הוספת תגית ללקוח
  async addTagToContact(action, contactId) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      });

      if (!contact) return;

      const updatedTags = [...new Set([...contact.tags, action.tag])];
      
      await prisma.contact.update({
        where: { id: contactId },
        data: { tags: updatedTags }
      });

    } catch (error) {
      console.error('Error adding tag to contact:', error);
    }
  }

  // הסרת תגית מלקוח
  async removeTagFromContact(action, contactId) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      });

      if (!contact) return;

      const updatedTags = contact.tags.filter(tag => tag !== action.tag);
      
      await prisma.contact.update({
        where: { id: contactId },
        data: { tags: updatedTags }
      });

    } catch (error) {
      console.error('Error removing tag from contact:', error);
    }
  }

  // עדכון סגמנט לקוח
  async updateContactSegment(action, contactId) {
    try {
      // כאן ניתן להוסיף לוגיקה לעדכון סגמנטים
      console.log(`Updating segment for contact ${contactId} to ${action.segmentId}`);

    } catch (error) {
      console.error('Error updating contact segment:', error);
    }
  }

  // יצירת משימה
  async createTask(action, contactId, trigger) {
    try {
      // כאן ניתן להוסיף לוגיקה ליצירת משימות
      console.log(`Creating task for contact ${contactId}: ${action.description}`);

    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  // קריאה ל-webhook
  async callWebhook(action, contactId, eventData) {
    try {
      const fetch = require('node-fetch');
      
      const payload = {
        contactId,
        eventData,
        timestamp: new Date().toISOString(),
        ...action.payload
      };

      await fetch(action.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.headers
        },
        body: JSON.stringify(payload)
      });

    } catch (error) {
      console.error('Error calling webhook:', error);
    }
  }

  // רישום הפעלת טריגר
  async logTriggerExecution(triggerId, contactId, eventData) {
    try {
      await prisma.triggerExecution.create({
        data: {
          triggerId,
          contactId,
          eventData,
          executedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error logging trigger execution:', error);
    }
  }

  // קבלת סטטיסטיקות טריגרים
  async getTriggerStats(userId, timeframe = 30) {
    try {
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

      const triggers = await prisma.behavioralTrigger.findMany({
        where: { userId },
        include: {
          executions: {
            where: { executedAt: { gte: startDate } }
          }
        }
      });

      const stats = {
        totalTriggers: triggers.length,
        activeTriggers: triggers.filter(t => t.isActive).length,
        totalExecutions: triggers.reduce((sum, t) => sum + t.executions.length, 0),
        triggerPerformance: triggers.map(trigger => ({
          id: trigger.id,
          name: trigger.name,
          executionCount: trigger.executions.length,
          isActive: trigger.isActive
        }))
      };

      return stats;

    } catch (error) {
      console.error('Error getting trigger stats:', error);
      throw error;
    }
  }
}

module.exports = new BehavioralTriggers();
