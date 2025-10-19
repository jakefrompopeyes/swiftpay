import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import crypto from 'crypto'

async function sendOnce(url: string, payload: any, secret: string) {
  const body = JSON.stringify(payload)
  const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-webhook-signature': signature }, body, cache: 'no-store' })
  const text = await res.text().catch(() => '')
  return { status: res.status, body: text }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' })
  try {
    if (!supabaseAdmin) return res.status(500).json({ success: false, error: 'Database not configured' })
    const { paymentId } = req.body || {}
    if (!paymentId) return res.status(400).json({ success: false, error: 'Missing paymentId' })

    // load payment + vendor webhook url and api key
    const { data: pr, error: prErr } = await supabaseAdmin
      .from('payment_requests')
      .select('id, user_id, amount, currency, network, status, to_address, tx_hash, created_at')
      .eq('id', paymentId)
      .single()
    if (prErr || !pr) return res.status(404).json({ success: false, error: 'Payment not found' })

    const { data: vendor, error: vErr } = await supabaseAdmin
      .from('vendors')
      .select('api_key, webhook_url')
      .eq('user_id', pr.user_id)
      .single()
    if (vErr || !vendor || !vendor.webhook_url) return res.status(400).json({ success: false, error: 'Webhook URL not configured' })

    const payload = {
      id: pr.id,
      status: pr.status,
      amount: pr.amount,
      currency: pr.currency,
      network: pr.network,
      to_address: pr.to_address,
      tx_hash: pr.tx_hash || null,
      created_at: pr.created_at,
      event: 'payment.status'
    }

    const result = await sendOnce(vendor.webhook_url, payload, vendor.api_key)

    await supabaseAdmin.from('webhook_deliveries').insert({
      user_id: pr.user_id,
      payment_id: pr.id,
      url: vendor.webhook_url,
      request_body: payload as any,
      response_code: result.status,
      response_body: result.body,
      success: result.status >= 200 && result.status < 300
    })

    return res.json({ success: true, data: { status: result.status } })
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


