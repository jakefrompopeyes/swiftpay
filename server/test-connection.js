#!/usr/bin/env node

// Test script to verify Supabase connection
require('dotenv').config();
const { supabaseAdmin } = require('./src/lib/supabase');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 Supabase project connected');
    
    // Test table creation
    const { data: tables } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    console.log('📋 Available tables:', tables?.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Make sure you have:');
    console.log('1. Created server/.env with your Supabase credentials');
    console.log('2. Run the database migration in Supabase SQL Editor');
    console.log('3. Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
}

testConnection();


