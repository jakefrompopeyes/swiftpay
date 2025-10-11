#!/usr/bin/env node

// Check what tables exist in the database
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
  console.log('🔍 Checking all tables in the database...');
  
  try {
    // Get all tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('📋 All tables in database:');
    tables?.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check specifically for our tables
    const ourTables = ['users', 'wallets', 'transactions', 'vendors'];
    const foundTables = tables?.map(t => t.table_name).filter(name => 
      ourTables.includes(name)
    );
    
    console.log('\n🎯 SwiftPay tables status:');
    ourTables.forEach(tableName => {
      const exists = foundTables?.includes(tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();


