import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    const { data: paymentRequest, error } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
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
      data: paymentRequest
    });
  } catch (error: any) {
    console.error('Get payment request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment request'
    });
  }
}
