import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { BlockchainService } from '../services/blockchain';
import { PriceService } from '../services/price';
import { wss } from '../index';

const router = Router();
const prisma = new PrismaClient();
const blockchainService = new BlockchainService();
const priceService = new PriceService();

// Create new transaction
router.post('/', [
  body('toUserId').isString().notEmpty(),
  body('walletId').isString().notEmpty(),
  body('amount').isNumeric().isFloat({ min: 0.000001 }),
  body('currency').isLength({ min: 2, max: 10 }),
  body('description').optional().isString().trim().escape()
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { toUserId, walletId, amount, currency, description } = req.body;

  // Verify wallet belongs to user
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

  // Check if recipient exists
  const recipient = await prisma.user.findUnique({
    where: { id: toUserId }
  });

  if (!recipient) {
    return res.status(404).json({
      success: false,
      error: 'Recipient not found'
    });
  }

  // Check balance
  const currentBalance = await blockchainService.getBalance(wallet.network, wallet.address);
  if (parseFloat(currentBalance) < parseFloat(amount)) {
    return res.status(400).json({
      success: false,
      error: 'Insufficient balance'
    });
  }

  // Convert to fiat value
  const fiatAmount = await priceService.convertToFiat(parseFloat(amount), currency);

  // Create transaction record
  const transaction = await prisma.transaction.create({
    data: {
      fromUserId: req.user!.id,
      toUserId,
      walletId,
      amount: parseFloat(amount),
      currency,
      fiatAmount,
      fiatCurrency: 'USD',
      network: wallet.network,
      description,
      status: 'PENDING'
    },
    include: {
      fromUser: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true
        }
      },
      toUser: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true
        }
      },
      wallet: {
        select: {
          address: true,
          network: true,
          currency: true
        }
      }
    }
  });

  // Send WebSocket notification
  wss.clients.forEach((client) => {
    if (client.userId === toUserId) {
      client.send(JSON.stringify({
        type: 'new_transaction',
        data: transaction
      }));
    }
  });

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: { transaction }
  });
}));

// Get user's transactions
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    OR: [
      { fromUserId: req.user!.id },
      { toUserId: req.user!.id }
    ]
  };

  if (status) {
    where.status = status;
  }

  if (type === 'sent') {
    where.fromUserId = req.user!.id;
  } else if (type === 'received') {
    where.toUserId = req.user!.id;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      fromUser: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true
        }
      },
      toUser: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true
        }
      },
      wallet: {
        select: {
          address: true,
          network: true,
          currency: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: Number(limit)
  });

  const total = await prisma.transaction.count({ where });

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// Get transaction details
router.get('/:transactionId', asyncHandler(async (req: AuthRequest, res) => {
  const { transactionId } = req.params;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      OR: [
        { fromUserId: req.user!.id },
        { toUserId: req.user!.id }
      ]
    },
    include: {
      fromUser: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      toUser: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      wallet: {
        select: {
          address: true,
          network: true,
          currency: true
        }
      }
    }
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found'
    });
  }

  // Get blockchain transaction status if txHash exists
  let blockchainStatus = null;
  if (transaction.txHash) {
    try {
      blockchainStatus = await blockchainService.getTransactionStatus(
        transaction.network,
        transaction.txHash
      );
    } catch (error) {
      console.error('Error getting blockchain status:', error);
    }
  }

  res.json({
    success: true,
    data: {
      transaction,
      blockchainStatus
    }
  });
}));

// Confirm transaction (send to blockchain)
router.post('/:transactionId/confirm', asyncHandler(async (req: AuthRequest, res) => {
  const { transactionId } = req.params;
  const { privateKey } = req.body;

  if (!privateKey) {
    return res.status(400).json({
      success: false,
      error: 'Private key is required'
    });
  }

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      fromUserId: req.user!.id,
      status: 'PENDING'
    },
    include: {
      wallet: true,
      toUser: true
    }
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found or already processed'
    });
  }

  try {
    // Get recipient's wallet for this network
    const recipientWallet = await prisma.wallet.findFirst({
      where: {
        userId: transaction.toUserId,
        network: transaction.wallet.network,
        currency: transaction.currency
      }
    });

    if (!recipientWallet) {
      return res.status(400).json({
        success: false,
        error: 'Recipient does not have a wallet for this network'
      });
    }

    // Send transaction to blockchain
    let txResult;
    if (transaction.wallet.network === 'bitcoin') {
      txResult = await blockchainService.sendBitcoinTransaction(
        transaction.wallet.address,
        recipientWallet.address,
        transaction.amount.toString(),
        privateKey
      );
    } else {
      txResult = await blockchainService.sendTransaction(
        transaction.wallet.network,
        transaction.wallet.address,
        recipientWallet.address,
        transaction.amount.toString(),
        privateKey
      );
    }

    if (!txResult.success) {
      return res.status(400).json({
        success: false,
        error: txResult.error || 'Transaction failed'
      });
    }

    // Update transaction with txHash
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        txHash: txResult.txHash,
        status: 'CONFIRMED'
      }
    });

    // Send WebSocket notification
    wss.clients.forEach((client) => {
      if (client.userId === transaction.toUserId) {
        client.send(JSON.stringify({
          type: 'transaction_confirmed',
          data: updatedTransaction
        }));
      }
    });

    res.json({
      success: true,
      message: 'Transaction confirmed and sent to blockchain',
      data: {
        transaction: updatedTransaction,
        txHash: txResult.txHash
      }
    });
  } catch (error) {
    console.error('Error confirming transaction:', error);
    
    // Update transaction status to failed
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED' }
    });

    res.status(500).json({
      success: false,
      error: 'Failed to confirm transaction'
    });
  }
}));

// Cancel transaction
router.post('/:transactionId/cancel', asyncHandler(async (req: AuthRequest, res) => {
  const { transactionId } = req.params;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      fromUserId: req.user!.id,
      status: 'PENDING'
    }
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found or cannot be cancelled'
    });
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status: 'CANCELLED' }
  });

  res.json({
    success: true,
    message: 'Transaction cancelled successfully',
    data: { transaction: updatedTransaction }
  });
}));

export default router;

