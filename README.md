# SwiftPay - Crypto Payment Processor

The Stripe for crypto - enabling seamless cryptocurrency payments between individuals and vendors.

## Features

- 🚀 **Multi-Crypto Support**: Bitcoin, Ethereum, Polygon, and major cryptocurrencies
- 💱 **Fiat Conversion**: Real-time crypto-to-fiat pricing
- 🔌 **Developer APIs**: RESTful APIs for easy integration
- 📊 **Analytics Dashboard**: Comprehensive transaction analytics for vendors
- 🔒 **Secure**: Enterprise-grade security and compliance features
- ⚡ **Fast**: Real-time transaction processing

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Web3.js, Ethers.js, Bitcoin Core
- **Real-time**: WebSocket connections

## Quick Start

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development servers:
```bash
npm run dev
```

## Project Structure

```
swiftpay/
├── client/          # Next.js frontend application
├── server/          # Node.js backend API
├── shared/          # Shared types and utilities
└── docs/           # Documentation
```

## API Documentation

See `/docs/api.md` for detailed API documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

