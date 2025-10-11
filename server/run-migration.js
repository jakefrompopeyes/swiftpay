#!/usr/bin/env node

// Run the multi-chain database migration
require('dotenv').config();
const { supabaseAdmin } = require('./src/lib/supabase');

async function runMigration() {
  console.log('🔄 Running multi-chain wallet migration...');
  
  try {
    // Add network column
    const { error: networkError } = await supabaseAdmin.rpc('exec_sql', {
      sql: "ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT 'ethereum'"
    });
    
    if (networkError) {
      console.log('Network column error:', networkError.message);
    } else {
      console.log('✅ Added network column');
    }

    // Add currency column
    const { error: currencyError } = await supabaseAdmin.rpc('exec_sql', {
      sql: "ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETH'"
    });
    
    if (currencyError) {
      console.log('Currency column error:', currencyError.message);
    } else {
      console.log('✅ Added currency column');
    }

    // Add mnemonic column
    const { error: mnemonicError } = await supabaseAdmin.rpc('exec_sql', {
      sql: "ALTER TABLE wallets ADD COLUMN IF NOT EXISTS mnemonic TEXT"
    });
    
    if (mnemonicError) {
      console.log('Mnemonic column error:', mnemonicError.message);
    } else {
      console.log('✅ Added mnemonic column');
    }

    // Update existing wallets
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ network: 'ethereum', currency: 'ETH' })
      .is('network', null);

    if (updateError) {
      console.log('Update error:', updateError.message);
    } else {
      console.log('✅ Updated existing wallets');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration();


