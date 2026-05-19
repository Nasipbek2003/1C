import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get products with filtering and pagination (requires auth for admin features)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { category, page = '1', limit = '20' } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where = category ? { category: category as string } : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' }
    }),
    prisma.product.count({ where })
  ]);

  res.json({
    products,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum)
  });
}));

// Get product by ID
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({ product });
}));

// Create product schema
const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().optional(),
  category: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  inventory: z.number().int().min(0)
});

// Create new product
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const data = createProductSchema.parse(req.body);

  const product = await prisma.product.create({
    data: {
      c1ProductId: `PROD-${Date.now()}`, // Generate unique ID
      name: data.name,
      price: data.price,
      description: data.description,
      category: data.category,
      sizes: data.sizes || [],
      inventory: data.inventory,
      lastSyncedAt: new Date()
    }
  });

  res.status(201).json({ product });
}));

// Update product schema
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  sizes: z.array(z.string()).optional(),
  inventory: z.number().int().min(0).optional()
});

// Update product
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateProductSchema.parse(req.body);

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });

  res.json({ product });
}));

// Delete product
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.product.delete({
    where: { id }
  });

  res.json({ success: true, message: 'Product deleted' });
}));

export { router as productsRouter };
