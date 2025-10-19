import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })
  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ success: false, error: 'Database not configured' })
      const { success, limit = '50', paymentId, from, to } = (req.query || {}) as any
      let q = supabaseAdmin
        .from('webhook_deliveries')
        .select('id, payment_id, url, response_code, success, attempt_count, created_at, updated_at')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })
        .limit(parseInt(String(limit), 10) || 50)
      if (success === 'true') q = q.eq('success', true)
      if (success === 'false') q = q.eq('success', false)
      if (paymentId && typeof paymentId === 'string') q = q.eq('payment_id', paymentId)
      if (from && typeof from === 'string') q = q.gte('created_at', from)
      if (to && typeof to === 'string') q = q.lte('created_at', to)
      const { data, error } = await q
      if (error) return res.status(500).json({ success: false, error: 'Failed to load deliveries' })
      return res.json({ success: true, data: data || [] })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


