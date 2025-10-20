import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: 'Database not configured' })
      }
      const userId = req.user!.id
      const { data, error } = await supabaseAdmin
        .from('payment_requests')
        .select('id, amount, currency, network, to_address, status, created_at')
        .eq('user_id', userId)
        .filter('status', 'ilike', 'pending')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) return res.status(500).json({ success: false, error: error.message })
      return res.json({ success: true, data })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


