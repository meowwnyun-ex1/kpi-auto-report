import { storage } from '@/shared/utils';

export type RealtimeEvent =
  | { type: 'connected'; timestamp: string }
  | { type: 'subscribed'; timestamp: string }
  | { type: 'heartbeat'; timestamp: string }
  | {
      type: 'api_change';
      action: string;
      resource: string;
      path: string;
      userId: number | null;
      timestamp: string;
      correlationId?: string;
    }
  | { type: 'pong'; timestamp: string };

type RealtimeClientOptions = {
  onEvent: (evt: RealtimeEvent) => void;
  onStatus?: (status: 'connecting' | 'connected' | 'disconnected') => void;
};

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;
  private closedByUser = false;

  constructor(private opts: RealtimeClientOptions) {}

  connect() {
    const token = storage.getAuthToken();
    if (!token) return;

    this.closedByUser = false;
    this.opts.onStatus?.('connecting');

    const url = new URL('/api/realtime', window.location.origin);
    url.searchParams.set('token', token);

    this.ws = new WebSocket(url.toString().replace(/^http/, 'ws'));

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.opts.onStatus?.('connected');
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        this.opts.onEvent(msg);
      } catch {
        // ignore
      }
    };

    this.ws.onclose = () => {
      this.opts.onStatus?.('disconnected');
      this.ws = null;
      if (!this.closedByUser) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // allow close handler to reconnect
    };
  }

  subscribe(filters: { fiscalYear?: number; month?: number; dept?: string; category?: string }) {
    this.send({ type: 'subscribe', filters });
  }

  ping() {
    this.send({ type: 'ping' });
  }

  close() {
    this.closedByUser = true;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  private send(payload: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  private scheduleReconnect() {
    const attempt = this.reconnectAttempt++;
    const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
  }
}

