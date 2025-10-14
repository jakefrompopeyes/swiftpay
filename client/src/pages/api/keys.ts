import { NextApiResponse } from 'next'
import crypto from 'crypto'
import { supabaseAdmin } from '../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../lib/auth-middleware'

function hashKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export default function handler(req: AuthRequest, res: NextApiResponse) {
  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: 'Database not configured' })
      }
      const userId = req.user!.id

      if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
          .from('api_keys')
          .select('id, name, last_used_at, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) return res.status(500).json({ success: false, error: 'Failed to load keys' })
        return res.json({ success: true, data: data || [] })
      }

      if (req.method === 'POST') {
        const { name } = req.body || {}
        if (!name) return res.status(400).json({ success: false, error: 'Missing name' })

        // Generate a 32-byte key and return the plaintext once
        const raw = crypto.randomBytes(32).toString('hex')
        const key = `sk_${raw}`
        const keyHash = hashKey(key)

        const { error } = await supabaseAdmin
          .from('api_keys')
          .insert({ user_id: userId, name, key_hash: keyHash })

        if (error) return res.status(500).json({ success: false, error: 'Failed to create key' })
        return res.json({ success: true, data: { key } })
      }

      if (req.method === 'DELETE') {
        const { id } = req.body || {}
        if (!id) return res.status(400).json({ success: false, error: 'Missing id' })

        const { error } = await supabaseAdmin
          .from('api_keys')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)

        if (error) return res.status(500).json({ success: false, error: 'Failed to delete key' })
        return res.json({ success: true })
      }

      return res.status(405).json({ success: false, error: 'Method not allowed' })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


