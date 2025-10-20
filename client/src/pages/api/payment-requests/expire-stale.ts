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

      const { data, error } = await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'failed' })
        .eq('user_id', req.user!.id)
        .filter('status', 'ilike', 'pending')
        .lt('created_at', threshold)
        .select('id')

      if (error) {
        return res.status(500).json({ success: false, error: error.message || 'Failed to expire pending links' })
      }
      const expired = Array.isArray(data) ? data.length : 0
      return res.json({ success: true, data: { expired, expireMinutes } })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


