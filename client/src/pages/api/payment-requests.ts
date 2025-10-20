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
        .select('id, user_id, amount, currency, network, description, status, to_address, tx_hash, created_at')
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
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
        // Expire old pendings before returning
        const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10))
        const threshold = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString()
        await supabaseAdmin
          .from('payment_requests')
          .update({ status: 'failed' })
          .eq('user_id', req.user!.id)
          .filter('status', 'ilike', 'pending')
          .lt('created_at', threshold)

        // First read
        let { data: paymentRequests, error } = await supabaseAdmin
          .from('payment_requests')
          .select('id, user_id, amount, currency, network, description, status, to_address, tx_hash, created_at, method_selected')
          .eq('user_id', req.user!.id)
          .order('created_at', { ascending: false });

        // As a safety net, lazy-expire any stale rows we still see pending
        if (!error && Array.isArray(paymentRequests)) {
          const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10))
          const cutoff = Date.now() - expireMinutes * 60 * 1000
          const staleIds = (paymentRequests || [])
            .filter((p: any) => String(p.status) === 'pending' && p.created_at && new Date(p.created_at).getTime() < cutoff)
            .map((p: any) => p.id)
          if (staleIds.length > 0) {
            await supabaseAdmin
              .from('payment_requests')
              .update({ status: 'failed' })
              .in('id', staleIds)
            // re-read
            const reread = await supabaseAdmin
              .from('payment_requests')
              .select('id, user_id, amount, currency, network, description, status, to_address, tx_hash, created_at, method_selected')
              .eq('user_id', req.user!.id)
              .order('created_at', { ascending: false })
            paymentRequests = reread.data as any
            error = reread.error as any
          }
        }

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
