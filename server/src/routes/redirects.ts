import { Router, Request, Response } from 'express'
import { PriceService } from '../services/price'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// Public redirect: creates a payment request and redirects to /pay/:id
// Example: /r/pay?mid=<userId>&amount=10&currency=ETH&description=Order&merchant=Store
router.get('/pay', async (req: Request, res: Response) => {
  try {
    const { mid, amount, currency = 'ETH', description } = req.query as any
    if (!mid) {
      res.status(400).send('Missing merchant id (mid)')
      return
    }

    // Find wallet for merchant by currency
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('address, network, currency')
      .eq('user_id', mid)
      .eq('currency', String(currency).toUpperCase())
      .single()

    if (walletError || !wallet) {
      res.status(404).send('Wallet for requested currency not found')
      return
    }

    // Convert USD to crypto amount
    const priceService = new PriceService()
    const usd = amount ? parseFloat(String(amount)) : 0
    const cryptoAmount = usd > 0 ? await priceService.convertFromFiat(usd, String(currency).toUpperCase(), 'USD') : 0

    // Insert payment request
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: mid,
        amount: cryptoAmount,
        currency: String(currency).toUpperCase(),
        network: wallet.network,
        description: description || null,
        status: 'pending',
        to_address: wallet.address
      })
      .select('id')
      .single()

    if (error) throw error

    // Use the request's host header to preserve the correct port
    const host = req.headers.host || 'localhost:3000'
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http')
    const base = `${protocol}://${host}`
    const checkoutUrl = `${base}/pay/${pr.id}`

    res.redirect(302, checkoutUrl)
  } catch (e: any) {
    console.error('Redirect pay error:', e)
    res.status(500).send('Failed to create payment')
  }
})

export default router



