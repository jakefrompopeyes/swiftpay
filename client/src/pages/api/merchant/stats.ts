import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: 'Database not configured' });
      }

      const userId = req.user!.id;

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
      const completedPayments = payments?.filter(p => p.status === 'completed') || [];
      const totalRevenue = completedPayments.reduce((sum, p) => {
        // Convert crypto amount to USD (simplified - in production you'd use current prices)
        const amount = parseFloat(p.amount) || 0;
        return sum + amount; // Assuming amounts are already in USD equivalent
      }, 0);

      const totalTransactions = payments?.length || 0;
      const completedTransactions = completedPayments.length;
      const conversionRate = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0;

      // Get unique customers (simplified - using payment request IDs as proxy)
      const uniqueCustomers = new Set(payments?.map(p => p.id) || []).size;

      // Recent transactions (last 10)
      const recentTransactions = (payments || []).slice(0, 10).map(p => ({
        id: p.id,
        amount: parseFloat(p.amount) || 0,
        currency: p.currency,
        customer: `Customer ${p.id.slice(-6)}`, // Simplified customer ID
        status: p.status,
        timestamp: p.created_at,
        description: p.description || 'Payment'
      }));

      res.json({
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
      res.status(500).json({
        success: false,
        error: 'Failed to fetch merchant statistics'
      });
    }
  });
}
