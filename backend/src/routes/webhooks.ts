import { Router } from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { zenoPayService } from '../services/zenoPayService';

const router = Router();

// ZenoPay webhook endpoint
router.post('/zenopay', async (req, res) => {
  try {
    logger.info('ZenoPay webhook received:', {
      headers: req.headers,
      body: req.body
    });

    // Get signature from various possible header names
    const signature = req.headers['x-zenopay-signature'] || 
                     req.headers['x-signature'] || 
                     req.headers['signature'] as string;
    
    const payload = JSON.stringify(req.body);

    // Verify webhook signature (skip in development if no signature)
    if (signature && !zenoPayService.verifyWebhookSignature(payload, signature)) {
      logger.error('Invalid webhook signature', { signature, payload });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body;
    
    // Process webhook
    if (!zenoPayService.processWebhook(webhookData)) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Find the payment record by transaction ID or reference
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { paymentReference: webhookData.transactionId || webhookData.transaction_id },
          { paymentReference: webhookData.reference || webhookData.external_reference },
          { paymentReference: webhookData.id }
        ]
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
      logger.error(`Payment not found for webhook:`, webhookData);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Map webhook status to our internal status
    const webhookStatus = webhookData.status || webhookData.payment_status;
    let newStatus = 'PENDING';
    
    if (webhookStatus) {
      const statusLower = webhookStatus.toLowerCase();
      if (statusLower.includes('success') || statusLower.includes('complete') || statusLower === 'paid') {
        newStatus = 'COMPLETED';
      } else if (statusLower.includes('fail') || statusLower.includes('error') || statusLower.includes('cancel')) {
        newStatus = 'FAILED';
      }
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: newStatus === 'COMPLETED' ? new Date() : null
      }
    });

    // If payment is completed, activate the session
    if (newStatus === 'COMPLETED' && payment.session) {
      const expiresAt = new Date(Date.now() + payment.session.package.duration * 60 * 1000);
      
      await prisma.session.update({
        where: { id: payment.session.id },
        data: {
          status: 'ACTIVE',
          expiresAt
        }
      });

      logger.info(`Session activated: ${payment.session.id} for payment: ${payment.id}`);
    } else if (newStatus === 'FAILED' && payment.session) {
      // Mark session as failed
      await prisma.session.update({
        where: { id: payment.session.id },
        data: {
          status: 'TERMINATED'
        }
      });

      logger.info(`Session terminated due to failed payment: ${payment.session.id}`);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Mock webhook for development/testing
router.post('/zenopay/mock/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status = 'COMPLETED' } = req.body;

    logger.info(`Mock webhook received: ${transactionId} - ${status}`);

    // Find the payment record
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

    // Update payment status
    const newStatus = status === 'COMPLETED' ? 'COMPLETED' : 
                     status === 'FAILED' ? 'FAILED' : 'PENDING';

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    // If payment is completed, activate the session or generate voucher
    if (status === 'COMPLETED') {
      if (payment.session) {
        const expiresAt = new Date(Date.now() + payment.session.package.duration * 60 * 1000);
        
        await prisma.session.update({
          where: { id: payment.session.id },
          data: {
            status: 'ACTIVE',
            expiresAt
          }
        });

        logger.info(`Session activated: ${payment.session.id}`);
      } else {
        // Generate voucher for offline purchase
        const voucherCode = zenoPayService.generateVoucherCode();
        
        // Store voucher in database (you might want to create a vouchers table)
        // For now, we'll update the payment with voucher info
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentReference: voucherCode // Store voucher code in reference field
          }
        });

        logger.info(`Voucher generated: ${voucherCode} for payment: ${payment.id}`);
      }
    }

    res.json({ 
      success: true, 
      message: 'Mock webhook processed successfully',
      status: newStatus
    });

  } catch (error) {
    logger.error('Mock webhook processing error:', error);
    res.status(500).json({ error: 'Mock webhook processing failed' });
  }
});

export { router as webhookRoutes };