import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ success: false, error: 'Database not configured' })
      const { paymentId } = req.body || {}
      if (!paymentId) return res.status(400).json({ success: false, error: 'Missing paymentId' })

      // Ensure user owns the payment
      const { data: pr, error: prErr } = await supabaseAdmin
        .from('payment_requests')
        .select('id, user_id')
        .eq('id', paymentId)
        .single()
      if (prErr || !pr || pr.user_id !== req.user!.id) return res.status(404).json({ success: false, error: 'Not found' })

      const resp = await fetch('/api/webhooks/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId }) })
      const json = await resp.json().catch(() => ({ success: false }))
      if (!json.success) return res.status(500).json({ success: false, error: 'Resend failed' })
      return res.json({ success: true })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


