import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      // Return supported networks (only CDP supported networks)
      const networks = [
        {
          network: 'ethereum',
          name: 'Ethereum',
          currency: 'ETH',
          type: 'EVM',
          icon: '🔷',
          description: 'Ethereum Mainnet',
          testnet: false
        },
        {
          network: 'solana',
          name: 'Solana',
          currency: 'SOL',
          type: 'SOL',
          icon: '🟣',
          description: 'Solana Mainnet',
          testnet: false
        },
        {
          network: 'binance',
          name: 'BNB Smart Chain',
          currency: 'BNB',
          type: 'EVM',
          icon: '🟡',
          description: 'BNB Smart Chain',
          testnet: false
        }
      ];

      res.json({
        success: true,
        data: networks
      });
    } catch (error: any) {
      console.error('Get networks error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get supported networks'
      });
    }
  });
}
