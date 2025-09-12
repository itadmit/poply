const express = require('express');
const router = express.Router();
const advancedSegmentation = require('../services/advancedSegmentation');
const auth = require('../middleware/auth');

// יצירת סגמנט מתקדם
router.post('/', auth, async (req, res) => {
  try {
    const segmentData = req.body;
    const segment = await advancedSegmentation.createAdvancedSegment(req.user.id, segmentData);
    res.status(201).json(segment);
  } catch (error) {
    console.error('Error creating advanced segment:', error);
    res.status(400).json({ error: error.message });
  }
});

// חישוב חברי סגמנט
router.post('/:segmentId/calculate', auth, async (req, res) => {
  try {
    const { segmentId } = req.params;
    const result = await advancedSegmentation.calculateSegmentMembers(segmentId);
    res.json(result);
  } catch (error) {
    console.error('Error calculating segment members:', error);
    res.status(500).json({ error: 'Failed to calculate segment members' });
  }
});

// רענון סגמנטים אוטומטיים
router.post('/refresh-auto-update', auth, async (req, res) => {
  try {
    const results = await advancedSegmentation.refreshAutoUpdateSegments(req.user.id);
    res.json({
      message: 'Auto-update segments refreshed successfully',
      results
    });
  } catch (error) {
    console.error('Error refreshing auto-update segments:', error);
    res.status(500).json({ error: 'Failed to refresh auto-update segments' });
  }
});

// קבלת סטטיסטיקות סגמנט
router.get('/:segmentId/stats', auth, async (req, res) => {
  try {
    const { segmentId } = req.params;
    const stats = await advancedSegmentation.getSegmentStats(segmentId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting segment stats:', error);
    res.status(500).json({ error: 'Failed to get segment stats' });
  }
});

// יצוא חברי סגמנט
router.get('/:segmentId/export', auth, async (req, res) => {
  try {
    const { segmentId } = req.params;
    const { format = 'json' } = req.query;
    
    const exportData = await advancedSegmentation.exportSegmentMembers(segmentId, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=segment-${segmentId}.csv`);
      res.send(exportData);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting segment members:', error);
    res.status(500).json({ error: 'Failed to export segment members' });
  }
});

// בדיקת תנאי סגמנט (לבדיקות)
router.post('/test-conditions', auth, async (req, res) => {
  try {
    const { conditions, contactId } = req.body;

    if (!conditions || !contactId) {
      return res.status(400).json({ error: 'Conditions and contact ID are required' });
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: req.user.id },
      include: {
        orders: true,
        events: {
          where: {
            createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        emailTracking: true
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const matches = await advancedSegmentation.evaluateSegmentConditions(conditions, contact);
    
    res.json({
      contactId,
      matches,
      conditions,
      contactData: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        totalOrders: contact.orders.length,
        totalSpent: contact.orders.reduce((sum, order) => sum + (order.total || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error testing segment conditions:', error);
    res.status(500).json({ error: 'Failed to test segment conditions' });
  }
});

// קבלת רשימת כללי סגמנטציה זמינים
router.get('/available-rules', auth, async (req, res) => {
  try {
    const availableRules = {
      customerFields: [
        { field: 'firstName', label: 'שם פרטי', type: 'string' },
        { field: 'lastName', label: 'שם משפחה', type: 'string' },
        { field: 'email', label: 'אימייל', type: 'string' },
        { field: 'phone', label: 'טלפון', type: 'string' },
        { field: 'company', label: 'חברה', type: 'string' },
        { field: 'tags', label: 'תגיות', type: 'array' },
        { field: 'status', label: 'סטטוס', type: 'enum', options: ['ACTIVE', 'INACTIVE', 'UNSUBSCRIBED', 'BOUNCED'] },
        { field: 'createdAt', label: 'תאריך הרשמה', type: 'date' }
      ],
      purchaseFields: [
        { field: 'totalOrders', label: 'מספר הזמנות', type: 'number' },
        { field: 'totalSpent', label: 'סכום כולל', type: 'number' },
        { field: 'avgOrderValue', label: 'ערך הזמנה ממוצע', type: 'number' },
        { field: 'lastOrderDate', label: 'תאריך הזמנה אחרונה', type: 'date' },
        { field: 'daysSinceLastOrder', label: 'ימים מאז הזמנה אחרונה', type: 'number' },
        { field: 'preferredCategory', label: 'קטגוריה מועדפת', type: 'string' }
      ],
      behaviorFields: [
        { field: 'emailEngagement', label: 'מעורבות במייל', type: 'engagement' },
        { field: 'eventCount', label: 'מספר אירועים', type: 'number' },
        { field: 'hasEvent', label: 'קיום אירוע', type: 'boolean' },
        { field: 'seasonalBehavior', label: 'התנהגות עונתית', type: 'seasonal' }
      ],
      calculatedFields: [
        { field: 'customerLifecycleStage', label: 'שלב במחזור חיים', type: 'enum', options: ['new_lead', 'cold_lead', 'first_time_buyer', 'repeat_customer', 'vip_customer', 'occasional_buyer'] },
        { field: 'riskLevel', label: 'רמת סיכון', type: 'enum', options: ['very_low', 'low', 'medium', 'high', 'unknown'] },
        { field: 'clv', label: 'Customer Lifetime Value', type: 'number' }
      ],
      operators: {
        string: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
        number: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'between'],
        date: ['before', 'after', 'within_days', 'older_than_days', 'this_month', 'last_month', 'this_year'],
        array: ['contains', 'not_contains', 'contains_any', 'contains_all', 'is_empty', 'is_not_empty', 'length_equals', 'length_greater', 'length_less'],
        boolean: ['has', 'not_has'],
        enum: ['equals', 'not_equals'],
        engagement: ['open_rate_above', 'open_rate_below', 'click_rate_above', 'click_rate_below', 'high_engagement', 'low_engagement', 'no_engagement'],
        seasonal: ['prefers', 'avoids', 'neutral']
      }
    };

    res.json(availableRules);
  } catch (error) {
    console.error('Error getting available rules:', error);
    res.status(500).json({ error: 'Failed to get available rules' });
  }
});

// קבלת דוגמאות לתנאי סגמנטציה
router.get('/example-conditions', auth, async (req, res) => {
  try {
    const examples = [
      {
        name: 'לקוחות VIP',
        description: 'לקוחות שהוציאו יותר מ-1000₪ ויש להם יותר מ-3 הזמנות',
        conditions: {
          operator: 'AND',
          rules: [
            { field: 'totalSpent', operator: 'greater_than', value: 1000 },
            { field: 'totalOrders', operator: 'greater_than', value: 3 }
          ]
        }
      },
      {
        name: 'לקוחות בסיכון',
        description: 'לקוחות שלא הזמינו יותר מ-90 ימים אבל יש להם היסטוריית רכישות',
        conditions: {
          operator: 'AND',
          rules: [
            { field: 'daysSinceLastOrder', operator: 'greater_than', value: 90 },
            { field: 'totalOrders', operator: 'greater_than', value: 0 }
          ]
        }
      },
      {
        name: 'לקוחות מעורבים במייל',
        description: 'לקוחות עם מעורבות גבוהה במיילים',
        conditions: {
          operator: 'OR',
          rules: [
            { field: 'emailEngagement', operator: 'high_engagement' },
            { field: 'emailEngagement', operator: 'open_rate_above', value: 50 }
          ]
        }
      },
      {
        name: 'לקוחות חדשים',
        description: 'לקוחות שנרשמו בשבוע האחרון',
        conditions: {
          operator: 'AND',
          rules: [
            { field: 'createdAt', operator: 'within_days', value: 7 },
            { field: 'totalOrders', operator: 'equals', value: 0 }
          ]
        }
      },
      {
        name: 'קונים חוזרים',
        description: 'לקוחות עם יותר מהזמנה אחת בחודש האחרון',
        conditions: {
          operator: 'AND',
          rules: [
            { field: 'totalOrders', operator: 'greater_than', value: 1 },
            { field: 'lastOrderDate', operator: 'within_days', value: 30 }
          ]
        }
      }
    ];

    res.json(examples);
  } catch (error) {
    console.error('Error getting example conditions:', error);
    res.status(500).json({ error: 'Failed to get example conditions' });
  }
});

module.exports = router;
