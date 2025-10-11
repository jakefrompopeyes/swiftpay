#!/usr/bin/env node

// Test Coinbase Cloud integration
require('dotenv').config();
const { coinbaseCloudService } = require('./src/services/coinbaseCloud');

async function testCoinbaseCloud() {
  console.log('🧪 Testing Coinbase Cloud integration...');
  
  try {
    // Test 1: Check if credentials are loaded
    console.log('\n1️⃣ Checking API credentials...');
    if (!process.env.COINBASE_CLOUD_API_KEY || !process.env.COINBASE_CLOUD_API_SECRET) {
      console.log('❌ Coinbase Cloud API credentials not found in environment variables');
      console.log('Please add COINBASE_CLOUD_API_KEY and COINBASE_CLOUD_API_SECRET to your .env file');
      return;
    }
    console.log('✅ API credentials found');

    // Test 2: Get supported networks
    console.log('\n2️⃣ Testing supported networks...');
    const networks = await coinbaseCloudService.getSupportedNetworks();
    console.log('✅ Supported networks:', networks);

    // Test 3: Test authentication (this will fail if credentials are invalid)
    console.log('\n3️⃣ Testing authentication...');
    try {
      // This will attempt to authenticate with Coinbase Cloud
      await coinbaseCloudService.authenticate();
      console.log('✅ Authentication successful');
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
      console.log('Please check your API credentials');
      return;
    }

    console.log('\n🎉 Coinbase Cloud integration is working!');
    console.log('You can now create wallets through the frontend at http://localhost:3000/vendor-wallets');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCoinbaseCloud();


