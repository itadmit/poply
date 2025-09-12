const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdvancedSegmentation {

  // יצירת סגמנט מתקדם
  async createAdvancedSegment(userId, segmentData) {
    try {
      const {
        name,
        description,
        conditions,
        isAutoUpdate = true,
        refreshInterval = 24 // שעות
      } = segmentData;

      const segment = await prisma.segment.create({
        data: {
          userId,
          name,
          description,
          conditions: {
            ...conditions,
            isAdvanced: true,
            autoUpdate: isAutoUpdate,
            refreshInterval
          }
        }
      });

      // חישוב ראשוני של הסגמנט
      await this.calculateSegmentMembers(segment.id);

      return segment;

    } catch (error) {
      console.error('Error creating advanced segment:', error);
      throw error;
    }
  }

  // חישוב חברי הסגמנט
  async calculateSegmentMembers(segmentId) {
    try {
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
        include: { user: true }
      });

      if (!segment) {
        throw new Error('Segment not found');
      }

      // קבלת כל הקונטקטים של המשתמש
      const allContacts = await prisma.contact.findMany({
        where: { userId: segment.userId },
        include: {
          orders: true,
          events: {
            where: {
              createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } // שנה אחרונה
            }
          },
          emailTracking: true
        }
      });

      // סינון קונטקטים לפי תנאי הסגמנט
      const matchingContacts = [];
      
      for (const contact of allContacts) {
        if (await this.evaluateSegmentConditions(segment.conditions, contact)) {
          matchingContacts.push(contact);
        }
      }

      // עדכון חברי הסגמנט
      await this.updateSegmentMembers(segmentId, matchingContacts.map(c => c.id));

      return {
        segmentId,
        totalContacts: matchingContacts.length,
        updatedAt: new Date()
      };

    } catch (error) {
      console.error('Error calculating segment members:', error);
      throw error;
    }
  }

  // הערכת תנאי סגמנט
  async evaluateSegmentConditions(conditions, contact) {
    try {
      const { operator = 'AND', rules } = conditions;

      if (!rules || rules.length === 0) return true;

      const results = [];

      for (const rule of rules) {
        const result = await this.evaluateRule(rule, contact);
        results.push(result);
      }

      // החלת אופרטור לוגי
      if (operator === 'AND') {
        return results.every(r => r);
      } else if (operator === 'OR') {
        return results.some(r => r);
      }

      return false;

    } catch (error) {
      console.error('Error evaluating segment conditions:', error);
      return false;
    }
  }

  // הערכת כלל בודד
  async evaluateRule(rule, contact) {
    try {
      const { field, operator, value, timeframe } = rule;

      switch (field) {
        case 'firstName':
        case 'lastName':
        case 'email':
        case 'phone':
        case 'company':
          return this.evaluateStringField(contact[field], operator, value);

        case 'tags':
          return this.evaluateArrayField(contact.tags, operator, value);

        case 'status':
          return this.evaluateStringField(contact.status, operator, value);

        case 'createdAt':
          return this.evaluateDateField(contact.createdAt, operator, value, timeframe);

        case 'totalOrders':
          return this.evaluateNumberField(contact.orders.length, operator, value);

        case 'totalSpent':
          const totalSpent = contact.orders.reduce((sum, order) => sum + (order.total || 0), 0);
          return this.evaluateNumberField(totalSpent, operator, value);

        case 'avgOrderValue':
          const avgOrderValue = contact.orders.length > 0 
            ? contact.orders.reduce((sum, order) => sum + (order.total || 0), 0) / contact.orders.length
            : 0;
          return this.evaluateNumberField(avgOrderValue, operator, value);

        case 'lastOrderDate':
          if (contact.orders.length === 0) return operator === 'is_null';
          const lastOrder = contact.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          return this.evaluateDateField(lastOrder.createdAt, operator, value, timeframe);

        case 'daysSinceLastOrder':
          if (contact.orders.length === 0) return operator === 'greater_than' && value < 999;
          const lastOrderDate = contact.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt;
          const daysSince = Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
          return this.evaluateNumberField(daysSince, operator, value);

        case 'emailEngagement':
          return this.evaluateEmailEngagement(contact, operator, value, timeframe);

        case 'eventCount':
          return this.evaluateEventCount(contact, operator, value, rule.eventType, timeframe);

        case 'hasEvent':
          return this.evaluateHasEvent(contact, operator, value, timeframe);

        case 'customerLifecycleStage':
          const stage = this.determineLifecycleStage(contact);
          return this.evaluateStringField(stage, operator, value);

        case 'riskLevel':
          const risk = this.calculateChurnRisk(contact);
          return this.evaluateStringField(risk, operator, value);

        case 'clv':
          const clv = await this.calculateCLV(contact);
          return this.evaluateNumberField(clv, operator, value);

        case 'preferredCategory':
          const preferredCategory = this.getPreferredCategory(contact);
          return this.evaluateStringField(preferredCategory, operator, value);

        case 'seasonalBehavior':
          return this.evaluateSeasonalBehavior(contact, operator, value, timeframe);

        case 'deviceType':
          return this.evaluateDeviceType(contact, operator, value, timeframe);

        case 'geolocation':
          return this.evaluateGeolocation(contact, operator, value);

        default:
          console.warn(`Unknown field: ${field}`);
          return false;
      }

    } catch (error) {
      console.error('Error evaluating rule:', error);
      return false;
    }
  }

  // הערכת שדה טקסט
  evaluateStringField(actualValue, operator, expectedValue) {
    if (!actualValue) actualValue = '';
    
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return actualValue.toLowerCase().includes(expectedValue.toLowerCase());
      case 'not_contains':
        return !actualValue.toLowerCase().includes(expectedValue.toLowerCase());
      case 'starts_with':
        return actualValue.toLowerCase().startsWith(expectedValue.toLowerCase());
      case 'ends_with':
        return actualValue.toLowerCase().endsWith(expectedValue.toLowerCase());
      case 'is_empty':
        return !actualValue || actualValue.trim() === '';
      case 'is_not_empty':
        return actualValue && actualValue.trim() !== '';
      default:
        return false;
    }
  }

  // הערכת שדה מספרי
  evaluateNumberField(actualValue, operator, expectedValue) {
    const actual = Number(actualValue) || 0;
    const expected = Number(expectedValue) || 0;

    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'greater_equal':
        return actual >= expected;
      case 'less_equal':
        return actual <= expected;
      case 'between':
        const [min, max] = expectedValue;
        return actual >= min && actual <= max;
      default:
        return false;
    }
  }

  // הערכת שדה תאריך
  evaluateDateField(actualValue, operator, expectedValue, timeframe) {
    const actualDate = new Date(actualValue);
    const now = new Date();

    switch (operator) {
      case 'before':
        return actualDate < new Date(expectedValue);
      case 'after':
        return actualDate > new Date(expectedValue);
      case 'within_days':
        const daysDiff = Math.floor((now - actualDate) / (1000 * 60 * 60 * 24));
        return daysDiff <= expectedValue;
      case 'older_than_days':
        const daysOld = Math.floor((now - actualDate) / (1000 * 60 * 60 * 24));
        return daysOld > expectedValue;
      case 'this_month':
        return actualDate.getMonth() === now.getMonth() && actualDate.getFullYear() === now.getFullYear();
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return actualDate.getMonth() === lastMonth.getMonth() && actualDate.getFullYear() === lastMonth.getFullYear();
      case 'this_year':
        return actualDate.getFullYear() === now.getFullYear();
      default:
        return false;
    }
  }

  // הערכת שדה מערך
  evaluateArrayField(actualArray, operator, expectedValue) {
    if (!actualArray) actualArray = [];

    switch (operator) {
      case 'contains':
        return actualArray.includes(expectedValue);
      case 'not_contains':
        return !actualArray.includes(expectedValue);
      case 'contains_any':
        return expectedValue.some(val => actualArray.includes(val));
      case 'contains_all':
        return expectedValue.every(val => actualArray.includes(val));
      case 'is_empty':
        return actualArray.length === 0;
      case 'is_not_empty':
        return actualArray.length > 0;
      case 'length_equals':
        return actualArray.length === expectedValue;
      case 'length_greater':
        return actualArray.length > expectedValue;
      case 'length_less':
        return actualArray.length < expectedValue;
      default:
        return false;
    }
  }

  // הערכת מעורבות במייל
  evaluateEmailEngagement(contact, operator, value, timeframe) {
    const days = timeframe || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const recentEmails = contact.emailTracking.filter(e => 
      new Date(e.sentAt) >= startDate
    );

    if (recentEmails.length === 0) {
      return operator === 'no_engagement';
    }

    const openRate = recentEmails.filter(e => e.openedAt).length / recentEmails.length * 100;
    const clickRate = recentEmails.filter(e => e.clickedAt).length / recentEmails.length * 100;

    switch (operator) {
      case 'open_rate_above':
        return openRate > value;
      case 'open_rate_below':
        return openRate < value;
      case 'click_rate_above':
        return clickRate > value;
      case 'click_rate_below':
        return clickRate < value;
      case 'high_engagement':
        return openRate > 50 && clickRate > 10;
      case 'low_engagement':
        return openRate < 20 || clickRate < 2;
      case 'no_engagement':
        return openRate === 0 && clickRate === 0;
      default:
        return false;
    }
  }

  // הערכת מספר אירועים
  evaluateEventCount(contact, operator, value, eventType, timeframe) {
    const days = timeframe || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    let events = contact.events.filter(e => new Date(e.createdAt) >= startDate);
    
    if (eventType && eventType !== 'any') {
      events = events.filter(e => e.type === eventType);
    }

    return this.evaluateNumberField(events.length, operator, value);
  }

  // הערכת קיום אירוע
  evaluateHasEvent(contact, operator, eventType, timeframe) {
    const days = timeframe || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const hasEvent = contact.events.some(e => 
      e.type === eventType && new Date(e.createdAt) >= startDate
    );

    return operator === 'has' ? hasEvent : !hasEvent;
  }

  // קביעת שלב במחזור החיים
  determineLifecycleStage(contact) {
    const daysSinceCreated = Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const orderCount = contact.orders.length;
    const totalSpent = contact.orders.reduce((sum, order) => sum + (order.total || 0), 0);

    if (orderCount === 0) {
      return daysSinceCreated < 7 ? 'new_lead' : 'cold_lead';
    }

    if (orderCount === 1) {
      return 'first_time_buyer';
    }

    if (totalSpent > 1000 && orderCount > 5) {
      return 'vip_customer';
    }

    if (orderCount > 2) {
      return 'repeat_customer';
    }

    return 'occasional_buyer';
  }

  // חישוב סיכון נטישה
  calculateChurnRisk(contact) {
    if (contact.orders.length === 0) return 'unknown';

    const lastOrder = contact.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const daysSinceLastOrder = Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastOrder > 180) return 'high';
    if (daysSinceLastOrder > 90) return 'medium';
    if (daysSinceLastOrder > 30) return 'low';
    return 'very_low';
  }

  // חישוב CLV פשוט
  async calculateCLV(contact) {
    if (contact.orders.length === 0) return 0;

    const totalSpent = contact.orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const avgOrderValue = totalSpent / contact.orders.length;
    const customerLifetimeMonths = Math.max(1, contact.orders.length * 2); // הערכה פשוטה

    return avgOrderValue * (contact.orders.length / 12) * customerLifetimeMonths;
  }

  // קבלת קטגוריה מועדפת
  getPreferredCategory(contact) {
    const categoryCounts = {};
    
    contact.orders.forEach(order => {
      if (order.product && order.product.category) {
        const category = order.product.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a);

    return sortedCategories.length > 0 ? sortedCategories[0][0] : null;
  }

  // הערכת התנהגות עונתית
  evaluateSeasonalBehavior(contact, operator, season, timeframe) {
    const seasonMonths = {
      'spring': [2, 3, 4], // מרץ-מאי
      'summer': [5, 6, 7], // יוני-אוגוסט
      'autumn': [8, 9, 10], // ספטמבר-נובמבר
      'winter': [11, 0, 1] // דצמבר-פברואר
    };

    const months = seasonMonths[season];
    if (!months) return false;

    const seasonalOrders = contact.orders.filter(order => {
      const orderMonth = new Date(order.createdAt).getMonth();
      return months.includes(orderMonth);
    });

    const totalOrders = contact.orders.length;
    const seasonalPercentage = totalOrders > 0 ? (seasonalOrders.length / totalOrders) * 100 : 0;

    switch (operator) {
      case 'prefers':
        return seasonalPercentage > 40;
      case 'avoids':
        return seasonalPercentage < 10;
      case 'neutral':
        return seasonalPercentage >= 20 && seasonalPercentage <= 30;
      default:
        return false;
    }
  }

  // הערכת סוג מכשיר
  evaluateDeviceType(contact, operator, deviceType, timeframe) {
    // כאן ניתן להוסיף לוגיקה לזיהוי סוג מכשיר מנתוני האירועים
    // לעת עתה נחזיר false
    return false;
  }

  // הערכת מיקום גיאוגרפי
  evaluateGeolocation(contact, operator, location) {
    // כאן ניתן להוסיף לוגיקה למיקום גיאוגרפי
    // לעת עתה נחזיר false
    return false;
  }

  // עדכון חברי סגמנט
  async updateSegmentMembers(segmentId, contactIds) {
    try {
      // מחיקת חברים קיימים
      await prisma.segmentContact.deleteMany({
        where: { segmentId }
      });

      // הוספת חברים חדשים
      if (contactIds.length > 0) {
        await prisma.segmentContact.createMany({
          data: contactIds.map(contactId => ({
            segmentId,
            contactId
          }))
        });
      }

      return contactIds.length;

    } catch (error) {
      console.error('Error updating segment members:', error);
      throw error;
    }
  }

  // רענון אוטומטי של סגמנטים
  async refreshAutoUpdateSegments(userId) {
    try {
      const autoUpdateSegments = await prisma.segment.findMany({
        where: {
          userId,
          conditions: {
            path: ['autoUpdate'],
            equals: true
          }
        }
      });

      const results = [];

      for (const segment of autoUpdateSegments) {
        try {
          const result = await this.calculateSegmentMembers(segment.id);
          results.push({
            segmentId: segment.id,
            name: segment.name,
            ...result
          });
        } catch (error) {
          console.error(`Error refreshing segment ${segment.id}:`, error);
          results.push({
            segmentId: segment.id,
            name: segment.name,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Error refreshing auto-update segments:', error);
      throw error;
    }
  }

  // קבלת סטטיסטיקות סגמנט
  async getSegmentStats(segmentId) {
    try {
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
        include: {
          contacts: {
            include: {
              contact: {
                include: {
                  orders: true,
                  events: {
                    where: {
                      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!segment) {
        throw new Error('Segment not found');
      }

      const contacts = segment.contacts.map(sc => sc.contact);
      
      const stats = {
        totalContacts: contacts.length,
        totalSpent: contacts.reduce((sum, c) => 
          sum + c.orders.reduce((orderSum, o) => orderSum + (o.total || 0), 0), 0
        ),
        avgOrderValue: 0,
        totalOrders: contacts.reduce((sum, c) => sum + c.orders.length, 0),
        activeContacts: contacts.filter(c => 
          c.events.length > 0 || 
          c.orders.some(o => (Date.now() - new Date(o.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000)
        ).length,
        lifeCycleDistribution: {},
        riskDistribution: {}
      };

      if (stats.totalOrders > 0) {
        stats.avgOrderValue = stats.totalSpent / stats.totalOrders;
      }

      // חישוב התפלגות שלבי מחזור חיים
      contacts.forEach(contact => {
        const stage = this.determineLifecycleStage(contact);
        stats.lifeCycleDistribution[stage] = (stats.lifeCycleDistribution[stage] || 0) + 1;
      });

      // חישוב התפלגות רמת סיכון
      contacts.forEach(contact => {
        const risk = this.calculateChurnRisk(contact);
        stats.riskDistribution[risk] = (stats.riskDistribution[risk] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('Error getting segment stats:', error);
      throw error;
    }
  }

  // יצוא חברי סגמנט
  async exportSegmentMembers(segmentId, format = 'json') {
    try {
      const segment = await prisma.segment.findUnique({
        where: { id: segmentId },
        include: {
          contacts: {
            include: {
              contact: {
                include: {
                  orders: true
                }
              }
            }
          }
        }
      });

      if (!segment) {
        throw new Error('Segment not found');
      }

      const contacts = segment.contacts.map(sc => {
        const contact = sc.contact;
        return {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          tags: contact.tags,
          status: contact.status,
          totalOrders: contact.orders.length,
          totalSpent: contact.orders.reduce((sum, order) => sum + (order.total || 0), 0),
          createdAt: contact.createdAt,
          lifeCycleStage: this.determineLifecycleStage(contact),
          riskLevel: this.calculateChurnRisk(contact)
        };
      });

      if (format === 'csv') {
        return this.convertToCSV(contacts);
      }

      return contacts;

    } catch (error) {
      console.error('Error exporting segment members:', error);
      throw error;
    }
  }

  // המרה ל-CSV
  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (Array.isArray(value)) {
            return `"${value.join(';')}"`;
          }
          return `"${value || ''}"`;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

module.exports = new AdvancedSegmentation();
