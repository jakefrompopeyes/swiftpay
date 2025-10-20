import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    if (!supabaseAdmin) {
      console.error('Manual expiry: Supabase not configured - missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return res.status(500).json({ success: false, error: 'Database not configured - check Supabase environment variables' })
    }

    const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10))
    const fiveMinutesAgo = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString()

    console.log(`Manual expiry: Looking for payments older than ${expireMinutes} minutes (before ${fiveMinutesAgo})`)

    // First, get all pending payments to show what we're working with
    const { data: allPending, error: fetchError } = await supabaseAdmin
      .from('payment_requests')
      .select('id, amount, currency, created_at, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Manual expiry: Error fetching pending payments:', fetchError)
      return res.status(500).json({ success: false, error: 'Failed to fetch pending payments', details: fetchError.message })
    }

    console.log(`Manual expiry: Found ${allPending?.length || 0} total pending payments`)

    // Find payments older than the threshold
    const oldPayments = (allPending || []).filter((p: any) => new Date(p.created_at).toISOString() < fiveMinutesAgo)
    
    if (oldPayments.length === 0) {
      console.log('Manual expiry: No payments older than threshold found')
      return res.json({ 
        success: true, 
        data: { 
          totalPending: allPending?.length || 0,
          expired: 0,
          expireMinutes,
          message: 'No payments older than threshold found'
        } 
      })
    }

    console.log(`Manual expiry: Found ${oldPayments.length} payments to expire`)

    // Expire the old payments
    let expired: any[] | null = null
    const { data: expiredBulk, error: expireError } = await supabaseAdmin
      .from('payment_requests')
      .update({ 
        status: 'failed', 
        updated_at: new Date().toISOString() 
      })
      .in('id', oldPayments.map((p: any) => p.id))
      .select('id')

    if (expireError) {
      // Fallback: perform update with server-side filtering (avoids large IN lists and some policy edge cases)
      console.warn('Manual expiry: bulk update failed, trying filtered update:', expireError)
      const { data: expiredFiltered, error: filteredErr } = await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .filter('status', 'ilike', 'pending')
        .lt('created_at', fiveMinutesAgo)
        .select('id')
      if (filteredErr) {
        console.error('Manual expiry: filtered update also failed:', filteredErr)
        return res.status(500).json({ success: false, error: 'Failed to expire payments', details: filteredErr.message || expireError.message })
      }
      expired = expiredFiltered as any
    } else {
      expired = expiredBulk as any
    }

    console.log(`Manual expiry: Successfully expired ${expired?.length || 0} payments`)

    return res.json({ 
      success: true, 
      data: { 
        totalPending: allPending?.length || 0,
        expired: expired?.length || 0,
        expireMinutes,
        expiredIds: expired?.map((e: any) => e.id) || [],
        message: `Successfully expired ${expired?.length || 0} payments`
      } 
    })

  } catch (error) {
    console.error('Manual expiry: Unexpected error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' })
  }
}
