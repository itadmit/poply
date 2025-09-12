const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PredictiveAnalytics {
  
  // חישוב Customer Lifetime Value (CLV)
  async calculateCLV(contactId) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          orders: true,
          events: {
            where: { type: 'ORDER_COMPLETE' }
          }
        }
      });

      if (!contact || !contact.orders.length) {
        return { clv: 0, prediction: 'new_customer' };
      }

      // חישוב ממוצע הזמנה
      const totalRevenue = contact.orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const averageOrderValue = totalRevenue / contact.orders.length;
      
      // חישוב תדירות הזמנות (הזמנות לחודש)
      const firstOrder = new Date(Math.min(...contact.orders.map(o => new Date(o.createdAt))));
      const monthsSinceFirst = Math.max(1, (Date.now() - firstOrder.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const orderFrequency = contact.orders.length / monthsSinceFirst;

      // חיזוי CLV (פשוט - ניתן לשפר עם ML)
      const predictedLifetimeMonths = this.predictCustomerLifetime(contact);
      const clv = averageOrderValue * orderFrequency * predictedLifetimeMonths;

      return {
        clv: Math.round(clv * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        orderFrequency: Math.round(orderFrequency * 100) / 100,
        predictedLifetimeMonths,
        prediction: this.getCustomerSegment(clv)
      };

    } catch (error) {
      console.error('Error calculating CLV:', error);
      return { clv: 0, prediction: 'unknown' };
    }
  }

  // חיזוי אורך חיי הלקוח
  predictCustomerLifetime(contact) {
    const daysSinceLastOrder = contact.orders.length > 0 
      ? (Date.now() - new Date(contact.orders[contact.orders.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    // אלגוריתם פשוט - ניתן לשפר
    if (daysSinceLastOrder > 180) return 6; // לקוח לא פעיל
    if (daysSinceLastOrder > 90) return 12; // לקוח בסיכון
    if (contact.orders.length > 5) return 24; // לקוח נאמן
    if (contact.orders.length > 2) return 18; // לקוח חוזר
    return 12; // לקוח חדש
  }

  // סיווג לקוח לפי CLV
  getCustomerSegment(clv) {
    if (clv > 1000) return 'vip';
    if (clv > 500) return 'high_value';
    if (clv > 200) return 'medium_value';
    if (clv > 50) return 'low_value';
    return 'new_customer';
  }

  // חיזוי נטישת עגלה
  async predictCartAbandonment(contactId) {
    try {
      const recentEvents = await prisma.event.findMany({
        where: {
          contactId,
          type: { in: ['CART_ADD', 'CHECKOUT_START', 'ORDER_COMPLETE'] },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // שבוע אחרון
        },
        orderBy: { createdAt: 'desc' }
      });

      const hasCartAdd = recentEvents.some(e => e.type === 'CART_ADD');
      const hasCheckoutStart = recentEvents.some(e => e.type === 'CHECKOUT_START');
      const hasOrderComplete = recentEvents.some(e => e.type === 'ORDER_COMPLETE');

      let abandonmentRisk = 0;
      
      if (hasCartAdd && !hasOrderComplete) {
        abandonmentRisk += 40;
        if (hasCheckoutStart) abandonmentRisk += 30;
        
        // בדיקת זמן מאז הוספה לעגלה
        const lastCartAdd = recentEvents.find(e => e.type === 'CART_ADD');
        const hoursSinceAdd = (Date.now() - new Date(lastCartAdd.createdAt).getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceAdd > 24) abandonmentRisk += 20;
        if (hoursSinceAdd > 72) abandonmentRisk += 10;
      }

      return {
        risk: Math.min(100, abandonmentRisk),
        recommendation: this.getAbandonmentRecommendation(abandonmentRisk)
      };

    } catch (error) {
      console.error('Error predicting cart abandonment:', error);
      return { risk: 0, recommendation: 'monitor' };
    }
  }

  getAbandonmentRecommendation(risk) {
    if (risk > 70) return 'urgent_intervention';
    if (risk > 40) return 'send_reminder';
    if (risk > 20) return 'offer_discount';
    return 'monitor';
  }

  // חיזוי הזמן הטוב ביותר לשליחת מייל
  async predictBestSendTime(contactId) {
    try {
      const emailEvents = await prisma.event.findMany({
        where: {
          contactId,
          type: { in: ['EMAIL_OPEN', 'EMAIL_CLICK'] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // חודש אחרון
        }
      });

      if (emailEvents.length < 3) {
        return {
          bestHour: 10, // ברירת מחדל - 10 בבוקר
          bestDay: 2, // ברירת מחדל - יום שלישי
          confidence: 'low'
        };
      }

      // ניתוח שעות פעילות
      const hourActivity = {};
      const dayActivity = {};

      emailEvents.forEach(event => {
        const date = new Date(event.createdAt);
        const hour = date.getHours();
        const day = date.getDay();

        hourActivity[hour] = (hourActivity[hour] || 0) + 1;
        dayActivity[day] = (dayActivity[day] || 0) + 1;
      });

      const bestHour = Object.keys(hourActivity).reduce((a, b) => 
        hourActivity[a] > hourActivity[b] ? a : b
      );
      
      const bestDay = Object.keys(dayActivity).reduce((a, b) => 
        dayActivity[a] > dayActivity[b] ? a : b
      );

      return {
        bestHour: parseInt(bestHour),
        bestDay: parseInt(bestDay),
        confidence: emailEvents.length > 10 ? 'high' : 'medium'
      };

    } catch (error) {
      console.error('Error predicting best send time:', error);
      return { bestHour: 10, bestDay: 2, confidence: 'low' };
    }
  }

  // חיזוי נושאי מייל שיעבדו טוב
  async predictEmailSubjectPerformance(contactId, subjects) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          events: {
            where: { type: { in: ['EMAIL_OPEN', 'EMAIL_CLICK'] } }
          }
        }
      });

      if (!contact) return {};

      // ניתוח מילות מפתח שעבדו בעבר
      const successfulSubjects = await prisma.emailTracking.findMany({
        where: {
          contactId,
          opened: true
        },
        select: { subject: true }
      });

      const keywordScores = {};
      
      successfulSubjects.forEach(email => {
        const words = email.subject.toLowerCase().split(' ');
        words.forEach(word => {
          if (word.length > 2) {
            keywordScores[word] = (keywordScores[word] || 0) + 1;
          }
        });
      });

      // ציון לכל נושא מוצע
      const subjectScores = {};
      subjects.forEach(subject => {
        let score = 0;
        const words = subject.toLowerCase().split(' ');
        
        words.forEach(word => {
          if (keywordScores[word]) {
            score += keywordScores[word];
          }
        });

        // בונוס לנושאים קצרים
        if (subject.length < 50) score += 2;
        
        // בונוס לנושאים עם אמוג'י
        if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(subject)) {
          score += 1;
        }

        subjectScores[subject] = score;
      });

      return subjectScores;

    } catch (error) {
      console.error('Error predicting email subject performance:', error);
      return {};
    }
  }

  // חיזוי סיכוי לביטול הרשמה
  async predictUnsubscribeRisk(contactId) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          events: {
            where: {
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      });

      if (!contact) return { risk: 0 };

      let riskScore = 0;

      // בדיקת פעילות אימייל
      const emailEvents = contact.events.filter(e => 
        e.type === 'EMAIL_OPEN' || e.type === 'EMAIL_CLICK'
      );
      
      if (emailEvents.length === 0) riskScore += 30;
      else if (emailEvents.length < 2) riskScore += 15;

      // בדיקת פעילות באתר
      const siteEvents = contact.events.filter(e => 
        e.type === 'PAGE_VIEW' || e.type === 'ORDER_COMPLETE'
      );
      
      if (siteEvents.length === 0) riskScore += 25;
      else if (siteEvents.length < 3) riskScore += 10;

      // בדיקת תדירות מיילים שנשלחו
      const emailsSent = await prisma.emailTracking.count({
        where: {
          contactId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      });

      if (emailsSent > 5) riskScore += 20; // יותר מדי מיילים
      if (emailsSent > 10) riskScore += 15;

      return {
        risk: Math.min(100, riskScore),
        recommendation: riskScore > 50 ? 'reduce_frequency' : 'maintain'
      };

    } catch (error) {
      console.error('Error predicting unsubscribe risk:', error);
      return { risk: 0, recommendation: 'maintain' };
    }
  }

  // דוח תחזיות כללי
  async generatePredictiveReport(contactId) {
    try {
      const [clv, cartAbandonment, bestSendTime, unsubscribeRisk] = await Promise.all([
        this.calculateCLV(contactId),
        this.predictCartAbandonment(contactId),
        this.predictBestSendTime(contactId),
        this.predictUnsubscribeRisk(contactId)
      ]);

      return {
        contactId,
        clv,
        cartAbandonment,
        bestSendTime,
        unsubscribeRisk,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating predictive report:', error);
      throw error;
    }
  }
}

module.exports = new PredictiveAnalytics();
