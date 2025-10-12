import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import Supabase
import { supabaseAdmin } from './lib/supabase';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import walletRoutes from './routes/wallets';
import transactionRoutes from './routes/transactions';
import vendorRoutes from './routes/vendors';
import apiRoutes from './routes/api';
import paymentRequestRoutes from './routes/paymentRequests';
import webhookRoutes from './routes/webhooks';
import redirectRoutes from './routes/redirects';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Import services
import { BlockchainService } from './services/blockchain';
import { PriceService } from './services/price';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting (relaxed for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for dev)
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3007',
      'http://localhost:3008',
      'http://localhost:3009',
      undefined, // allow same-origin/non-browser tools
      // Vercel preview/deployments
      /https?:\/\/.+\.vercel\.app$/
    ]
    if (!origin) return callback(null, true)
    if (allowed.some((o) => (typeof o === 'string' ? o === origin : (o as RegExp).test(origin)))) {
      return callback(null, true)
    }
    callback(null, false)
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'Connected'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/wallets', authenticateToken, walletRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/vendors', authenticateToken, vendorRoutes);
app.use('/api/public', apiRoutes);
app.use('/api/payment-requests', paymentRequestRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/r', redirectRoutes);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'subscribe_transactions':
          // Subscribe user to transaction updates
          (ws as any).userId = data.userId;
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Initialize services
const blockchainService = new BlockchainService();
const priceService = new PriceService();

// Start price updates
priceService.startPriceUpdates();

// Export WebSocket server for use in other modules
export { wss };

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 SwiftPay server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
});

export default app;

