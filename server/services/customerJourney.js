const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CustomerJourney {

  // יצירת מפת מסע לקוח
  async createJourneyMap(contactId, timeframe = 30) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
          events: {
            where: {
              createdAt: { 
                gte: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000) 
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          orders: {
            where: {
              createdAt: { 
                gte: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000) 
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      // יצירת timeline של אירועים
      const timeline = [];

      // הוספת אירועים
      contact.events.forEach(event => {
        timeline.push({
          type: 'event',
          eventType: event.type,
          timestamp: event.createdAt,
          data: event.data,
          stage: this.getJourneyStage(event.type),
          description: this.getEventDescription(event)
        });
      });

      // הוספת הזמנות
      contact.orders.forEach(order => {
        timeline.push({
          type: 'order',
          timestamp: order.createdAt,
          data: {
            orderId: order.id,
            total: order.total,
            status: order.status
          },
          stage: 'purchase',
          description: `הזמנה בסך ${order.total}₪`
        });
      });

      // מיון לפי זמן
      timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // זיהוי שלבי המסע
      const journeyStages = this.identifyJourneyStages(timeline);
      
      // חישוב מדדים
      const metrics = this.calculateJourneyMetrics(timeline, contact);

      return {
        contactId,
        contact: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email
        },
        timeframe,
        timeline,
        stages: journeyStages,
        metrics,
        insights: this.generateJourneyInsights(timeline, metrics)
      };

    } catch (error) {
      console.error('Error creating journey map:', error);
      throw error;
    }
  }

  // זיהוי שלב במסע הלקוח
  getJourneyStage(eventType) {
    const stageMap = {
      'PAGE_VIEW': 'awareness',
      'EMAIL_OPEN': 'interest',
      'EMAIL_CLICK': 'consideration',
      'POPUP_SHOWN': 'awareness',
      'POPUP_CLOSED': 'awareness',
      'CART_ADD': 'consideration',
      'CART_REMOVE': 'consideration',
      'CHECKOUT_START': 'intent',
      'ORDER_COMPLETE': 'purchase',
      'CUSTOM': 'engagement'
    };
    
    return stageMap[eventType] || 'unknown';
  }

  // תיאור אירוע
  getEventDescription(event) {
    const descriptions = {
      'PAGE_VIEW': `צפה בדף: ${event.data?.page || 'לא ידוע'}`,
      'EMAIL_OPEN': `פתח מייל: ${event.data?.subject || 'לא ידוע'}`,
      'EMAIL_CLICK': `לחץ על קישור במייל`,
      'POPUP_SHOWN': `הוצג פופאפ: ${event.data?.popupName || 'לא ידוע'}`,
      'POPUP_CLOSED': `סגר פופאפ`,
      'CART_ADD': `הוסיף לעגלה: ${event.data?.productName || 'מוצר'}`,
      'CART_REMOVE': `הסיר מהעגלה: ${event.data?.productName || 'מוצר'}`,
      'CHECKOUT_START': `התחיל תהליך רכישה`,
      'ORDER_COMPLETE': `השלים הזמנה`,
      'CUSTOM': event.description || 'אירוע מותאם'
    };
    
    return descriptions[event.type] || `אירוע: ${event.type}`;
  }

  // זיהוי שלבי המסע
  identifyJourneyStages(timeline) {
    const stages = {
      awareness: { events: [], duration: 0, firstEvent: null, lastEvent: null },
      interest: { events: [], duration: 0, firstEvent: null, lastEvent: null },
      consideration: { events: [], duration: 0, firstEvent: null, lastEvent: null },
      intent: { events: [], duration: 0, firstEvent: null, lastEvent: null },
      purchase: { events: [], duration: 0, firstEvent: null, lastEvent: null },
      engagement: { events: [], duration: 0, firstEvent: null, lastEvent: null }
    };

    timeline.forEach(event => {
      const stage = event.stage;
      if (stages[stage]) {
        stages[stage].events.push(event);
        
        if (!stages[stage].firstEvent) {
          stages[stage].firstEvent = event.timestamp;
        }
        stages[stage].lastEvent = event.timestamp;
      }
    });

    // חישוב משך זמן לכל שלב
    Object.keys(stages).forEach(stageKey => {
      const stage = stages[stageKey];
      if (stage.firstEvent && stage.lastEvent) {
        stage.duration = Math.round(
          (new Date(stage.lastEvent) - new Date(stage.firstEvent)) / (1000 * 60 * 60)
        ); // שעות
      }
    });

    return stages;
  }

  // חישוב מדדי המסע
  calculateJourneyMetrics(timeline, contact) {
    const totalEvents = timeline.length;
    const uniqueDays = new Set(
      timeline.map(event => new Date(event.timestamp).toDateString())
    ).size;

    // חישוב זמן ממוצע בין אירועים
    let totalTimeBetweenEvents = 0;
    for (let i = 1; i < timeline.length; i++) {
      const timeDiff = new Date(timeline[i].timestamp) - new Date(timeline[i-1].timestamp);
      totalTimeBetweenEvents += timeDiff;
    }
    
    const avgTimeBetweenEvents = timeline.length > 1 
      ? totalTimeBetweenEvents / (timeline.length - 1) / (1000 * 60 * 60) // שעות
      : 0;

    // זיהוי conversion funnel
    const hasAwareness = timeline.some(e => e.stage === 'awareness');
    const hasInterest = timeline.some(e => e.stage === 'interest');
    const hasConsideration = timeline.some(e => e.stage === 'consideration');
    const hasIntent = timeline.some(e => e.stage === 'intent');
    const hasPurchase = timeline.some(e => e.stage === 'purchase');

    const conversionRate = this.calculateConversionRate(timeline);
    const engagementScore = this.calculateEngagementScore(timeline);

    return {
      totalEvents,
      uniqueDays,
      avgTimeBetweenEvents: Math.round(avgTimeBetweenEvents * 100) / 100,
      conversionFunnel: {
        awareness: hasAwareness,
        interest: hasInterest,
        consideration: hasConsideration,
        intent: hasIntent,
        purchase: hasPurchase
      },
      conversionRate,
      engagementScore,
      journeyLength: timeline.length > 0 
        ? Math.round((new Date(timeline[timeline.length - 1].timestamp) - new Date(timeline[0].timestamp)) / (1000 * 60 * 60 * 24))
        : 0 // ימים
    };
  }

  // חישוב שיעור המרה
  calculateConversionRate(timeline) {
    const totalInteractions = timeline.length;
    const purchases = timeline.filter(e => e.stage === 'purchase').length;
    
    return totalInteractions > 0 ? Math.round((purchases / totalInteractions) * 100 * 100) / 100 : 0;
  }

  // חישוב ציון מעורבות
  calculateEngagementScore(timeline) {
    let score = 0;
    
    const eventWeights = {
      'PAGE_VIEW': 1,
      'EMAIL_OPEN': 2,
      'EMAIL_CLICK': 3,
      'POPUP_SHOWN': 1,
      'CART_ADD': 4,
      'CHECKOUT_START': 5,
      'ORDER_COMPLETE': 10
    };

    timeline.forEach(event => {
      const weight = eventWeights[event.eventType] || 1;
      score += weight;
    });

    // נרמול הציון (0-100)
    const maxPossibleScore = timeline.length * 10; // מקסימום אם כל האירועים הם רכישות
    return maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;
  }

  // יצירת תובנות על המסע
  generateJourneyInsights(timeline, metrics) {
    const insights = [];

    // תובנות על אורך המסע
    if (metrics.journeyLength > 30) {
      insights.push({
        type: 'warning',
        title: 'מסע ארוך',
        description: `הלקוח במסע כבר ${metrics.journeyLength} ימים. כדאי לשקול התערבות פעילה.`,
        recommendation: 'שלח מייל אישי או הצע הנחה מיוחדת'
      });
    }

    // תובנות על מעורבות
    if (metrics.engagementScore < 30) {
      insights.push({
        type: 'alert',
        title: 'מעורבות נמוכה',
        description: `ציון המעורבות הוא ${metrics.engagementScore}. הלקוח לא מאוד פעיל.`,
        recommendation: 'נסה תוכן מעניין יותר או שנה את תדירות השליחה'
      });
    } else if (metrics.engagementScore > 70) {
      insights.push({
        type: 'success',
        title: 'מעורבות גבוהה',
        description: `ציון המעורבות הוא ${metrics.engagementScore}. לקוח מעורב מאוד!`,
        recommendation: 'המשך עם התוכן הנוכחי והצע מוצרים נוספים'
      });
    }

    // תובנות על נטישת עגלה
    const cartAdds = timeline.filter(e => e.eventType === 'CART_ADD');
    const purchases = timeline.filter(e => e.eventType === 'ORDER_COMPLETE');
    
    if (cartAdds.length > 0 && purchases.length === 0) {
      insights.push({
        type: 'opportunity',
        title: 'נטישת עגלה',
        description: `הלקוח הוסיף ${cartAdds.length} פריטים לעגלה אך לא השלים רכישה.`,
        recommendation: 'שלח מייל תזכורת עם הנחה של 10%'
      });
    }

    // תובנות על תדירות פעילות
    if (metrics.avgTimeBetweenEvents > 168) { // שבוע
      insights.push({
        type: 'info',
        title: 'פעילות נמוכה',
        description: `ממוצע זמן בין פעילויות הוא ${Math.round(metrics.avgTimeBetweenEvents / 24)} ימים.`,
        recommendation: 'שקול להגדיל את תדירות התקשורת'
      });
    }

    return insights;
  }

  // השוואת מסעות של מספר לקוחות
  async compareJourneys(contactIds, timeframe = 30) {
    try {
      const journeys = await Promise.all(
        contactIds.map(id => this.createJourneyMap(id, timeframe))
      );

      // חישוב ממוצעים
      const avgMetrics = {
        totalEvents: journeys.reduce((sum, j) => sum + j.metrics.totalEvents, 0) / journeys.length,
        engagementScore: journeys.reduce((sum, j) => sum + j.metrics.engagementScore, 0) / journeys.length,
        conversionRate: journeys.reduce((sum, j) => sum + j.metrics.conversionRate, 0) / journeys.length,
        journeyLength: journeys.reduce((sum, j) => sum + j.metrics.journeyLength, 0) / journeys.length
      };

      // זיהוי patterns משותפים
      const commonPatterns = this.identifyCommonPatterns(journeys);

      return {
        journeys,
        comparison: {
          avgMetrics,
          commonPatterns,
          bestPerformer: journeys.reduce((best, current) => 
            current.metrics.engagementScore > best.metrics.engagementScore ? current : best
          ),
          worstPerformer: journeys.reduce((worst, current) => 
            current.metrics.engagementScore < worst.metrics.engagementScore ? current : worst
          )
        }
      };

    } catch (error) {
      console.error('Error comparing journeys:', error);
      throw error;
    }
  }

  // זיהוי דפוסים משותפים
  identifyCommonPatterns(journeys) {
    const patterns = [];

    // דפוס של נטישת עגלה
    const cartAbandonmentCount = journeys.filter(j => 
      j.timeline.some(e => e.eventType === 'CART_ADD') &&
      !j.timeline.some(e => e.eventType === 'ORDER_COMPLETE')
    ).length;

    if (cartAbandonmentCount > journeys.length * 0.3) {
      patterns.push({
        type: 'cart_abandonment',
        frequency: cartAbandonmentCount,
        description: `${cartAbandonmentCount} מתוך ${journeys.length} לקוחות נטשו עגלה`
      });
    }

    // דפוס של מעורבות במייל
    const emailEngagement = journeys.filter(j => 
      j.timeline.some(e => e.eventType === 'EMAIL_OPEN' || e.eventType === 'EMAIL_CLICK')
    ).length;

    patterns.push({
      type: 'email_engagement',
      frequency: emailEngagement,
      description: `${emailEngagement} מתוך ${journeys.length} לקוחות מעורבים במיילים`
    });

    return patterns;
  }

  // יצירת המלצות לשיפור המסע
  async generateJourneyRecommendations(contactId) {
    try {
      const journey = await this.createJourneyMap(contactId);
      const recommendations = [];

      // המלצות בהתבסס על שלבי המסע
      const stages = journey.stages;

      if (stages.awareness.events.length === 0) {
        recommendations.push({
          priority: 'high',
          category: 'awareness',
          title: 'הגבר מודעות',
          description: 'הלקוח לא חשוף מספיק למותג',
          actions: [
            'הגדל נוכחות ברשתות חברתיות',
            'שלח מיילים עם תוכן מעניין',
            'הצג פרסומות ממוקדות'
          ]
        });
      }

      if (stages.consideration.events.length > 0 && stages.purchase.events.length === 0) {
        recommendations.push({
          priority: 'high',
          category: 'conversion',
          title: 'שפר המרה',
          description: 'הלקוח מעוניין אך לא רוכש',
          actions: [
            'הצע הנחה מוגבלת בזמן',
            'שלח ביקורות לקוחות',
            'הוסף אמצעי תשלום נוספים'
          ]
        });
      }

      if (journey.metrics.engagementScore < 40) {
        recommendations.push({
          priority: 'medium',
          category: 'engagement',
          title: 'הגבר מעורבות',
          description: 'הלקוח לא מאוד פעיל',
          actions: [
            'שלח תוכן מותאם אישית',
            'הזמן לאירועים או וובינרים',
            'צור תוכן אינטראקטיבי'
          ]
        });
      }

      return recommendations;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }
}

module.exports = new CustomerJourney();
