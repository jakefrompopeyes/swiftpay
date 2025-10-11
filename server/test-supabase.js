#!/usr/bin/env node

// Test script to verify Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('📡 URL:', supabaseUrl);
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('\n🔧 Make sure you have:');
      console.log('1. Run the database migration in Supabase SQL Editor');
      console.log('2. Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 Supabase project connected');
    
    // Test table creation
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    const tableNames = tables?.map(t => t.table_name).filter(name => 
      ['users', 'wallets', 'transactions', 'vendors'].includes(name)
    );
    
    console.log('📋 SwiftPay tables found:', tableNames?.join(', ') || 'None');
    
    if (tableNames?.length === 4) {
      console.log('🎉 All required tables are present!');
    } else {
      console.log('⚠️  Some tables are missing. Please run the database migration.');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();


