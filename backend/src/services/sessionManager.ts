import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { MikroTikService } from './mikrotik';
import { io } from '../server';

export interface SessionCreationRequest {
  deviceMac: string;
  deviceName?: string;
  ipAddress?: string;
  routerId: string;
  packageId: string;
  userId?: string;
}

export interface SessionValidationResult {
  isValid: boolean;
  session?: any;
  reason?: string;
}

export class SessionManager {
  async createSession(request: SessionCreationRequest): Promise<{ success: boolean; session?: any; error?: string }> {
    try {
      logger.info(`Creating session for device ${request.deviceMac} on router ${request.routerId}`);

      // 1. Verify router exists and is online
      const router = await prisma.router.findUnique({
        where: { id: request.routerId }
      });

      if (!router) {
        return { success: false, error: 'Router not found' };
      }

      if (router.status !== 'ONLINE') {
        return { success: false, error: 'Router is offline' };
      }

      // 2. Verify device is actually connected to the router
      const mikrotik = new MikroTikService(router.ipAddress, router.id);
      const isDeviceConnected = await mikrotik.verifyDeviceOnRouter(request.deviceMac, request.ipAddress);
      
      if (!isDeviceConnected) {
        logger.error(`Device ${request.deviceMac} is not connected to router ${router.ipAddress}`);
        return { success: false, error: 'Device not connected to router' };
      }

      // 3. Check for existing active session
      const existingSession = await this.getActiveSession(request.deviceMac);
      if (existingSession.isValid) {
        return { success: false, error: 'Device already has an active session' };
      }

      // 4. Get package details
      const package_ = await prisma.package.findUnique({
        where: { id: request.packageId }
      });

      if (!package_ || !package_.isActive) {
        return { success: false, error: 'Package not found or inactive' };
      }

      // 5. Calculate expiry time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + package_.duration * 60 * 1000);

      // 6. Create session in database
      const session = await prisma.session.create({
        data: {
          deviceMac: request.deviceMac,
          deviceName: request.deviceName || 'Unknown Device',
          ipAddress: request.ipAddress,
          routerId: request.routerId,
          packageId: request.packageId,
          userId: request.userId,
          expiresAt,
          status: 'ACTIVE'
        },
        include: {
          router: true,
          package: true
        }
      });

      logger.info(`Session created: ${session.id} for device ${request.deviceMac}`);
      return { success: true, session };

    } catch (error) {
      logger.error('Session creation error:', error);
      return { success: false, error: 'Failed to create session' };
    }
  }

  async getActiveSession(deviceMac: string): Promise<SessionValidationResult> {
    try {
      const session = await prisma.session.findFirst({
        where: {
          deviceMac,
          status: 'ACTIVE',
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          router: true,
          package: true,
          payment: true
        }
      });

      if (!session) {
        return { isValid: false, reason: 'No active session found' };
      }

      // Verify router is still online
      if (session.router.status !== 'ONLINE') {
        await this.terminateSession(session.id, 'Router offline');
        return { isValid: false, reason: 'Router offline' };
      }

      // Verify device is still connected to router
      const mikrotik = new MikroTikService(session.router.ipAddress, session.router.id);
      const isConnected = await mikrotik.verifyDeviceOnRouter(deviceMac, session.ipAddress || undefined);
      
      if (!isConnected) {
        await this.terminateSession(session.id, 'Device disconnected from router');
        return { isValid: false, reason: 'Device not connected to router' };
      }

      return { isValid: true, session };
    } catch (error) {
      logger.error('Session validation error:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }

  async terminateSession(sessionId: string, reason?: string): Promise<boolean> {
    try {
      logger.info(`Terminating session ${sessionId}. Reason: ${reason || 'Manual termination'}`);

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { router: true }
      });

      if (!session) {
        logger.error(`Session ${sessionId} not found`);
        return false;
      }

      // Remove user from MikroTik router
      const mikrotik = new MikroTikService(session.router.ipAddress, session.router.id);
      await mikrotik.removeUser(session.deviceMac);
      await mikrotik.disconnectUser(session.deviceMac);

      // Update session status
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'TERMINATED',
          endTime: new Date()
        }
      });

      // Update router active users count
      await this.updateRouterActiveUsers(session.routerId);

      // Emit real-time update
      io.emit('session-terminated', {
        sessionId,
        deviceMac: session.deviceMac,
        reason
      });

      logger.info(`Session ${sessionId} terminated successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to terminate session ${sessionId}:`, error);
      return false;
    }
  }

  async suspendSession(sessionId: string, reason?: string): Promise<boolean> {
    try {
      logger.info(`Suspending session ${sessionId}. Reason: ${reason || 'Manual suspension'}`);

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { router: true }
      });

      if (!session) {
        return false;
      }

      // Block user on MikroTik router
      const mikrotik = new MikroTikService(session.router.ipAddress, session.router.id);
      await mikrotik.blockUser(session.deviceMac);

      // Update session status
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'SUSPENDED' }
      });

      // Emit real-time update
      io.emit('session-suspended', {
        sessionId,
        deviceMac: session.deviceMac,
        reason
      });

      return true;
    } catch (error) {
      logger.error(`Failed to suspend session ${sessionId}:`, error);
      return false;
    }
  }

  async resumeSession(sessionId: string): Promise<boolean> {
    try {
      logger.info(`Resuming session ${sessionId}`);

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { router: true }
      });

      if (!session || session.status !== 'SUSPENDED') {
        return false;
      }

      // Check if session is still valid (not expired)
      if (session.expiresAt <= new Date()) {
        await this.terminateSession(sessionId, 'Session expired');
        return false;
      }

      // Unblock user on MikroTik router
      const mikrotik = new MikroTikService(session.router.ipAddress, session.router.id);
      await mikrotik.unblockUser(session.deviceMac);

      // Update session status
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'ACTIVE' }
      });

      // Emit real-time update
      io.emit('session-resumed', {
        sessionId,
        deviceMac: session.deviceMac
      });

      return true;
    } catch (error) {
      logger.error(`Failed to resume session ${sessionId}:`, error);
      return false;
    }
  }

  async extendSession(sessionId: string, additionalMinutes: number): Promise<boolean> {
    try {
      logger.info(`Extending session ${sessionId} by ${additionalMinutes} minutes`);

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { router: true }
      });

      if (!session || session.status !== 'ACTIVE') {
        return false;
      }

      // Calculate new expiry time
      const newExpiresAt = new Date(session.expiresAt.getTime() + additionalMinutes * 60 * 1000);

      // Update MikroTik time limit
      const mikrotik = new MikroTikService(session.router.ipAddress, session.router.id);
      const remainingMinutes = Math.ceil((newExpiresAt.getTime() - Date.now()) / 60000);
      await mikrotik.setUserTimeLimit(session.deviceMac, remainingMinutes);

      // Update session in database
      await prisma.session.update({
        where: { id: sessionId },
        data: { expiresAt: newExpiresAt }
      });

      // Emit real-time update
      io.emit('session-extended', {
        sessionId,
        deviceMac: session.deviceMac,
        newExpiresAt,
        additionalMinutes
      });

      return true;
    } catch (error) {
      logger.error(`Failed to extend session ${sessionId}:`, error);
      return false;
    }
  }

  async updateSessionStats(sessionId: string): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { router: true }
      });

      if (!session) {
        return false;
      }

      // Get current stats from MikroTik
      const mikrotik = new MikroTikService(session.router.ipAddress, session.router.id);
      const stats = await mikrotik.getUserStats(session.deviceMac);

      if (stats) {
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            bytesUp: BigInt(stats.bytesUp),
            bytesDown: BigInt(stats.bytesDown)
          }
        });
      }

      return true;
    } catch (error) {
      logger.error(`Failed to update session stats ${sessionId}:`, error);
      return false;
    }
  }

  private async updateRouterActiveUsers(routerId: string): Promise<void> {
    try {
      const activeCount = await prisma.session.count({
        where: {
          routerId,
          status: 'ACTIVE',
          expiresAt: {
            gt: new Date()
          }
        }
      });

      await prisma.router.update({
        where: { id: routerId },
        data: { activeUsers: activeCount }
      });
    } catch (error) {
      logger.error(`Failed to update router active users count:`, error);
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      logger.info('Cleaning up expired sessions');

      const expiredSessions = await prisma.session.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lte: new Date()
          }
        },
        include: { router: true }
      });

      let cleanedCount = 0;

      for (const session of expiredSessions) {
        const success = await this.terminateSession(session.id, 'Session expired');
        if (success) {
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }
}