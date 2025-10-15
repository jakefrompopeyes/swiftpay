import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { convertFromFiat } from '../../../lib/price'

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
    const { merchantId, amount, currency, description, network: qNetwork } = req.query

    if (!merchantId || typeof merchantId !== 'string') {
      res.status(400).json({ success: false, error: 'merchantId is required' })
      return
    }

    // currency is optional; we'll infer from selected wallet if not provided

    const parsedAmount = amount ? parseFloat(String(amount)) : 0
    const safeDescription = description ? String(description) : ''
    let upperCurrency = String(currency).toUpperCase()
    // Normalize Polygon symbols: accept MATIC or POL, always treat as MATIC price for gas token
    if (upperCurrency === 'POL') upperCurrency = 'MATIC'

    // Optional network preference (disambiguate ETH across EVMs)
    let wallet: any = null
    let walletErr: any = null
    if (qNetwork && typeof qNetwork === 'string') {
      const { data, error } = await supabaseAdmin
        .from('wallets')
        .select('address, network, currency')
        .eq('user_id', merchantId)
        .eq('network', String(qNetwork).toLowerCase())
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      wallet = data; walletErr = error
    }
    if (!wallet && !walletErr) {
      // Load all active wallets
      const { data: all, error } = await supabaseAdmin
        .from('wallets')
        .select('address, network, currency')
        .eq('user_id', merchantId)
        .eq('is_active', true)
      if (error) { walletErr = error } else {
        type W = { address: string; network: string; currency: string }
        const list: W[] = (all || []) as W[]
        // Try currency match if provided
        let pick: W | null = (typeof currency === 'string') ? (list.find((w: W) => String(w.currency).toUpperCase() === upperCurrency) || null) : null
        // Else prefer stablecoins, then first
        if (!pick) {
          const order = ['USDC','USDT','DAI','ETH','MATIC','SOL','BNB']
          for (const sym of order) {
            const found = list.find((w: W) => String(w.currency).toUpperCase() === sym)
            if (found) { pick = found; break }
          }
        }
        wallet = pick || list[0] || null
      }
    }

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

    // If amount passed is in USD, convert to crypto for storage/QR math
    // Coin-agnostic flow: treat incoming amount as USD and store coin later upon user selection
    const usdAmount = parsedAmount > 0 ? parsedAmount : 0

    const paymentRequest = {
      // Let Supabase generate UUID id
      user_id: merchantId,
      amount: usdAmount,
      currency: 'USD',
      network: null,
      description: safeDescription,
      status: 'pending',
      to_address: null,
      // coin-agnostic until user selects a method
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


