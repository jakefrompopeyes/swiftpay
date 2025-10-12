import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Test if wallets table exists and has the correct columns
    const { data: wallets, error } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Database schema error',
        details: error.message,
        code: error.code
      });
    }

    // Test if we can insert a test wallet (then delete it)
    const testWallet = {
      // Let Supabase generate the UUID automatically
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      address: '0x1234567890123456789012345678901234567890',
      private_key: '0x1234567890123456789012345678901234567890123456789012345678901234',
      network: 'ethereum',
      currency: 'ETH',
      mnemonic: null,
      balance: 0,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabaseAdmin
      .from('wallets')
      .insert(testWallet);

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Insert test failed',
        details: insertError.message,
        code: insertError.code
      });
    }

    // Clean up test wallet (delete by address since we don't have the generated id)
    await supabaseAdmin
      .from('wallets')
      .delete()
      .eq('address', testWallet.address);

    res.json({
      success: true,
      message: 'Wallets table schema is correct',
      data: {
        tableExists: true,
        columnsSupported: true,
        insertWorks: true
      }
    });

  } catch (error: any) {
    console.error('Test wallets schema error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message || 'Unknown error'
    });
  }
}
