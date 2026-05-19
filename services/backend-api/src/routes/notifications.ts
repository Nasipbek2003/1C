import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', asyncHandler(async (req, res) => {
  const { customerId, status } = req.query;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (status) where.status = status;

  const notifications = await prisma.notification.findMany({
    where,
    include: {
      customer: true,
      order: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ notifications });
}));

const createNotificationSchema = z.object({
  customerId: z.string().uuid(),
  type: z.enum(['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'CUSTOM']),
  content: z.string(),
  orderId: z.string().uuid().optional()
});

// Create notification
router.post('/', asyncHandler(async (req, res) => {
  const data = createNotificationSchema.parse(req.body);

  const notification = await prisma.notification.create({
    data
  });

  res.status(201).json({ notification });
}));

export { router as notificationsRouter };
