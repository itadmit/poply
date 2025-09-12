const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DynamicContent {

  // יצירת תוכן דינמי בהתבסס על נתוני הלקוח
  async generatePersonalizedContent(contactId, templateType, baseContent) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { product: true }
          },
          events: {
            where: {
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // איסוף נתונים לפרסונליזציה
      const personalizationData = await this.collectPersonalizationData(contact);
      
      // יצירת תוכן מותאם
      const personalizedContent = this.applyPersonalization(baseContent, personalizationData, templateType);

      return {
        contactId,
        templateType,
        personalizedContent,
        personalizationData,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating personalized content:', error);
      throw error;
    }
  }

  // איסוף נתונים לפרסונליזציה
  async collectPersonalizationData(contact) {
    const data = {
      // נתונים בסיסיים
      firstName: contact.firstName || 'לקוח יקר',
      lastName: contact.lastName || '',
      fullName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'לקוח יקר',
      email: contact.email,
      phone: contact.phone,
      company: contact.company,

      // נתוני רכישות
      totalOrders: contact.orders.length,
      totalSpent: contact.orders.reduce((sum, order) => sum + (order.total || 0), 0),
      lastOrder: contact.orders[0] || null,
      favoriteProducts: this.getFavoriteProducts(contact.orders),
      avgOrderValue: contact.orders.length > 0 
        ? contact.orders.reduce((sum, order) => sum + (order.total || 0), 0) / contact.orders.length 
        : 0,

      // נתוני התנהגות
      recentActivity: this.getRecentActivity(contact.events),
      preferredCategories: this.getPreferredCategories(contact.orders),
      engagementLevel: this.calculateEngagementLevel(contact.events),
      
      // נתוני זמן
      daysSinceLastOrder: contact.orders[0] 
        ? Math.floor((Date.now() - new Date(contact.orders[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      
      // סגמנטציה
      customerSegment: this.determineCustomerSegment(contact),
      lifeCycleStage: this.determineLifeCycleStage(contact),
      riskLevel: this.calculateChurnRisk(contact)
    };

    return data;
  }

  // קבלת מוצרים מועדפים
  getFavoriteProducts(orders) {
    const productCounts = {};
    
    orders.forEach(order => {
      if (order.product) {
        const productName = order.product.name;
        productCounts[productName] = (productCounts[productName] || 0) + 1;
      }
    });

    return Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }

  // קבלת פעילות אחרונה
  getRecentActivity(events) {
    const activityTypes = {
      'PAGE_VIEW': 'צפה בדף',
      'EMAIL_OPEN': 'פתח מייל',
      'EMAIL_CLICK': 'לחץ על קישור',
      'CART_ADD': 'הוסיף לעגלה',
      'ORDER_COMPLETE': 'השלים הזמנה'
    };

    return events.slice(0, 5).map(event => ({
      type: activityTypes[event.type] || event.type,
      date: event.createdAt,
      data: event.data
    }));
  }

  // קבלת קטגוריות מועדפות
  getPreferredCategories(orders) {
    const categoryCounts = {};
    
    orders.forEach(order => {
      if (order.product && order.product.category) {
        const category = order.product.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
  }

  // חישוב רמת מעורבות
  calculateEngagementLevel(events) {
    if (events.length === 0) return 'נמוכה';
    
    const recentEvents = events.filter(e => 
      (Date.now() - new Date(e.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    );

    if (recentEvents.length >= 10) return 'גבוהה';
    if (recentEvents.length >= 5) return 'בינונית';
    return 'נמוכה';
  }

  // קביעת סגמנט לקוח
  determineCustomerSegment(contact) {
    const totalSpent = contact.orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const orderCount = contact.orders.length;

    if (totalSpent > 1000 && orderCount > 5) return 'VIP';
    if (totalSpent > 500 || orderCount > 3) return 'נאמן';
    if (orderCount > 1) return 'חוזר';
    if (orderCount === 1) return 'חדש';
    return 'פוטנציאלי';
  }

  // קביעת שלב במחזור החיים
  determineLifeCycleStage(contact) {
    const daysSinceCreated = Math.floor((Date.now() - new Date(contact.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const orderCount = contact.orders.length;
    const daysSinceLastOrder = contact.orders[0] 
      ? Math.floor((Date.now() - new Date(contact.orders[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (orderCount === 0 && daysSinceCreated < 7) return 'חדש';
    if (orderCount === 0 && daysSinceCreated >= 7) return 'לא פעיל';
    if (orderCount > 0 && daysSinceLastOrder < 30) return 'פעיל';
    if (orderCount > 0 && daysSinceLastOrder < 90) return 'בסיכון';
    return 'נטש';
  }

  // חישוב סיכון נטישה
  calculateChurnRisk(contact) {
    const daysSinceLastOrder = contact.orders[0] 
      ? Math.floor((Date.now() - new Date(contact.orders[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastOrder > 180) return 'גבוה';
    if (daysSinceLastOrder > 90) return 'בינוני';
    return 'נמוך';
  }

  // החלת פרסונליזציה על התוכן
  applyPersonalization(baseContent, data, templateType) {
    let content = baseContent;

    // החלפת משתנים בסיסיים
    content = content.replace(/\{\{firstName\}\}/g, data.firstName);
    content = content.replace(/\{\{lastName\}\}/g, data.lastName);
    content = content.replace(/\{\{fullName\}\}/g, data.fullName);
    content = content.replace(/\{\{email\}\}/g, data.email);
    content = content.replace(/\{\{company\}\}/g, data.company || '');

    // החלפת משתני רכישות
    content = content.replace(/\{\{totalOrders\}\}/g, data.totalOrders);
    content = content.replace(/\{\{totalSpent\}\}/g, `${Math.round(data.totalSpent)}₪`);
    content = content.replace(/\{\{avgOrderValue\}\}/g, `${Math.round(data.avgOrderValue)}₪`);

    // תוכן דינמי בהתבסס על סגמנט
    content = this.applySegmentBasedContent(content, data);

    // תוכן דינמי בהתבסס על זמן
    content = this.applyTimeBasedContent(content, data);

    // המלצות מוצרים
    content = this.applyProductRecommendations(content, data);

    // הודעות מותאמות אישית
    content = this.applyPersonalizedMessages(content, data, templateType);

    return content;
  }

  // תוכן בהתבסס על סגמנט
  applySegmentBasedContent(content, data) {
    const segmentContent = {
      'VIP': 'כלקוח VIP שלנו, אתה זכאי להנחות מיוחדות ולשירות עדיפות',
      'נאמן': 'תודה על הנאמנות שלך! הנה הצעה מיוחדת בשבילך',
      'חוזר': 'שמחים לראות אותך שוב! יש לנו משהו מיוחד בשבילך',
      'חדש': 'ברוכים הבאים! הנה הנחה מיוחדת ללקוחות חדשים',
      'פוטנציאלי': 'מעוניינים להצטרף למשפחה שלנו? הנה הצעה שלא תוכלו לסרב לה'
    };

    const segmentMessage = segmentContent[data.customerSegment] || '';
    content = content.replace(/\{\{segmentMessage\}\}/g, segmentMessage);

    return content;
  }

  // תוכן בהתבסס על זמן
  applyTimeBasedContent(content, data) {
    let timeGreeting = '';
    
    if (data.timeOfDay >= 6 && data.timeOfDay < 12) {
      timeGreeting = 'בוקר טוב';
    } else if (data.timeOfDay >= 12 && data.timeOfDay < 18) {
      timeGreeting = 'צהריים טובים';
    } else if (data.timeOfDay >= 18 && data.timeOfDay < 22) {
      timeGreeting = 'ערב טוב';
    } else {
      timeGreeting = 'לילה טוב';
    }

    content = content.replace(/\{\{timeGreeting\}\}/g, timeGreeting);

    // תוכן בהתבסס על יום בשבוע
    const dayMessages = {
      0: 'יום ראשון נעים!',
      1: 'שבוע טוב!',
      2: 'יום שלישי פרודוקטיבי!',
      3: 'אמצע השבוע - זמן מושלם לקנייה!',
      4: 'יום חמישי מבורך!',
      5: 'שבת שלום!',
      6: 'שבת שלום!'
    };

    content = content.replace(/\{\{dayMessage\}\}/g, dayMessages[data.dayOfWeek] || '');

    return content;
  }

  // המלצות מוצרים
  applyProductRecommendations(content, data) {
    let recommendations = '';

    if (data.favoriteProducts.length > 0) {
      const topProduct = data.favoriteProducts[0];
      recommendations = `בהתבסס על הרכישות הקודמות שלך, אנחנו חושבים שתאהב גם מוצרים דומים ל-${topProduct.name}`;
    } else if (data.preferredCategories.length > 0) {
      const topCategory = data.preferredCategories[0];
      recommendations = `ראינו שאתה מעוניין ב-${topCategory.category}, יש לנו מוצרים חדשים בקטגוריה זו!`;
    } else {
      recommendations = 'גלה את המוצרים הפופולריים ביותר שלנו';
    }

    content = content.replace(/\{\{productRecommendations\}\}/g, recommendations);

    return content;
  }

  // הודעות מותאמות אישית
  applyPersonalizedMessages(content, data, templateType) {
    let personalMessage = '';

    // הודעות בהתבסס על שלב במחזור החיים
    if (data.lifeCycleStage === 'בסיכון') {
      personalMessage = 'התגעגענו אליך! הנה הצעה מיוחדת כדי לחזור אלינו';
    } else if (data.lifeCycleStage === 'נטש') {
      personalMessage = 'זה זמן רב שלא ראינו אותך. בוא נתחיל מחדש עם הנחה של 20%';
    } else if (data.daysSinceLastOrder && data.daysSinceLastOrder < 7) {
      personalMessage = 'תודה על הרכישה האחרונה! מה דעתך על מוצרים משלימים?';
    }

    // הודעות בהתבסס על סוג התבנית
    if (templateType === 'cart_abandonment' && data.recentActivity.some(a => a.type === 'הוסיף לעגלה')) {
      personalMessage = 'שכחת משהו בעגלה? המוצרים שלך מחכים לך!';
    } else if (templateType === 'birthday' && data.firstName) {
      personalMessage = `יום הולדת שמח ${data.firstName}! הנה מתנה מיוחדת בשבילך`;
    }

    content = content.replace(/\{\{personalMessage\}\}/g, personalMessage);

    return content;
  }

  // יצירת תוכן דינמי למייל
  async generateDynamicEmail(contactId, emailTemplate) {
    try {
      const personalizedContent = await this.generatePersonalizedContent(
        contactId, 
        'email', 
        emailTemplate.content
      );

      // יצירת נושא דינמי
      const personalizedSubject = this.applyPersonalization(
        emailTemplate.subject, 
        personalizedContent.personalizationData, 
        'email'
      );

      return {
        subject: personalizedSubject,
        content: personalizedContent.personalizedContent,
        personalizationData: personalizedContent.personalizationData
      };

    } catch (error) {
      console.error('Error generating dynamic email:', error);
      throw error;
    }
  }

  // יצירת תוכן דינמי לאסמס
  async generateDynamicSMS(contactId, smsTemplate) {
    try {
      const personalizedContent = await this.generatePersonalizedContent(
        contactId, 
        'sms', 
        smsTemplate.content
      );

      // הגבלת אורך לאסמס (160 תווים)
      let smsContent = personalizedContent.personalizedContent;
      if (smsContent.length > 160) {
        smsContent = smsContent.substring(0, 157) + '...';
      }

      return {
        content: smsContent,
        personalizationData: personalizedContent.personalizationData
      };

    } catch (error) {
      console.error('Error generating dynamic SMS:', error);
      throw error;
    }
  }

  // יצירת תוכן דינמי לפופאפ
  async generateDynamicPopup(contactId, popupTemplate) {
    try {
      const personalizedContent = await this.generatePersonalizedContent(
        contactId, 
        'popup', 
        popupTemplate.content
      );

      return {
        title: this.applyPersonalization(
          popupTemplate.title, 
          personalizedContent.personalizationData, 
          'popup'
        ),
        content: personalizedContent.personalizedContent,
        personalizationData: personalizedContent.personalizationData
      };

    } catch (error) {
      console.error('Error generating dynamic popup:', error);
      throw error;
    }
  }

  // בדיקת תוכן דינמי (preview)
  async previewDynamicContent(contactId, template, templateType) {
    try {
      const personalizedContent = await this.generatePersonalizedContent(
        contactId, 
        templateType, 
        template.content
      );

      const preview = {
        original: template,
        personalized: {
          content: personalizedContent.personalizedContent,
          subject: template.subject ? this.applyPersonalization(
            template.subject, 
            personalizedContent.personalizationData, 
            templateType
          ) : undefined
        },
        personalizationData: personalizedContent.personalizationData,
        changes: this.identifyChanges(template.content, personalizedContent.personalizedContent)
      };

      return preview;

    } catch (error) {
      console.error('Error previewing dynamic content:', error);
      throw error;
    }
  }

  // זיהוי שינויים בתוכן
  identifyChanges(original, personalized) {
    const changes = [];
    const variablePattern = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = variablePattern.exec(original)) !== null) {
      changes.push({
        variable: match[1],
        placeholder: match[0],
        wasReplaced: !personalized.includes(match[0])
      });
    }

    return changes;
  }

  // שמירת תבנית תוכן דינמי
  async saveDynamicTemplate(userId, templateData) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const template = await prisma.dynamicTemplate.create({
        data: {
          userId,
          name: templateData.name,
          type: templateData.type,
          subject: templateData.subject,
          content: templateData.content,
          variables: templateData.variables || [],
          conditions: templateData.conditions || {},
          isActive: templateData.isActive !== false
        }
      });

      return template;

    } catch (error) {
      console.error('Error saving dynamic template:', error);
      throw error;
    }
  }
}

module.exports = new DynamicContent();
