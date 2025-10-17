import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../lib/auth-middleware';
// BYO wallets only: no Coinbase Cloud dependencies

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return authenticateToken(req, res, async () => {
      try {
        const { data: wallets, error } = await supabaseAdmin
          .from('wallets')
          .select('id, address, network, currency, is_active, source, created_at')
          .eq('user_id', req.user!.id)
          .eq('is_active', true)

        if (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch wallets'
          });
        }

        res.json({ success: true, data: wallets || [] });
      } catch (error: any) {
        console.error('Get wallets error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get wallets'
        });
      }
    });
  }

  // POST route removed: we no longer create wallets.

  res.status(405).json({ success: false, error: 'Method not allowed' });
}
