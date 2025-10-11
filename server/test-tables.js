#!/usr/bin/env node

// Check what tables exist in the database using a different approach
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  console.log('🔍 Checking tables by trying to query them...');
  
  const tables = ['users', 'wallets', 'transactions', 'vendors'];
  
  for (const tableName of tables) {
    try {
      console.log(`\n📋 Testing ${tableName} table...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`  ✅ ${tableName}: Table exists and accessible`);
      }
    } catch (err) {
      console.log(`  ❌ ${tableName}: ${err.message}`);
    }
  }
  
  // Try to create a test user to see if the table works
  console.log('\n🧪 Testing user creation...');
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        name: 'Test User'
      })
      .select();
    
    if (error) {
      console.log(`❌ User creation failed: ${error.message}`);
    } else {
      console.log('✅ User creation successful!');
      console.log('Created user:', data);
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('email', 'test@example.com');
      console.log('🧹 Test user cleaned up');
    }
  } catch (err) {
    console.log(`❌ User creation error: ${err.message}`);
  }
}

checkTables();


