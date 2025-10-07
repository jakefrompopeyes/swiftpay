import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler';
import { PriceService } from '../services/price';

const router = Router();
const prisma = new PrismaClient();
const priceService = new PriceService();

// Get current crypto prices
router.get('/prices', asyncHandler(async (req, res) => {
  const prices = await prisma.priceData.findMany({
    orderBy: { lastUpdated: 'desc' }
  });

  res.json({
    success: true,
    data: { prices }
  });
}));

// Get price for specific currency
router.get('/prices/:currency', asyncHandler(async (req, res) => {
  const { currency } = req.params;
  
  const price = await prisma.priceData.findUnique({
    where: { currency: currency.toUpperCase() }
  });

  if (!price) {
    return res.status(404).json({
      success: false,
      error: 'Price data not found for this currency'
    });
  }

  res.json({
    success: true,
    data: { price }
  });
}));

// Convert crypto to fiat
router.get('/convert/:amount/:fromCurrency/:toCurrency', asyncHandler(async (req, res) => {
  const { amount, fromCurrency, toCurrency } = req.params;
  
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid amount'
    });
  }

  let convertedAmount: number;
  
  if (toCurrency.toLowerCase() === 'usd') {
    convertedAmount = await priceService.convertToFiat(numericAmount, fromCurrency);
  } else {
    // For now, only support USD conversion
    return res.status(400).json({
      success: false,
      error: 'Only USD conversion is currently supported'
    });
  }

  res.json({
    success: true,
    data: {
      fromAmount: numericAmount,
      fromCurrency: fromCurrency.toUpperCase(),
      toAmount: convertedAmount,
      toCurrency: toCurrency.toUpperCase(),
      rate: convertedAmount / numericAmount
    }
  });
}));

// Get supported currencies
router.get('/currencies', asyncHandler(async (req, res) => {
  const currencies = [
    { symbol: 'BTC', name: 'Bitcoin', network: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', network: 'ethereum' },
    { symbol: 'MATIC', name: 'Polygon', network: 'polygon' },
    { symbol: 'USDC', name: 'USD Coin', network: 'ethereum' },
    { symbol: 'USDT', name: 'Tether', network: 'ethereum' },
    { symbol: 'BNB', name: 'Binance Coin', network: 'ethereum' },
    { symbol: 'ADA', name: 'Cardano', network: 'cardano' },
    { symbol: 'SOL', name: 'Solana', network: 'solana' },
    { symbol: 'DOT', name: 'Polkadot', network: 'polkadot' },
    { symbol: 'LINK', name: 'Chainlink', network: 'ethereum' }
  ];

  res.json({
    success: true,
    data: { currencies }
  });
}));

// Get vendor by username (for payment links)
router.get('/vendor/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      vendorProfile: true,
      wallets: {
        where: { isActive: true },
        select: {
          id: true,
          address: true,
          network: true,
          currency: true
        }
      }
    }
  });

  if (!user || !user.isVendor || !user.vendorProfile) {
    return res.status(404).json({
      success: false,
      error: 'Vendor not found'
    });
  }

  res.json({
    success: true,
    data: {
      vendor: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        vendorProfile: user.vendorProfile,
        wallets: user.wallets
      }
    }
  });
}));

export default router;

