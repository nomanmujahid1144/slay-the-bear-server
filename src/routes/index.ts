import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import stripeRoutes from './stripe.routes';
// import webhookRoutes from './webhook.routes';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🐻 Slay The Bear API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stripe', stripeRoutes);
// router.use('/webhooks', webhookRoutes);

export default router;