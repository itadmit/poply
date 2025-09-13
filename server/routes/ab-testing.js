const express = require('express');
const router = express.Router();
const abTesting = require('../services/abTesting');
const { authenticateToken: auth } = require('../middleware/auth');

// יצירת בדיקת A/B חדשה
router.post('/', auth, async (req, res) => {
  try {
    const testData = req.body;
    const abTest = await abTesting.createABTest(req.user.id, testData);
    res.status(201).json(abTest);
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(400).json({ error: error.message });
  }
});

// קבלת רשימת בדיקות A/B
router.get('/', auth, async (req, res) => {
  try {
    const { status, type } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (type) filters.type = type;

    const tests = await abTesting.getABTests(req.user.id, filters);
    res.json(tests);
  } catch (error) {
    console.error('Error getting A/B tests:', error);
    res.status(500).json({ error: 'Failed to get A/B tests' });
  }
});

// קבלת בדיקת A/B ספציפית
router.get('/:testId', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const abTest = await prisma.aBTest.findFirst({
      where: { id: testId, userId: req.user.id },
      include: {
        variants: true,
        assignments: {
          include: { contact: true }
        },
        events: true,
        _count: {
          select: {
            assignments: true,
            events: true
          }
        }
      }
    });

    if (!abTest) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    res.json(abTest);
  } catch (error) {
    console.error('Error getting A/B test:', error);
    res.status(500).json({ error: 'Failed to get A/B test' });
  }
});

// התחלת בדיקת A/B
router.post('/:testId/start', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const abTest = await abTesting.startABTest(testId, req.user.id);
    res.json(abTest);
  } catch (error) {
    console.error('Error starting A/B test:', error);
    res.status(400).json({ error: error.message });
  }
});

// עצירת בדיקת A/B
router.post('/:testId/stop', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const result = await abTesting.stopABTest(testId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error stopping A/B test:', error);
    res.status(400).json({ error: error.message });
  }
});

// הקצאת משתמש לוריאנט (לשימוש פנימי)
router.post('/:testId/assign/:contactId', auth, async (req, res) => {
  try {
    const { testId, contactId } = req.params;
    const assignment = await abTesting.assignUserToVariant(testId, contactId);
    res.json(assignment);
  } catch (error) {
    console.error('Error assigning user to variant:', error);
    res.status(400).json({ error: error.message });
  }
});

// רישום אירוע בבדיקת A/B
router.post('/:testId/event', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { contactId, eventType, eventData } = req.body;

    if (!contactId || !eventType) {
      return res.status(400).json({ error: 'Contact ID and event type are required' });
    }

    const event = await abTesting.recordEvent(testId, contactId, eventType, eventData);
    res.json(event);
  } catch (error) {
    console.error('Error recording A/B test event:', error);
    res.status(400).json({ error: error.message });
  }
});

// קבלת תוצאות בדיקת A/B
router.get('/:testId/results', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await abTesting.calculateResults(testId);
    res.json(results);
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    res.status(500).json({ error: 'Failed to get A/B test results' });
  }
});

// עדכון בדיקת A/B
router.put('/:testId', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const updateData = req.body;
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // בדיקה שהבדיקה שייכת למשתמש
    const existingTest = await prisma.aBTest.findFirst({
      where: { id: testId, userId: req.user.id }
    });

    if (!existingTest) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (existingTest.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only update draft tests' });
    }

    const updatedTest = await prisma.aBTest.update({
      where: { id: testId },
      data: {
        name: updateData.name,
        description: updateData.description,
        duration: updateData.duration,
        autoWinner: updateData.autoWinner,
        successMetric: updateData.successMetric,
        targetAudience: updateData.targetAudience
      },
      include: {
        variants: true
      }
    });

    res.json(updatedTest);
  } catch (error) {
    console.error('Error updating A/B test:', error);
    res.status(500).json({ error: 'Failed to update A/B test' });
  }
});

// מחיקת בדיקת A/B
router.delete('/:testId', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // בדיקה שהבדיקה שייכת למשתמש
    const existingTest = await prisma.aBTest.findFirst({
      where: { id: testId, userId: req.user.id }
    });

    if (!existingTest) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    if (existingTest.status === 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot delete active test. Stop it first.' });
    }

    await prisma.aBTest.delete({
      where: { id: testId }
    });

    res.json({ message: 'A/B test deleted successfully' });
  } catch (error) {
    console.error('Error deleting A/B test:', error);
    res.status(500).json({ error: 'Failed to delete A/B test' });
  }
});

// דוח ביצועים כללי
router.get('/dashboard/performance', auth, async (req, res) => {
  try {
    const { timeframe = 30 } = req.query;
    const report = await abTesting.getPerformanceReport(req.user.id, parseInt(timeframe));
    res.json(report);
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ error: 'Failed to generate performance report' });
  }
});

// שכפול בדיקת A/B
router.post('/:testId/duplicate', auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const originalTest = await prisma.aBTest.findFirst({
      where: { id: testId, userId: req.user.id },
      include: { variants: true }
    });

    if (!originalTest) {
      return res.status(404).json({ error: 'A/B test not found' });
    }

    // יצירת עותק
    const duplicatedTest = await prisma.aBTest.create({
      data: {
        userId: req.user.id,
        name: `${originalTest.name} (Copy)`,
        description: originalTest.description,
        type: originalTest.type,
        successMetric: originalTest.successMetric,
        duration: originalTest.duration,
        autoWinner: originalTest.autoWinner,
        targetAudience: originalTest.targetAudience,
        variants: {
          create: originalTest.variants.map(variant => ({
            name: variant.name,
            content: variant.content,
            trafficPercentage: variant.trafficPercentage,
            isControl: variant.isControl
          }))
        }
      },
      include: { variants: true }
    });

    res.status(201).json(duplicatedTest);
  } catch (error) {
    console.error('Error duplicating A/B test:', error);
    res.status(500).json({ error: 'Failed to duplicate A/B test' });
  }
});

module.exports = router;
