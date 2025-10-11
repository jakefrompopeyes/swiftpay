# 🏦 Coinbase Cloud Integration Setup Guide

## Overview
SwiftPay now integrates with **Coinbase Cloud Wallet as a Service (WaaS)** for enterprise-grade wallet management. This provides enhanced security, multi-chain support, and professional infrastructure.

## 🔑 Key Benefits

### **Enhanced Security**
- **Multi-Party Computation (MPC)** - Private keys split between user and Coinbase
- **Trusted Execution Environment (TEE)** - Hardware-level security
- **No seed phrases** - User-friendly onboarding with username/password
- **Automatic backups** - Secure key share backups

### **Multi-Chain Support**
- **Ethereum** - ETH, ERC-20 tokens
- **Polygon** - MATIC, Polygon tokens
- **Solana** - SOL, SPL tokens
- **Bitcoin** - BTC
- **Bitcoin Cash** - BCH
- **Arbitrum** - ETH, Arbitrum tokens
- **Base** - ETH, Base tokens

### **Enterprise Features**
- **Real-time balances** - Live blockchain data
- **Transaction management** - Send/receive across chains
- **Compliance ready** - Built-in regulatory compliance
- **Insurance coverage** - Enterprise insurance

## 🚀 Setup Instructions

### 1. **Get Coinbase Cloud API Credentials**

1. Visit [Coinbase Cloud Developer Portal](https://portal.cdp.coinbase.com/)
2. Create an account or sign in
3. Create a new project
4. Generate API credentials:
   - **API Key** - Your public identifier
   - **API Secret** - Your private key (keep secure!)

### 2. **Configure Environment Variables**

Add these to your `server/.env` file:

```bash
# Coinbase Cloud Configuration
COINBASE_CLOUD_API_KEY=your_api_key_here
COINBASE_CLOUD_API_SECRET=your_api_secret_here
COINBASE_CLOUD_BASE_URL=https://api.cdp.coinbase.com
```

### 3. **Test the Integration**

```bash
# Start the server
cd server && npm run dev

# Test wallet creation
curl -X POST http://localhost:3001/api/wallets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"network": "ethereum"}'
```

## 🔧 API Endpoints

### **Create Wallet**
```http
POST /api/wallets
Authorization: Bearer {token}
Content-Type: application/json

{
  "network": "ethereum" | "polygon" | "solana" | "bitcoin" | "bitcoin-cash"
}
```

### **Get Wallet Balance**
```http
GET /api/wallets/{walletId}/balance
Authorization: Bearer {token}
```

### **Get Supported Networks**
```http
GET /api/wallets/networks
Authorization: Bearer {token}
```

## 🎯 Frontend Integration

The frontend automatically detects Coinbase Cloud wallets and shows:
- **Blue "Coinbase Cloud" badge** on wallets
- **Real-time balances** from Coinbase infrastructure
- **Multi-chain support** with proper icons

## 🔄 Migration from Custom Wallets

### **Backward Compatibility**
- **Existing wallets** continue to work with custom service
- **New wallets** automatically use Coinbase Cloud
- **Mixed environment** supported during transition

### **Wallet Identification**
- **Coinbase Cloud wallets**: `private_key` starts with `coinbase_cloud_`
- **Custom wallets**: Regular private key format
- **Automatic detection** in balance/transaction endpoints

## 📊 Monitoring & Analytics

### **Coinbase Cloud Dashboard**
- Monitor wallet usage
- Track API calls and limits
- View transaction analytics
- Manage API keys

### **SwiftPay Integration**
- Wallet creation logs
- Balance update tracking
- Error monitoring
- Performance metrics

## 🛡️ Security Best Practices

### **API Key Management**
- **Never commit** API keys to version control
- **Use environment variables** for configuration
- **Rotate keys** regularly
- **Monitor usage** for anomalies

### **Wallet Security**
- **MPC technology** eliminates single points of failure
- **TEE protection** for key operations
- **Automatic backups** prevent key loss
- **Enterprise insurance** coverage

## 🚨 Troubleshooting

### **Common Issues**

**Authentication Errors**
```bash
# Check API credentials
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.cdp.coinbase.com/v1/wallets
```

**Network Unsupported**
```bash
# Check supported networks
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/wallets/networks
```

**Balance Retrieval Issues**
- Verify wallet exists in Coinbase Cloud
- Check network connectivity
- Review API rate limits

### **Fallback Behavior**
- If Coinbase Cloud is unavailable, system falls back to custom service
- Legacy wallets continue to work normally
- Error messages indicate the active provider

## 📈 Next Steps

1. **Set up Coinbase Cloud account**
2. **Configure API credentials**
3. **Test wallet creation**
4. **Monitor integration health**
5. **Scale to production**

## 🔗 Resources

- [Coinbase Cloud Documentation](https://docs.cdp.coinbase.com/)
- [Wallet as a Service Guide](https://docs.cdp.coinbase.com/wallet-api/)
- [API Reference](https://docs.cdp.coinbase.com/api/)
- [Support Portal](https://support.cdp.coinbase.com/)

---

**Ready to get started?** Follow the setup instructions above and test the integration!


