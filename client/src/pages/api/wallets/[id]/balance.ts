import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../../lib/auth-middleware';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      const { id } = req.query;

      // Get wallet details
      const { data: wallet, error } = await supabaseAdmin
        .from('wallets')
        .select('id, address, network, currency')
        .eq('id', id)
        .eq('user_id', req.user!.id)
        .single();

      if (error || !wallet) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found'
        });
      }

      // For now, return mock balance
      // In production, you'd fetch real balance from blockchain
      const mockBalance = Math.random() * 10; // Random balance for demo

      res.json({
        success: true,
        data: {
          address: wallet.address,
          balance: mockBalance.toFixed(8),
          currency: wallet.currency,
          network: wallet.network
        }
      });
    } catch (error: any) {
      console.error('Get wallet balance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallet balance'
      });
    }
  });
}
