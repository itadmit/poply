const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

// Get all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.user.id,
      ...(status && { status }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } }
        ]
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        orders: {
          include: {
            contact: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, imageUrl, category, tags } = productSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        imageUrl,
        category,
        tags: tags || [],
        userId: req.user.id
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, imageUrl, category, tags, status } = req.body;

    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(status && { status })
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Import products
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products array is required' });
    }

    const validProducts = products.map(product => ({
      name: product.name,
      description: product.description || null,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl || null,
      category: product.category || null,
      tags: product.tags || [],
      userId: req.user.id
    }));

    const result = await prisma.product.createMany({
      data: validProducts,
      skipDuplicates: true
    });

    res.json({ 
      message: `${result.count} products imported successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({ message: 'Failed to import products' });
  }
});

module.exports = router;
