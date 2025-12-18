import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:8081", 
      "http://localhost:3000",
      "http://localhost:4173",
      "https://mr-mpange.github.io",
      process.env.FRONTEND_URL || "http://localhost:5173"
    ];
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('github.io')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// CORS debug endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
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
    res.status(500).json({
      status: 'API Error',
      database: 'Connection Failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' });
  }
});

// Portal routes (public)
app.get('/api/portal/packages', async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
        description: true
      },
      orderBy: { price: 'asc' }
    });

    const formattedPackages = packages.map(pkg => ({
      ...pkg,
      durationHours: Math.round(pkg.duration / 60 * 10) / 10,
      priceFormatted: `${(pkg.price / 100).toLocaleString()} TZS`,
      durationText: pkg.duration < 60 
        ? `${pkg.duration} minutes`
        : pkg.duration < 1440
        ? `${Math.round(pkg.duration / 60)} hours`
        : `${Math.round(pkg.duration / 1440)} days`
    }));

    res.json({ packages: formattedPackages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

app.get('/api/portal/status/:macAddress', async (req, res) => {
  try {
    const { macAddress } = req.params;

    const activeSession = await prisma.session.findFirst({
      where: {
        deviceMac: macAddress,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        package: {
          select: {
            name: true,
            duration: true
          }
        },
        router: {
          select: {
            name: true,
            location: true
          }
        }
      }
    });

    if (activeSession) {
      const timeRemaining = Math.max(0, activeSession.expiresAt.getTime() - Date.now());
      
      res.json({
        hasActiveSession: true,
        session: {
          id: activeSession.id,
          packageName: activeSession.package.name,
          startTime: activeSession.startTime,
          expiresAt: activeSession.expiresAt,
          timeRemaining,
          timeRemainingFormatted: formatDuration(timeRemaining),
          routerName: activeSession.router.name,
          routerLocation: activeSession.router.location,
          bytesUp: activeSession.bytesUp.toString(),
          bytesDown: activeSession.bytesDown.toString(),
          status: activeSession.status
        }
      });
    } else {
      res.json({
        hasActiveSession: false,
        message: 'No active session found',
        deviceConnected: true
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to check device status' });
  }
});

app.get('/api/portal/router/:routerId', async (req, res) => {
  try {
    const { routerId } = req.params;
    
    let router;
    
    if (routerId === 'default-router-id' || routerId === 'default') {
      router = await prisma.router.findFirst({
        where: { status: 'ONLINE' },
        select: {
          id: true,
          name: true,
          location: true,
          status: true,
          activeUsers: true
        }
      });
    } else {
      router = await prisma.router.findUnique({
        where: { id: routerId },
        select: {
          id: true,
          name: true,
          location: true,
          status: true,
          activeUsers: true
        }
      });
    }

    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    res.json({
      router: {
        ...router,
        isOnline: router.status === 'ONLINE'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get router information' });
  }
});

// ZenoPay purchase endpoint
app.post('/api/portal/purchase', async (req, res) => {
  try {
    const { packageId, deviceMac, phoneNumber, paymentMethod, routerId, ipAddress } = req.body;

    // Validate required fields
    if (!packageId || !deviceMac || !phoneNumber || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get package
    const package_ = await prisma.package.findUnique({
      where: { id: packageId }
    });

    if (!package_) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Get router
    let router;
    if (routerId && routerId !== 'default') {
      router = await prisma.router.findUnique({
        where: { id: routerId }
      });
    } else {
      router = await prisma.router.findFirst({
        where: { status: 'ONLINE' }
      });
    }

    if (!router) {
      return res.status(503).json({ error: 'No routers available' });
    }

    // Format phone number
    const { zenoPayService } = await import('./services/zenoPayService');
    const formattedPhone = zenoPayService.formatPhoneNumber(phoneNumber);

    // Create session (initially PENDING)
    const session = await prisma.session.create({
      data: {
        deviceMac,
        deviceName: 'Portal User',
        ipAddress,
        routerId: router.id,
        packageId: package_.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Temporary expiry
        status: 'PENDING'
      }
    });

    // Generate payment reference
    const paymentReference = `NF-${Date.now()}-${session.id.slice(-6)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        sessionId: session.id,
        packageId: package_.id,
        amount: package_.price,
        paymentMethod,
        phoneNumber: formattedPhone,
        paymentReference,
        status: 'PENDING'
      }
    });

    // Log payment initiation
    console.log('Initiating payment:', {
      packageName: package_.name,
      amount: package_.price / 100,
      phone: formattedPhone,
      method: paymentMethod,
      reference: paymentReference
    });

    // Initiate ZenoPay payment
    const paymentResult = await zenoPayService.initiatePayment({
      amount: package_.price / 100, // Convert from cents to TZS
      currency: 'TZS',
      phoneNumber: formattedPhone,
      paymentMethod: paymentMethod as 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY',
      reference: paymentReference,
      description: `NetFlow WiFi - ${package_.name}`,
      callbackUrl: `${process.env.API_URL || 'http://localhost:3001'}/api/webhooks/zenopay`
    });

    console.log('ZenoPay payment result:', paymentResult);

    // Update payment with transaction ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentReference: paymentResult.transactionId || paymentReference
      }
    });

    if (paymentResult.success) {
      res.json({
        success: true,
        message: 'Payment initiated successfully',
        payment: {
          id: payment.id,
          transactionId: paymentResult.transactionId,
          reference: paymentReference,
          status: paymentResult.status,
          amount: package_.price,
          paymentUrl: paymentResult.paymentUrl
        },
        session: {
          id: session.id,
          status: 'PENDING'
        },
        instructions: `Please complete payment on your ${paymentMethod.replace('_', ' ')} app. You will receive internet access once payment is confirmed.`
      });
    } else {
      // Update session and payment status to failed
      await prisma.session.update({
        where: { id: session.id },
        data: { status: 'TERMINATED' }
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      res.status(400).json({
        success: false,
        error: paymentResult.message || 'Payment initiation failed'
      });
    }

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
});

// Voucher redemption endpoint
app.post('/api/portal/redeem-voucher', async (req, res) => {
  try {
    const { voucherCode, deviceMac, routerId, ipAddress } = req.body;

    if (!voucherCode || !deviceMac) {
      return res.status(400).json({ error: 'Voucher code and device MAC are required' });
    }

    // Get router
    let router;
    if (routerId && routerId !== 'default') {
      router = await prisma.router.findUnique({
        where: { id: routerId }
      });
    } else {
      router = await prisma.router.findFirst({
        where: { status: 'ONLINE' }
      });
    }

    if (!router) {
      return res.status(503).json({ error: 'No routers available' });
    }

    // Redeem voucher
    const { voucherService } = await import('./services/voucherService');
    const result = await voucherService.redeemVoucher(
      voucherCode.toUpperCase(),
      deviceMac,
      router.id,
      ipAddress
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        session: result.session
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('Voucher redemption error:', error);
    res.status(500).json({ error: 'Failed to redeem voucher' });
  }
});

// Check payment status endpoint
app.get('/api/portal/payment-status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find payment by transaction ID
    const payment = await prisma.payment.findFirst({
      where: {
        paymentReference: transactionId
      },
      include: {
        session: {
          include: {
            package: true,
            router: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check with ZenoPay if payment is still pending
    if (payment.status === 'PENDING') {
      const { zenoPayService } = await import('./services/zenoPayService');
      const statusResult = await zenoPayService.checkPaymentStatus(transactionId);
      
      if (statusResult.status === 'COMPLETED' && payment.status !== 'COMPLETED') {
        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date()
          }
        });

        // Activate session
        if (payment.session) {
          const expiresAt = new Date(Date.now() + payment.session.package.duration * 60 * 1000);
          await prisma.session.update({
            where: { id: payment.session.id },
            data: {
              status: 'ACTIVE',
              expiresAt
            }
          });
        }

        payment.status = 'COMPLETED';
      }
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      session: payment.session ? {
        id: payment.session.id,
        status: payment.session.status,
        packageName: payment.session.package.name,
        expiresAt: payment.session.expiresAt,
        routerName: payment.session.router.name
      } : null
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Auth middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Protected routes
app.get('/api/routers', authenticateToken, async (req, res) => {
  try {
    const routers = await prisma.router.findMany({
      select: {
        id: true,
        name: true,
        ipAddress: true,
        macAddress: true,
        location: true,
        status: true,
        lastSeen: true,
        signalStrength: true,
        activeUsers: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const routersWithStats = routers.map(router => ({
      ...router,
      activeSessions: router._count.sessions,
      statusColor: router.status === 'ONLINE' ? 'green' : 
                   router.status === 'OFFLINE' ? 'red' : 'yellow',
      lastSeenFormatted: router.lastSeen ? 
        new Date(router.lastSeen).toLocaleString() : 'Never'
    }));

    res.json({ routers: routersWithStats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routers' });
  }
});

// Dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalSessions,
      activeSessions,
      totalRouters,
      onlineRouters,
      totalPackages,
      activePackages,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      todaySessions,
      weekSessions,
      monthSessions
    ] = await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { status: 'ACTIVE' } }),
      prisma.router.count(),
      prisma.router.count({ where: { status: 'ONLINE' } }),
      prisma.package.count(),
      prisma.package.count({ where: { isActive: true } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { 
          status: 'COMPLETED',
          paidAt: { gte: todayStart }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { 
          status: 'COMPLETED',
          paidAt: { gte: weekStart }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { 
          status: 'COMPLETED',
          paidAt: { gte: monthStart }
        },
        _sum: { amount: true }
      }),
      prisma.session.count({
        where: { createdAt: { gte: todayStart } }
      }),
      prisma.session.count({
        where: { createdAt: { gte: weekStart } }
      }),
      prisma.session.count({
        where: { createdAt: { gte: monthStart } }
      })
    ]);

    res.json({
      stats: {
        sessions: {
          total: totalSessions,
          active: activeSessions,
          today: todaySessions,
          week: weekSessions,
          month: monthSessions
        },
        routers: {
          total: totalRouters,
          online: onlineRouters,
          offline: totalRouters - onlineRouters
        },
        packages: {
          total: totalPackages,
          active: activePackages,
          inactive: totalPackages - activePackages
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          today: todayRevenue._sum.amount || 0,
          week: weekRevenue._sum.amount || 0,
          month: monthRevenue._sum.amount || 0,
          totalFormatted: `${((totalRevenue._sum.amount || 0) / 100).toLocaleString()} TZS`,
          todayFormatted: `${((todayRevenue._sum.amount || 0) / 100).toLocaleString()} TZS`,
          weekFormatted: `${((weekRevenue._sum.amount || 0) / 100).toLocaleString()} TZS`,
          monthFormatted: `${((monthRevenue._sum.amount || 0) / 100).toLocaleString()} TZS`
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get active sessions for dashboard
app.get('/api/dashboard/active-sessions', authenticateToken, async (req, res) => {
  try {
    const activeSessions = await prisma.session.findMany({
      where: { 
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      },
      include: {
        router: {
          select: {
            name: true,
            location: true
          }
        },
        package: {
          select: {
            name: true,
            duration: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const formattedSessions = activeSessions.map(session => ({
      ...session,
      bytesUp: session.bytesUp.toString(), // Convert BigInt to string
      bytesDown: session.bytesDown.toString(), // Convert BigInt to string
      timeRemaining: Math.max(0, session.expiresAt.getTime() - Date.now()),
      timeRemainingFormatted: formatDuration(Math.max(0, session.expiresAt.getTime() - Date.now())),
      bytesUpFormatted: formatBytes(Number(session.bytesUp)),
      bytesDownFormatted: formatBytes(Number(session.bytesDown))
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Get all sessions with filtering
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { status, routerId, packageId, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (routerId) where.routerId = routerId;
    if (packageId) where.packageId = packageId;

    const [sessions, totalCount] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          router: { 
            select: { 
              id: true,
              name: true, 
              location: true,
              ipAddress: true
            } 
          },
          package: { 
            select: { 
              id: true,
              name: true, 
              duration: true,
              price: true
            } 
          },
          payment: {
            select: {
              id: true,
              status: true,
              paymentMethod: true,
              amount: true,
              paidAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.session.count({ where })
    ]);

    const sessionsWithFormatting = sessions.map(session => ({
      ...session,
      bytesUp: session.bytesUp.toString(), // Convert BigInt to string
      bytesDown: session.bytesDown.toString(), // Convert BigInt to string
      timeRemaining: session.status === 'ACTIVE' ? 
        Math.max(0, session.expiresAt.getTime() - Date.now()) : 0,
      timeRemainingFormatted: session.status === 'ACTIVE' ? 
        formatDuration(Math.max(0, session.expiresAt.getTime() - Date.now())) : 
        session.status === 'EXPIRED' ? 'Expired' :
        session.status === 'TERMINATED' ? 'Terminated' :
        session.status === 'SUSPENDED' ? 'Suspended' :
        session.status === 'PENDING' ? 'Pending Payment' : 'N/A',
      durationFormatted: formatDuration(session.package.duration * 60 * 1000),
      bytesUpFormatted: formatBytes(Number(session.bytesUp)),
      bytesDownFormatted: formatBytes(Number(session.bytesDown)),
      statusColor: getStatusColor(session.status),
      isExpired: session.expiresAt < new Date()
    }));

    res.json({ 
      sessions: sessionsWithFormatting,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get all payments
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { status, method, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) where.status = status;
    if (method) where.paymentMethod = method;

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          session: { 
            select: { 
              deviceMac: true,
              deviceName: true,
              router: {
                select: {
                  name: true,
                  location: true
                }
              }
            } 
          },
          package: { 
            select: { 
              name: true,
              duration: true
            } 
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.payment.count({ where })
    ]);

    const paymentsWithFormatting = payments.map(payment => ({
      ...payment,
      amountFormatted: `${(payment.amount / 100).toLocaleString()} TZS`,
      statusColor: payment.status === 'COMPLETED' ? 'green' : 
                   payment.status === 'PENDING' ? 'yellow' : 'red',
      paidAtFormatted: payment.paidAt ? 
        new Date(payment.paidAt).toLocaleString() : 'N/A'
    }));

    res.json({ 
      payments: paymentsWithFormatting,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get all packages (admin)
app.get('/api/packages', authenticateToken, async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      include: {
        _count: {
          select: {
            sessions: true,
            payments: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const packagesWithStats = packages.map(pkg => ({
      ...pkg,
      durationHours: Math.round(pkg.duration / 60 * 10) / 10,
      priceFormatted: `${(pkg.price / 100).toLocaleString()} TZS`,
      durationText: pkg.duration < 60 
        ? `${pkg.duration} minutes`
        : pkg.duration < 1440
        ? `${Math.round(pkg.duration / 60)} hours`
        : `${Math.round(pkg.duration / 1440)} days`,
      totalSessions: pkg._count.sessions,
      completedPayments: pkg._count.payments,
      totalRevenue: pkg._count.payments * pkg.price,
      totalRevenueFormatted: `${((pkg._count.payments * pkg.price) / 100).toLocaleString()} TZS`
    }));

    res.json({ packages: packagesWithStats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Helper functions
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m ${seconds % 60}s`;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'green';
    case 'EXPIRED': return 'red';
    case 'TERMINATED': return 'gray';
    case 'SUSPENDED': return 'yellow';
    default: return 'gray';
  }
}

// Router management endpoints
app.post('/api/routers', authenticateToken, async (req, res) => {
  try {
    const { name, ipAddress, location, username = 'admin', password } = req.body;
    
    if (!name || !ipAddress || !password) {
      return res.status(400).json({ error: 'Name, IP address, and password are required' });
    }

    // Check if IP address is already in use
    const existingRouter = await prisma.router.findUnique({
      where: { ipAddress }
    });

    if (existingRouter) {
      return res.status(400).json({ error: 'IP address already in use' });
    }

    const router = await prisma.router.create({
      data: {
        name,
        ipAddress,
        location,
        status: 'ONLINE', // Mock as online for demo
        lastSeen: new Date(),
        signalStrength: Math.floor(Math.random() * 40) + 60 // 60-100%
      }
    });

    res.status(201).json({ 
      router,
      message: `Router ${router.name} created successfully`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create router' });
  }
});

app.post('/api/routers/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const router = await prisma.router.findUnique({
      where: { id }
    });

    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    // Mock connection test - in production this would test actual MikroTik API
    const isOnline = Math.random() > 0.2; // 80% success rate
    
    await prisma.router.update({
      where: { id },
      data: {
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        lastSeen: isOnline ? new Date() : router.lastSeen,
        signalStrength: isOnline ? Math.floor(Math.random() * 40) + 60 : null
      }
    });

    res.json({
      online: isOnline,
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      message: isOnline ? 'Router is online and responding' : 'Router is offline or unreachable'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to test router connection' });
  }
});

app.delete('/api/routers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const router = await prisma.router.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sessions: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      }
    });

    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    if (router._count.sessions > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete router with active sessions',
        activeSessions: router._count.sessions
      });
    }

    await prisma.router.delete({
      where: { id }
    });

    res.json({ message: `Router ${router.name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete router' });
  }
});

// Session management endpoints
app.post('/api/sessions/:id/terminate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    await prisma.session.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        endTime: new Date()
      }
    });

    console.log(`Session terminated: ${id}`);
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    console.error('Failed to terminate session:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// Suspend session endpoint
app.post('/api/sessions/:id/suspend', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    await prisma.session.update({
      where: { id },
      data: {
        status: 'SUSPENDED'
      }
    });

    console.log(`Session suspended: ${id}`);
    res.json({ message: 'Session suspended successfully' });
  } catch (error) {
    console.error('Failed to suspend session:', error);
    res.status(500).json({ error: 'Failed to suspend session' });
  }
});

// Resume session endpoint
app.post('/api/sessions/:id/resume', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'SUSPENDED') {
      return res.status(400).json({ error: 'Session is not suspended' });
    }

    await prisma.session.update({
      where: { id },
      data: {
        status: 'ACTIVE'
      }
    });

    console.log(`Session resumed: ${id}`);
    res.json({ message: 'Session resumed successfully' });
  } catch (error) {
    console.error('Failed to resume session:', error);
    res.status(500).json({ error: 'Failed to resume session' });
  }
});

// Extend session endpoint
app.post('/api/sessions/:id/extend', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes = 60 } = req.body; // Default extend by 1 hour

    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Extend session expiry time
    const newExpiresAt = new Date(session.expiresAt.getTime() + minutes * 60 * 1000);
    
    await prisma.session.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt
      }
    });

    console.log(`Session extended: ${id} by ${minutes} minutes`);
    res.json({ 
      message: `Session extended by ${minutes} minutes`,
      newExpiresAt: newExpiresAt
    });
  } catch (error) {
    console.error('Failed to extend session:', error);
    res.status(500).json({ error: 'Failed to extend session' });
  }
});

// Webhook routes
app.use('/api/webhooks', async (req, res, next) => {
  const { webhookRoutes } = await import('./routes/webhooks');
  webhookRoutes(req, res, next);
});

// Test webhook routes (development only)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', async (req, res, next) => {
    const { testWebhookRoutes } = await import('./routes/testWebhook');
    testWebhookRoutes(req, res, next);
  });
}

// ZenoPay configuration check endpoint
app.get('/api/zenopay/config', authenticateToken, async (req, res) => {
  try {
    const { zenoPayService } = await import('./services/zenoPayService');
    const hasApiKey = process.env.ZENOPAY_API_KEY && process.env.ZENOPAY_API_KEY !== 'your-zenopay-api-key-here';
    const hasSecretKey = process.env.ZENOPAY_SECRET_KEY && process.env.ZENOPAY_SECRET_KEY !== 'your-zenopay-secret-key-here';
    
    res.json({
      configured: hasApiKey && hasSecretKey,
      baseUrl: process.env.ZENOPAY_BASE_URL,
      webhookUrl: process.env.ZENOPAY_WEBHOOK_URL,
      supportedMethods: zenoPayService.getSupportedPaymentMethods(),
      mode: hasApiKey && hasSecretKey ? 'production' : 'mock'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check ZenoPay configuration' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`NetFlow Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`ZenoPay webhook URL: http://localhost:${PORT}/api/webhooks/zenopay`);
});