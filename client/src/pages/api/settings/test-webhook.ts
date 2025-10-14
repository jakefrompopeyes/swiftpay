import { NextApiResponse } from 'next'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  return authenticateToken(req, res, async () => {
    try {
      const { url, secret, paymentId } = req.body || {}
      if (!url) return res.status(400).json({ success: false, error: 'Missing url' })

      const payload = {
        paymentId: paymentId || 'test-payment',
        status: 'completed',
        transactionHash: '0x' + 'ab'.repeat(32),
        amount: '1.00',
        currency: 'USDC'
      }

      // Sign body if secret provided
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (secret) {
        const cryptoMod = await import('crypto')
        const sig = cryptoMod.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
        headers['x-webhook-signature'] = `sha256=${sig}`
      }

      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
      const text = await r.text()
      return res.json({ success: true, data: { status: r.status, body: text } })
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || 'Failed to send test webhook' })
    }
  })
}


