import { NextApiRequest, NextApiResponse } from 'next';
import { getPrice } from '../../lib/price'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const cryptocurrencies = ['BTC', 'ETH', 'USDC', 'USDT', 'DAI', 'BNB', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI', 'ARB', 'MATIC', 'XMR'];
    const prices: Record<string, number> = {};
    
    for (const crypto of cryptocurrencies) {
      try {
        prices[crypto] = await getPrice(crypto);
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
