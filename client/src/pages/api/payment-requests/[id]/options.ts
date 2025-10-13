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
    // Fetch request to get merchant id
    const { data: pr, error: prErr } = await supabaseAdmin
      .from('payment_requests')
      .select('user_id')
      .eq('id', id)
      .single()

    if (prErr || !pr) {
      res.status(404).json({ success: false, error: 'Payment request not found' })
      return
    }

    // Fetch merchant wallets (only real CDP-backed networks)
    const allowedNetworks = ['ethereum','solana','binance','polygon','base','arbitrum']
    const { data: wallets, error: wErr } = await supabaseAdmin
      .from('wallets')
      .select('id, address, network, currency, is_active')
      .eq('user_id', pr.user_id)
      .in('network', allowedNetworks)
      .eq('is_active', true)

    if (wErr) {
      res.status(500).json({ success: false, error: 'Failed to load wallets' })
      return
    }

    res.json({ success: true, data: { wallets: wallets || [] } })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Get payment options error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


