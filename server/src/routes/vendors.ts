import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest, requireVendor } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get vendor profile
router.get('/profile', requireVendor, asyncHandler(async (req: AuthRequest, res) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: req.user!.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!vendorProfile) {
    return res.status(404).json({
      success: false,
      error: 'Vendor profile not found'
    });
  }

  res.json({
    success: true,
    data: { vendorProfile }
  });
}));

// Update vendor profile
router.put('/profile', requireVendor, [
  body('businessName').isString().trim().escape(),
  body('description').optional().isString().trim().escape(),
  body('website').optional().isURL(),
  body('logo').optional().isString()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { businessName, description, website, logo } = req.body;

  const vendorProfile = await prisma.vendorProfile.update({
    where: { userId: req.user!.id },
    data: {
      businessName,
      description,
      website,
      logo
    }
  });

  res.json({
    success: true,
    message: 'Vendor profile updated successfully',
    data: { vendorProfile }
  });
}));

// Get vendor analytics
router.get('/analytics', requireVendor, asyncHandler(async (req: AuthRequest, res) => {
  const { period = '30d' } = req.query;
  
  let dateFilter: Date;
  switch (period) {
    case '7d':
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Get transaction statistics
  const totalTransactions = await prisma.transaction.count({
    where: {
      toUserId: req.user!.id,
      createdAt: { gte: dateFilter }
    }
  });

  const totalVolume = await prisma.transaction.aggregate({
    where: {
      toUserId: req.user!.id,
      createdAt: { gte: dateFilter },
      status: 'CONFIRMED'
    },
    _sum: {
      fiatAmount: true
    }
  });

  const totalVolumeCrypto = await prisma.transaction.aggregate({
    where: {
      toUserId: req.user!.id,
      createdAt: { gte: dateFilter },
      status: 'CONFIRMED'
    },
    _sum: {
      amount: true
    }
  });

  // Get transactions by currency
  const transactionsByCurrency = await prisma.transaction.groupBy({
    by: ['currency'],
    where: {
      toUserId: req.user!.id,
      createdAt: { gte: dateFilter },
      status: 'CONFIRMED'
    },
    _sum: {
      amount: true,
      fiatAmount: true
    },
    _count: true
  });

  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      toUserId: req.user!.id,
      createdAt: { gte: dateFilter }
    },
    include: {
      fromUser: {
        select: {
          username: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  res.json({
    success: true,
    data: {
      analytics: {
        period,
        totalTransactions,
        totalVolumeUSD: totalVolume._sum.fiatAmount || 0,
        totalVolumeCrypto: totalVolumeCrypto._sum.amount || 0,
        transactionsByCurrency,
        recentTransactions
      }
    }
  });
}));

// Get vendor dashboard data
router.get('/dashboard', requireVendor, asyncHandler(async (req: AuthRequest, res) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: req.user!.id }
  });

  if (!vendorProfile) {
    return res.status(404).json({
      success: false,
      error: 'Vendor profile not found'
    });
  }

  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransactions = await prisma.transaction.count({
    where: {
      toUserId: req.user!.id,
      createdAt: { gte: today }
    }
  });

  const todayVolume = await prisma.transaction.aggregate({
    where: {
      toUserId: req.user!.id,
      createdAt: { gte: today },
      status: 'CONFIRMED'
    },
    _sum: {
      fiatAmount: true
    }
  });

  // Get pending transactions
  const pendingTransactions = await prisma.transaction.count({
    where: {
      toUserId: req.user!.id,
      status: 'PENDING'
    }
  });

  res.json({
    success: true,
    data: {
      vendorProfile,
      dashboard: {
        todayTransactions,
        todayVolumeUSD: todayVolume._sum.fiatAmount || 0,
        pendingTransactions
      }
    }
  });
}));

export default router;

