const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const segmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  conditions: z.record(z.any())
});

// Get all segments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [segments, total] = await Promise.all([
      prisma.segment.findMany({
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
      prisma.segment.count({ where })
    ]);

    res.json({
      segments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get segments error:', error);
    res.status(500).json({ message: 'Failed to fetch segments' });
  }
});

// Get single segment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const segment = await prisma.segment.findFirst({
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

    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    res.json(segment);
  } catch (error) {
    console.error('Get segment error:', error);
    res.status(500).json({ message: 'Failed to fetch segment' });
  }
});

// Create segment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, conditions } = segmentSchema.parse(req.body);

    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        conditions,
        userId: req.user.id
      }
    });

    res.status(201).json(segment);
  } catch (error) {
    console.error('Create segment error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to create segment' });
  }
});

// Update segment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, conditions } = req.body;

    const segment = await prisma.segment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    const updatedSegment = await prisma.segment.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(conditions && { conditions })
      }
    });

    res.json(updatedSegment);
  } catch (error) {
    console.error('Update segment error:', error);
    res.status(500).json({ message: 'Failed to update segment' });
  }
});

// Delete segment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const segment = await prisma.segment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    await prisma.segment.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Delete segment error:', error);
    res.status(500).json({ message: 'Failed to delete segment' });
  }
});

// Add contacts to segment
router.post('/:id/contacts', authenticateToken, async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ message: 'Contact IDs array is required' });
    }

    const segment = await prisma.segment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    // Check if contacts belong to user
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId: req.user.id
      }
    });

    if (contacts.length !== contactIds.length) {
      return res.status(400).json({ message: 'Some contacts not found or not accessible' });
    }

    // Add contacts to segment
    const result = await prisma.segmentContact.createMany({
      data: contactIds.map(contactId => ({
        segmentId: req.params.id,
        contactId
      })),
      skipDuplicates: true
    });

    res.json({ 
      message: `${result.count} contacts added to segment`,
      count: result.count
    });
  } catch (error) {
    console.error('Add contacts to segment error:', error);
    res.status(500).json({ message: 'Failed to add contacts to segment' });
  }
});

// Remove contacts from segment
router.delete('/:id/contacts', authenticateToken, async (req, res) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ message: 'Contact IDs array is required' });
    }

    const segment = await prisma.segment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    // Remove contacts from segment
    const result = await prisma.segmentContact.deleteMany({
      where: {
        segmentId: req.params.id,
        contactId: { in: contactIds }
      }
    });

    res.json({ 
      message: `${result.count} contacts removed from segment`,
      count: result.count
    });
  } catch (error) {
    console.error('Remove contacts from segment error:', error);
    res.status(500).json({ message: 'Failed to remove contacts from segment' });
  }
});

// Get segment contacts
router.get('/:id/contacts', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const segment = await prisma.segment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!segment) {
      return res.status(404).json({ message: 'Segment not found' });
    }

    const [segmentContacts, total] = await Promise.all([
      prisma.segmentContact.findMany({
        where: { segmentId: req.params.id },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          contact: {
            include: {
              _count: {
                select: { 
                  orders: true,
                  events: true,
                  campaigns: true
                }
              }
            }
          }
        }
      }),
      prisma.segmentContact.count({
        where: { segmentId: req.params.id }
      })
    ]);

    res.json({
      contacts: segmentContacts.map(sc => sc.contact),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get segment contacts error:', error);
    res.status(500).json({ message: 'Failed to fetch segment contacts' });
  }
});

module.exports = router;
