import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, created_at')
      .eq('id', req.user!.id)
      .single();

    if (error || !user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Get user's wallets
    const { data: wallets } = await supabaseAdmin
      .from('wallets')
      .select('id, address, network, currency, created_at')
      .eq('user_id', req.user!.id);

    // Check if user is a vendor
    const { data: vendor } = await supabaseAdmin
      .from('vendors')
      .select('id, business_name, api_key')
      .eq('user_id', req.user!.id)
      .single();

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at
        },
        wallets: wallets || [],
        isVendor: !!vendor,
        vendor: vendor || null
      }
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({
      success: false,
      error: 'Name is required'
    });
    return;
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({ name })
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });

  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
}));

export default router;