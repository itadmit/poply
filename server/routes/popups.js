const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const popupSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['EXIT_INTENT', 'TIME_DELAY', 'SCROLL_PERCENTAGE', 'PAGE_VIEWS', 'CUSTOM']),
  trigger: z.enum(['EXIT_INTENT', 'TIME_DELAY', 'SCROLL_PERCENTAGE', 'PAGE_VIEWS', 'CUSTOM']),
  conditions: z.record(z.any()),
  design: z.record(z.any())
});

// Get all popups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(status && { status })
    };

    const [popups, total] = await Promise.all([
      prisma.popup.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { events: true }
          }
        }
      }),
      prisma.popup.count({ where })
    ]);

    res.json({
      popups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get popups error:', error);
    res.status(500).json({ message: 'Failed to fetch popups' });
  }
});

// Get single popup
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const popup = await prisma.popup.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        _count: {
          select: { events: true }
        }
      }
    });

    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    res.json(popup);
  } catch (error) {
    console.error('Get popup error:', error);
    res.status(500).json({ message: 'Failed to fetch popup' });
  }
});

// Create popup
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, title, content, type, trigger, conditions, design } = popupSchema.parse(req.body);

    const popup = await prisma.popup.create({
      data: {
        name,
        title,
        content,
        type,
        trigger,
        conditions,
        design,
        userId: req.user.id
      }
    });

    res.status(201).json(popup);
  } catch (error) {
    console.error('Create popup error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to create popup' });
  }
});

// Update popup
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, title, content, type, trigger, conditions, design, status } = req.body;

    const popup = await prisma.popup.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    const updatedPopup = await prisma.popup.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(title && { title }),
        ...(content && { content }),
        ...(type && { type }),
        ...(trigger && { trigger }),
        ...(conditions && { conditions }),
        ...(design && { design }),
        ...(status && { status })
      }
    });

    res.json(updatedPopup);
  } catch (error) {
    console.error('Update popup error:', error);
    res.status(500).json({ message: 'Failed to update popup' });
  }
});

// Delete popup
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const popup = await prisma.popup.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    await prisma.popup.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Popup deleted successfully' });
  } catch (error) {
    console.error('Delete popup error:', error);
    res.status(500).json({ message: 'Failed to delete popup' });
  }
});

// Toggle popup status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const popup = await prisma.popup.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    const newStatus = popup.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updatedPopup = await prisma.popup.update({
      where: { id: req.params.id },
      data: { status: newStatus }
    });

    res.json(updatedPopup);
  } catch (error) {
    console.error('Toggle popup error:', error);
    res.status(500).json({ message: 'Failed to toggle popup' });
  }
});

// Get popup statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const popup = await prisma.popup.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!popup) {
      return res.status(404).json({ message: 'Popup not found' });
    }

    const [totalShows, totalCloses, recentEvents] = await Promise.all([
      prisma.event.count({
        where: {
          popupId: req.params.id,
          type: 'POPUP_SHOWN'
        }
      }),
      prisma.event.count({
        where: {
          popupId: req.params.id,
          type: 'POPUP_CLOSED'
        }
      }),
      prisma.event.findMany({
        where: {
          popupId: req.params.id
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    const conversionRate = totalShows > 0 ? (totalCloses / totalShows) * 100 : 0;

    res.json({
      totalShows,
      totalCloses,
      conversionRate: Math.round(conversionRate * 100) / 100,
      recentEvents
    });
  } catch (error) {
    console.error('Get popup stats error:', error);
    res.status(500).json({ message: 'Failed to fetch popup statistics' });
  }
});

module.exports = router;
