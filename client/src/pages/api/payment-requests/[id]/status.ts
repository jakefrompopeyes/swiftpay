import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .select('status')
      .eq('id', id)
      .single()

    if (error || !data) {
      res.status(404).json({ success: false, error: 'Payment request not found' })
      return
    }

    res.json({ success: true, data })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Get payment status error:', err)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    const { data: paymentRequest, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, status, amount, currency, created_at')
      .eq('id', id)
      .single();

    if (error || !paymentRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payment request not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: paymentRequest.status,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency
      }
    });
  } catch (error: any) {
    console.error('Get payment request status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment request status'
    });
  }
}
