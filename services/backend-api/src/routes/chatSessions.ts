import { Router } from 'express';
import { prisma } from '../utils/db';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get chat sessions
router.get('/', asyncHandler(async (req, res) => {
  const { customerId, active } = req.query;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (active !== undefined) where.isActive = active === 'true';

  const sessions = await prisma.chatSession.findMany({
    where,
    include: {
      customer: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { lastActivityAt: 'desc' }
  });

  res.json({ sessions });
}));

// Get single chat session
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: {
      customer: true
    }
  });

  if (!session) {
    throw new AppError('Chat session not found', 404);
  }

  res.json({ session });
}));

// Get chat session messages
router.get('/:id/messages', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await prisma.chatSession.findUnique({
    where: { id }
  });

  if (!session) {
    throw new AppError('Chat session not found', 404);
  }

  const messages = await prisma.message.findMany({
    where: { chatSessionId: id },
    orderBy: { createdAt: 'asc' }
  });

  res.json({ messages });
}));

// Update chat session (e.g., close it)
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const session = await prisma.chatSession.update({
    where: { id },
    data: {
      isActive,
      closedAt: isActive === false ? new Date() : null
    }
  });

  res.json({ session });
}));

export { router as chatSessionsRouter };
