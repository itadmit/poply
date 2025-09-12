const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const contactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional()
});

// Get all contacts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, tags } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(tags && { tags: { hasSome: tags.split(',') } }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { 
              orders: true,
              events: true,
              campaigns: true
            }
          }
        }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// Get single contact
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        orders: {
          include: {
            product: true
          }
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        campaigns: {
          include: {
            campaign: true
          }
        },
        segments: {
          include: {
            segment: true
          }
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ message: 'Failed to fetch contact' });
  }
});

// Create contact
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email, firstName, lastName, phone, company, tags, source } = contactSchema.parse(req.body);

    // Check if contact already exists
    const existingContact = await prisma.contact.findFirst({
      where: {
        email,
        userId: req.user.id
      }
    });

    if (existingContact) {
      return res.status(400).json({ message: 'Contact already exists' });
    }

    const contact = await prisma.contact.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        company,
        tags: tags || [],
        source,
        userId: req.user.id
      }
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to create contact' });
  }
});

// Update contact
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { email, firstName, lastName, phone, company, tags, status } = req.body;

    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        ...(email && { email }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(company !== undefined && { company }),
        ...(tags !== undefined && { tags }),
        ...(status && { status })
      }
    });

    res.json(updatedContact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Failed to delete contact' });
  }
});

// Import contacts
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: 'Contacts array is required' });
    }

    const validContacts = contacts.map(contact => ({
      email: contact.email,
      firstName: contact.firstName || null,
      lastName: contact.lastName || null,
      phone: contact.phone || null,
      company: contact.company || null,
      tags: contact.tags || [],
      source: contact.source || 'import',
      userId: req.user.id
    }));

    const result = await prisma.contact.createMany({
      data: validContacts,
      skipDuplicates: true
    });

    res.json({ 
      message: `${result.count} contacts imported successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({ message: 'Failed to import contacts' });
  }
});

// Get contact statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [
      totalContacts,
      activeContacts,
      unsubscribedContacts,
      bouncedContacts,
      recentContacts
    ] = await Promise.all([
      prisma.contact.count({
        where: { userId: req.user.id }
      }),
      prisma.contact.count({
        where: { userId: req.user.id, status: 'ACTIVE' }
      }),
      prisma.contact.count({
        where: { userId: req.user.id, status: 'UNSUBSCRIBED' }
      }),
      prisma.contact.count({
        where: { userId: req.user.id, status: 'BOUNCED' }
      }),
      prisma.contact.count({
        where: {
          userId: req.user.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    res.json({
      totalContacts,
      activeContacts,
      unsubscribedContacts,
      bouncedContacts,
      recentContacts
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ message: 'Failed to fetch contact statistics' });
  }
});

module.exports = router;
