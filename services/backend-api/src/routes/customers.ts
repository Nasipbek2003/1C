import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get customers with search and pagination (requires auth)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { search, page = '1', limit = '20' } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where = search ? {
    OR: [
      { name: { contains: search as string, mode: 'insensitive' as const } },
      { phone: { contains: search as string } },
      { username: { contains: search as string, mode: 'insensitive' as const } }
    ]
  } : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.customer.count({ where })
  ]);

  res.json({
    customers,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum)
  });
}));

// Get customer by ID with orders (requires auth)
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({ customer });
}));

const createCustomerSchema = z.object({
  telegramUserId: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional()
});

// Create customer (public - no auth required for Telegram bot)
router.post('/', asyncHandler(async (req, res) => {
  const data = createCustomerSchema.parse(req.body);

  const existingCustomer = await prisma.customer.findUnique({
    where: { telegramUserId: data.telegramUserId }
  });

  if (existingCustomer) {
    throw new AppError('Customer already exists', 400);
  }

  const customer = await prisma.customer.create({
    data
  });

  res.status(201).json({ customer });
}));

const updateCustomerSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional()
});

// Update customer (requires auth)
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateCustomerSchema.parse(req.body);

  const customer = await prisma.customer.update({
    where: { id },
    data
  });

  res.json({ customer });
}));

export { router as customersRouter };
