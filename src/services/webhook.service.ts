import Stripe from 'stripe';
import { stripe } from './stripe.service';
import { UserService } from './user.service';
import { db } from '../db';
import { users, subscriptions, subscriptionEntries } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { Plan } from '../constants/enums';
import config from '../config';

export class WebhookService {

  // ── Helper: map priceId → correct Plan ──────────────────────────────────
  private static getPlanFromPriceId(priceId: string): Plan {
    const basicPriceIds = [
      config.STRIPE_BASIC_MONTHLY_PRICE_ID,
      config.STRIPE_BASIC_YEARLY_PRICE_ID,
    ];
    const premiumPriceIds = [
      config.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      config.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    ];

    if (basicPriceIds.includes(priceId)) return Plan.BASIC;
    if (premiumPriceIds.includes(priceId)) return Plan.PREMIUM;

    throw new Error(`Unknown price ID: ${priceId}`);
  }

  // ── Helper: map priceId → period ────────────────────────────────────────
  private static getPeriodFromPriceId(priceId: string): 'monthly' | 'yearly' {
    const yearlyPriceIds = [
      config.STRIPE_BASIC_YEARLY_PRICE_ID,
      config.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    ];
    return yearlyPriceIds.includes(priceId) ? 'yearly' : 'monthly';
  }

  /**
   * Verify Stripe Webhook Signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error: any) {
      logger.error('Webhook signature verification failed', { error: error.message });
      throw ApiError.badRequest(`Webhook Error: ${error.message}`);
    }
  }

  /**
   * Handle Stripe Webhook Events
   */
  static async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    logger.info(`Processing webhook: ${event.type}`, { eventId: event.id });

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error: any) {
      logger.error('Webhook handler error', {
        eventType: event.type,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle: checkout.session.completed
   * Triggered when user completes checkout
   */
  private static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    logger.info('Processing checkout.session.completed', { sessionId: session.id });

    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'invoice'],
    });

    const customerEmail = expandedSession.customer_details?.email;
    if (!customerEmail) throw new Error('Customer email not found in session');

    const user = await UserService.getUserByEmail(customerEmail);
    if (!user) throw new Error(`User not found for email: ${customerEmail}`);

    if (!user.customerId && expandedSession.customer) {
      await UserService.updateCustomerId(user.id, expandedSession.customer as string);
    }

    const lineItems = expandedSession.line_items?.data || [];

    for (const item of lineItems) {
      const priceId = item.price?.id;
      const isSubscription = item.price?.type === 'recurring';

      if (isSubscription && priceId) {
        const plan = this.getPlanFromPriceId(priceId);
        const period = this.getPeriodFromPriceId(priceId);

        // Calculate fallback dates (used only if subscription object has no periods yet)
        const now = new Date();
        const fallbackEnd = new Date(now);
        if (period === 'yearly') {
          fallbackEnd.setFullYear(fallbackEnd.getFullYear() + 1);
        } else {
          fallbackEnd.setMonth(fallbackEnd.getMonth() + 1);
        }

        // Try to get real dates from the Stripe subscription
        let startDate = now;
        let endDate = fallbackEnd;

        if (expandedSession.subscription) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(
              expandedSession.subscription as string
            );
            const ps = (stripeSub as any).current_period_start;
            const pe = (stripeSub as any).current_period_end;
            if (ps && pe && !isNaN(ps) && !isNaN(pe)) {
              startDate = new Date(ps * 1000);
              endDate = new Date(pe * 1000);
            }
          } catch (e) {
            logger.warn('Could not retrieve subscription for dates, using fallback', { e });
          }
        }

        const invoice = expandedSession.invoice as Stripe.Invoice;
        const invoiceNumber = (invoice as any)?.number || 'N/A';

        // Upsert subscription record
        const existing = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, user.id))
          .limit(1);

        let subscriptionId: string;

        if (existing.length > 0) {
          await db
            .update(subscriptions)
            .set({ plan, period, startDate, endDate, updatedAt: new Date() })
            .where(eq(subscriptions.userId, user.id));
          subscriptionId = existing[0].id;
        } else {
          const [newSub] = await db
            .insert(subscriptions)
            .values({ userId: user.id, plan, period, startDate, endDate })
            .returning();
          subscriptionId = newSub.id;
        }

        // Insert the initial invoice entry
        await db.insert(subscriptionEntries).values({
          subscriptionId,
          invoiceId: invoiceNumber,
          amount: ((item.price?.unit_amount || 0) / 100).toString(),
          status: 'Subscribed',
          startDate,
          endDate,
          viewURL: (invoice as any)?.hosted_invoice_url || null,
          downloadURL: (invoice as any)?.invoice_pdf || null,
        });

        await UserService.updateUserPlan(user.id, plan);

        logger.info('Subscription created successfully', { userId: user.id, plan, period, startDate, endDate });
      }
    }
  }


  /**
   * Handle: customer.subscription.created
   */
  private static async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    logger.info('Processing subscription.created', { subscriptionId: subscription.id });

    const customerId = subscription.customer as string;
    const periodStart = (subscription as any).current_period_start;
    const periodEnd = (subscription as any).current_period_end;

    if (!periodStart || !periodEnd) {
      logger.warn('subscription.created: no period dates available, skipping date update');
      return;
    }

    const startDate = new Date(periodStart * 1000);
    const endDate = new Date(periodEnd * 1000);

    // Find user by customer ID
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.customerId, customerId))
      .limit(1);

    if (userRows.length === 0) {
      logger.warn(`subscription.created: no user found for customer ${customerId}`);
      return;
    }

    const userId = userRows[0].id;

    // Update both the subscription record AND the latest entry with real dates
    const userSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (userSub.length === 0) {
      logger.warn(`subscription.created: no subscription record for user ${userId}`);
      return;
    }

    const subscriptionId = userSub[0].id;

    await db
      .update(subscriptions)
      .set({ startDate, endDate, updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId));

    // Also update the most recently inserted entry (the Subscribed one)
    await db
      .update(subscriptionEntries)
      .set({ startDate, endDate, updatedAt: new Date() })
      .where(eq(subscriptionEntries.subscriptionId, subscriptionId));

    logger.info('Subscription dates corrected from subscription.created', { userId, startDate, endDate });
  }

  /**
   * Handle: customer.subscription.updated
   * Triggered when subscription is modified (e.g., plan change, renewal)
   */
  // private static async handleSubscriptionUpdated(
  //   subscription: Stripe.Subscription
  // ): Promise<void> {
  //   logger.info('Processing subscription.updated', {
  //     subscriptionId: subscription.id,
  //     status: subscription.status,
  //   });

  //   const customerId = subscription.customer as string;

  //   // Find user by customer ID
  //   const user = await db
  //     .select()
  //     .from(users)
  //     .where(eq(users.customerId, customerId))
  //     .limit(1);

  //   if (user.length === 0) {
  //     throw new Error(`User not found for customer: ${customerId}`);
  //   }

  //   const userId = user[0].id;

  //   // Handle renewal or reactivation
  //   if (subscription.status === 'active') {
  //     const priceId = subscription.items.data[0].price.id;

  //     // Determine plan and period from priceId — not hardcoded
  //     const plan = this.getPlanFromPriceId(priceId);
  //     const period = this.getPeriodFromPriceId(priceId);
  //     const endDate = new Date((subscription as any).current_period_end * 1000);

  //     // Update subscription
  //     await db
  //       .update(subscriptions)
  //       .set({
  //         plan: plan,
  //         period: period,
  //         endDate: endDate,
  //         updatedAt: new Date(),
  //       })
  //       .where(eq(subscriptions.userId, userId));

  //     // Update user plan
  //     await UserService.updateUserPlan(userId, plan);

  //     logger.info('Subscription updated to active', { userId, plan, period });
  //   }
  // }
  private static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    logger.info('Processing subscription.updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    const customerId = subscription.customer as string;

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.customerId, customerId))
      .limit(1);

    if (userRows.length === 0) {
      throw new Error(`User not found for customer: ${customerId}`);
    }

    const userId = userRows[0].id;

    if (subscription.status === 'active') {
      const isPendingDowngrade = subscription.metadata?.pending_downgrade === 'true';

      if (isPendingDowngrade) {
        logger.info('Pending downgrade detected — DB unchanged until next renewal', { userId });
        return;
      }

      // Immediate change (upgrade or reactivation) — update DB now
      const priceId = subscription.items.data[0].price.id;
      const plan = this.getPlanFromPriceId(priceId);
      const period = this.getPeriodFromPriceId(priceId);
      const endDate = new Date((subscription as any).current_period_end * 1000);

      await db
        .update(subscriptions)
        .set({ plan, period, endDate, updatedAt: new Date() })
        .where(eq(subscriptions.userId, userId));

      await UserService.updateUserPlan(userId, plan);

      logger.info('Subscription updated to active', { userId, plan, period, endDate });
    }
  }

  /**
   * Handle: customer.subscription.deleted
   * Triggered when subscription is canceled/expired
   */
  private static async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    logger.info('Processing subscription.deleted', {
      subscriptionId: subscription.id,
    });

    const customerId = subscription.customer as string;

    // Find user by customer ID
    const user = await db
      .select()
      .from(users)
      .where(eq(users.customerId, customerId))
      .limit(1);

    if (user.length === 0) {
      throw new Error(`User not found for customer: ${customerId}`);
    }

    const userId = user[0].id;

    // Get user's subscription record
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (userSubscription.length > 0) {
      const subscriptionId = userSubscription[0].id;

      // Get latest invoice
      const latestInvoice = await stripe.invoices.retrieve(
        subscription.latest_invoice as string
      );

      // Update subscription entry status to Canceled
      await db
        .update(subscriptionEntries)
        .set({
          status: 'Canceled',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(subscriptionEntries.subscriptionId, subscriptionId),
            eq(subscriptionEntries.invoiceId, latestInvoice.number || 'N/A')
          )
        );

      // Update subscription plan to free
      await db
        .update(subscriptions)
        .set({
          plan: Plan.FREE,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, userId));
    }

    // Update user plan to free
    await UserService.updateUserPlan(userId, Plan.FREE);

    logger.info('Subscription canceled, user downgraded to free', { userId });
  }

  /**
     * Handle: invoice.payment_succeeded
     *
     * billing_reason cases:
     * - subscription_create  → skip (handled by checkout.session.completed)
     * - subscription_update  → proration from immediate upgrade (always_invoice)
     * - subscription_cycle   → normal renewal (also applies pending downgrade if any)
     */
  private static async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<void> {
    logger.info('Processing invoice.payment_succeeded', { invoiceId: invoice.id });

    const billingReason = (invoice as any).billing_reason;

    // ── Skip initial charge — handled by checkout.session.completed ──────
    if (billingReason === 'subscription_create') {
      logger.info('Skipping invoice.payment_succeeded for initial subscription payment');
      return;
    }

    if (!(invoice as any).subscription) return;

    const subscription = await stripe.subscriptions.retrieve(
      (invoice as any).subscription as string
    );

    const customerId = subscription.customer as string;

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.customerId, customerId))
      .limit(1);

    if (userRows.length === 0) throw new Error(`User not found for customer: ${customerId}`);

    const userId = userRows[0].id;

    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (userSubscription.length === 0) return;

    const subscriptionId = userSubscription[0].id;

    // ── Proration invoice from immediate upgrade (always_invoice) ────────
    if (billingReason === 'subscription_update') {
      logger.info('Processing proration invoice from plan upgrade', { invoiceId: invoice.id, userId });

      // Get dates from invoice line items — more reliable than subscription for proration
      const invoiceLines = (invoice as any).lines?.data;
      let prorationStart = (invoice as any).period_start;
      let prorationEnd = (invoice as any).period_end;

      if (invoiceLines && invoiceLines.length > 0) {
        // Find the positive proration line (the new plan charge)
        const chargeLine = invoiceLines.find((l: any) => l.amount > 0 && l.period);
        if (chargeLine?.period?.start && chargeLine?.period?.end) {
          prorationStart = chargeLine.period.start;
          prorationEnd = chargeLine.period.end;
        }
      }

      if (!prorationStart || !prorationEnd) {
        logger.warn('Proration invoice missing period dates, skipping', { invoiceId: invoice.id });
        return;
      }

      const startDate = new Date(prorationStart * 1000);
      const endDate = new Date(prorationEnd * 1000);

      await db.insert(subscriptionEntries).values({
        subscriptionId,
        invoiceId: (invoice as any).number || 'N/A',
        amount: (((invoice as any).amount_paid || 0) / 100).toString(),
        status: 'Renewal',
        startDate,
        endDate,
        viewURL: (invoice as any).hosted_invoice_url || null,
        downloadURL: (invoice as any).invoice_pdf || null,
      });

      logger.info('Proration invoice entry added', { userId, amount: (invoice as any).amount_paid });
      return;
    }

    // ── Renewal (subscription_cycle) ─────────────────────────────────────
    const periodStart = (subscription as any).current_period_start;
    const periodEnd = (subscription as any).current_period_end;

    if (!periodStart || !periodEnd) {
      logger.warn('Renewal invoice missing period dates, skipping', { invoiceId: invoice.id });
      return;
    }

    const startDate = new Date(periodStart * 1000);
    const endDate = new Date(periodEnd * 1000);

    // Check for pending downgrade — apply it now at renewal
    const isPendingDowngrade = subscription.metadata?.pending_downgrade === 'true';
    const pendingPriceId = subscription.metadata?.pending_price_id;
    const pendingPlan = subscription.metadata?.pending_plan;
    const pendingPeriod = subscription.metadata?.pending_period;

    if (isPendingDowngrade && pendingPriceId && pendingPlan && pendingPeriod) {
      logger.info('Applying pending downgrade at renewal', { userId, pendingPlan, pendingPeriod });

      // Swap to the new lower price on Stripe + clear metadata
      await stripe.subscriptions.update(subscription.id, {
        items: [{ id: subscription.items.data[0].id, price: pendingPriceId }],
        proration_behavior: 'none',
        metadata: {
          pending_downgrade: '',
          pending_plan: '',
          pending_period: '',
          pending_price_id: '',
        },
      });

      await db.insert(subscriptionEntries).values({
        subscriptionId,
        invoiceId: (invoice as any).number || 'N/A',
        amount: (((invoice as any).amount_paid || 0) / 100).toString(),
        status: 'Renewal',
        startDate,
        endDate,
        viewURL: (invoice as any).hosted_invoice_url || null,
        downloadURL: (invoice as any).invoice_pdf || null,
      });

      await db
        .update(subscriptions)
        .set({ plan: pendingPlan as any, period: pendingPeriod as any, endDate, updatedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId));

      await UserService.updateUserPlan(userId, pendingPlan as any);

      logger.info('Downgrade applied successfully at renewal', { userId, plan: pendingPlan, period: pendingPeriod });
      return;
    }

    // ── Normal renewal — update dates + insert billing entry ─────────────
    const priceId = subscription.items.data[0].price.id;
    const plan = this.getPlanFromPriceId(priceId);
    const period = this.getPeriodFromPriceId(priceId);

    await db.insert(subscriptionEntries).values({
      subscriptionId,
      invoiceId: (invoice as any).number || 'N/A',
      amount: (((invoice as any).amount_paid || 0) / 100).toString(),
      status: 'Renewal',
      startDate,
      endDate,
      viewURL: (invoice as any).hosted_invoice_url || null,
      downloadURL: (invoice as any).invoice_pdf || null,
    });

    await db
      .update(subscriptions)
      .set({ plan, period, endDate, updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId));

    logger.info('Subscription renewed successfully', { userId, plan, period, endDate });
  }


  /**
   * Handle: invoice.payment_failed
   * Triggered when payment fails
   */
  private static async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice
  ): Promise<void> {
    logger.warn('Processing invoice.payment_failed', {
      invoiceId: invoice.id,
    });

    // Log the failure - you might want to send an email notification
    logger.warn('Payment failed for invoice', {
      invoiceId: invoice.id,
      customerEmail: invoice.customer_email,
    });

    // Note: Don't immediately downgrade - Stripe will retry
    // Only downgrade after all retries fail (subscription.deleted event)
  }
}