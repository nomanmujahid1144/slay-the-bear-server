import { Plan } from '../constants/enums';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IAPPlatform = 'ios' | 'android';
export type IAPPeriod = 'monthly' | 'yearly';

export interface IAPProduct {
  platform: IAPPlatform;
  plan: Plan.BASIC | Plan.PREMIUM;
  period: IAPPeriod;
}

// ─── Product catalogue ───────────────────────────────────────────────────────
// Single source of truth for every product ID the mobile app sells.
// Lookups are exact (case-sensitive) — that is how Apple and Google send them.

/**
 * Products the app sells today. ONLY these are accepted by
 * /iap/verify and /iap/restore.
 */
export const IAP_PRODUCTS: Readonly<Record<string, IAPProduct>> = {
  // iOS (App Store)
  'basic.monthly':   { platform: 'ios', plan: Plan.BASIC,   period: 'monthly' },
  'basic.yearly':    { platform: 'ios', plan: Plan.BASIC,   period: 'yearly' },
  'premium.monthly': { platform: 'ios', plan: Plan.PREMIUM, period: 'monthly' },
  'premium.yearly':  { platform: 'ios', plan: Plan.PREMIUM, period: 'yearly' },

  // Android (Google Play) — package: com.slaythebear
  'slythebear.monthly.basic':    { platform: 'android', plan: Plan.BASIC,   period: 'monthly' },
  'slythebear.annually.basic':   { platform: 'android', plan: Plan.BASIC,   period: 'yearly' },
  'slythebear.monthly.premium':  { platform: 'android', plan: Plan.PREMIUM, period: 'monthly' },
  'slythebear.annually.premium': { platform: 'android', plan: Plan.PREMIUM, period: 'yearly' },
};

/**
 * Old iOS product IDs. The app no longer sells or sends these, so
 * verify/restore REJECT them. They are kept only so that rows already in
 * iap_transactions (and any renewal webhook Apple still sends for an old
 * subscriber) resolve to the right plan instead of being guessed.
 */
const LEGACY_IAP_PRODUCTS: Readonly<Record<string, IAPProduct>> = {
  'Slay.the.bear.monthly.basic':    { platform: 'ios', plan: Plan.BASIC,   period: 'monthly' },
  'com.slythebear.yearly.basic':    { platform: 'ios', plan: Plan.BASIC,   period: 'yearly' },
  'Slay.the.bear.monthly.Premium':  { platform: 'ios', plan: Plan.PREMIUM, period: 'monthly' },
  'com.slythebear.yearly.premimum': { platform: 'ios', plan: Plan.PREMIUM, period: 'yearly' },
};

const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

/** Current (sellable) product, or null if the ID is not one of the 8 live IDs. */
export function getIAPProduct(productId: string): IAPProduct | null {
  return hasOwn(IAP_PRODUCTS, productId) ? IAP_PRODUCTS[productId] : null;
}

/** True only if productId is a live product AND belongs to the given platform. */
export function isAcceptedProductForPlatform(productId: string, platform: IAPPlatform): boolean {
  return getIAPProduct(productId)?.platform === platform;
}

/**
 * Plan for any known product, live or legacy. Returns null for an unknown ID —
 * callers must NOT grant a plan in that case (the old code defaulted to Premium).
 */
export function resolvePlanForProduct(productId: string): Plan.BASIC | Plan.PREMIUM | null {
  if (hasOwn(IAP_PRODUCTS, productId)) return IAP_PRODUCTS[productId].plan;
  if (hasOwn(LEGACY_IAP_PRODUCTS, productId)) return LEGACY_IAP_PRODUCTS[productId].plan;
  return null;
}

/** Billing period for any known product, live or legacy. */
export function resolvePeriodForProduct(productId: string): IAPPeriod | null {
  if (hasOwn(IAP_PRODUCTS, productId)) return IAP_PRODUCTS[productId].period;
  if (hasOwn(LEGACY_IAP_PRODUCTS, productId)) return LEGACY_IAP_PRODUCTS[productId].period;
  return null;
}

// ─── Apple: choose the right transaction from a receipt ──────────────────────

/** The subset of an Apple `latest_receipt_info` entry we rely on. */
export interface AppleReceiptEntry {
  transaction_id: string;
  original_transaction_id: string;
  product_id: string;
  purchase_date_ms: string;
  expires_date_ms?: string;
  cancellation_date_ms?: string;
  cancellation_date?: string;
}

/**
 * An iOS receipt holds the user's WHOLE purchase history, in no guaranteed order.
 * Pick the entry for the product the app asked about: same product_id, not
 * refunded/revoked, and the highest expires_date_ms.
 * Returns null if the receipt has no usable entry for that product.
 */
export function selectAppleTransaction(
  entries: AppleReceiptEntry[],
  productId: string
): AppleReceiptEntry | null {
  let best: AppleReceiptEntry | null = null;
  let bestExpiry = -Infinity;
  let bestPurchase = -Infinity;

  for (const entry of entries) {
    if (entry.product_id !== productId) continue;

    // A refunded / revoked transaction no longer entitles the user to anything
    if (entry.cancellation_date_ms || entry.cancellation_date) continue;

    const expiry = Number(entry.expires_date_ms);
    if (!Number.isFinite(expiry)) continue;

    const purchase = Number(entry.purchase_date_ms);
    const purchaseValue = Number.isFinite(purchase) ? purchase : -Infinity;

    if (expiry > bestExpiry || (expiry === bestExpiry && purchaseValue > bestPurchase)) {
      best = entry;
      bestExpiry = expiry;
      bestPurchase = purchaseValue;
    }
  }

  return best;
}

// ─── Status: choose which stored transaction represents the user ─────────────

interface StoredTransactionLike {
  status: string;
  purchaseDate: Date;
  expiryDate: Date;
}

/**
 * From ALL of a user's stored transactions (any platform) pick the one that
 * represents their current subscription:
 *   1. a transaction that is genuinely active right now (status 'active' AND
 *      expiry in the future) — the most recently purchased one if there are
 *      several (e.g. after an upgrade), otherwise
 *   2. the newest transaction overall (so the app can show "expired").
 * Returns null when the user has no transactions at all.
 */
export function pickCurrentTransaction<T extends StoredTransactionLike>(
  rows: T[],
  now: Date = new Date()
): { transaction: T; isActive: boolean } | null {
  if (rows.length === 0) return null;

  const newestFirst = [...rows].sort(
    (a, b) =>
      b.purchaseDate.getTime() - a.purchaseDate.getTime() ||
      b.expiryDate.getTime() - a.expiryDate.getTime()
  );

  const active = newestFirst.find(
    (row) => row.status === 'active' && row.expiryDate.getTime() > now.getTime()
  );

  return active
    ? { transaction: active, isActive: true }
    : { transaction: newestFirst[0], isActive: false };
}