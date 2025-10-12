import { NextApiRequest, NextApiResponse } from 'next';

// Simple price service for Vercel Functions
class PriceService {
  private prices: Record<string, number> = {
    BTC: 45000,
    ETH: 2800,
    USDC: 1,
    USDT: 1,
    BNB: 320,
    ADA: 0.45,
    SOL: 95,
    DOT: 7.2,
    LINK: 14.5
  };

  async getPrice(symbol: string): Promise<number> {
    // In production, you'd fetch from CoinGecko or similar
    return this.prices[symbol.toUpperCase()] || 0;
  }
}

const priceService = new PriceService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
}
