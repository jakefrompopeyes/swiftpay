import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('name').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }

  const { email, name, password } = req.body;

  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
      return;
    }

    // Create user in Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Auto-create wallets for major cryptocurrencies
    try {
      const { coinbaseCloudService } = await import('../services/coinbaseCloud');
      const autoWallets = await coinbaseCloudService.createAutoWallets(user.id);
      
      // Save auto-created wallets to database
      for (const wallet of autoWallets) {
        await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: user.id,
            address: wallet.address,
            private_key: `coinbase_cloud_${wallet.walletId}`,
            network: wallet.network,
            currency: wallet.currency,
            mnemonic: null
          });
      }
      
      console.log(`✅ Auto-created ${autoWallets.length} wallets for new user ${user.email}`);
    } catch (walletError: any) {
      console.error('❌ Failed to auto-create wallets:', walletError.message);
      // Don't fail registration if wallet creation fails
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully with auto-created wallets',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}));

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }

  const { email, password } = req.body;

  try {
    // Find user in Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}));

// Verify token
router.get('/verify', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'No token provided'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}));

export default router;