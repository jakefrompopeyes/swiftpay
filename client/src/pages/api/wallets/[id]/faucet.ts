import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../../lib/auth-middleware';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      const { id } = req.query;
      const { token = 'eth' } = req.body;

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

      // For now, return mock faucet response
      // In production, you'd integrate with testnet faucets
      const mockAmount = Math.random() * 0.1; // Random small amount

      res.json({
        success: true,
        data: {
          address: wallet.address,
          amount: mockAmount.toFixed(6),
          currency: wallet.currency,
          network: wallet.network,
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          message: `Faucet request successful for ${wallet.currency}`
        }
      });
    } catch (error: any) {
      console.error('Faucet request error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to request faucet'
      });
    }
  });
}
