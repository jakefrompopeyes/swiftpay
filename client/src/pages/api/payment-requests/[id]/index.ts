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
    // Bust any intermediate caches and ensure fresh read
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, user_id, amount, currency, network, description, status, to_address')
      .eq('id', id)
      .single()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Payment request fetch error:', error)
      res.status(500).json({ success: false, error: 'Failed to load payment request' })
      return
    }

    if (!data) {
      res.status(404).json({ success: false, error: 'Payment request not found' })
      return
    }

    // Normalize currencies/networks to expected shapes
    const normalized = {
      ...data,
      currency: (data.currency || '').toUpperCase(),
      network: data.network,
      to_address: data.to_address
    }
    res.json({ success: true, data: normalized })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Get payment request error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


