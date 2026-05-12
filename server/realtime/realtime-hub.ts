import type http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocketServer, type WebSocket } from 'ws';
import { logger } from '../utils/logger';

export type RealtimeEvent =
  | {
      type: 'api_change';
      action: string;
      resource: string;
      path: string;
      userId: number | null;
      timestamp: string;
      correlationId?: string;
    }
  | {
      type: 'heartbeat';
      timestamp: string;
    };

type ClientContext = {
  ws: WebSocket;
  userId: number;
  username: string;
  role: string;
  subscriptions: Array<{
    fiscalYear?: number;
    month?: number;
    dept?: string;
    category?: string;
  }>;
};

let wss: WebSocketServer | null = null;
const clients = new Set<ClientContext>();

function safeSend(ws: WebSocket, payload: unknown) {
  if (ws.readyState !== ws.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function parseTokenFromUrl(url: string) {
  try {
    const u = new URL(url, 'http://localhost');
    return u.searchParams.get('token');
  } catch {
    return null;
  }
}

export function initRealtime(server: http.Server) {
  if (wss) return wss;

  wss = new WebSocketServer({ server, path: '/api/realtime' });

  wss.on('connection', (ws, req) => {
    const jwtSecret = process.env.JWT_SECRET;
    const token = req.url ? parseTokenFromUrl(req.url) : null;

    if (!jwtSecret || !token) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      const ctx: ClientContext = {
        ws,
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        subscriptions: [],
      };
      clients.add(ctx);

      safeSend(ws, { type: 'connected', timestamp: new Date().toISOString() });

      ws.on('message', (buf) => {
        try {
          const msg = JSON.parse(buf.toString());
          if (msg?.type === 'subscribe') {
            const filters = msg?.filters ?? {};
            ctx.subscriptions = [
              {
                fiscalYear: typeof filters.fiscalYear === 'number' ? filters.fiscalYear : undefined,
                month: typeof filters.month === 'number' ? filters.month : undefined,
                dept: typeof filters.dept === 'string' ? filters.dept : undefined,
                category: typeof filters.category === 'string' ? filters.category : undefined,
              },
            ];
            safeSend(ws, { type: 'subscribed', timestamp: new Date().toISOString() });
          } else if (msg?.type === 'ping') {
            safeSend(ws, { type: 'pong', timestamp: new Date().toISOString() });
          }
        } catch {
          // ignore invalid messages
        }
      });

      ws.on('close', () => {
        clients.delete(ctx);
      });
    } catch {
      ws.close(1008, 'Unauthorized');
    }
  });

  // heartbeat
  const interval = setInterval(() => {
    if (!wss) return;
    const evt: RealtimeEvent = { type: 'heartbeat', timestamp: new Date().toISOString() };
    for (const c of clients) safeSend(c.ws, evt);
  }, 30000);
  wss.on('close', () => clearInterval(interval));

  logger.info('Realtime WS initialized at /api/realtime');
  return wss;
}

export function publishRealtimeEvent(event: RealtimeEvent) {
  if (!wss) return;
  for (const c of clients) {
    // Subscription filtering can be expanded later; for now broadcast safely.
    safeSend(c.ws, event);
  }
}

