// import { Router } from 'express';
// import express from 'express';
// import { WebhookController } from '../controllers/webhook.controller';

// const router = Router();

// /**
//  * @route   POST /api/webhooks/stripe
//  * @desc    Handle Stripe webhook events
//  * @access  Public (Stripe sends webhooks)
//  * 
//  * CRITICAL: This route uses raw body (not JSON)
//  * Stripe signature verification requires the raw request body
//  */
// router.post(
//   '/stripe',
//   express.raw({ type: 'application/json' }), // Parse as raw buffer
//   WebhookController.handleStripe
// );

// export default router;