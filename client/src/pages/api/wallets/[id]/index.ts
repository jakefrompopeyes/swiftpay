import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../../lib/auth-middleware';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      const { id } = req.query;

      // Delete wallet
      const { error } = await supabaseAdmin
        .from('wallets')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user!.id);

      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to delete wallet'
        });
      }

      res.json({
        success: true,
        message: 'Wallet deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete wallet error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete wallet'
      });
    }
  });
}
