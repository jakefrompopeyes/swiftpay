import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase-server'

// Placeholder chain check - in production hook to a webhook/provider
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Missing id' })
    return
  }

  try {
    if (!supabaseAdmin) {
      res.status(500).json({ success: false, error: 'Supabase not configured' })
      return
    }
    // No-op for now
    res.json({ success: true })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Check chain error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


