import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware';
import { authenticateApiKey } from '../../../lib/api-key-auth';

interface PaymentRequest {
  id: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  description?: string;
}

export default async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Force fresh data for dashboard widgets
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  const header = (req.headers['authorization'] || req.headers['x-api-key']) as string | undefined;
  const apiKey = header?.startsWith('Bearer ') ? header.slice(7) : header;
  if (apiKey && apiKey.startsWith('sk_')) {
    const result = await authenticateApiKey(apiKey, 120);
    if (!result.ok) return res.status(401).json({ success: false, error: result.error });
    (req as any).user = { id: result.userId };
    return run(req, res);
  }

  return authenticateToken(req, res, () => run(req, res));

  async function run(req2: AuthRequest, res2: NextApiResponse) {
    try {
      if (!supabaseAdmin) {
        return res2.status(500).json({ success: false, error: 'Database not configured' });
      }

      const userId = (req2.user as any)!.id;

      // Expire pending payments older than configurable window
      const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10));
      const threshold = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString();
      // Lazy-expire any stale pendings for this merchant
      const { data: stale, error: findErr } = await supabaseAdmin
        .from('payment_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lt('created_at', threshold)
      if (!findErr && stale && stale.length > 0) {
        await supabaseAdmin
          .from('payment_requests')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .in('id', stale.map((s: any) => s.id))
      }

      // Get payment requests for this merchant
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payment_requests')
        .select('id, amount, currency, status, created_at, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        return res.status(500).json({ success: false, error: 'Failed to fetch payment data' });
      }

      // Calculate stats
      const completedPayments = (payments as PaymentRequest[])?.filter((p: PaymentRequest) => p.status === 'completed') || [];
      const totalRevenue = completedPayments.reduce((sum: number, p: PaymentRequest) => {
        // Convert crypto amount to USD (simplified - in production you'd use current prices)
        const amount = parseFloat(p.amount) || 0;
        return sum + amount; // Assuming amounts are already in USD equivalent
      }, 0);

      const totalTransactions = payments?.length || 0;
      const completedTransactions = completedPayments.length;
      const conversionRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;

      // Get unique customers (simplified - using payment request IDs as proxy)
      const uniqueCustomers = new Set((payments as PaymentRequest[])?.map((p: PaymentRequest) => p.id) || []).size;

      // Recent transactions (last 10)
      const recentTransactions = (payments as PaymentRequest[] || []).slice(0, 10).map((p: PaymentRequest) => ({
        id: p.id,
        amount: parseFloat(p.amount) || 0,
        currency: p.currency,
        customer: `Customer ${p.id.slice(-6)}`, // Simplified customer ID
        status: p.status,
        timestamp: p.created_at,
        description: p.description || 'Payment'
      }));

      res2.json({
        success: true,
        data: {
          stats: {
            totalRevenue,
            totalTransactions,
            activeCustomers: uniqueCustomers,
            conversionRate: Math.round(conversionRate * 10) / 10 // Round to 1 decimal
          },
          recentTransactions
        }
      });

    } catch (error: any) {
      console.error('Merchant stats error:', error);
      res2.status(500).json({
        success: false,
        error: 'Failed to fetch merchant statistics'
      });
    }
  }
}
