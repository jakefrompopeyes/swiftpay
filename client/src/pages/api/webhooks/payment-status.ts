import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import crypto from 'crypto';

// Webhook endpoint for payment status updates
// This would typically be called by external services (block explorers, payment processors, etc.)
// For now, we'll create a simple HMAC-based authentication system

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'Database not configured' });
    }

    // Verify webhook signature (optional but recommended for production)
    const webhookSecret = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
    const signature = req.headers['x-webhook-signature'] as string;
    
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        return res.status(401).json({ success: false, error: 'Invalid signature' });
      }
    }

    const { paymentId, status, transactionHash, amount, currency } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: paymentId, status' 
      });
    }

    // Update payment request status
    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from('payment_requests')
      .update({
        status,
        transaction_hash: transactionHash || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select('id, user_id, status, amount, currency')
      .single();

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update payment status' 
      });
    }

    if (!updatedPayment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Payment request not found' 
      });
    }

    // Log the webhook event
    console.log(`Payment ${paymentId} status updated to ${status}`, {
      paymentId,
      status,
      transactionHash,
      merchantId: updatedPayment.user_id
    });

    // In a real implementation, you might want to:
    // 1. Send notifications to the merchant
    // 2. Update merchant balances
    // 3. Trigger other business logic
    // 4. Send confirmation emails to customers

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
        merchantId: updatedPayment.user_id
      }
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
