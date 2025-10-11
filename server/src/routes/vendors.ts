import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { requireVendor } from '../middleware/auth';

const router = Router();

// Get vendor profile
router.get('/profile', requireVendor, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name, api_key, webhook_url, created_at')
      .eq('user_id', req.user!.id)
      .single();

    if (error || !vendor) {
      res.status(404).json({
        success: false,
        error: 'Vendor profile not found'
      });
      return;
    }

    res.json({
      success: true,
      data: vendor
    });

  } catch (error: any) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vendor profile'
    });
  }
}));

// Create vendor profile
router.post('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { businessName, webhookUrl } = req.body;

  if (!businessName) {
    res.status(400).json({
      success: false,
      error: 'Business name is required'
    });
    return;
  }

  try {
    // Generate API key
    const apiKey = `sp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .insert({
        user_id: req.user!.id,
        business_name: businessName,
        api_key: apiKey,
        webhook_url: webhookUrl || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Vendor profile created successfully',
      data: vendor
    });

  } catch (error: any) {
    console.error('Create vendor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create vendor profile'
    });
  }
}));

// Update vendor profile
router.put('/profile', requireVendor, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { businessName, webhookUrl } = req.body;

  try {
    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .update({
        business_name: businessName,
        webhook_url: webhookUrl
      })
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      data: vendor
    });

  } catch (error: any) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor profile'
    });
  }
}));

// Get vendor analytics
router.get('/analytics', requireVendor, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    // Get vendor's transactions
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('amount, currency, status, created_at')
      .eq('to_wallet_id', req.user!.id) // Assuming vendor receives payments
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (error) {
      throw error;
    }

    // Calculate analytics
    const totalTransactions = transactions?.length || 0;
    const totalVolume = transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) || 0;
    const successfulTransactions = transactions?.filter(tx => tx.status === 'completed').length || 0;

    res.json({
      success: true,
      data: {
        totalTransactions,
        totalVolume,
        successfulTransactions,
        successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0,
        recentTransactions: transactions?.slice(0, 10) || []
      }
    });

  } catch (error: any) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vendor analytics'
    });
  }
}));

export default router;