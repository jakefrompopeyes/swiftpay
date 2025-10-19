#!/usr/bin/env node

// Simple script to expire pending payments older than 5 minutes
// Usage: node expire-pending.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY') {
  console.error('❌ Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  console.error('   Or edit this script to include your actual Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function expirePendingPayments() {
  try {
    console.log('🔄 Checking for pending payments older than 5 minutes...')
    
    const expireMinutes = 5
    const fiveMinutesAgo = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString()
    
    // First, let's see what pending payments exist
    const { data: pending, error: fetchError } = await supabase
      .from('payment_requests')
      .select('id, amount, currency, created_at, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ Error fetching pending payments:', fetchError.message)
      return
    }
    
    console.log(`📊 Found ${pending.length} pending payments`)
    
    if (pending.length === 0) {
      console.log('✅ No pending payments found')
      return
    }
    
    // Show pending payments
    console.log('\n📋 Pending payments:')
    pending.forEach((p, i) => {
      const age = Math.round((Date.now() - new Date(p.created_at).getTime()) / 1000 / 60)
      console.log(`  ${i + 1}. ${p.id} - $${p.amount} ${p.currency} - ${age} minutes old`)
    })
    
    // Find payments older than 5 minutes
    const oldPayments = pending.filter(p => new Date(p.created_at).toISOString() < fiveMinutesAgo)
    
    if (oldPayments.length === 0) {
      console.log('✅ No payments older than 5 minutes found')
      return
    }
    
    console.log(`\n⏰ Found ${oldPayments.length} payments older than 5 minutes`)
    
    // Expire the old payments
    const { data: expired, error: expireError } = await supabase
      .from('payment_requests')
      .update({ 
        status: 'failed', 
        updated_at: new Date().toISOString() 
      })
      .in('id', oldPayments.map(p => p.id))
      .select('id')
    
    if (expireError) {
      console.error('❌ Error expiring payments:', expireError.message)
      return
    }
    
    console.log(`✅ Successfully expired ${expired.length} payments`)
    console.log('📋 Expired payment IDs:', expired.map(e => e.id).join(', '))
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the function
expirePendingPayments()
  .then(() => {
    console.log('\n🎉 Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  })
