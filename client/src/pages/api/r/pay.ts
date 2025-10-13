import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  try {
    const { merchantId, amount, currency, description } = req.query

    if (!merchantId || typeof merchantId !== 'string') {
      res.status(400).json({ success: false, error: 'merchantId is required' })
      return
    }

    if (!currency || typeof currency !== 'string') {
      res.status(400).json({ success: false, error: 'currency is required' })
      return
    }

    const parsedAmount = amount ? parseFloat(String(amount)) : 0
    const safeDescription = description ? String(description) : ''

    const paymentRequest = {
      // Let Supabase generate UUID id
      user_id: merchantId,
      amount: parsedAmount,
      currency,
      description: safeDescription,
      status: 'pending'
    }

    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .insert(paymentRequest)
      .select('*')
      .single()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Redirect pay insert error:', error)
      res.status(500).json({ success: false, error: 'Failed to create payment request', details: (error as any)?.message || String(error) })
      return
    }

    const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
    const host = req.headers.host
    const baseUrl = `${proto}://${host}`
    const redirectUrl = `${baseUrl}/pay/${data.id}`

    res.setHeader('Location', redirectUrl)
    res.status(302).end()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Redirect pay error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


