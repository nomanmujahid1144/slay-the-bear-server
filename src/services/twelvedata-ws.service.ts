// src/services/twelvedata-ws.service.ts
//
// Twelve Data real-time engine — completely separate from websocket.service.ts
// (Tradier). Mounted on its own path so the two never collide.
//
// Two layers share ONE upstream connection to Twelve Data:
//   Layer 1 — the curated default watchlist (see twelvedata-symbols.config.ts),
//             subscribed once at boot in a single batch message, always on,
//             regardless of how many browser clients are connected.
//   Layer 2 — whatever extra symbols connected browser clients ask for on
//             demand via this service's own WebSocket endpoint; added to the
//             upstream subscription while wanted, dropped (never the
//             defaults) once no client wants them any more.
//
// Every price tick is merged onto a REST-seeded baseline (name, exchange,
// open/high/low/previousClose, logo) fetched ONCE per symbol via
// twelvedata.service.ts — not re-fetched per tick — then written to the
// LIVE_PRICE Redis key and broadcast to whichever browser clients asked for
// that symbol.

import { WebSocket as WSClient, WebSocketServer } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';
import config from '../config';
import { setCacheTD, CACHE_KEYS_TD, CACHE_TTL_TD } from '../utils/twelvedata/twelvedata-cache.config';
import { ALL_DEFAULT_TD_SYMBOLS } from '../utils/twelvedata/twelvedata-symbols.config';
import { twelveDataService } from './twelvedata.service';
import {
    TwelveDataQuote,
    TwelveDataPriceEvent,
    TwelveDataSubscribeStatusEvent,
    TwelveDataSubscribeStatusItem,
    TwelveDataWsIncomingMessage,
} from '../types/markets/twelvedata/twelvedata-response.types';

interface Client {
    ws: WSClient;
    subscribedSymbols: Set<string>;
}

interface ClientMessage {
    type: 'subscribe' | 'unsubscribe';
    symbols: string[];
}

export class TwelveDataWebSocketService {
    private wss: WebSocketServer | null = null;
    private clients: Map<WSClient, Client> = new Map();

    private tdWs: WSClient | null = null;
    private allSubscribedSymbols: Set<string> = new Set(); // everything currently live on the upstream socket (defaults + extras)
    private clientRequestedSymbols: Set<string> = new Set(); // Layer 2 demand only, recomputed from connected clients
    private symbolSnapshots: Map<string, TwelveDataQuote> = new Map(); // last known full quote per symbol, updated per tick

    private heartbeatTimer: NodeJS.Timeout | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;

    private readonly RECONNECT_DELAY = 5000; // 5 seconds
    private readonly HEARTBEAT_INTERVAL = 10000; // 10 seconds, per Twelve Data's WS docs

    /**
     * Initialize the browser-facing WebSocket server and connect upstream to Twelve Data.
     */
    initialize(server: Server) {
        this.wss = new WebSocketServer({
            server,
            path: '/ws/markets/twelvedata',
        });

        this.wss.on('connection', (ws: WSClient) => {
            this.handleConnection(ws);
        });

        logger.info('🔌 Twelve Data WebSocket server initialized on /ws/markets/twelvedata');

        this.connectUpstream();
    }

    /**
     * Handle a new browser client connection
     */
    private handleConnection(ws: WSClient) {
        logger.info('📡 New Twelve Data WebSocket client connected');

        const client: Client = {
            ws,
            subscribedSymbols: new Set(),
        };

        this.clients.set(ws, client);

        ws.on('message', (message: string) => {
            this.handleClientMessage(client, message);
        });

        ws.on('close', () => {
            this.handleDisconnection(client);
        });

        ws.on('error', (error) => {
            logger.error('Twelve Data WebSocket client error:', error);
        });

        this.send(ws, {
            type: 'connected',
            message: 'Connected to Slay The Bear real-time Twelve Data market feed',
        });
    }

    /**
     * Handle an incoming message from a browser client
     */
    private handleClientMessage(client: Client, message: string) {
        try {
            const data: ClientMessage = JSON.parse(message);

            if (data.type === 'subscribe') {
                this.subscribeClient(client, data.symbols);
            } else if (data.type === 'unsubscribe') {
                this.unsubscribeClient(client, data.symbols);
            }
        } catch (error) {
            logger.error('Error parsing Twelve Data WebSocket message:', error);
            this.send(client.ws, {
                type: 'error',
                message: 'Invalid message format',
            });
        }
    }

    /**
     * Subscribe a client to symbols (Layer 2 — on demand, any market)
     */
    private subscribeClient(client: Client, symbols: string[]) {
        const normSymbols = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);

        normSymbols.forEach((symbol) => {
            client.subscribedSymbols.add(symbol);
        });

        logger.info(`Twelve Data client subscribed to: ${normSymbols.join(', ')}`);

        this.recalculateClientRequestedSymbols();
        this.updateUpstreamSubscription();

        // Anything we already have a snapshot for can be sent immediately,
        // instead of the client waiting for the next tick.
        normSymbols.forEach((symbol) => {
            const snapshot = this.symbolSnapshots.get(symbol);
            if (snapshot) {
                this.send(client.ws, { type: 'quote', data: snapshot });
            }
        });

        this.send(client.ws, { type: 'subscribed', symbols: normSymbols });
    }

    /**
     * Unsubscribe a client from symbols
     */
    private unsubscribeClient(client: Client, symbols: string[]) {
        const normSymbols = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);

        normSymbols.forEach((symbol) => {
            client.subscribedSymbols.delete(symbol);
        });

        logger.info(`Twelve Data client unsubscribed from: ${normSymbols.join(', ')}`);

        this.recalculateClientRequestedSymbols();
        this.updateUpstreamSubscription();

        this.send(client.ws, { type: 'unsubscribed', symbols: normSymbols });
    }

    /**
     * Handle client disconnection
     */
    private handleDisconnection(client: Client) {
        logger.info('📴 Twelve Data WebSocket client disconnected');
        this.clients.delete(client.ws);

        this.recalculateClientRequestedSymbols();
        this.updateUpstreamSubscription();
    }

    /**
     * Recompute Layer 2 demand from every currently connected client
     */
    private recalculateClientRequestedSymbols() {
        this.clientRequestedSymbols.clear();

        this.clients.forEach((client) => {
            client.subscribedSymbols.forEach((symbol) => {
                this.clientRequestedSymbols.add(symbol);
            });
        });
    }

    /**
     * What SHOULD be subscribed on the upstream socket right now:
     * the always-on default watchlist, union'd with live Layer 2 demand.
     */
    private computeDesiredSymbols(): Set<string> {
        const desired = new Set<string>(ALL_DEFAULT_TD_SYMBOLS);
        this.clientRequestedSymbols.forEach((symbol) => desired.add(symbol));
        return desired;
    }

    /**
     * Reconcile the upstream Twelve Data subscription with what's actually
     * wanted — subscribes newly-needed symbols, unsubscribes ones nobody
     * wants any more (never the defaults), and seeds a REST baseline for
     * anything new so its first tick has something to merge onto.
     */
    private updateUpstreamSubscription() {
        const desired = this.computeDesiredSymbols();

        const newSymbols = Array.from(desired).filter((s) => !this.allSubscribedSymbols.has(s));
        const staleSymbols = Array.from(this.allSubscribedSymbols).filter(
            (s) => !desired.has(s) && !ALL_DEFAULT_TD_SYMBOLS.includes(s),
        );

        if (newSymbols.length > 0) {
            newSymbols.forEach((s) => this.allSubscribedSymbols.add(s));
            this.sendUpstream('subscribe', newSymbols);
            newSymbols.forEach((symbol) => this.seedSnapshot(symbol));
            logger.info(`📊 Twelve Data WS: +${newSymbols.length} symbol(s) → ${newSymbols.join(', ')}`);
        }

        if (staleSymbols.length > 0) {
            staleSymbols.forEach((s) => {
                this.allSubscribedSymbols.delete(s);
                this.symbolSnapshots.delete(s);
            });
            this.sendUpstream('unsubscribe', staleSymbols);
            logger.info(`📉 Twelve Data WS: -${staleSymbols.length} symbol(s) → ${staleSymbols.join(', ')}`);
        }
    }

    /**
     * Fetch a one-time REST baseline (full quote + logo) for a symbol so
     * subsequent WS price ticks — which only carry price/volume/timestamp —
     * have somewhere to merge onto. Cheap: twelvedata.service.ts already
     * caches both the quote snapshot and the logo.
     */
    private async seedSnapshot(symbol: string) {
        try {
            const { data } = await twelveDataService.getQuote(symbol);
            this.symbolSnapshots.set(symbol, data);
        } catch (error: any) {
            logger.warn(`Twelve Data WS: could not seed baseline for ${symbol}: ${error.message}`);
        }
    }

    /**
     * Connect (or reconnect) to Twelve Data's price WebSocket
     */
    private connectUpstream() {
        try {
            const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${config.TWELVE_DATA_API_KEY}`;
            this.tdWs = new WSClient(wsUrl);

            this.tdWs.on('open', () => {
                logger.info('📡 Connected to Twelve Data WebSocket');

                // Subscriptions never survive a reconnect, so start clean
                // and re-subscribe everything currently wanted in ONE batch.
                this.allSubscribedSymbols.clear();
                const desired = Array.from(this.computeDesiredSymbols());

                if (desired.length > 0) {
                    desired.forEach((s) => this.allSubscribedSymbols.add(s));
                    this.sendUpstream('subscribe', desired);
                    desired.forEach((symbol) => this.seedSnapshot(symbol));
                    logger.info(`📊 Subscribed to ${desired.length} symbol(s) via Twelve Data WebSocket`);
                }

                this.startHeartbeat();
            });

            this.tdWs.on('message', (raw: string) => {
                this.handleUpstreamMessage(raw);
            });

            this.tdWs.on('error', (error: any) => {
                logger.error('Twelve Data WebSocket error:', error.message);
            });

            this.tdWs.on('close', () => {
                logger.info('Twelve Data WebSocket closed, reconnecting...');
                this.stopHeartbeat();
                this.tdWs = null;
                this.reconnectTimer = setTimeout(() => this.connectUpstream(), this.RECONNECT_DELAY);
            });
        } catch (error: any) {
            logger.error('Error connecting to Twelve Data WebSocket:', error.message);
            this.reconnectTimer = setTimeout(() => this.connectUpstream(), this.RECONNECT_DELAY);
        }
    }

    /**
     * Send a heartbeat every 10s, as required by Twelve Data's WS protocol
     */
    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            this.sendUpstream('heartbeat');
        }, this.HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Send an action message to Twelve Data (subscribe/unsubscribe/heartbeat)
     */
    private sendUpstream(action: 'subscribe' | 'unsubscribe' | 'heartbeat' | 'reset', symbols?: string[]) {
        if (!this.tdWs || this.tdWs.readyState !== WSClient.OPEN) return;

        const payload: any = { action };
        if (symbols && symbols.length > 0) {
            payload.params = { symbols: symbols.join(',') };
        }

        this.tdWs.send(JSON.stringify(payload));
    }

    /**
     * Handle an incoming message from Twelve Data
     */
    private handleUpstreamMessage(raw: string) {
        try {
            const message: TwelveDataWsIncomingMessage = JSON.parse(raw);

            if (message.event === 'price') {
                this.handlePriceEvent(message as TwelveDataPriceEvent);
            } else if (message.event === 'subscribe-status' || message.event === 'unsubscribe-status') {
                this.handleSubscribeStatus(message as TwelveDataSubscribeStatusEvent);
            }
            // 'heartbeat' acks and anything else are ignored — nothing to react to.
        } catch (error) {
            // Ignore parse errors, matching the existing Tradier WS service's behaviour.
        }
    }

    /**
     * Merge a price tick onto the symbol's REST-seeded baseline, cache it,
     * and broadcast it to whichever clients asked for that symbol.
     */
    private async handlePriceEvent(event: TwelveDataPriceEvent) {
        const symbol = event.symbol?.toUpperCase();
        if (!symbol || typeof event.price !== 'number') return;

        const baseline = this.symbolSnapshots.get(symbol);
        if (!baseline) {
            // First tick can race ahead of the REST seed — seed now, merge on the next tick.
            this.seedSnapshot(symbol);
            return;
        }

        const currentPrice = event.price;
        const change = baseline.previousClose ? currentPrice - baseline.previousClose : baseline.change;
        const changePercent = baseline.previousClose ? (change / baseline.previousClose) * 100 : baseline.changePercent;

        const updated: TwelveDataQuote = {
            ...baseline,
            currentPrice,
            change,
            changePercent,
            high: Math.max(baseline.high, currentPrice),
            low: baseline.low > 0 ? Math.min(baseline.low, currentPrice) : currentPrice,
            volume: typeof event.day_volume === 'number' ? event.day_volume : baseline.volume,
            timestamp: event.timestamp,
            source: 'websocket',
        };

        this.symbolSnapshots.set(symbol, updated);

        await setCacheTD(CACHE_KEYS_TD.LIVE_PRICE(symbol), updated, CACHE_TTL_TD.LIVE_PRICE);

        this.broadcastToClients(symbol, updated);
    }

    /**
     * Log subscribe/unsubscribe outcomes; seed a baseline for anything that
     * just went live and doesn't have one yet (covers the boot-time default batch).
     */
    private handleSubscribeStatus(event: TwelveDataSubscribeStatusEvent) {
        (event.success ?? []).forEach((item: TwelveDataSubscribeStatusItem) => {
            const symbol = item.symbol?.toUpperCase();
            if (symbol && !this.symbolSnapshots.has(symbol)) {
                this.seedSnapshot(symbol);
            }
        });

        (event.fails ?? []).forEach((item: TwelveDataSubscribeStatusItem) => {
            logger.warn(`⚠️ Twelve Data WS subscribe failed for ${item.symbol}`);
        });
    }

    /**
     * Broadcast a quote update to every client that asked for that symbol
     */
    private broadcastToClients(symbol: string, quote: TwelveDataQuote) {
        this.clients.forEach((client) => {
            if (client.subscribedSymbols.has(symbol)) {
                this.send(client.ws, { type: 'quote', data: quote });
            }
        });
    }

    /**
     * Send a message to a single client
     */
    private send(ws: WSClient, data: any) {
        if (ws.readyState === WSClient.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    /**
     * Broadcast to all connected clients
     */
    broadcast(data: any) {
        this.clients.forEach((client) => {
            this.send(client.ws, data);
        });
    }

    /**
     * Get connected client count
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Close the upstream connection and the browser-facing WebSocket server
     */
    close() {
        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.tdWs) {
            this.tdWs.close();
        }

        if (this.wss) {
            this.wss.close(() => {
                logger.info('🔌 Twelve Data WebSocket server closed');
            });
        }
    }
}

// Export singleton instance
export const twelveDataWebSocketService = new TwelveDataWebSocketService();
