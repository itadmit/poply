const express = require('express');
const router = express.Router();
const behavioralTriggers = require('../services/behavioralTriggers');
const auth = require('../middleware/auth');

// יצירת טריגר התנהגותי חדש
router.post('/', auth, async (req, res) => {
  try {
    const triggerData = req.body;
    const trigger = await behavioralTriggers.createBehavioralTrigger(req.user.id, triggerData);
    res.status(201).json(trigger);
  } catch (error) {
    console.error('Error creating behavioral trigger:', error);
    res.status(400).json({ error: error.message });
  }
});

// קבלת רשימת טריגרים
router.get('/', auth, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const triggers = await prisma.behavioralTrigger.findMany({
      where: { userId: req.user.id },
      include: {
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 5
        },
        _count: {
          select: { executions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(triggers);
  } catch (error) {
    console.error('Error getting behavioral triggers:', error);
    res.status(500).json({ error: 'Failed to get behavioral triggers' });
  }
});

// קבלת טריגר ספציפי
router.get('/:triggerId', auth, async (req, res) => {
  try {
    const { triggerId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const trigger = await prisma.behavioralTrigger.findFirst({
      where: { id: triggerId, userId: req.user.id },
      include: {
        executions: {
          include: { contact: true },
          orderBy: { executedAt: 'desc' },
          take: 20
        }
      }
    });

    if (!trigger) {
      return res.status(404).json({ error: 'Behavioral trigger not found' });
    }

    res.json(trigger);
  } catch (error) {
    console.error('Error getting behavioral trigger:', error);
    res.status(500).json({ error: 'Failed to get behavioral trigger' });
  }
});

// עדכון טריגר
router.put('/:triggerId', auth, async (req, res) => {
  try {
    const { triggerId } = req.params;
    const updateData = req.body;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const existingTrigger = await prisma.behavioralTrigger.findFirst({
      where: { id: triggerId, userId: req.user.id }
    });

    if (!existingTrigger) {
      return res.status(404).json({ error: 'Behavioral trigger not found' });
    }

    const updatedTrigger = await prisma.behavioralTrigger.update({
      where: { id: triggerId },
      data: updateData
    });

    res.json(updatedTrigger);
  } catch (error) {
    console.error('Error updating behavioral trigger:', error);
    res.status(500).json({ error: 'Failed to update behavioral trigger' });
  }
});

// מחיקת טריגר
router.delete('/:triggerId', auth, async (req, res) => {
  try {
    const { triggerId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const existingTrigger = await prisma.behavioralTrigger.findFirst({
      where: { id: triggerId, userId: req.user.id }
    });

    if (!existingTrigger) {
      return res.status(404).json({ error: 'Behavioral trigger not found' });
    }

    await prisma.behavioralTrigger.delete({
      where: { id: triggerId }
    });

    res.json({ message: 'Behavioral trigger deleted successfully' });
  } catch (error) {
    console.error('Error deleting behavioral trigger:', error);
    res.status(500).json({ error: 'Failed to delete behavioral trigger' });
  }
});

// הפעלה/השבתה של טריגר
router.post('/:triggerId/toggle', auth, async (req, res) => {
  try {
    const { triggerId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const trigger = await prisma.behavioralTrigger.findFirst({
      where: { id: triggerId, userId: req.user.id }
    });

    if (!trigger) {
      return res.status(404).json({ error: 'Behavioral trigger not found' });
    }

    const updatedTrigger = await prisma.behavioralTrigger.update({
      where: { id: triggerId },
      data: { isActive: !trigger.isActive }
    });

    res.json(updatedTrigger);
  } catch (error) {
    console.error('Error toggling behavioral trigger:', error);
    res.status(500).json({ error: 'Failed to toggle behavioral trigger' });
  }
});

// עיבוד אירוע ידני (לבדיקות)
router.post('/process-event', auth, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      userId: req.user.id
    };

    const executedTriggers = await behavioralTriggers.processEvent(eventData);
    res.json({
      message: 'Event processed successfully',
      executedTriggers: executedTriggers.length,
      triggers: executedTriggers.map(t => ({ id: t.id, name: t.name }))
    });
  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

// קבלת סטטיסטיקות טריגרים
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const stats = await behavioralTriggers.getTriggerStats(req.user.id, parseInt(timeframe));
    res.json(stats);
  } catch (error) {
    console.error('Error getting trigger stats:', error);
    res.status(500).json({ error: 'Failed to get trigger stats' });
  }
});

// בדיקת תנאי טריגר (לבדיקות)
router.post('/test-conditions', auth, async (req, res) => {
  try {
    const { conditions, contactId, eventType, eventData } = req.body;

    if (!conditions || !contactId) {
      return res.status(400).json({ error: 'Conditions and contact ID are required' });
    }

    // יצירת טריגר זמני לבדיקה
    const testTrigger = {
      conditions,
      triggerType: 'EVENT_BASED'
    };

    const shouldExecute = await behavioralTriggers.shouldExecuteTrigger(
      testTrigger, 
      eventType, 
      eventData, 
      contactId
    );

    res.json({
      shouldExecute,
      conditions,
      contactId,
      eventType,
      eventData
    });
  } catch (error) {
    console.error('Error testing trigger conditions:', error);
    res.status(500).json({ error: 'Failed to test trigger conditions' });
  }
});

// שכפול טריגר
router.post('/:triggerId/duplicate', auth, async (req, res) => {
  try {
    const { triggerId } = req.params;
    const { name } = req.body;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const originalTrigger = await prisma.behavioralTrigger.findFirst({
      where: { id: triggerId, userId: req.user.id }
    });

    if (!originalTrigger) {
      return res.status(404).json({ error: 'Behavioral trigger not found' });
    }

    const duplicatedTrigger = await prisma.behavioralTrigger.create({
      data: {
        userId: req.user.id,
        name: name || `${originalTrigger.name} (Copy)`,
        description: originalTrigger.description,
        triggerType: originalTrigger.triggerType,
        conditions: originalTrigger.conditions,
        actions: originalTrigger.actions,
        cooldownPeriod: originalTrigger.cooldownPeriod,
        maxExecutions: originalTrigger.maxExecutions,
        priority: originalTrigger.priority,
        isActive: false // תמיד יוצר כלא פעיל
      }
    });

    res.status(201).json(duplicatedTrigger);
  } catch (error) {
    console.error('Error duplicating behavioral trigger:', error);
    res.status(500).json({ error: 'Failed to duplicate behavioral trigger' });
  }
});

module.exports = router;
