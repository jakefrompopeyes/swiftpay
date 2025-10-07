import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      vendorProfile: true,
      wallets: {
        select: {
          id: true,
          address: true,
          network: true,
          currency: true,
          balance: true,
          isActive: true
        }
      }
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      isVendor: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    data: { user }
  });
}));

// Update user profile
router.put('/profile', [
  body('firstName').optional().isString().trim().escape(),
  body('lastName').optional().isString().trim().escape(),
  body('username').optional().isString().trim().escape()
], asyncHandler(async (req: AuthRequest, res) => {
  const { firstName, lastName, username } = req.body;

  // Check if username is already taken
  if (username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: { not: req.user!.id }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username is already taken'
      });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName,
      lastName,
      username
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      isVendor: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

export default router;

