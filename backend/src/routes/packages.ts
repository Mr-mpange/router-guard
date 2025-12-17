import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { authenticateToken, requireAdmin, requireOperator } from '../middleware/auth';

const router = Router();

// Apply authentication to admin routes only
const createPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(1, 'Price must be greater than 0'),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

const updatePackageSchema = z.object({
  name: z.string().min(1).optional(),
  duration: z.number().min(1).optional(),
  price: z.number().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

// Public route - get active packages (for captive portal)
router.get('/', async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
        description: true,
        _count: {
          select: {
            sessions: true
          }
        }
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
        : `${Math.round(pkg.duration / 1440)} days`,
      totalSessions: pkg._count.sessions
    }));

    res.json({ packages: formattedPackages });
  } catch (error) {
    logger.error('Failed to fetch packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Admin routes - require authentication
router.use(authenticateToken);

// Get all packages (admin)
router.get('/admin', requireOperator, async (req, res) => {
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
      totalRevenue: pkg._count.payments * pkg.price
    }));

    res.json({ packages: packagesWithStats });
  } catch (error) {
    logger.error('Failed to fetch admin packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Get single package
router.get('/:id', requireOperator, async (req, res) => {
  try {
    const { id } = req.params;
    
    const package_ = await prisma.package.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            router: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
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
      }
    });

    if (!package_) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ package: package_ });
  } catch (error) {
    logger.error('Failed to fetch package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// Create new package
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = createPackageSchema.parse(req.body);
    
    // Check if package name already exists
    const existingPackage = await prisma.package.findFirst({
      where: { name: data.name }
    });

    if (existingPackage) {
      return res.status(400).json({ error: 'Package name already exists' });
    }

    const package_ = await prisma.package.create({
      data
    });

    logger.info(`Package created: ${package_.name} by user ${req.user?.email}`);

    res.status(201).json({ 
      package: package_,
      message: `Package ${package_.name} created successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data',
        details: error.errors
      });
    }
    logger.error('Failed to create package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// Update package
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updatePackageSchema.parse(req.body);

    const existingPackage = await prisma.package.findUnique({
      where: { id }
    });

    if (!existingPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Check name conflict if name is being changed
    if (data.name && data.name !== existingPackage.name) {
      const conflictPackage = await prisma.package.findFirst({
        where: { name: data.name }
      });

      if (conflictPackage) {
        return res.status(400).json({ error: 'Package name already exists' });
      }
    }

    const package_ = await prisma.package.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info(`Package updated: ${package_.name} by user ${req.user?.email}`);

    res.json({ 
      package: package_,
      message: `Package ${package_.name} updated successfully`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid data',
        details: error.errors
      });
    }
    logger.error('Failed to update package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// Delete package
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const package_ = await prisma.package.findUnique({
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

    if (!package_) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (package_._count.sessions > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete package with active sessions',
        activeSessions: package_._count.sessions
      });
    }

    await prisma.package.delete({
      where: { id }
    });

    logger.info(`Package deleted: ${package_.name} by user ${req.user?.email}`);

    res.json({ message: `Package ${package_.name} deleted successfully` });
  } catch (error) {
    logger.error('Failed to delete package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

// Toggle package status
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const package_ = await prisma.package.findUnique({
      where: { id }
    });

    if (!package_) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        isActive: !package_.isActive,
        updatedAt: new Date()
      }
    });

    logger.info(`Package ${updatedPackage.isActive ? 'activated' : 'deactivated'}: ${updatedPackage.name} by user ${req.user?.email}`);

    res.json({ 
      package: updatedPackage,
      message: `Package ${updatedPackage.name} ${updatedPackage.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error('Failed to toggle package status:', error);
    res.status(500).json({ error: 'Failed to toggle package status' });
  }
});

// Clear all dummy data (ADMIN ONLY)
router.delete('/admin/clear-dummy-data', requireAdmin, async (req, res) => {
  try {
    // Delete all existing packages (this will also delete related sessions and payments due to cascade)
    const deletedPackages = await prisma.package.deleteMany({});
    
    // Delete all existing routers
    const deletedRouters = await prisma.router.deleteMany({});
    
    // Delete all sessions
    const deletedSessions = await prisma.session.deleteMany({});
    
    // Delete all payments
    const deletedPayments = await prisma.payment.deleteMany({});

    logger.info(`Dummy data cleared by user ${req.user?.email}: ${deletedPackages.count} packages, ${deletedRouters.count} routers, ${deletedSessions.count} sessions, ${deletedPayments.count} payments`);

    res.json({ 
      message: 'All dummy data cleared successfully',
      deleted: {
        packages: deletedPackages.count,
        routers: deletedRouters.count,
        sessions: deletedSessions.count,
        payments: deletedPayments.count
      }
    });
  } catch (error) {
    logger.error('Failed to clear dummy data:', error);
    res.status(500).json({ error: 'Failed to clear dummy data' });
  }
});

// Create test session (for testing dashboard)
router.post('/admin/create-test-session', requireAdmin, async (req, res) => {
  try {
    const routers = await prisma.router.findMany({ take: 1 });
    const packages = await prisma.package.findMany({ take: 1 });
    
    if (routers.length === 0 || packages.length === 0) {
      return res.status(400).json({ error: 'Need at least one router and one package to create test session' });
    }

    const router = routers[0];
    const package_ = packages[0];
    
    // Create test session
    const session = await prisma.session.create({
      data: {
        deviceMac: `AA:BB:CC:DD:EE:${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`,
        deviceName: `Test Device ${Math.floor(Math.random() * 100)}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 200) + 50}`,
        routerId: router.id,
        packageId: package_.id,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + package_.duration * 60 * 1000),
        bytesUp: BigInt(Math.floor(Math.random() * 1000000)),
        bytesDown: BigInt(Math.floor(Math.random() * 5000000))
      }
    });

    // Create corresponding payment
    await prisma.payment.create({
      data: {
        sessionId: session.id,
        packageId: package_.id,
        amount: package_.price,
        paymentMethod: 'MPESA',
        phoneNumber: '+255712345678',
        status: 'COMPLETED',
        paidAt: new Date()
      }
    });

    logger.info(`Test session created: ${session.id} by user ${req.user?.email}`);

    res.json({ 
      message: 'Test session created successfully',
      session
    });
  } catch (error) {
    logger.error('Failed to create test session:', error);
    res.status(500).json({ error: 'Failed to create test session' });
  }
});

export { router as packageRoutes };