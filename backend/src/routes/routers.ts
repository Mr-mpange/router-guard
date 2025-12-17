import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { MikroTikService } from '../services/mikrotik';
import { authenticateToken, requireAdmin, requireOperator } from '../middleware/auth';

const router = Router();

// Apply authentication to all router routes
router.use(authenticateToken);

const createRouterSchema = z.object({
  name: z.string().min(1, 'Router name is required'),
  ipAddress: z.string().ip('Invalid IP address'),
  macAddress: z.string().optional(),
  location: z.string().optional(),
  username: z.string().default('admin'),
  password: z.string().min(1, 'Router password is required')
});

const updateRouterSchema = z.object({
  name: z.string().min(1).optional(),
  ipAddress: z.string().ip().optional(),
  macAddress: z.string().optional(),
  location: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional()
});

// Get all routers
router.get('/', requireOperator, async (req, res) => {
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
    logger.error('Failed to fetch routers:', error);
    res.status(500).json({ error: 'Failed to fetch routers' });
  }
});

// Get single router
router.get('/:id', requireOperator, async (req, res) => {
  try {
    const { id } = req.params;
    
    const router = await prisma.router.findUnique({
      where: { id },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            package: {
              select: { name: true, duration: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    res.json({ router });
  } catch (error) {
    logger.error('Failed to fetch router:', error);
    res.status(500).json({ error: 'Failed to fetch router' });
  }
});

// Create new router
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = createRouterSchema.parse(req.body);
    
    // Check if IP address is already in use
    const existingRouter = await prisma.router.findUnique({
      where: { ipAddress: data.ipAddress }
    });

    if (existingRouter) {
      return res.status(400).json({ error: 'IP address already in use' });
    }

    // Test connection to router
    const mikrotik = new MikroTikService(data.ipAddress, 'temp-id', data.username, data.password);
    const isOnline = await mikrotik.testConnection();

    const router = await prisma.router.create({
      data: {
        name: data.name,
        ipAddress: data.ipAddress,
        macAddress: data.macAddress,
        location: data.location,
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        lastSeen: isOnline ? new Date() : null,
        signalStrength: isOnline ? Math.floor(Math.random() * 40) + 60 : null // 60-100%
      }
    });

    logger.info(`Router created: ${router.name} (${router.ipAddress}) by user ${req.user?.email}`);

    res.status(201).json({ 
      router,
      message: `Router ${router.name} created successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data',
        details: error.errors
      });
    }
    logger.error('Failed to create router:', error);
    res.status(500).json({ error: 'Failed to create router' });
  }
});

// Update router
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateRouterSchema.parse(req.body);

    const existingRouter = await prisma.router.findUnique({
      where: { id }
    });

    if (!existingRouter) {
      return res.status(404).json({ error: 'Router not found' });
    }

    // Check IP address conflict if IP is being changed
    if (data.ipAddress && data.ipAddress !== existingRouter.ipAddress) {
      const conflictRouter = await prisma.router.findUnique({
        where: { ipAddress: data.ipAddress }
      });

      if (conflictRouter) {
        return res.status(400).json({ error: 'IP address already in use' });
      }
    }

    const router = await prisma.router.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info(`Router updated: ${router.name} by user ${req.user?.email}`);

    res.json({ 
      router,
      message: `Router ${router.name} updated successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data',
        details: error.errors
      });
    }
    logger.error('Failed to update router:', error);
    res.status(500).json({ error: 'Failed to update router' });
  }
});

// Delete router
router.delete('/:id', requireAdmin, async (req, res) => {
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

    logger.info(`Router deleted: ${router.name} by user ${req.user?.email}`);

    res.json({ message: `Router ${router.name} deleted successfully` });
  } catch (error) {
    logger.error('Failed to delete router:', error);
    res.status(500).json({ error: 'Failed to delete router' });
  }
});

// Test router connection
router.post('/:id/test', requireOperator, async (req, res) => {
  try {
    const { id } = req.params;

    const router = await prisma.router.findUnique({
      where: { id }
    });

    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    const mikrotik = new MikroTikService(router.ipAddress, router.id);
    const isOnline = await mikrotik.testConnection();
    
    let routerInfo = null;
    if (isOnline) {
      routerInfo = await mikrotik.getRouterInfo();
    }

    // Update router status
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
      routerInfo,
      message: isOnline ? 'Router is online and responding' : 'Router is offline or unreachable'
    });
  } catch (error) {
    logger.error('Failed to test router connection:', error);
    res.status(500).json({ error: 'Failed to test router connection' });
  }
});

// Get router statistics
router.get('/:id/stats', requireOperator, async (req, res) => {
  try {
    const { id } = req.params;

    const router = await prisma.router.findUnique({
      where: { id }
    });

    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    if (router.status !== 'ONLINE') {
      return res.status(400).json({ error: 'Router is offline' });
    }

    const mikrotik = new MikroTikService(router.ipAddress, router.id);
    const activeUsers = await mikrotik.getActiveUsers();

    // Get session statistics
    const [totalSessions, activeSessions, todaySessions] = await Promise.all([
      prisma.session.count({
        where: { routerId: id }
      }),
      prisma.session.count({
        where: { 
          routerId: id,
          status: 'ACTIVE'
        }
      }),
      prisma.session.count({
        where: {
          routerId: id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    res.json({
      router: {
        id: router.id,
        name: router.name,
        status: router.status
      },
      stats: {
        totalSessions,
        activeSessions,
        todaySessions,
        activeUsers: activeUsers.length,
        uptime: router.lastSeen ? Date.now() - router.lastSeen.getTime() : 0
      },
      activeUsers
    });
  } catch (error) {
    logger.error('Failed to get router stats:', error);
    res.status(500).json({ error: 'Failed to get router statistics' });
  }
});

export { router as routerRoutes };