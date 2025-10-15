import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../lib/auth-middleware';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return authenticateToken(req, res, async () => {
      try {
        const { amount, currency, description } = req.body;

        if (!amount || !currency) {
          return res.status(400).json({
            success: false,
            error: 'Amount and currency are required'
          });
        }

        // Create payment request
        const paymentRequest = {
          id: `pr_${Date.now()}`,
          user_id: req.user!.id,
          amount: parseFloat(amount),
          currency,
          description: description || '',
          status: 'pending',
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
          .from('payment_requests')
          .insert(paymentRequest)
          .select('*')
          .single();

        if (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create payment request'
          });
        }

        // Generate checkout URL
        const checkoutUrl = `${req.headers.origin}/pay/${data.id}`;

        res.json({
          success: true,
          data: {
            ...data,
            checkoutUrl
          }
        });
      } catch (error: any) {
        console.error('Create payment request error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create payment request'
        });
      }
    });
  }

  if (req.method === 'GET') {
    return authenticateToken(req, res, async () => {
      try {
        // Expire old pendings before returning
        const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10))
        const threshold = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString()
        await supabaseAdmin
          .from('payment_requests')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('user_id', req.user!.id)
          .eq('status', 'pending')
          .lt('created_at', threshold)

        const { data: paymentRequests, error } = await supabaseAdmin
          .from('payment_requests')
          .select('*')
          .eq('user_id', req.user!.id)
          .order('created_at', { ascending: false });

        if (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch payment requests'
          });
        }

        res.json({
          success: true,
          data: paymentRequests || []
        });
      } catch (error: any) {
        console.error('Get payment requests error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to get payment requests'
        });
      }
    });
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}
