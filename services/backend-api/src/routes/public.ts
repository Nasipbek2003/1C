import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public endpoints for Telegram Bot (no authentication required)

const createCustomerSchema = z.object({
  telegramUserId: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional()
});

// Create or get customer
router.post('/customers', asyncHandler(async (req, res) => {
  const data = createCustomerSchema.parse(req.body);

  // Try to find existing customer
  let customer = await prisma.customer.findUnique({
    where: { telegramUserId: data.telegramUserId }
  });

  if (customer) {
    return res.json({ customer, created: false });
  }

  // Create new customer
  customer = await prisma.customer.create({
    data
  });

  res.status(201).json({ customer, created: true });
}));

// Get customer by telegram user ID
router.get('/customers/telegram/:telegramUserId', asyncHandler(async (req, res) => {
  const { telegramUserId } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { telegramUserId }
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json({ customer });
}));

// Create chat session
router.post('/chat-sessions', asyncHandler(async (req, res) => {
  const { customerId } = req.body;

  // Check if there's already an active session
  const existingSession = await prisma.chatSession.findFirst({
    where: {
      customerId,
      isActive: true
    }
  });

  if (existingSession) {
    return res.json({ session: existingSession, created: false });
  }

  // Create new session
  const session = await prisma.chatSession.create({
    data: {
      customerId
    }
  });

  res.status(201).json({ session, created: true });
}));

// Create message
const createMessageSchema = z.object({
  chatSessionId: z.string().uuid(),
  senderId: z.string(),
  senderType: z.enum(['CUSTOMER', 'OPERATOR', 'BOT']),
  content: z.string().min(1)
});

router.post('/messages', asyncHandler(async (req, res) => {
  const data = createMessageSchema.parse(req.body);

  const message = await prisma.message.create({
    data
  });

  // Update chat session last activity
  await prisma.chatSession.update({
    where: { id: data.chatSessionId },
    data: { lastActivityAt: new Date() }
  });

  res.status(201).json({ message });
}));

// Get customer orders by telegram user ID
router.get('/customers/telegram/:telegramUserId/orders', asyncHandler(async (req, res) => {
  const { telegramUserId } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { telegramUserId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      }
    }
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json({ orders: customer.orders });
}));

// Get products with filtering and pagination (public - no auth)
router.get('/products', asyncHandler(async (req, res) => {
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

// Get product by ID (public - no auth)
router.get('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ product });
}));

export { router as publicRouter };
