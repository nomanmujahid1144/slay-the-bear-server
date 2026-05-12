// ============================================
// TRADIER RAW API RESPONSE TYPES
// (what Tradier API actually returns)
// ============================================

// ── Auth ──────────────────────────────────

// Raw token response from Tradier OAuth
export interface TradierRawTokenResponse {
    access_token: string;
    expires_in: number;         // Seconds until expiry (usually 86400 = 24h)
    issued_at: string;          // Timestamp when token was issued
    scope: string;              // e.g. "read write trade"
    status: string;             // "approved"
    token_type: string;         // "Bearer"
}

// Raw profile from Tradier
export interface TradierRawProfile {
    profile: {
        account: TradierRawAccount | TradierRawAccount[];
        id: string;
        name: string;
    };
}

export interface TradierRawAccount {
    account_number: string;
    classification: string;     // 'individual', 'entity', 'ira', etc.
    date_created: string;
    day_trader: boolean;
    option_level: number;
    status: string;             // 'active', 'inactive', 'suspended'
    type: string;               // 'margin', 'cash', 'pdt'
    last_update_date: string;
}

// Raw balances from Tradier
export interface TradierRawBalances {
    balances: {
        account_number: string;
        account_type: string;
        cash: {
            cash_available: number;
            sweep: number;
            unsettled_funds: number;
        };
        equity: number;
        long_market_value: number;
        market_value: number;
        open_pl: number;
        option_requirement: number;
        pending_cash: number;
        short_market_value: number;
        total_cash: number;
        total_equity: number;
        uncleared_funds: number;
        pending_orders_count: number;
        pdt_information?: {
            day_trade_buying_power: number;
            num_day_trades: number;
        };
    };
}

// Raw position from Tradier
export interface TradierRawPosition {
    cost_basis: number;
    date_acquired: string;
    id: number;
    quantity: number;
    symbol: string;
}

export interface TradierRawPositions {
    positions: {
        position: TradierRawPosition | TradierRawPosition[];
    } | string; // "null" when no positions
}

// Raw order from Tradier
export interface TradierRawOrder {
    id: number;
    type: string;
    symbol: string;
    side: string;
    quantity: number;
    status: string;
    duration: string;
    price?: number;
    stop_price?: number;
    avg_fill_price: number;
    exec_quantity: number;
    last_fill_price: number;
    last_fill_quantity: number;
    remaining_quantity: number;
    create_date: string;
    transaction_date: string;
    class: string;
    num_legs?: number;
}

export interface TradierRawOrders {
    orders: {
        order: TradierRawOrder | TradierRawOrder[];
    } | string; // "null" when no orders
}

// Raw order placement response
export interface TradierRawOrderResponse {
    order: {
        id: number;
        status: string;
        partner_id?: string;
    };
}

// Raw history event
export interface TradierRawHistoryEvent {
    amount: number;
    date: string;
    description: string;
    quantity?: number;
    price?: number;
    symbol?: string;
    trade_type?: string;
    type: string;
}

export interface TradierRawHistory {
    history: {
        event: TradierRawHistoryEvent | TradierRawHistoryEvent[];
    } | string;
}

// Raw gain/loss
export interface TradierRawGainLoss {
    gainloss: {
        closed_position: TradierRawClosedPosition | TradierRawClosedPosition[];
    } | string;
}

export interface TradierRawClosedPosition {
    close_date: string;
    cost: number;
    gain_loss: number;
    gain_loss_percent: number;
    open_date: string;
    proceeds: number;
    quantity: number;
    symbol: string;
    term: number;
}

// ============================================
// NORMALISED RESPONSE TYPES
// (what our API returns to the frontend/mobile)
// ============================================

// ── Auth ──────────────────────────────────

export interface TradierConnectResponse {
    success: true;
    message: string;
    data: {
        accountNumber: string;
        accountType: string;
        accountName: string;
        environment: 'sandbox' | 'production';
        connectedAt: string;
    };
}

export interface TradierDisconnectResponse {
    success: true;
    message: string;
}

export interface TradierConnectionStatusResponse {
    success: true;
    data: {
        isConnected: boolean;
        accountNumber?: string;
        accountType?: string;
        accountName?: string;
        environment?: 'sandbox' | 'production';
        connectedAt?: string;
    };
}

// ── Account ───────────────────────────────

export interface TradierProfileResponse {
    success: true;
    data: {
        accountNumber: string;
        accountType: string;
        accountClassification: string;
        status: string;
        dayTrader: boolean;
        optionLevel: number;
    };
}

export interface TradierBalancesResponse {
    success: true;
    data: {
        accountNumber: string;
        accountType: string;
        totalEquity: number;
        totalCash: number;
        cashAvailable: number;
        marketValue: number;
        longMarketValue: number;
        shortMarketValue: number;
        openPl: number;
        pendingCash: number;
        unclearedFunds: number;
        pendingOrdersCount: number;
        dayTradeBuyingPower?: number;
        numDayTrades?: number;
    };
}

export interface TradierPosition {
    id: number;
    symbol: string;
    quantity: number;
    costBasis: number;
    dateAcquired: string;
}

export interface TradierPositionsResponse {
    success: true;
    data: TradierPosition[];
    count: number;
}

export interface TradierOrder {
    id: number;
    symbol: string;
    type: string;
    side: string;
    quantity: number;
    status: string;
    duration: string;
    price?: number;
    stopPrice?: number;
    avgFillPrice: number;
    execQuantity: number;
    remainingQuantity: number;
    createDate: string;
    transactionDate: string;
    class: string;
}

export interface TradierOrdersResponse {
    success: true;
    data: TradierOrder[];
    count: number;
}

export interface TradierOrderResponse {
    success: true;
    data: TradierOrder;
}

export interface TradierPlaceOrderResponse {
    success: true;
    message: string;
    data: {
        orderId: number;
        status: string;
    };
}

export interface TradierModifyOrderResponse {
    success: true;
    message: string;
    data: {
        orderId: number;
        status: string;
    };
}

export interface TradierCancelOrderResponse {
    success: true;
    message: string;
    data: {
        orderId: number;
        status: string;
    };
}

export interface TradierHistoryEvent {
    type: string;
    date: string;
    amount: number;
    description: string;
    symbol?: string;
    quantity?: number;
    price?: number;
    tradeType?: string;
}

export interface TradierHistoryResponse {
    success: true;
    data: TradierHistoryEvent[];
    count: number;
}

export interface TradierClosedPosition {
    symbol: string;
    quantity: number;
    openDate: string;
    closeDate: string;
    cost: number;
    proceeds: number;
    gainLoss: number;
    gainLossPercent: number;
    term: number;
}

export interface TradierGainLossResponse {
    success: true;
    data: TradierClosedPosition[];
    count: number;
}

// ── Order Preview ─────────────────────────

export interface TradierOrderPreviewResponse {
    success: true;
    data: {
        symbol: string;
        side: string;
        quantity: number;
        type: string;
        duration: string;
        price?: number;
        stop?: number;
        estimatedCost: number;
        commission: number;
        extendedHours: boolean;
        status: string;
    };
}