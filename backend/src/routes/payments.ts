import { Router } from 'express';
import { prisma } from '../utils/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        session: { select: { deviceMac: true } },
        package: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ payments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export { router as paymentRoutes };