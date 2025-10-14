import crypto from 'crypto'
import { supabaseAdmin } from './supabase-server'

function hashKey(key: string) {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export interface ApiKeyAuthResult {
  ok: boolean
  userId?: string
  error?: string
}

// Enforce simple per-minute limit (default 60 req/min)
export async function authenticateApiKey(rawKey: string | undefined, limitPerMinute = 60): Promise<ApiKeyAuthResult> {
  if (!rawKey) return { ok: false, error: 'Missing API key' }
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const h = hashKey(rawKey)
  // Find key
  const { data: rows, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', h)
    .limit(1)
  if (error) return { ok: false, error: 'Auth failed' }
  const key = rows && rows[0]
  if (!key) return { ok: false, error: 'Invalid API key' }

  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setSeconds(0, 0)

  // Upsert usage row
  const { data: usageRows } = await supabaseAdmin
    .from('api_key_usage')
    .select('id, count')
    .eq('api_key_id', key.id)
    .eq('window_start', windowStart.toISOString())
  let count = usageRows && usageRows[0]?.count
  if (count == null) {
    await supabaseAdmin.from('api_key_usage').insert({ api_key_id: key.id, window_start: windowStart.toISOString(), count: 0 })
    count = 0
  }

  if (count >= limitPerMinute) {
    return { ok: false, error: 'Rate limit exceeded' }
  }

  // Increment and update last used
  await supabaseAdmin
    .from('api_key_usage')
    .update({ count: (count || 0) + 1 })
    .eq('api_key_id', key.id)
    .eq('window_start', windowStart.toISOString())

  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: now.toISOString() })
    .eq('id', key.id)

  return { ok: true, userId: key.user_id }
}


