import { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';
import { logger } from '../utils/logger';

/**
 * Webhook Controller - Handles Stripe webhook events
 */
export class WebhookController {
  /**
   * POST /api/webhooks/stripe
   * Handle Stripe webhook events
   * 
   * IMPORTANT: This route must use raw body, not JSON parsed body
   */
  static async handleStripe(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        logger.error('No Stripe signature found in headers');
        return res.status(400).send('No signature provided');
      }

      // Get raw body (this is why we need express.raw() for this route)
      const payload = req.body;

      // Verify webhook signature and get event
      const event = WebhookService.verifyWebhookSignature(
        payload,
        signature as string
      );

      logger.info('Webhook signature verified', { eventType: event.type });

      // Handle the event
      await WebhookService.handleStripeWebhook(event);

      // Return 200 to acknowledge receipt
      return res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('Webhook error', { error: error.message });
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
}