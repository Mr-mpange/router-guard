import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
// import { SessionManager } from '../services/sessionManager';
import { authenticateToken, requireOperator, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply authentication to all session routes
router.use(authenticateToken);
router.use(requireOperator);

const sessionQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPENDED']).optional(),
  routerId: z.string().optional(),
  packageId: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20')
});

// Get all sessions with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const query = sessionQuerySchema.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.routerId) where.routerId = query.routerId;
    if (query.packageId) where.packageId = query.packageId;

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
        take: query.limit
      }),
      prisma.session.count({ where })
    ]);

    const sessionsWithFormatting = sessions.map(session => ({
      ...session,
      timeRemaining: session.status === 'ACTIVE' ? 
        Math.max(0, session.expiresAt.getTime() - Date.now()) : 0,
      timeRemainingFormatted: session.status === 'ACTIVE' ? 
        formatDuration(Math.max(0, session.expiresAt.getTime() - Date.now())) : 'N/A',
      durationFormatted: formatDuration(session.package.duration * 60 * 1000),
      bytesUpFormatted: formatBytes(Number(session.bytesUp)),
      bytesDownFormatted: formatBytes(Number(session.bytesDown)),
      statusColor: getStatusColor(session.status),
      isExpired: session.expiresAt < new Date()
    }));

    res.json({ 
      sessions: sessionsWithFormatting,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / query.limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: error.errors
      });
    }
    logger.error('Failed to fetch sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get single session details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        router: true,
        package: true,
        payment: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionWithFormatting = {
      ...session,
      timeRemaining: session.status === 'ACTIVE' ? 
        Math.max(0, session.expiresAt.getTime() - Date.now()) : 0,
      timeRemainingFormatted: session.status === 'ACTIVE' ? 
        formatDuration(Math.max(0, session.expiresAt.getTime() - Date.now())) : 'N/A',
      durationFormatted: formatDuration(session.package.duration * 60 * 1000),
      bytesUpFormatted: formatBytes(Number(session.bytesUp)),
      bytesDownFormatted: formatBytes(Number(session.bytesDown)),
      statusColor: getStatusColor(session.status),
      isExpired: session.expiresAt < new Date()
    };

    res.json({ session: sessionWithFormatting });
  } catch (error) {
    logger.error('Failed to fetch session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Terminate session
router.post('/:id/terminate', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Update session status to terminated
    await prisma.session.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        endTime: new Date()
      }
    });

    logger.info(`Session terminated: ${id} by user ${req.user?.email}`);
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    logger.error('Failed to terminate session:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// Suspend session
router.post('/:id/suspend', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const session = await prisma.session.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Update session status to suspended
    await prisma.session.update({
      where: { id },
      data: {
        status: 'SUSPENDED'
      }
    });

    logger.info(`Session suspended: ${id} by user ${req.user?.email}`);
    res.json({ message: 'Session suspended successfully' });
  } catch (error) {
    logger.error('Failed to suspend session:', error);
    res.status(500).json({ error: 'Failed to suspend session' });
  }
});

// Resume session
router.post('/:id/resume', async (req: AuthenticatedRequest, res) => {
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

    // Update session status to active
    await prisma.session.update({
      where: { id },
      data: {
        status: 'ACTIVE'
      }
    });

    logger.info(`Session resumed: ${id} by user ${req.user?.email}`);
    res.json({ message: 'Session resumed successfully' });
  } catch (error) {
    logger.error('Failed to resume session:', error);
    res.status(500).json({ error: 'Failed to resume session' });
  }
});

// Extend session
router.post('/:id/extend', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ error: 'Invalid extension time' });
    }

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

    logger.info(`Session extended: ${id} by ${minutes} minutes by user ${req.user?.email}`);
    res.json({ message: `Session extended by ${minutes} minutes` });
  } catch (error) {
    logger.error('Failed to extend session:', error);
    res.status(500).json({ error: 'Failed to extend session' });
  }
});

// Get session statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [
      totalSessions,
      activeSessions,
      expiredSessions,
      suspendedSessions,
      todaySessions
    ] = await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { status: 'ACTIVE' } }),
      prisma.session.count({ where: { status: 'EXPIRED' } }),
      prisma.session.count({ where: { status: 'SUSPENDED' } }),
      prisma.session.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    res.json({
      stats: {
        totalSessions,
        activeSessions,
        expiredSessions,
        suspendedSessions,
        todaySessions
      }
    });
  } catch (error) {
    logger.error('Failed to fetch session stats:', error);
    res.status(500).json({ error: 'Failed to fetch session statistics' });
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

export { router as sessionRoutes };