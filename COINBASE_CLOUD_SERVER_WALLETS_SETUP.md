# 🏦 Coinbase Cloud Server Wallets Integration Guide

## Overview
This guide shows you how to properly integrate **Coinbase Cloud Server Wallets API** with SwiftPay, based on the official Coinbase Cloud documentation.

## 🔑 Required Credentials

Based on the official documentation, you need **3 credentials** from Coinbase Cloud:

### 1. **API Key Name**
- Your public API key identifier
- Generated in Coinbase Developer Platform

### 2. **API Key Private Key** 
- Your private key for Bearer token authentication
- Generated alongside the API Key Name

### 3. **Wallet Secret**
- Additional security credential for wallet operations
- Used to generate Wallet Authentication JWT tokens
- **Critical**: Only shown once when generated!

## 🚀 Setup Instructions

### Step 1: Create Coinbase Cloud Account
1. Visit [Coinbase Developer Platform](https://docs.cdp.coinbase.com/)
2. Sign up for an account
3. Create a new project

### Step 2: Generate API Credentials
1. **Navigate to API Keys section** in your project dashboard
2. **Create new API key** with appropriate permissions:
   - `wallet:read` - Read wallet information
   - `wallet:write` - Create wallets and transactions
3. **Copy the API Key Name and Private Key** immediately
4. **Generate Wallet Secret** for additional security
5. **Store all credentials securely** - they won't be shown again!

### Step 3: Configure Environment Variables
Add these to your `server/.env` file:

```bash
# Coinbase Cloud Server Wallets API Configuration
COINBASE_CLOUD_API_KEY_NAME=your_actual_api_key_name
COINBASE_CLOUD_API_KEY_PRIVATE_KEY=your_actual_api_key_private_key
COINBASE_CLOUD_WALLET_SECRET=your_actual_wallet_secret
COINBASE_CLOUD_BASE_URL=https://api.cdp.coinbase.com
```

### Step 4: Test the Integration
```bash
# Restart the server
cd server && npm run dev

# Test wallet creation through frontend
# Go to: http://localhost:3000/vendor-wallets
```

## 🔧 How It Works

### Authentication Method
Coinbase Cloud uses a **two-layer authentication system**:

1. **Bearer Token**: `Authorization: Bearer {API_KEY_PRIVATE_KEY}`
2. **Wallet Auth JWT**: `X-Wallet-Auth: {JWT_TOKEN}`

The JWT token is generated using:
- **Issuer**: API Key Name
- **Secret**: Wallet Secret  
- **Algorithm**: ES256
- **Expiration**: 1 hour

### Supported Networks
- **Ethereum** (Primary)
- **Polygon** 
- **Base** (Coinbase's L2)
- **Arbitrum**

### API Endpoints
- **Create Wallet**: `POST /v1/wallets`
- **Get Balance**: `GET /v1/wallets/{id}/balance`
- **Send Transaction**: `POST /v1/wallets/{id}/transactions`
- **List Wallets**: `GET /v1/wallets`

## 🛡️ Security Features

### Multi-Party Computation (MPC)
- Private keys are split between Coinbase and your application
- No single party has complete access to private keys
- Enhanced security for production environments

### Coinbase-Managed (2-of-2) Model
- Shared key management with Coinbase
- Recommended for production use
- Automatic key rotation and backup

## 🧪 Testing

### Sandbox Environment
Coinbase Cloud provides sandbox environments for testing:
- Test wallet creation without real funds
- Validate transaction flows
- Test error handling

### Test Flow
1. **Create test wallet** for Ethereum
2. **Check wallet balance** (should be 0)
3. **Test transaction** (will fail without funds, but validates API)
4. **Verify wallet details** are returned correctly

## 📊 Benefits Over Custom Implementation

### Enterprise Security
- **SOC 2 Type II** certified infrastructure
- **Insurance coverage** for digital assets
- **Compliance ready** with financial regulations

### Scalability
- **Global CDN** for fast response times
- **Automatic scaling** for high transaction volumes
- **99.9% uptime** SLA

### Developer Experience
- **Simple API** calls for complex operations
- **Comprehensive documentation**
- **SDK support** for multiple languages

## 🚨 Important Notes

### Credential Security
- **Never commit** credentials to version control
- **Use environment variables** for all credentials
- **Rotate credentials** regularly
- **Monitor API usage** for anomalies

### Error Handling
- **Implement retry logic** for transient failures
- **Handle rate limits** gracefully
- **Log all API interactions** for debugging
- **Monitor wallet operations** for security

## 🔗 Resources

- [Coinbase Cloud Documentation](https://docs.cdp.coinbase.com/)
- [Server Wallets API Reference](https://docs.cdp.coinbase.com/server-wallets/v1/wallets-api)
- [API Authentication Guide](https://docs.cdp.coinbase.com/get-started/docs/cdp-api-keys)
- [Wallet SDK Documentation](https://coinbase-cloud.mintlify.app/wallet-api/docs/quickstart)

## 🎯 Next Steps

1. **Get your Coinbase Cloud credentials**
2. **Add them to your `.env` file**
3. **Restart the server**
4. **Test wallet creation** through the frontend
5. **Monitor the integration** for any issues

---

**Ready to get started?** Follow the setup instructions above to integrate enterprise-grade wallet management with Coinbase Cloud!


