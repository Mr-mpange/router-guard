import { Router } from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { authenticateToken, requireOperator } from '../middleware/auth';

const router = Router();

// Dashboard routes are now public (no authentication required)

// Get dashboard statistics
router.get('/stats', async (req, res) => {
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
    logger.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get active sessions for dashboard
router.get('/active-sessions', async (req, res) => {
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
      timeRemaining: Math.max(0, session.expiresAt.getTime() - Date.now()),
      timeRemainingFormatted: formatDuration(Math.max(0, session.expiresAt.getTime() - Date.now())),
      bytesUpFormatted: formatBytes(Number(session.bytesUp)),
      bytesDownFormatted: formatBytes(Number(session.bytesDown))
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    logger.error('Failed to fetch active sessions:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const [recentSessions, recentPayments] = await Promise.all([
      prisma.session.findMany({
        include: {
          router: { select: { name: true } },
          package: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.payment.findMany({
        where: { status: 'COMPLETED' },
        include: {
          package: { select: { name: true } },
          session: { select: { deviceMac: true } }
        },
        orderBy: { paidAt: 'desc' },
        take: 5
      })
    ]);

    const activity = [
      ...recentSessions.map(session => ({
        id: session.id,
        type: 'session',
        action: 'Session Started',
        description: `${session.package.name} on ${session.router.name}`,
        deviceMac: session.deviceMac,
        timestamp: session.createdAt,
        status: session.status
      })),
      ...recentPayments.map(payment => ({
        id: payment.id,
        type: 'payment',
        action: 'Payment Completed',
        description: `${payment.package.name} - ${(payment.amount / 100).toLocaleString()} TZS`,
        deviceMac: payment.session.deviceMac,
        timestamp: payment.paidAt,
        status: payment.status
      }))
    ].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    }).slice(0, 10);

    res.json({ activity });
  } catch (error) {
    logger.error('Failed to fetch recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Get router status overview
router.get('/router-status', async (req, res) => {
  try {
    const routers = await prisma.router.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        status: true,
        activeUsers: true,
        lastSeen: true,
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
      orderBy: { name: 'asc' }
    });

    const routerStatus = routers.map(router => ({
      ...router,
      activeSessions: router._count.sessions,
      statusColor: router.status === 'ONLINE' ? 'green' : 
                   router.status === 'OFFLINE' ? 'red' : 'yellow',
      lastSeenFormatted: router.lastSeen ? 
        new Date(router.lastSeen).toLocaleString() : 'Never'
    }));

    res.json({ routers: routerStatus });
  } catch (error) {
    logger.error('Failed to fetch router status:', error);
    res.status(500).json({ error: 'Failed to fetch router status' });
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

export { router as dashboardRoutes };