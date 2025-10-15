import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
  if (!supabaseAdmin) return res.status(500).json({ success: false, error: 'Database not configured' })

  try {
    const { id } = req.query
    const { network, address, currency, amount } = req.body || {}
    if (!id || typeof id !== 'string') return res.status(400).json({ success: false, error: 'Missing id' })
    if (!network || !address || !currency) return res.status(400).json({ success: false, error: 'Missing selection' })

    // Only allow updating pending requests
    const { data: pr } = await supabaseAdmin
      .from('payment_requests')
      .select('id, status')
      .eq('id', id)
      .maybeSingle()
    if (!pr) return res.status(404).json({ success: false, error: 'Not found' })
    if (String(pr.status) !== 'pending') return res.status(200).json({ success: true })

    const { error: upErr } = await supabaseAdmin
      .from('payment_requests')
      .update({
        network: String(network),
        to_address: String(address),
        currency: String(currency).toUpperCase(),
        amount: amount != null ? Number(amount) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (upErr) return res.status(500).json({ success: false, error: 'Failed to update selection' })
    return res.json({ success: true })
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


