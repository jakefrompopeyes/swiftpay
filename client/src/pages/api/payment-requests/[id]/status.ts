import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Missing id' })
    return
  }

  try {
    if (!supabaseAdmin) {
      res.status(500).json({ success: false, error: 'Supabase not configured' })
      return
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .select('status, created_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Payment request not found' })
      return
    }

    // Lazy-expire: if pending and older than window, flip to failed and return failed
    if (String(data.status) === 'pending') {
      const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10))
      const threshold = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString()
      if ((data as any).created_at && new Date((data as any).created_at).toISOString() < threshold) {
        await supabaseAdmin
          .from('payment_requests')
          .update({ status: 'failed' })
          .eq('id', id)
        return res.json({ success: true, data: { status: 'failed' } })
      }
    }
    res.json({ success: true, data: { status: data.status } })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Get payment status error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
