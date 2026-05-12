// ============================================
// TRADIER TRADING REQUEST TYPES
// ============================================

// ── Auth ──────────────────────────────────

// GET /api/trading/auth/connect
// No request params needed — just redirects to Tradier

// GET /api/trading/auth/callback
export interface TradierCallbackRequest {
    code: string;   // Authorization code from Tradier
    state?: string; // Optional state param for security
}

// DELETE /api/trading/auth/disconnect
// No request params needed — uses authenticated user

// ── Account ───────────────────────────────

// GET /api/trading/account/profile
// No request params needed — uses authenticated user

// GET /api/trading/account/balances
// No request params needed — uses authenticated user

// GET /api/trading/account/positions
// No request params needed — uses authenticated user

// GET /api/trading/account/history
export interface TradierAccountHistoryRequest {
    limit?: number;         // Number of results (default: 25)
    offset?: number;        // Pagination offset
    type?: 'trade' | 'option' | 'ach' | 'wire' | 'dividend' | 'fee' | 'tax' | 'journal' | 'check' | 'transfer' | 'adjustment' | 'interest';
    start?: string;         // Start date YYYY-MM-DD
    end?: string;           // End date YYYY-MM-DD
}

// GET /api/trading/account/gainloss
export interface TradierGainLossRequest {
    limit?: number;
    offset?: number;
    sortBy?: 'openDate' | 'closeDate';
    sort?: 'asc' | 'desc';
    start?: string;         // Start date YYYY-MM-DD
    end?: string;           // End date YYYY-MM-DD
}

// ── Orders ────────────────────────────────

// Supported order types
export type TradierOrderType = 'market' | 'limit' | 'stop' | 'stop_limit';

// Supported order sides
export type TradierOrderSide = 'buy' | 'sell' | 'buy_to_cover' | 'sell_short';

// Supported order durations
export type TradierOrderDuration = 'day' | 'gtc' | 'pre' | 'post';

// POST /api/trading/orders/preview
export interface TradierOrderPreviewRequest {
    symbol: string;                 // e.g. "AAPL"
    side: TradierOrderSide;         // buy or sell
    quantity: number;               // Number of shares
    type: TradierOrderType;         // market, limit, stop, stop_limit
    duration: TradierOrderDuration; // day, gtc, pre, post
    price?: number;                 // Required for limit and stop_limit orders
    stop?: number;                  // Required for stop and stop_limit orders
}

// POST /api/trading/orders/place
export interface TradierPlaceOrderRequest {
    symbol: string;
    side: TradierOrderSide;
    quantity: number;
    type: TradierOrderType;
    duration: TradierOrderDuration;
    price?: number;
    stop?: number;
}

// GET /api/trading/orders
export interface TradierGetOrdersRequest {
    includeTags?: boolean;
}

// GET /api/trading/orders/:orderId
export interface TradierGetOrderRequest {
    orderId: string;
}

// PUT /api/trading/orders/:orderId
export interface TradierModifyOrderRequest {
    orderId: string;
    type?: TradierOrderType;
    duration?: TradierOrderDuration;
    price?: number;
    stop?: number;
}

// DELETE /api/trading/orders/:orderId
export interface TradierCancelOrderRequest {
    orderId: string;
}