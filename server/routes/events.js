const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const eventSchema = z.object({
  type: z.enum(['PAGE_VIEW', 'EMAIL_OPEN', 'EMAIL_CLICK', 'POPUP_SHOWN', 'POPUP_CLOSED', 'CART_ADD', 'CART_REMOVE', 'CHECKOUT_START', 'ORDER_COMPLETE', 'CUSTOM']),
  data: z.record(z.any()),
  contactId: z.string().optional(),
  campaignId: z.string().optional(),
  popupId: z.string().optional()
});

// Track event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, data, contactId, campaignId, popupId } = eventSchema.parse(req.body);

    const event = await prisma.event.create({
      data: {
        type,
        data,
        userId: req.user.id,
        contactId,
        campaignId,
        popupId
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Track event error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to track event' });
  }
});

// Get events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, contactId, campaignId, popupId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(type && { type }),
      ...(contactId && { contactId }),
      ...(campaignId && { campaignId }),
      ...(popupId && { popupId }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          campaign: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          popup: {
            select: {
              id: true,
              name: true,
              title: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get event statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const where = {
      userId: req.user.id,
      ...dateFilter
    };

    const [
      totalEvents,
      pageViews,
      emailOpens,
      emailClicks,
      popupShows,
      popupCloses,
      cartAdds,
      orders,
      recentEvents
    ] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.count({ where: { ...where, type: 'PAGE_VIEW' } }),
      prisma.event.count({ where: { ...where, type: 'EMAIL_OPEN' } }),
      prisma.event.count({ where: { ...where, type: 'EMAIL_CLICK' } }),
      prisma.event.count({ where: { ...where, type: 'POPUP_SHOWN' } }),
      prisma.event.count({ where: { ...where, type: 'POPUP_CLOSED' } }),
      prisma.event.count({ where: { ...where, type: 'CART_ADD' } }),
      prisma.event.count({ where: { ...where, type: 'ORDER_COMPLETE' } }),
      prisma.event.findMany({
        where,
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

    const emailOpenRate = emailOpens > 0 ? (emailClicks / emailOpens) * 100 : 0;
    const popupConversionRate = popupShows > 0 ? (popupCloses / popupShows) * 100 : 0;

    res.json({
      totalEvents,
      pageViews,
      emailOpens,
      emailClicks,
      emailOpenRate: Math.round(emailOpenRate * 100) / 100,
      popupShows,
      popupCloses,
      popupConversionRate: Math.round(popupConversionRate * 100) / 100,
      cartAdds,
      orders,
      recentEvents
    });
  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({ message: 'Failed to fetch event statistics' });
  }
});

// Get events by contact
router.get('/contact/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      contactId,
      ...(type && { type })
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          popup: {
            select: {
              id: true,
              name: true,
              title: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contact events error:', error);
    res.status(500).json({ message: 'Failed to fetch contact events' });
  }
});

module.exports = router;
