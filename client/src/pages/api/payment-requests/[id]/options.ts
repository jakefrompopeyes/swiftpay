import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase-server'
import { isTokenSupported } from '../../../../lib/tokens'

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

    // Fetch merchant wallets (BYO): include Bitcoin and Monero if provided
    const allowedNetworks = ['ethereum','solana','binance','polygon','base','arbitrum','bitcoin','monero']
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

    // Expand token options (USDC/USDT/DAI) for each wallet where supported (EVM/Solana only)
    const expanded = (wallets || []).flatMap((w: any) => {
      const base = [{ ...w }]
      const net = (w.network || '').toLowerCase()
      const candidates = ['USDC','USDT','DAI']
      const extras = candidates
        .filter(sym => isTokenSupported(net, sym))
        .filter(sym => (w.currency || '').toUpperCase() !== sym)
        .map(sym => ({ ...w, id: `${w.id}-${sym}`, currency: sym }))
      return [...base, ...extras]
    })

    res.json({ success: true, data: { wallets: expanded } })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Get payment options error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


