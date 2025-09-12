const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ABTesting {

  // יצירת בדיקת A/B חדשה
  async createABTest(userId, testData) {
    try {
      const {
        name,
        description,
        type, // 'email' או 'campaign'
        variants,
        trafficSplit,
        targetAudience,
        successMetric,
        duration,
        autoWinner
      } = testData;

      // וולידציה
      if (!variants || variants.length < 2) {
        throw new Error('At least 2 variants are required');
      }

      const totalSplit = trafficSplit.reduce((sum, split) => sum + split, 0);
      if (Math.abs(totalSplit - 100) > 0.01) {
        throw new Error('Traffic split must sum to 100%');
      }

      const abTest = await prisma.aBTest.create({
        data: {
          userId,
          name,
          description,
          type,
          status: 'draft',
          successMetric,
          duration,
          autoWinner: autoWinner || false,
          variants: {
            create: variants.map((variant, index) => ({
              name: variant.name,
              content: variant.content,
              trafficPercentage: trafficSplit[index],
              isControl: index === 0
            }))
          },
          targetAudience: targetAudience || {}
        },
        include: {
          variants: true
        }
      });

      return abTest;

    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  // התחלת בדיקת A/B
  async startABTest(testId, userId) {
    try {
      const abTest = await prisma.aBTest.findFirst({
        where: { id: testId, userId },
        include: { variants: true }
      });

      if (!abTest) {
        throw new Error('A/B test not found');
      }

      if (abTest.status !== 'draft') {
        throw new Error('A/B test is not in draft status');
      }

      // עדכון סטטוס לפעיל
      const updatedTest = await prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: 'active',
          startedAt: new Date(),
          endDate: new Date(Date.now() + abTest.duration * 24 * 60 * 60 * 1000)
        },
        include: { variants: true }
      });

      return updatedTest;

    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  // הקצאת משתמש לוריאנט
  async assignUserToVariant(testId, contactId) {
    try {
      // בדיקה אם המשתמש כבר הוקצה
      const existingAssignment = await prisma.aBTestAssignment.findFirst({
        where: { testId, contactId }
      });

      if (existingAssignment) {
        return existingAssignment;
      }

      const abTest = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: { variants: true }
      });

      if (!abTest || abTest.status !== 'active') {
        throw new Error('A/B test is not active');
      }

      // בחירת וריאנט בהתבסס על traffic split
      const selectedVariant = this.selectVariantByTraffic(abTest.variants);

      const assignment = await prisma.aBTestAssignment.create({
        data: {
          testId,
          contactId,
          variantId: selectedVariant.id,
          assignedAt: new Date()
        },
        include: {
          variant: true
        }
      });

      return assignment;

    } catch (error) {
      console.error('Error assigning user to variant:', error);
      throw error;
    }
  }

  // בחירת וריאנט לפי traffic split
  selectVariantByTraffic(variants) {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.trafficPercentage;
      if (random <= cumulative) {
        return variant;
      }
    }

    // fallback לוריאנט הראשון
    return variants[0];
  }

  // רישום אירוע בבדיקת A/B
  async recordEvent(testId, contactId, eventType, eventData = {}) {
    try {
      const assignment = await prisma.aBTestAssignment.findFirst({
        where: { testId, contactId }
      });

      if (!assignment) {
        throw new Error('User not assigned to this A/B test');
      }

      const event = await prisma.aBTestEvent.create({
        data: {
          testId,
          variantId: assignment.variantId,
          contactId,
          eventType,
          eventData,
          timestamp: new Date()
        }
      });

      return event;

    } catch (error) {
      console.error('Error recording A/B test event:', error);
      throw error;
    }
  }

  // חישוב תוצאות בדיקת A/B
  async calculateResults(testId) {
    try {
      const abTest = await prisma.aBTest.findUnique({
        where: { id: testId },
        include: {
          variants: true,
          assignments: true,
          events: true
        }
      });

      if (!abTest) {
        throw new Error('A/B test not found');
      }

      const results = {
        testId,
        testName: abTest.name,
        status: abTest.status,
        startedAt: abTest.startedAt,
        endDate: abTest.endDate,
        successMetric: abTest.successMetric,
        variants: []
      };

      // חישוב תוצאות לכל וריאנט
      for (const variant of abTest.variants) {
        const assignments = abTest.assignments.filter(a => a.variantId === variant.id);
        const events = abTest.events.filter(e => e.variantId === variant.id);

        const totalUsers = assignments.length;
        const conversions = events.filter(e => e.eventType === abTest.successMetric).length;
        const conversionRate = totalUsers > 0 ? (conversions / totalUsers) * 100 : 0;

        // חישוב מדדים נוספים
        const opens = events.filter(e => e.eventType === 'EMAIL_OPEN').length;
        const clicks = events.filter(e => e.eventType === 'EMAIL_CLICK').length;
        const openRate = totalUsers > 0 ? (opens / totalUsers) * 100 : 0;
        const clickRate = opens > 0 ? (clicks / opens) * 100 : 0;

        results.variants.push({
          id: variant.id,
          name: variant.name,
          isControl: variant.isControl,
          trafficPercentage: variant.trafficPercentage,
          totalUsers,
          conversions,
          conversionRate: Math.round(conversionRate * 100) / 100,
          opens,
          clicks,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100
        });
      }

      // חישוב מובהקות סטטיסטית
      results.statisticalSignificance = this.calculateStatisticalSignificance(results.variants);
      
      // זיהוי הווריאנט המנצח
      results.winner = this.determineWinner(results.variants, abTest.successMetric);

      return results;

    } catch (error) {
      console.error('Error calculating A/B test results:', error);
      throw error;
    }
  }

  // חישוב מובהקות סטטיסטית (פשוט)
  calculateStatisticalSignificance(variants) {
    if (variants.length < 2) return { isSignificant: false, confidence: 0 };

    const control = variants.find(v => v.isControl) || variants[0];
    const challenger = variants.find(v => !v.isControl) || variants[1];

    // חישוב פשוט של z-test
    const p1 = control.conversionRate / 100;
    const p2 = challenger.conversionRate / 100;
    const n1 = control.totalUsers;
    const n2 = challenger.totalUsers;

    if (n1 < 30 || n2 < 30) {
      return { isSignificant: false, confidence: 0, reason: 'Sample size too small' };
    }

    const pooledP = (control.conversions + challenger.conversions) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    if (se === 0) {
      return { isSignificant: false, confidence: 0, reason: 'No variance' };
    }

    const z = Math.abs(p1 - p2) / se;
    
    // המרה ל-confidence level (פשוט)
    let confidence = 0;
    if (z > 2.58) confidence = 99;
    else if (z > 1.96) confidence = 95;
    else if (z > 1.65) confidence = 90;

    return {
      isSignificant: confidence >= 95,
      confidence,
      zScore: Math.round(z * 100) / 100,
      effect: ((p2 - p1) / p1 * 100).toFixed(2) + '%'
    };
  }

  // קביעת הווריאנט המנצח
  determineWinner(variants, successMetric) {
    if (variants.length === 0) return null;

    const sortedVariants = [...variants].sort((a, b) => {
      if (successMetric === 'EMAIL_OPEN') return b.openRate - a.openRate;
      if (successMetric === 'EMAIL_CLICK') return b.clickRate - a.clickRate;
      return b.conversionRate - a.conversionRate;
    });

    const winner = sortedVariants[0];
    const improvement = sortedVariants.length > 1 
      ? ((winner.conversionRate - sortedVariants[1].conversionRate) / sortedVariants[1].conversionRate * 100)
      : 0;

    return {
      variantId: winner.id,
      variantName: winner.name,
      improvement: Math.round(improvement * 100) / 100
    };
  }

  // סיום בדיקת A/B
  async stopABTest(testId, userId) {
    try {
      const abTest = await prisma.aBTest.findFirst({
        where: { id: testId, userId }
      });

      if (!abTest) {
        throw new Error('A/B test not found');
      }

      if (abTest.status !== 'active') {
        throw new Error('A/B test is not active');
      }

      // חישוב תוצאות סופיות
      const results = await this.calculateResults(testId);

      // עדכון סטטוס
      const updatedTest = await prisma.aBTest.update({
        where: { id: testId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          finalResults: results
        }
      });

      // אם מוגדר auto-winner, עדכן את הקמפיין המקורי
      if (abTest.autoWinner && results.winner && results.statisticalSignificance.isSignificant) {
        await this.applyWinningVariant(testId, results.winner.variantId);
      }

      return { test: updatedTest, results };

    } catch (error) {
      console.error('Error stopping A/B test:', error);
      throw error;
    }
  }

  // החלת הווריאנט המנצח
  async applyWinningVariant(testId, winningVariantId) {
    try {
      const variant = await prisma.aBTestVariant.findUnique({
        where: { id: winningVariantId },
        include: { test: true }
      });

      if (!variant) {
        throw new Error('Winning variant not found');
      }

      // כאן ניתן להוסיף לוגיקה להחלת השינויים על הקמפיין המקורי
      // לדוגמה: עדכון תבנית מייל, נושא, וכו'

      console.log(`Applied winning variant ${variant.name} for test ${testId}`);
      
      return true;

    } catch (error) {
      console.error('Error applying winning variant:', error);
      throw error;
    }
  }

  // קבלת רשימת בדיקות A/B
  async getABTests(userId, filters = {}) {
    try {
      const where = { userId };
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }

      const tests = await prisma.aBTest.findMany({
        where,
        include: {
          variants: true,
          _count: {
            select: {
              assignments: true,
              events: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return tests;

    } catch (error) {
      console.error('Error getting A/B tests:', error);
      throw error;
    }
  }

  // דוח ביצועים כללי
  async getPerformanceReport(userId, timeframe = 30) {
    try {
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

      const tests = await prisma.aBTest.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        include: {
          variants: true,
          assignments: true,
          events: true
        }
      });

      const report = {
        totalTests: tests.length,
        activeTests: tests.filter(t => t.status === 'active').length,
        completedTests: tests.filter(t => t.status === 'completed').length,
        totalParticipants: 0,
        avgImprovementRate: 0,
        significantTests: 0,
        testsByType: {}
      };

      let totalImprovement = 0;
      let testsWithImprovement = 0;

      for (const test of tests) {
        report.totalParticipants += test.assignments.length;
        
        // ספירה לפי סוג
        report.testsByType[test.type] = (report.testsByType[test.type] || 0) + 1;

        // חישוב שיפור אם הבדיקה הושלמה
        if (test.status === 'completed' && test.finalResults) {
          const results = test.finalResults;
          if (results.statisticalSignificance && results.statisticalSignificance.isSignificant) {
            report.significantTests++;
          }
          
          if (results.winner && results.winner.improvement > 0) {
            totalImprovement += results.winner.improvement;
            testsWithImprovement++;
          }
        }
      }

      report.avgImprovementRate = testsWithImprovement > 0 
        ? Math.round((totalImprovement / testsWithImprovement) * 100) / 100 
        : 0;

      return report;

    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }
}

module.exports = new ABTesting();
