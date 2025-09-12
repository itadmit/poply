const express = require('express');
const router = express.Router();
const customerJourney = require('../services/customerJourney');
const auth = require('../middleware/auth');

// קבלת מפת מסע לקוח
router.get('/contact/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { timeframe = 30 } = req.query;
    
    const journey = await customerJourney.createJourneyMap(contactId, parseInt(timeframe));
    res.json(journey);
  } catch (error) {
    console.error('Error getting customer journey:', error);
    res.status(500).json({ error: 'Failed to get customer journey' });
  }
});

// השוואת מסעות של מספר לקוחות
router.post('/compare', auth, async (req, res) => {
  try {
    const { contactIds, timeframe = 30 } = req.body;
    
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }

    if (contactIds.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 contacts can be compared at once' });
    }

    const comparison = await customerJourney.compareJourneys(contactIds, timeframe);
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing journeys:', error);
    res.status(500).json({ error: 'Failed to compare customer journeys' });
  }
});

// קבלת המלצות לשיפור המסע
router.get('/contact/:contactId/recommendations', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    
    const recommendations = await customerJourney.generateJourneyRecommendations(contactId);
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate journey recommendations' });
  }
});

// דוח מסעות כללי
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // קבלת הקונטקטים הפעילים ביותר
    const activeContacts = await prisma.contact.findMany({
      where: { 
        userId: req.user.id,
        events: {
          some: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }
      },
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 20
    });

    // יצירת מפות מסע לקונטקטים הפעילים
    const journeys = await Promise.all(
      activeContacts.map(async (contact) => {
        try {
          const journey = await customerJourney.createJourneyMap(contact.id, 30);
          return {
            contactId: contact.id,
            contact,
            metrics: journey.metrics,
            currentStage: this.getCurrentStage(journey.timeline),
            lastActivity: journey.timeline.length > 0 
              ? journey.timeline[journey.timeline.length - 1].timestamp 
              : null
          };
        } catch (error) {
          console.error(`Error processing journey for contact ${contact.id}:`, error);
          return null;
        }
      })
    );

    const validJourneys = journeys.filter(j => j !== null);

    // חישוב סטטיסטיקות כלליות
    const totalJourneys = validJourneys.length;
    const avgEngagement = totalJourneys > 0 
      ? validJourneys.reduce((sum, j) => sum + j.metrics.engagementScore, 0) / totalJourneys 
      : 0;
    
    const avgConversionRate = totalJourneys > 0 
      ? validJourneys.reduce((sum, j) => sum + j.metrics.conversionRate, 0) / totalJourneys 
      : 0;

    // סיווג לפי שלבים
    const stageDistribution = validJourneys.reduce((acc, journey) => {
      const stage = journey.currentStage;
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    // זיהוי לקוחות בסיכון
    const atRiskCustomers = validJourneys.filter(j => 
      j.metrics.engagementScore < 30 || 
      (j.lastActivity && (Date.now() - new Date(j.lastActivity).getTime()) > 7 * 24 * 60 * 60 * 1000)
    );

    // לקוחות עם הזדמנות גבוהה
    const highOpportunityCustomers = validJourneys.filter(j => 
      j.metrics.engagementScore > 60 && j.metrics.conversionRate === 0
    );

    res.json({
      summary: {
        totalActiveJourneys: totalJourneys,
        avgEngagementScore: Math.round(avgEngagement * 100) / 100,
        avgConversionRate: Math.round(avgConversionRate * 100) / 100,
        stageDistribution,
        atRiskCount: atRiskCustomers.length,
        highOpportunityCount: highOpportunityCustomers.length
      },
      journeys: validJourneys.sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore),
      atRiskCustomers: atRiskCustomers.slice(0, 10),
      highOpportunityCustomers: highOpportunityCustomers.slice(0, 10)
    });

  } catch (error) {
    console.error('Error generating journey dashboard:', error);
    res.status(500).json({ error: 'Failed to generate journey dashboard' });
  }
});

// פונקציה עזר לזיהוי השלב הנוכחי
function getCurrentStage(timeline) {
  if (timeline.length === 0) return 'unknown';
  
  // בדיקה לפי האירוע האחרון
  const lastEvent = timeline[timeline.length - 1];
  return lastEvent.stage;
}

module.exports = router;
