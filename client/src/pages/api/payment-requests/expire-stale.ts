import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: 'Database not configured' })
      }
      const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10))
      const threshold = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString()

      const { error } = await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('user_id', req.user!.id)
        .eq('status', 'pending')
        .lt('created_at', threshold)

      if (error) {
        return res.status(500).json({ success: false, error: 'Failed to expire pending links' })
      }
      return res.json({ success: true })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


