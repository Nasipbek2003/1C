import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { io } from '../index';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get orders with filtering and pagination
router.get('/', asyncHandler(async (req, res) => {
  const { customerId, status, page = '1', limit = '20' } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    orders,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum)
  });
}));

// Get order by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  res.json({ order });
}));

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    size: z.string().optional()
  })),
  deliveryAddress: z.string(),
  deliveryMethod: z.string(),
  paymentMethod: z.string()
});

// Create order
router.post('/', asyncHandler(async (req, res) => {
  const data = createOrderSchema.parse(req.body);

  // Calculate total amount
  const products = await prisma.product.findMany({
    where: {
      id: { in: data.items.map(item => item.productId) }
    }
  });

  const totalAmount = data.items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) throw new AppError(`Product ${item.productId} not found`, 404);
    return sum + (Number(product.price) * item.quantity);
  }, 0);

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create order with items
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: data.customerId,
      totalAmount,
      deliveryAddress: data.deliveryAddress,
      deliveryMethod: data.deliveryMethod,
      paymentMethod: data.paymentMethod,
      items: {
        create: data.items.map(item => {
          const product = products.find(p => p.id === item.productId)!;
          return {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            priceAtOrder: product.price
          };
        })
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

  // Emit WebSocket event
  io.emit('new_order', { order });

  res.status(201).json({ order, orderNumber });
}));

const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional()
});

// Update order status
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateOrderStatusSchema.parse(req.body);

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: data.status,
      ...(data.trackingNumber && { trackingNumber: data.trackingNumber })
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    }
  });

  // Emit WebSocket event
  io.emit('order_status_changed', { order });

  res.json({ order });
}));

export { router as ordersRouter };
