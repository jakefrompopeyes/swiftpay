# SwiftPay Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Prerequisites
- Vercel account (free at vercel.com)
- GitHub account
- Node.js installed locally

### Step 1: Prepare Repository
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: SwiftPay crypto payment processor"

# Create GitHub repository and push
# Go to github.com and create a new repository named "swiftpay"
git remote add origin https://github.com/YOUR_USERNAME/swiftpay.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"

2. **Import Repository**
   - Select your SwiftPay repository
   - Choose "client" as the root directory
   - Framework: Next.js (auto-detected)

3. **Configure Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   NEXT_PUBLIC_COINGECKO_API_KEY=CG-4t9T7hqedfTufESUnfqJu4mr
   NEXT_PUBLIC_API_URL=https://swiftpay-api.vercel.app
   NEXT_PUBLIC_APP_NAME=SwiftPay
   NEXT_PUBLIC_APP_VERSION=1.0.0
   NEXT_PUBLIC_APP_ENV=production
   NEXT_PUBLIC_ENABLE_DEMO_MODE=true
   NEXT_PUBLIC_ENABLE_MERCHANT_DASHBOARD=true
   NEXT_PUBLIC_ENABLE_WALLET_MANAGEMENT=true
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get your live URL (e.g., https://swiftpay.vercel.app)

### Step 3: Deploy Backend (Optional)

For a full-stack deployment, you can also deploy the backend:

1. **Create separate Vercel project for backend**
   - Root directory: "server"
   - Framework: Node.js
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Backend Environment Variables**
   ```
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_jwt_secret
   COINGECKO_API_KEY=CG-4t9T7hqedfTufESUnfqJu4mr
   NODE_ENV=production
   ```

### Step 4: Custom Domain (Optional)

1. **Add Custom Domain**
   - In Vercel dashboard, go to Project Settings
   - Add your domain (e.g., swiftpay.com)
   - Configure DNS records as instructed

2. **SSL Certificate**
   - Automatically provided by Vercel
   - HTTPS enabled by default

## 🌐 Alternative Hosting Options

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd client
npm run build
netlify deploy --prod --dir=.next
```

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Heroku
```bash
# Install Heroku CLI
# Create Procfile in client directory:
echo "web: npm start" > client/Procfile

# Deploy
heroku create swiftpay-app
git push heroku main
```

## 🔧 Production Optimizations

### Performance
- Enable Vercel Analytics
- Configure CDN settings
- Optimize images with next/image
- Enable compression

### Security
- Set up Content Security Policy
- Configure CORS properly
- Use environment variables for secrets
- Enable rate limiting

### Monitoring
- Set up error tracking (Sentry)
- Monitor performance metrics
- Configure uptime monitoring
- Set up alerts

## 📊 Post-Deployment Checklist

- [ ] Test all pages load correctly
- [ ] Verify navigation works
- [ ] Test demo mode functionality
- [ ] Check mobile responsiveness
- [ ] Verify API integrations
- [ ] Test payment flows
- [ ] Monitor performance
- [ ] Set up analytics

## 🚨 Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Environment Variables**: Ensure all required vars are set
3. **API Errors**: Verify CoinGecko API key is valid
4. **Routing Issues**: Check Next.js configuration

### Support
- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- GitHub Issues: Create issue in repository

## 🎉 Success!

Once deployed, your SwiftPay application will be live at:
- **Frontend**: https://swiftpay.vercel.app
- **Demo Mode**: https://swiftpay.vercel.app/demo
- **Merchant Dashboard**: https://swiftpay.vercel.app/merchant-dashboard

Share your crypto payment processor with the world! 🚀