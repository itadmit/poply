const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

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
    const { contactIds } = req.body;

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

    // Update campaign status
    await prisma.campaign.update({
      where: { id: req.params.id },
      data: { 
        status: 'SENDING',
        sentAt: new Date()
      }
    });

    // Add contacts to campaign
    if (contactIds && contactIds.length > 0) {
      await prisma.campaignContact.createMany({
        data: contactIds.map(contactId => ({
          campaignId: req.params.id,
          contactId,
          status: 'PENDING'
        }))
      });
    }

    // TODO: Implement actual sending logic (email service, SMS service, etc.)

    res.json({ message: 'Campaign sent successfully' });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ message: 'Failed to send campaign' });
  }
});

module.exports = router;
