const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const automationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trigger: z.enum(['CONTACT_CREATED', 'CONTACT_UPDATED', 'ORDER_CREATED', 'ORDER_COMPLETED', 'CART_ABANDONED', 'PAGE_VISITED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'CUSTOM']),
  conditions: z.record(z.any()),
  actions: z.record(z.any())
});

// Get all automations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(status && { status })
    };

    const [automations, total] = await Promise.all([
      prisma.automation.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.automation.count({ where })
    ]);

    res.json({
      automations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get automations error:', error);
    res.status(500).json({ message: 'Failed to fetch automations' });
  }
});

// Get single automation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const automation = await prisma.automation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }

    res.json(automation);
  } catch (error) {
    console.error('Get automation error:', error);
    res.status(500).json({ message: 'Failed to fetch automation' });
  }
});

// Create automation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, trigger, conditions, actions } = automationSchema.parse(req.body);

    const automation = await prisma.automation.create({
      data: {
        name,
        description,
        trigger,
        conditions,
        actions,
        userId: req.user.id
      }
    });

    res.status(201).json(automation);
  } catch (error) {
    console.error('Create automation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to create automation' });
  }
});

// Update automation
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, trigger, conditions, actions, status } = req.body;

    const automation = await prisma.automation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }

    const updatedAutomation = await prisma.automation.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(trigger && { trigger }),
        ...(conditions && { conditions }),
        ...(actions && { actions }),
        ...(status && { status })
      }
    });

    res.json(updatedAutomation);
  } catch (error) {
    console.error('Update automation error:', error);
    res.status(500).json({ message: 'Failed to update automation' });
  }
});

// Delete automation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const automation = await prisma.automation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }

    await prisma.automation.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Automation deleted successfully' });
  } catch (error) {
    console.error('Delete automation error:', error);
    res.status(500).json({ message: 'Failed to delete automation' });
  }
});

// Toggle automation status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const automation = await prisma.automation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!automation) {
      return res.status(404).json({ message: 'Automation not found' });
    }

    const newStatus = automation.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updatedAutomation = await prisma.automation.update({
      where: { id: req.params.id },
      data: { status: newStatus }
    });

    res.json(updatedAutomation);
  } catch (error) {
    console.error('Toggle automation error:', error);
    res.status(500).json({ message: 'Failed to toggle automation' });
  }
});

module.exports = router;
