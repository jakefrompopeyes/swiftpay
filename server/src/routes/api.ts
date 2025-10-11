import { Router, Request, Response } from 'express';
import { PriceService } from '../services/price';

const router = Router();
const priceService = new PriceService();

// Get crypto prices
router.get('/prices', async (req: Request, res: Response) => {
  try {
    const cryptocurrencies = ['BTC', 'ETH', 'USDC', 'USDT', 'BNB', 'ADA', 'SOL', 'DOT', 'LINK'];
    const prices: Record<string, number> = {};
    
    for (const crypto of cryptocurrencies) {
      try {
        prices[crypto] = await priceService.getPrice(crypto);
      } catch (error) {
        console.error(`Failed to get price for ${crypto}:`, error);
        prices[crypto] = 0;
      }
    }
    
    res.json({
      success: true,
      data: prices
    });
  } catch (error: any) {
    console.error('Get prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get prices'
    });
  }
});

// Get specific crypto price
router.get('/prices/:symbol', async (req: Request, res: Response) => {
  const { symbol } = req.params;
  
  try {
    const price = await priceService.getPrice(symbol.toUpperCase());
    if (!price) {
      res.status(404).json({
        success: false,
        error: 'Cryptocurrency not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: price
    });
  } catch (error: any) {
    console.error('Get price error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get price'
    });
  }
});

// Get supported cryptocurrencies
router.get('/cryptocurrencies', async (req: Request, res: Response) => {
  const cryptocurrencies = [
    { symbol: 'BTC', name: 'Bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    { symbol: 'ETH', name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    { symbol: 'USDC', name: 'USD Coin', logo: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png' },
    { symbol: 'USDT', name: 'Tether', logo: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' },
    { symbol: 'BNB', name: 'BNB', logo: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
    { symbol: 'ADA', name: 'Cardano', logo: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
    { symbol: 'SOL', name: 'Solana', logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    { symbol: 'DOT', name: 'Polkadot', logo: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' },
    { symbol: 'LINK', name: 'Chainlink', logo: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png' }
  ];

  res.json({
    success: true,
    data: cryptocurrencies
  });
});

// Health check
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'SwiftPay API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;