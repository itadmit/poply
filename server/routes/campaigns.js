const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');
const { addCampaignToQueue, scheduleCampaign, cancelCampaign, getQueueStats } = require('../services/campaignQueue');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const campaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['EMAIL', 'SMS', 'PUSH']),
  scheduledAt: z.string().datetime().optional()
});

// Get all campaigns
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(type && { type })
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { contacts: true }
          }
        }
      }),
      prisma.campaign.count({ where })
    ]);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        contacts: {
          include: {
            contact: true
          }
        },
        _count: {
          select: { contacts: true }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Failed to fetch campaign' });
  }
});

// Create campaign
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, subject, content, type, scheduledAt } = campaignSchema.parse(req.body);

    const campaign = await prisma.campaign.create({
      data: {
        name,
        subject,
        content,
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        userId: req.user.id
      }
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, subject, content, type, scheduledAt, status } = req.body;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(content && { content }),
        ...(type && { type }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(status && { status })
      }
    });

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await prisma.campaign.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Failed to delete campaign' });
  }
});

// Send campaign
router.post('/:id/send', authenticateToken, async (req, res) => {
  try {
    const { contactIds, segmentIds, sendToAll } = req.body;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Campaign is not in draft status' });
    }

    let targetContacts = [];

    if (sendToAll) {
      // שלח לכל אנשי הקשר הפעילים
      targetContacts = await prisma.contact.findMany({
        where: {
          userId: req.user.id,
          status: 'ACTIVE'
        },
        select: { id: true }
      });
    } else if (segmentIds && segmentIds.length > 0) {
      // שלח לסגמנטים ספציפיים
      const segmentContacts = await prisma.segmentContact.findMany({
        where: {
          segmentId: { in: segmentIds },
          segment: { userId: req.user.id }
        },
        include: {
          contact: {
            where: { status: 'ACTIVE' }
          }
        }
      });
      targetContacts = segmentContacts
        .filter(sc => sc.contact)
        .map(sc => ({ id: sc.contact.id }));
    } else if (contactIds && contactIds.length > 0) {
      // שלח לאנשי קשר ספציפיים
      targetContacts = await prisma.contact.findMany({
        where: {
          id: { in: contactIds },
          userId: req.user.id,
          status: 'ACTIVE'
        },
        select: { id: true }
      });
    }

    if (targetContacts.length === 0) {
      return res.status(400).json({ message: 'No valid contacts found for sending' });
    }

    // הוספת אנשי קשר לקמפיין
    await prisma.campaignContact.createMany({
      data: targetContacts.map(contact => ({
        campaignId: req.params.id,
        contactId: contact.id,
        status: 'PENDING'
      })),
      skipDuplicates: true
    });

    // הוספה לתור לשליחה ברקע
    if (campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()) {
      // קמפיין מתוזמן
      await scheduleCampaign(req.params.id, req.user.id, campaign.scheduledAt);
      await prisma.campaign.update({
        where: { id: req.params.id },
        data: { status: 'SCHEDULED' }
      });
    } else {
      // שליחה מיידית
      await addCampaignToQueue(req.params.id, req.user.id);
    }

    res.json({ 
      message: 'Campaign queued for sending',
      contactCount: targetContacts.length,
      scheduled: campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ message: 'Failed to send campaign' });
  }
});

// Cancel campaign
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (!['SCHEDULED', 'SENDING'].includes(campaign.status)) {
      return res.status(400).json({ message: 'Campaign cannot be cancelled' });
    }

    const cancelled = await cancelCampaign(req.params.id);
    
    if (cancelled) {
      res.json({ message: 'Campaign cancelled successfully' });
    } else {
      res.status(400).json({ message: 'Campaign could not be cancelled' });
    }
  } catch (error) {
    console.error('Cancel campaign error:', error);
    res.status(500).json({ message: 'Failed to cancel campaign' });
  }
});

// Get campaign stats
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const stats = await prisma.campaignContact.groupBy({
      by: ['status'],
      where: { campaignId: req.params.id },
      _count: { status: true }
    });

    const totalContacts = await prisma.campaignContact.count({
      where: { campaignId: req.params.id }
    });

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase() + 'Count'] = stat._count.status;
      return acc;
    }, {});

    const sentCount = statusCounts.sentCount || 0;
    const deliveredCount = statusCounts.deliveredCount || 0;
    const openedCount = statusCounts.openedCount || 0;
    const clickedCount = statusCounts.clickedCount || 0;
    const bouncedCount = statusCounts.bouncedCount || 0;
    const failedCount = statusCounts.failedCount || 0;

    res.json({
      totalContacts,
      sentCount,
      deliveredCount,
      openedCount,
      clickedCount,
      bouncedCount,
      failedCount,
      openRate: sentCount > 0 ? (openedCount / sentCount) * 100 : 0,
      clickRate: sentCount > 0 ? (clickedCount / sentCount) * 100 : 0,
      deliveryRate: totalContacts > 0 ? (deliveredCount / totalContacts) * 100 : 0
    });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({ message: 'Failed to fetch campaign stats' });
  }
});

// Get overall stats
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalCampaigns = await prisma.campaign.count({
      where: { userId: req.user.id }
    });

    const activeCampaigns = await prisma.campaign.count({
      where: { 
        userId: req.user.id,
        status: { in: ['SENDING', 'SCHEDULED'] }
      }
    });

    // Calculate average rates from sent campaigns
    const sentCampaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user.id,
        status: 'SENT'
      },
      include: {
        _count: {
          select: { contacts: true }
        }
      }
    });

    let totalOpenRate = 0;
    let totalClickRate = 0;
    let campaignCount = 0;

    for (const campaign of sentCampaigns) {
      const stats = await prisma.campaignContact.groupBy({
        by: ['status'],
        where: { campaignId: campaign.id },
        _count: { status: true }
      });

      const statusCounts = stats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase() + 'Count'] = stat._count.status;
        return acc;
      }, {});

      const sentCount = statusCounts.sentCount || 0;
      const openedCount = statusCounts.openedCount || 0;
      const clickedCount = statusCounts.clickedCount || 0;

      if (sentCount > 0) {
        totalOpenRate += (openedCount / sentCount) * 100;
        totalClickRate += (clickedCount / sentCount) * 100;
        campaignCount++;
      }
    }

    res.json({
      totalCampaigns,
      activeCampaigns,
      averageOpenRate: campaignCount > 0 ? totalOpenRate / campaignCount : 0,
      averageClickRate: campaignCount > 0 ? totalClickRate / campaignCount : 0
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ message: 'Failed to fetch overview stats' });
  }
});

// Get queue stats (admin only)
router.get('/queue/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const queueStats = await getQueueStats();
    res.json(queueStats);
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ message: 'Failed to fetch queue stats' });
  }
});

module.exports = router;
