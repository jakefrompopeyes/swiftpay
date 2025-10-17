import { NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware';

interface ExistingWallet { network: string; currency: string }

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      res.json({ success: true, message: 'Wallet auto-creation removed. Use Settings > Custom Wallets to add addresses.' })
    } catch (error: any) {
      console.error('Create missing wallets (removed) error:', error);
      res.status(500).json({
        success: false,
        error: 'Create missing wallets is disabled',
        details: error.message || 'Unknown error'
      });
    }
  });
}
