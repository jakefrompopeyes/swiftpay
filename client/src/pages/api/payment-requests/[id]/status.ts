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
    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .select('status')
      .eq('id', id)
      .single()

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Payment request not found' })
      return
    }

    res.json({ success: true, data })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Get payment status error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
