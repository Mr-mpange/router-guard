import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { MikroTikService } from '../services/mikrotik';
import { PaymentService } from '../services/payment';
import { SessionManager } from '../services/sessionManager';

const router = Router();

const purchaseSchema = z.object({
  packageId: z.string(),
  deviceMac: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format'),
  deviceName: z.string().optional(),
  ipAddress: z.string().optional(),
  routerId: z.string(),
  phoneNumber: z.string().regex(/^(\+255|0)[67]\d{8}$/, 'Invalid phone number format'),
  paymentMethod: z.enum(['MPESA', 'TIGO_PESA', 'AIRTEL_MONEY'])
});

const statusSchema = z.object({
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format'),
  routerId: z.string().optional(),
  ipAddress: z.string().optional()
});

// Get available packages for captive portal
router.get('/packages', async (req, res) => {
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
      orderBy: {
        price: 'asc'
      }
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
    logger.error('Get portal packages error:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Check device status with router verification
router.get('/status/:macAddress', async (req, res) => {
  try {
    const { macAddress } = req.params;
    const { routerId, ipAddress } = req.query;

    // Validate MAC address format
    if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress)) {
      return res.status(400).json({ error: 'Invalid MAC address format' });
    }

    const sessionManager = new SessionManager();
    const sessionResult = await sessionManager.getActiveSession(macAddress);

    if (sessionResult.isValid && sessionResult.session) {
      const session = sessionResult.session;
      const timeRemaining = Math.max(0, session.expiresAt.getTime() - Date.now());
      
      // If router ID is provided, verify it matches the session
      if (routerId && session.routerId !== routerId) {
        return res.json({
          hasActiveSession: false,
          message: 'Session exists on different router',
          redirectToRouter: session.router.name
        });
      }

      res.json({
        hasActiveSession: true,
        session: {
          id: session.id,
          packageName: session.package.name,
          startTime: session.startTime,
          expiresAt: session.expiresAt,
          timeRemaining,
          timeRemainingFormatted: formatDuration(timeRemaining),
          routerName: session.router.name,
          routerLocation: session.router.location,
          bytesUp: session.bytesUp.toString(),
          bytesDown: session.bytesDown.toString(),
          status: session.status
        }
      });
    } else {
      // Check if device is connected to any router
      if (routerId) {
        const router = await prisma.router.findUnique({
          where: { id: routerId as string }
        });

        if (router && router.status === 'ONLINE') {
          const mikrotik = new MikroTikService(router.ipAddress, router.id);
          const isConnected = await mikrotik.verifyDeviceOnRouter(macAddress, ipAddress as string);
          
          res.json({
            hasActiveSession: false,
            message: sessionResult.reason || 'No active session found',
            deviceConnected: isConnected,
            routerInfo: {
              id: router.id,
              name: router.name,
              location: router.location
            }
          });
        } else {
          res.json({
            hasActiveSession: false,
            message: 'Router offline or not found',
            deviceConnected: false
          });
        }
      } else {
        res.json({
          hasActiveSession: false,
          message: sessionResult.reason || 'No active session found'
        });
      }
    }
  } catch (error) {
    logger.error('Check device status error:', error);
    res.status(500).json({ error: 'Failed to check device status' });
  }
});

// Purchase package with enhanced security
router.post('/purchase', async (req, res) => {
  try {
    const data = purchaseSchema.parse(req.body);

    logger.info(`Purchase request: Device ${data.deviceMac} on router ${data.routerId}`);

    // 1. Verify router exists and is online
    const router = await prisma.router.findUnique({
      where: { id: data.routerId }
    });

    if (!router) {
      return res.status(404).json({ error: 'Router not found' });
    }

    if (router.status !== 'ONLINE') {
      return res.status(503).json({ error: 'Router is currently offline' });
    }

    // 2. CRITICAL: Verify device is actually connected to this specific router
    const mikrotik = new MikroTikService(router.ipAddress, router.id);
    const isDeviceConnected = await mikrotik.verifyDeviceOnRouter(data.deviceMac, data.ipAddress);
    
    if (!isDeviceConnected) {
      logger.error(`SECURITY: Device ${data.deviceMac} attempted purchase but not connected to router ${router.ipAddress}`);
      return res.status(403).json({ 
        error: 'Device not connected to router',
        message: 'You must be connected to the Wi-Fi network to purchase internet access'
      });
    }

    // 3. Check for existing active session
    const sessionManager = new SessionManager();
    const existingSession = await sessionManager.getActiveSession(data.deviceMac);
    
    if (existingSession.isValid) {
      return res.status(400).json({ 
        error: 'Device already has an active session',
        session: existingSession.session
      });
    }

    // 4. Get and validate package
    const package_ = await prisma.package.findUnique({
      where: { id: data.packageId }
    });

    if (!package_ || !package_.isActive) {
      return res.status(404).json({ error: 'Package not found or inactive' });
    }

    // 5. Create payment record first (before session)
    const payment = await prisma.payment.create({
      data: {
        sessionId: '', // Will be updated after session creation
        packageId: package_.id,
        amount: package_.price,
        paymentMethod: data.paymentMethod,
        phoneNumber: data.phoneNumber,
        status: 'PENDING'
      }
    });

    // 6. Initialize payment
    const paymentService = new PaymentService();
    const paymentResult = await paymentService.initiatePayment({
      amount: package_.price,
      phoneNumber: data.phoneNumber,
      method: data.paymentMethod,
      reference: payment.id,
      description: `NetFlow - ${package_.name}`
    });

    if (!paymentResult.success) {
      // Payment failed, clean up
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      return res.status(400).json({
        error: 'Payment failed',
        message: paymentResult.message
      });
    }

    // 7. Create session using SessionManager
    const sessionResult = await sessionManager.createSession({
      deviceMac: data.deviceMac,
      deviceName: data.deviceName,
      ipAddress: data.ipAddress,
      routerId: data.routerId,
      packageId: data.packageId
    });

    if (!sessionResult.success) {
      // Session creation failed, refund payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      return res.status(400).json({
        error: sessionResult.error || 'Failed to create session'
      });
    }

    // 8. Update payment with session ID and mark as completed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        sessionId: sessionResult.session!.id,
        paymentReference: paymentResult.reference,
        status: 'COMPLETED',
        paidAt: new Date()
      }
    });

    // 9. Add user to MikroTik router
    const addUserSuccess = await mikrotik.addUser(data.deviceMac, package_.duration);
    
    if (!addUserSuccess) {
      // Failed to add user to router, terminate session
      await sessionManager.terminateSession(sessionResult.session!.id, 'Failed to add user to router');
      
      return res.status(500).json({
        error: 'Failed to activate internet access',
        message: 'Please try again or contact support'
      });
    }

    logger.info(`Package purchased successfully: ${package_.name} for device ${data.deviceMac} on router ${router.name}`);

    res.json({
      success: true,
      session: {
        id: sessionResult.session!.id,
        packageName: package_.name,
        expiresAt: sessionResult.session!.expiresAt,
        timeRemaining: package_.duration * 60 * 1000,
        routerName: router.name,
        routerLocation: router.location
      },
      payment: {
        id: payment.id,
        amount: package_.price,
        reference: paymentResult.reference,
        status: 'COMPLETED'
      }
    });

  } catch (error) {
    logger.error('Purchase package error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Failed to purchase package' });
  }
});

// Extend session with enhanced security
router.post('/extend/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { packageId, phoneNumber, paymentMethod } = req.body;

    // Validate input
    if (!packageId || !phoneNumber || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionManager = new SessionManager();
    
    // Get session and verify it's valid
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { package: true, router: true }
    });

    if (!session || session.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Session not found or inactive' });
    }

    // Verify device is still connected to router
    const mikrotik = new MikroTikService(session.router.ipAddress, session.router.id);
    const isConnected = await mikrotik.verifyDeviceOnRouter(session.deviceMac, session.ipAddress || undefined);
    
    if (!isConnected) {
      await sessionManager.terminateSession(sessionId, 'Device disconnected from router');
      return res.status(403).json({ 
        error: 'Device not connected to router',
        message: 'You must be connected to the Wi-Fi network to extend your session'
      });
    }

    const newPackage = await prisma.package.findUnique({
      where: { id: packageId }
    });

    if (!newPackage || !newPackage.isActive) {
      return res.status(404).json({ error: 'Package not found or inactive' });
    }

    // Create payment for extension
    const payment = await prisma.payment.create({
      data: {
        sessionId: session.id,
        packageId: newPackage.id,
        amount: newPackage.price,
        paymentMethod,
        phoneNumber,
        status: 'PENDING'
      }
    });

    // Initialize payment
    const paymentService = new PaymentService();
    const paymentResult = await paymentService.initiatePayment({
      amount: newPackage.price,
      phoneNumber,
      method: paymentMethod,
      reference: payment.id,
      description: `NetFlow Extension - ${newPackage.name}`
    });

    if (!paymentResult.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      return res.status(400).json({
        error: 'Payment failed',
        message: paymentResult.message
      });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentReference: paymentResult.reference,
        status: 'COMPLETED',
        paidAt: new Date()
      }
    });

    // Extend session using SessionManager
    const extendSuccess = await sessionManager.extendSession(sessionId, newPackage.duration);
    
    if (!extendSuccess) {
      return res.status(500).json({ error: 'Failed to extend session' });
    }

    // Get updated session
    const updatedSession = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    logger.info(`Session extended: ${sessionId} by ${newPackage.duration} minutes`);

    res.json({
      success: true,
      newExpiresAt: updatedSession!.expiresAt,
      timeAdded: newPackage.duration * 60 * 1000,
      payment: {
        id: payment.id,
        amount: newPackage.price,
        reference: paymentResult.reference
      }
    });
  } catch (error) {
    logger.error('Extend session error:', error);
    res.status(500).json({ error: 'Failed to extend session' });
  }
});

// Get router information for captive portal
router.get('/router/:routerId', async (req, res) => {
  try {
    const { routerId } = req.params;

    const router = await prisma.router.findUnique({
      where: { id: routerId },
      select: {
        id: true,
        name: true,
        location: true,
        status: true,
        activeUsers: true
      }
    });

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
    logger.error('Get router info error:', error);
    res.status(500).json({ error: 'Failed to get router information' });
  }
});

// Voucher redemption endpoint
router.post('/redeem-voucher', async (req, res) => {
  try {
    const { voucherCode, deviceMac, routerId, ipAddress } = req.body;

    if (!voucherCode || !deviceMac || !routerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate MAC address
    if (!/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(deviceMac)) {
      return res.status(400).json({ error: 'Invalid MAC address format' });
    }

    // Verify router and device connection
    const router = await prisma.router.findUnique({
      where: { id: routerId }
    });

    if (!router || router.status !== 'ONLINE') {
      return res.status(503).json({ error: 'Router is offline or not found' });
    }

    const mikrotik = new MikroTikService(router.ipAddress, router.id);
    const isConnected = await mikrotik.verifyDeviceOnRouter(deviceMac, ipAddress);
    
    if (!isConnected) {
      return res.status(403).json({ 
        error: 'Device not connected to router',
        message: 'You must be connected to the Wi-Fi network to redeem a voucher'
      });
    }

    // For demo purposes, simulate voucher validation
    // In production, you would have a vouchers table
    const isValidVoucher = /^[A-Z0-9]{8,12}$/.test(voucherCode.toUpperCase());
    
    if (!isValidVoucher) {
      return res.status(400).json({ error: 'Invalid voucher code format' });
    }

    // Simulate voucher lookup - in production, query vouchers table
    const mockVoucher = {
      code: voucherCode.toUpperCase(),
      packageId: 'default-package-id', // Would come from voucher record
      isUsed: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    if (mockVoucher.isUsed) {
      return res.status(400).json({ error: 'Voucher has already been used' });
    }

    if (mockVoucher.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Voucher has expired' });
    }

    // Get default package for voucher (in production, from voucher record)
    const package_ = await prisma.package.findFirst({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });

    if (!package_) {
      return res.status(500).json({ error: 'No packages available' });
    }

    // Create session using SessionManager
    const sessionManager = new SessionManager();
    const sessionResult = await sessionManager.createSession({
      deviceMac,
      ipAddress,
      routerId,
      packageId: package_.id
    });

    if (!sessionResult.success) {
      return res.status(400).json({
        error: sessionResult.error || 'Failed to create session'
      });
    }

    // Add user to MikroTik router
    const addUserSuccess = await mikrotik.addUser(deviceMac, package_.duration);
    
    if (!addUserSuccess) {
      await sessionManager.terminateSession(sessionResult.session!.id, 'Failed to add user to router');
      return res.status(500).json({
        error: 'Failed to activate internet access'
      });
    }

    // In production, mark voucher as used
    logger.info(`Voucher redeemed: ${voucherCode} for device ${deviceMac}`);

    res.json({
      success: true,
      message: 'Voucher redeemed successfully',
      session: {
        id: sessionResult.session!.id,
        packageName: package_.name,
        expiresAt: sessionResult.session!.expiresAt,
        timeRemaining: package_.duration * 60 * 1000,
        routerName: router.name
      }
    });

  } catch (error) {
    logger.error('Voucher redemption error:', error);
    res.status(500).json({ error: 'Failed to redeem voucher' });
  }
});

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

export { router as captivePortalRoutes };