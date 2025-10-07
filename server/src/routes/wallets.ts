import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { BlockchainService } from '../services/blockchain';

const router = Router();
const prisma = new PrismaClient();
const blockchainService = new BlockchainService();

// Get user's wallets
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const wallets = await prisma.wallet.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      address: true,
      network: true,
      currency: true,
      balance: true,
      isActive: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    data: { wallets }
  });
}));

// Create new wallet
router.post('/', [
  body('network').isIn(['ethereum', 'polygon', 'bitcoin']),
  body('currency').isLength({ min: 2, max: 10 })
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { network, currency } = req.body;

  // Check if user already has a wallet for this network
  const existingWallet = await prisma.wallet.findFirst({
    where: {
      userId: req.user!.id,
      network,
      currency
    }
  });

  if (existingWallet) {
    return res.status(400).json({
      success: false,
      error: 'Wallet for this network and currency already exists'
    });
  }

  // Generate new wallet address
  const address = await blockchainService.generateWallet(network, req.user!.id);

  const wallet = await prisma.wallet.findUnique({
    where: { address },
    select: {
      id: true,
      address: true,
      network: true,
      currency: true,
      balance: true,
      isActive: true,
      createdAt: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Wallet created successfully',
    data: { wallet }
  });
}));

// Get wallet balance
router.get('/:walletId/balance', asyncHandler(async (req: AuthRequest, res) => {
  const { walletId } = req.params;

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId: req.user!.id
    }
  });

  if (!wallet) {
    return res.status(404).json({
      success: false,
      error: 'Wallet not found'
    });
  }

  // Get real-time balance from blockchain
  const balance = await blockchainService.getBalance(wallet.network, wallet.address);

  // Update balance in database
  await prisma.wallet.update({
    where: { id: walletId },
    data: { balance: parseFloat(balance) }
  });

  res.json({
    success: true,
    data: {
      walletId: wallet.id,
      address: wallet.address,
      network: wallet.network,
      currency: wallet.currency,
      balance: balance,
      fiatValue: 0 // Will be calculated with price service
    }
  });
}));

// Get wallet details
router.get('/:walletId', asyncHandler(async (req: AuthRequest, res) => {
  const { walletId } = req.params;

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId: req.user!.id
    },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          description: true
        }
      }
    }
  });

  if (!wallet) {
    return res.status(404).json({
      success: false,
      error: 'Wallet not found'
    });
  }

  res.json({
    success: true,
    data: { wallet }
  });
}));

// Update wallet (activate/deactivate)
router.patch('/:walletId', [
  body('isActive').isBoolean()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { walletId } = req.params;
  const { isActive } = req.body;

  const wallet = await prisma.wallet.findFirst({
    where: {
      id: walletId,
      userId: req.user!.id
    }
  });

  if (!wallet) {
    return res.status(404).json({
      success: false,
      error: 'Wallet not found'
    });
  }

  const updatedWallet = await prisma.wallet.update({
    where: { id: walletId },
    data: { isActive },
    select: {
      id: true,
      address: true,
      network: true,
      currency: true,
      balance: true,
      isActive: true,
      createdAt: true
    }
  });

  res.json({
    success: true,
    message: 'Wallet updated successfully',
    data: { wallet: updatedWallet }
  });
}));

// Get supported networks
router.get('/networks/supported', asyncHandler(async (req, res) => {
  const networks = await blockchainService.getSupportedNetworks();
  
  res.json({
    success: true,
    data: { networks }
  });
}));

export default router;

