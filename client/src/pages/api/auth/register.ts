import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { coinbaseCloudService } from '../../../lib/coinbase-cloud';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email, name, and password are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 6 characters'
    });
  }

  try {
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        name,
        password: hashedPassword
      })
      .select('id, email, name')
      .single();

    if (error || !user) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
        details: error?.message || 'Unknown error'
      });
    }

    // Create default wallets for the new user (only supported networks)
    const supportedNetworks = [
      { network: 'ethereum', currency: 'ETH' },
      { network: 'solana', currency: 'SOL' },
      { network: 'binance', currency: 'BNB' }
    ];

    // Create wallets using Coinbase Cloud
    const walletsToCreate = [];
    
    for (const network of supportedNetworks) {
      try {
        console.log(`Creating ${network.currency} wallet for new user ${user.id}`);
        
        // Create wallet using Coinbase Cloud
        const walletResult = await coinbaseCloudService.createWallet(network.network);
        
        // Prepare wallet data for database
        const walletData = {
          // Let Supabase generate the UUID automatically
          user_id: user.id,
          address: walletResult.address,
          private_key: `coinbase_cloud_${walletResult.walletId}`, // Store Coinbase Cloud wallet ID
          network: walletResult.network,
          currency: walletResult.currency,
          mnemonic: null, // Coinbase Cloud handles key management
          balance: 0, // Will be updated with real balance later
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        walletsToCreate.push(walletData);
        console.log(`✅ Created ${network.currency} wallet: ${walletResult.address}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to create ${network.currency} wallet:`, error);
        // Continue with other wallets even if one fails
      }
    }

    // Insert default wallets if any were created
    if (walletsToCreate.length > 0) {
      const { error: walletError } = await supabaseAdmin
        .from('wallets')
        .insert(walletsToCreate);

      if (walletError) {
        console.error('Failed to create default wallets:', walletError);
        // Don't fail registration if wallet creation fails, just log it
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    });

  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}
