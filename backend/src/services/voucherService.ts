import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { zenoPayService } from './zenoPayService';

interface VoucherData {
  code: string;
  packageId: string;
  amount: number;
  currency: string;
  paymentReference: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  usedBy?: string;
}

export class VoucherService {
  /**
   * Create a new voucher
   */
  async createVoucher(packageId: string, paymentId: string): Promise<string> {
    try {
      const voucherCode = zenoPayService.generateVoucherCode();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days validity

      const package_ = await prisma.package.findUnique({
        where: { id: packageId }
      });

      if (!package_) {
        throw new Error('Package not found');
      }

      // Create voucher record (we'll add this to the payment table for now)
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentReference: voucherCode
        }
      });

      logger.info(`Voucher created: ${voucherCode} for package: ${package_.name}`);
      return voucherCode;

    } catch (error) {
      logger.error('Failed to create voucher:', error);
      throw error;
    }
  }

  /**
   * Validate and redeem a voucher
   */
  async redeemVoucher(voucherCode: string, deviceMac: string, routerId: string, ipAddress?: string): Promise<{
    success: boolean;
    message: string;
    session?: any;
  }> {
    try {
      // Find voucher (stored in payment table for now)
      const payment = await prisma.payment.findFirst({
        where: {
          paymentReference: voucherCode,
          status: 'COMPLETED'
        },
        include: {
          package: true,
          session: true
        }
      });

      if (!payment) {
        return {
          success: false,
          message: 'Invalid or expired voucher code'
        };
      }

      // Check if voucher is already used
      if (payment.session) {
        return {
          success: false,
          message: 'Voucher has already been used'
        };
      }

      // Check if voucher is expired (30 days from creation)
      const voucherAge = Date.now() - payment.createdAt.getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      
      if (voucherAge > thirtyDays) {
        return {
          success: false,
          message: 'Voucher has expired'
        };
      }

      // Get router
      const router = await prisma.router.findUnique({
        where: { id: routerId }
      });

      if (!router) {
        return {
          success: false,
          message: 'Router not found'
        };
      }

      // Create session
      const expiresAt = new Date(Date.now() + payment.package.duration * 60 * 1000);
      
      const session = await prisma.session.create({
        data: {
          deviceMac,
          deviceName: 'Voucher User',
          ipAddress,
          routerId,
          packageId: payment.packageId,
          expiresAt,
          status: 'ACTIVE'
        },
        include: {
          package: true,
          router: true
        }
      });

      // Update payment to link with session
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          sessionId: session.id
        }
      });

      logger.info(`Voucher redeemed: ${voucherCode} for session: ${session.id}`);

      return {
        success: true,
        message: 'Voucher redeemed successfully',
        session: {
          id: session.id,
          packageName: session.package.name,
          startTime: session.startTime,
          expiresAt: session.expiresAt,
          timeRemaining: session.expiresAt.getTime() - Date.now(),
          timeRemainingFormatted: this.formatDuration(session.expiresAt.getTime() - Date.now()),
          routerName: session.router.name,
          routerLocation: session.router.location,
          bytesUp: '0',
          bytesDown: '0',
          status: session.status
        }
      };

    } catch (error) {
      logger.error('Voucher redemption failed:', error);
      return {
        success: false,
        message: 'Failed to redeem voucher'
      };
    }
  }

  /**
   * Get voucher details
   */
  async getVoucherDetails(voucherCode: string): Promise<{
    valid: boolean;
    used: boolean;
    expired: boolean;
    package?: any;
    createdAt?: Date;
  }> {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          paymentReference: voucherCode,
          status: 'COMPLETED'
        },
        include: {
          package: true,
          session: true
        }
      });

      if (!payment) {
        return { valid: false, used: false, expired: false };
      }

      const voucherAge = Date.now() - payment.createdAt.getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const expired = voucherAge > thirtyDays;
      const used = !!payment.session;

      return {
        valid: true,
        used,
        expired,
        package: payment.package,
        createdAt: payment.createdAt
      };

    } catch (error) {
      logger.error('Failed to get voucher details:', error);
      return { valid: false, used: false, expired: false };
    }
  }

  /**
   * Format duration in human readable format
   */
  private formatDuration(milliseconds: number): string {
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
}

export const voucherService = new VoucherService();