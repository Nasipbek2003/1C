import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { io } from '../index';

const router = Router();

// All routes require authentication
router.use(authenticate);

const createMessageSchema = z.object({
  chatSessionId: z.string().uuid(),
  senderId: z.string(),
  senderType: z.enum(['CUSTOMER', 'OPERATOR', 'BOT']),
  content: z.string().min(1)
});

// Create message
router.post('/', asyncHandler(async (req, res) => {
  const data = createMessageSchema.parse(req.body);

  const message = await prisma.message.create({
    data
  });

  // Update chat session last activity
  await prisma.chatSession.update({
    where: { id: data.chatSessionId },
    data: { lastActivityAt: new Date() }
  });

  // Emit WebSocket event
  io.emit('new_message', { message });

  res.status(201).json({ message });
}));

export { router as messagesRouter };
