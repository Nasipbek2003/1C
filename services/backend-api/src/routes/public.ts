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

// Update customer
router.put('/customers/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: name || undefined,
      phone: phone || undefined
    }
  });

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

// Create order (public - for Telegram bot)
const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    size: z.string().optional().nullable()
  })),
  deliveryAddress: z.string().min(1),
  deliveryMethod: z.string().min(1),
  paymentMethod: z.string().min(1)
});

router.post('/orders', asyncHandler(async (req, res) => {
  const data = createOrderSchema.parse(req.body);

  // Get products to calculate total
  const productIds = data.items.map(item => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  // Calculate total amount
  let totalAmount = 0;
  const orderItems = data.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    const itemTotal = parseFloat(product.price.toString()) * item.quantity;
    totalAmount += itemTotal;

    return {
      productId: item.productId,
      quantity: item.quantity,
      size: item.size || null,
      priceAtOrder: product.price
    };
  });

  // Generate order number
  const orderCount = await prisma.order.count();
  const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`;

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      totalAmount,
      deliveryAddress: data.deliveryAddress,
      deliveryMethod: data.deliveryMethod,
      paymentMethod: data.paymentMethod,
      status: 'NEW',
      items: {
        create: orderItems
      }
    },
    include: {
      items: {
        include: {
          product: true
        }
      },
      customer: true
    }
  });

  res.status(201).json({ order });
}));

export { router as publicRouter };
