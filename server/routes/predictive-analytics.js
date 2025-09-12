const express = require('express');
const router = express.Router();
const predictiveAnalytics = require('../services/predictiveAnalytics');
const auth = require('../middleware/auth');

// קבלת דוח תחזיות מלא לקונטקט
router.get('/contact/:contactId/report', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const report = await predictiveAnalytics.generatePredictiveReport(contactId);
    res.json(report);
  } catch (error) {
    console.error('Error generating predictive report:', error);
    res.status(500).json({ error: 'Failed to generate predictive report' });
  }
});

// חישוב CLV לקונטקט
router.get('/contact/:contactId/clv', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const clv = await predictiveAnalytics.calculateCLV(contactId);
    res.json(clv);
  } catch (error) {
    console.error('Error calculating CLV:', error);
    res.status(500).json({ error: 'Failed to calculate CLV' });
  }
});

// חיזוי נטישת עגלה
router.get('/contact/:contactId/cart-abandonment', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const prediction = await predictiveAnalytics.predictCartAbandonment(contactId);
    res.json(prediction);
  } catch (error) {
    console.error('Error predicting cart abandonment:', error);
    res.status(500).json({ error: 'Failed to predict cart abandonment' });
  }
});

// חיזוי זמן שליחה טוב
router.get('/contact/:contactId/best-send-time', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const prediction = await predictiveAnalytics.predictBestSendTime(contactId);
    res.json(prediction);
  } catch (error) {
    console.error('Error predicting best send time:', error);
    res.status(500).json({ error: 'Failed to predict best send time' });
  }
});

// חיזוי ביצועי נושא מייל
router.post('/contact/:contactId/subject-performance', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { subjects } = req.body;
    
    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ error: 'Subjects array is required' });
    }

    const predictions = await predictiveAnalytics.predictEmailSubjectPerformance(contactId, subjects);
    res.json(predictions);
  } catch (error) {
    console.error('Error predicting subject performance:', error);
    res.status(500).json({ error: 'Failed to predict subject performance' });
  }
});

// חיזוי סיכון לביטול הרשמה
router.get('/contact/:contactId/unsubscribe-risk', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const prediction = await predictiveAnalytics.predictUnsubscribeRisk(contactId);
    res.json(prediction);
  } catch (error) {
    console.error('Error predicting unsubscribe risk:', error);
    res.status(500).json({ error: 'Failed to predict unsubscribe risk' });
  }
});

// דוח תחזיות כללי לכל הקונטקטים
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // קבלת כל הקונטקטים של המשתמש
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    // חישוב תחזיות לקונטקטים הפעילים ביותר (עד 50)
    const activeContacts = contacts.slice(0, 50);
    
    const predictions = await Promise.all(
      activeContacts.map(async (contact) => {
        try {
          const clv = await predictiveAnalytics.calculateCLV(contact.id);
          const cartAbandonment = await predictiveAnalytics.predictCartAbandonment(contact.id);
          const unsubscribeRisk = await predictiveAnalytics.predictUnsubscribeRisk(contact.id);
          
          return {
            contact,
            clv: clv.clv,
            segment: clv.prediction,
            cartAbandonmentRisk: cartAbandonment.risk,
            unsubscribeRisk: unsubscribeRisk.risk
          };
        } catch (error) {
          console.error(`Error processing contact ${contact.id}:`, error);
          return {
            contact,
            clv: 0,
            segment: 'unknown',
            cartAbandonmentRisk: 0,
            unsubscribeRisk: 0
          };
        }
      })
    );

    // חישוב סטטיסטיקות כלליות
    const totalCLV = predictions.reduce((sum, p) => sum + p.clv, 0);
    const averageCLV = predictions.length > 0 ? totalCLV / predictions.length : 0;
    
    const segments = predictions.reduce((acc, p) => {
      acc[p.segment] = (acc[p.segment] || 0) + 1;
      return acc;
    }, {});

    const highRiskContacts = predictions.filter(p => 
      p.cartAbandonmentRisk > 50 || p.unsubscribeRisk > 50
    ).length;

    res.json({
      summary: {
        totalContacts: contacts.length,
        analyzedContacts: predictions.length,
        totalCLV: Math.round(totalCLV * 100) / 100,
        averageCLV: Math.round(averageCLV * 100) / 100,
        segments,
        highRiskContacts
      },
      predictions: predictions.sort((a, b) => b.clv - a.clv) // מיון לפי CLV
    });

  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ error: 'Failed to generate predictive dashboard' });
  }
});

module.exports = router;
