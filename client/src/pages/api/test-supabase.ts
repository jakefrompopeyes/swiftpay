import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test Supabase connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return res.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    res.json({
      success: true,
      message: 'Supabase connected successfully',
      data: data
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
}
