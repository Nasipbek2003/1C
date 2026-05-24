import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);

  const operator = await prisma.operator.findUnique({
    where: { username }
  });

  if (!operator || !operator.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, operator.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT secret not configured', 500);
  }

  const token = jwt.sign(
    { id: operator.id, username: operator.username, role: operator.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    operator: {
      id: operator.id,
      username: operator.username,
      name: operator.name,
      role: operator.role
    }
  });
}));

// Logout (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true });
});

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const operator = await prisma.operator.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  if (!operator) {
    throw new AppError('Operator not found', 404);
  }

  res.json({ operator });
}));

export { router as authRouter };
