import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { routerRoutes } from './routes/routers';
import { packageRoutes } from './routes/packages';
import { sessionRoutes } from './routes/sessions';
import { paymentRoutes } from './routes/payments';
import { dashboardRoutes } from './routes/dashboard';
import { captivePortalRoutes } from './routes/captivePortal';
import { initializeSocketHandlers } from './socket/handlers';
import { startBackgroundJobs } from './jobs';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test API endpoint
app.get('/api/test', async (req, res) => {
  try {
    const { prisma } = await import('./utils/database');
    
    // Test database connection
    const packageCount = await prisma.package.count();
    const routerCount = await prisma.router.count();
    
    res.json({
      status: 'API Working',
      database: 'Connected',
      packages: packageCount,
      routers: routerCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Test API error:', error);
    res.status(500).json({
      status: 'API Error',
      database: 'Connection Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/routers', routerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portal', captivePortalRoutes);

// Error handling
app.use(errorHandler);

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Start background jobs
startBackgroundJobs();

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`NetFlow Backend Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };