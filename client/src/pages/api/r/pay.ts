import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  try {
    if (!supabaseAdmin) {
      res.status(500).json({ success: false, error: 'Supabase not configured' })
      return
    }
    // Prevent CDN/proxy caching of this dynamic redirect endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
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
    const upperCurrency = String(currency).toUpperCase()

    // Find merchant wallet for requested currency
    const { data: wallet, error: walletErr } = await supabaseAdmin
      .from('wallets')
      .select('address, network, currency')
      .eq('user_id', merchantId)
      .eq('currency', upperCurrency)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (walletErr) {
      // eslint-disable-next-line no-console
      console.error('Redirect pay wallet lookup error:', walletErr)
      res.status(500).json({ success: false, error: 'Failed to find wallet', details: (walletErr as any)?.message || String(walletErr) })
      return
    }

    if (!wallet || !wallet.address) {
      res.status(400).json({ success: false, error: 'Wallet for requested currency not found' })
      return
    }

    const paymentRequest = {
      // Let Supabase generate UUID id
      user_id: merchantId,
      amount: parsedAmount,
      currency: upperCurrency,
      network: wallet.network,
      description: safeDescription,
      status: 'pending',
      to_address: wallet.address
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

    // Return JSON with redirect to allow client-side navigation fallback
    res.setHeader('Location', redirectUrl)
    if ((req.headers.accept || '').includes('application/json')) {
      res.status(200).json({ success: true, redirectUrl })
    } else {
      res.status(302).end()
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Redirect pay error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


