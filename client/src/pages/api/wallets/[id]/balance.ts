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

      // BYO wallets: we no longer fetch balances from CDP. Return 0 or integrate chain RPC later.
      const realBalance = '0.0000';

      res.json({
        success: true,
        data: {
          address: wallet.address,
          balance: realBalance,
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
