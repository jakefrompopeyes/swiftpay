import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../lib/auth-middleware'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: 'Database not configured' })
      }

      const userId = req.user!.id

      if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
          .from('merchant_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          return res.status(500).json({ success: false, error: 'Failed to load settings' })
        }
        return res.json({ success: true, data: data || null })
      }

      if (req.method === 'POST') {
        const body = req.body || {}
        const upsert = {
          user_id: userId,
          company_name: body.company_name || null,
          support_email: body.support_email || null,
          website_url: body.website_url || null,
          webhook_url: body.webhook_url || null,
          webhook_secret: body.webhook_secret || null,
          branding_primary: body.branding_primary || null,
          branding_secondary: body.branding_secondary || null,
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabaseAdmin
          .from('merchant_settings')
          .upsert(upsert, { onConflict: 'user_id' })
          .select('*')
          .maybeSingle()

        if (error) {
          return res.status(500).json({ success: false, error: 'Failed to save settings' })
        }
        return res.json({ success: true, data })
      }

      return res.status(405).json({ success: false, error: 'Method not allowed' })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


