import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/db';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all operators (admin only)
router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const operators = await prisma.operator.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ operators });
}));

// Get operator by ID
router.get('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const operator = await prisma.operator.findUnique({
    where: { id },
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

// Create operator schema
const createOperatorSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  isActive: z.boolean().optional()
});

// Create new operator
router.post('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const data = createOperatorSchema.parse(req.body);

  // Check if username already exists
  const existingOperator = await prisma.operator.findUnique({
    where: { username: data.username }
  });

  if (existingOperator) {
    throw new AppError('Username already exists', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  const operator = await prisma.operator.create({
    data: {
      username: data.username,
      passwordHash,
      name: data.name,
      role: data.role || 'OPERATOR',
      isActive: data.isActive !== undefined ? data.isActive : true
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  res.status(201).json({ operator });
}));

// Update operator schema
const updateOperatorSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'OPERATOR']).optional(),
  isActive: z.boolean().optional()
});

// Update operator
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = updateOperatorSchema.parse(req.body);

  console.log('🔧 Updating operator:', id);
  console.log('📝 Data received:', { ...data, password: data.password ? '***' : 'not provided' });

  // Check if operator exists
  const existingOperator = await prisma.operator.findUnique({
    where: { id }
  });

  if (!existingOperator) {
    throw new AppError('Operator not found', 404);
  }

  // If username is being changed, check if new username is available
  if (data.username && data.username !== existingOperator.username) {
    const usernameExists = await prisma.operator.findUnique({
      where: { username: data.username }
    });

    if (usernameExists) {
      throw new AppError('Username already exists', 400);
    }
  }

  // Prepare update data
  const updateData: any = {};
  if (data.username) updateData.username = data.username;
  if (data.name) updateData.name = data.name;
  if (data.role) updateData.role = data.role;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  // Hash new password if provided
  if (data.password) {
    console.log('🔐 Hashing new password...');
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
    console.log('✅ Password hashed successfully');
  } else {
    console.log('⚠️ No password provided, keeping existing password');
  }

  const operator = await prisma.operator.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  console.log('✅ Operator updated successfully');

  res.json({ operator });
}));

// Delete operator
router.delete('/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if operator exists
  const operator = await prisma.operator.findUnique({
    where: { id }
  });

  if (!operator) {
    throw new AppError('Operator not found', 404);
  }

  // Don't allow deleting yourself
  if (req.user && req.user.id === id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  await prisma.operator.delete({
    where: { id }
  });

  res.json({ success: true, message: 'Operator deleted' });
}));

export { router as operatorsRouter };
