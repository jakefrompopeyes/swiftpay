import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { broadcast } from '../utils/realtime'

const router = Router()

// Generic chain webhook endpoint
// Providers can be pointed here; we normalize minimal fields: address, amount, txHash, network
router.post('/chain', async (req: Request, res: Response) => {
  try {
    const payload = req.body || {}
    const address = payload.address || payload.to || payload.toAddress
    const txHash = payload.hash || payload.txHash || payload.signature
    const network = payload.network || payload.chain || 'ethereum'
    const amount = parseFloat(payload.amount || '0')

    if (!address) return res.status(400).json({ success: false, error: 'missing address' })

    // Find pending payment request for this address/network
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, amount, currency, network, status, to_address')
      .eq('to_address', address)
      .eq('network', network)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!pr) return res.json({ success: true })

    // Optional: validate amount >= requested
    const ok = !pr.amount || amount === 0 || amount >= parseFloat(pr.amount)
    if (!ok) return res.json({ success: true })

    await supabaseAdmin
      .from('payment_requests')
      .update({ status: 'completed', tx_hash: txHash || null })
      .eq('id', pr.id)

    broadcast({ type: 'payment_request_updated', id: pr.id, status: 'completed', txHash })

    res.json({ success: true })
  } catch (e: any) {
    console.error('Webhook error:', e)
    res.status(500).json({ success: false })
  }
})

export default router



