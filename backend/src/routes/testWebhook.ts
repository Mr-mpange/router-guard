import { Router } from 'express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

const router = Router();

// Test webhook endpoint for development
router.post('/simulate-payment/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status = 'COMPLETED' } = req.body;

    logger.info(`Simulating payment webhook: ${transactionId} - ${status}`);

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

    // If payment is completed, activate the session
    if (status === 'COMPLETED' && payment.session) {
      const expiresAt = new Date(Date.now() + payment.session.package.duration * 60 * 1000);
      
      await prisma.session.update({
        where: { id: payment.session.id },
        data: {
          status: 'ACTIVE',
          expiresAt
        }
      });

      logger.info(`Session activated: ${payment.session.id}`);
    }

    res.json({ 
      success: true, 
      message: 'Payment webhook simulated successfully',
      status: newStatus,
      payment: {
        id: payment.id,
        status: newStatus,
        amount: payment.amount
      }
    });

  } catch (error) {
    logger.error('Test webhook error:', error);
    res.status(500).json({ error: 'Test webhook failed' });
  }
});

export { router as testWebhookRoutes };