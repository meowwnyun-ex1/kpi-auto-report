/**
 * Enterprise Audit Logging Middleware
 * Comprehensive audit trail for compliance and security
 */

import { Request, Response, NextFunction } from 'express';
import { getKpiDb } from '../config/database';
import { logger } from '../utils/logger';
import { publishRealtimeEvent } from '../realtime/realtime-hub';

// ============================================
// TYPES
// ============================================

export interface AuditLogEntry {
  id?: number;
  timestamp: Date;
  userId: number | null;
  username: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  queryParams?: Record<string, unknown>;
  requestBody?: Record<string, unknown>;
  responseStatus: number;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
  changes?: ChangeRecord[];
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'ASSIGN'
  | 'UNASSIGN'
  | 'SYSTEM';

interface ChangeRecord {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

// ============================================
// AUDIT CONFIGURATION
// ============================================

const AUDIT_CONFIG = {
  // Paths to exclude from audit
  excludePaths: ['/api/health', '/api/status', '/uploads/', '/favicon.ico'],

  // Sensitive fields to mask
  sensitiveFields: ['password', 'password_hash', 'token', 'secret', 'credit_card', 'ssn'],

  // Actions that require detailed logging
  criticalActions: ['DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'],

  // Batch size for database writes
  batchSize: 100,

  // Flush interval in ms
  flushInterval: 5000,
};

// ============================================
// AUDIT BUFFER
// ============================================

class AuditBuffer {
  private buffer: AuditLogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  add(entry: AuditLogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= AUDIT_CONFIG.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, AUDIT_CONFIG.flushInterval);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const db = await getKpiDb();

      for (const entry of entries) {
        await db
          .request()
          .input('timestamp', entry.timestamp)
          .input('userId', entry.userId)
          .input('username', entry.username)
          .input('action', entry.action)
          .input('resource', entry.resource)
          .input('resourceId', entry.resourceId || null)
          .input('method', entry.method)
          .input('path', entry.path)
          .input('queryParams', entry.queryParams ? JSON.stringify(entry.queryParams) : null)
          .input(
            'requestBody',
            entry.requestBody ? JSON.stringify(this.sanitizeBody(entry.requestBody)) : null
          )
          .input('responseStatus', entry.responseStatus)
          .input('ipAddress', entry.ipAddress)
          .input('userAgent', entry.userAgent)
          .input('sessionId', entry.sessionId || null)
          .input('correlationId', entry.correlationId)
          .input('metadata', entry.metadata ? JSON.stringify(entry.metadata) : null)
          .input('changes', entry.changes ? JSON.stringify(entry.changes) : null).query(`
            INSERT INTO audit_logs (
              timestamp, user_id, username, action, resource, resource_id,
              method, path, query_params, request_body, response_status,
              ip_address, user_agent, session_id, correlation_id, metadata, changes
            ) VALUES (
              @timestamp, @userId, @username, @action, @resource, @resourceId,
              @method, @path, @queryParams, @requestBody, @responseStatus,
              @ipAddress, @userAgent, @sessionId, @correlationId, @metadata, @changes
            )
          `);
      }

      logger.info(`Flushed ${entries.length} audit entries`);
    } catch (error) {
      logger.error('Failed to write audit logs', error);
      // Re-add failed entries to buffer for retry
      this.buffer.unshift(...entries);
    }
  }

  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...body };

    for (const field of AUDIT_CONFIG.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

const auditBuffer = new AuditBuffer();

// ============================================
// AUDIT MIDDLEWARE
// ============================================

export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip excluded paths
  const shouldSkip = AUDIT_CONFIG.excludePaths.some((path) => req.path.startsWith(path));

  if (shouldSkip) {
    return next();
  }

  const startTime = Date.now();
  const correlationId = (req.headers['x-request-id'] as string) || generateCorrelationId();

  // Store original end function
  const originalEnd = res.end.bind(res);

  // Override end to capture response
  res.end = function (chunk: any, encoding?: any, cb?: any) {
    // Restore original end
    res.end = originalEnd;
    const endResult = res.end(chunk, encoding, cb);

    // Log after response is sent
    const duration = Date.now() - startTime;
    const action = determineAction(req);

    const auditEntry: AuditLogEntry = {
      timestamp: new Date(),
      userId: req.user?.userId || null,
      username: req.user?.username || 'anonymous',
      action,
      resource: determineResource(req),
      resourceId: req.params.id as string | undefined,
      method: req.method,
      path: req.path,
      queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
      requestBody: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
      responseStatus: res.statusCode,
      ipAddress: getClientIP(req),
      userAgent: req.headers['user-agent'] || '',
      correlationId,
      metadata: {
        duration,
        contentLength: res.get('content-length'),
        contentType: res.get('content-type'),
      },
    };

    // Add to buffer
    auditBuffer.add(auditEntry);

    // Lightweight realtime broadcast so connected clients can refresh.
    // (No data payload; clients refetch from DB via existing API.)
    if (req.method !== 'GET') {
      publishRealtimeEvent({
        type: 'api_change',
        action,
        resource: auditEntry.resource,
        path: auditEntry.path,
        userId: auditEntry.userId,
        timestamp: auditEntry.timestamp.toISOString(),
        correlationId: auditEntry.correlationId,
      });
    }

    // Log critical actions immediately
    if (AUDIT_CONFIG.criticalActions.includes(action)) {
      logger.info(`Critical action: ${action}`, {
        userId: req.user?.userId,
        resource: auditEntry.resource,
        resourceId: auditEntry.resourceId,
      });
    }

    return endResult;
  };

  next();
};

// ============================================
// AUDIT HELPERS
// ============================================

export async function logAuditEntry(entry: Omit<AuditLogEntry, 'id'>): Promise<void> {
  auditBuffer.add(entry as AuditLogEntry);
}

export async function logDataChange<T extends Record<string, unknown>>(
  userId: number,
  username: string,
  resource: string,
  resourceId: string,
  oldData: T,
  newData: T,
  action: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE'
): Promise<void> {
  const changes: ChangeRecord[] = [];

  if (action === 'UPDATE') {
    for (const key of Object.keys(newData)) {
      if (oldData[key] !== newData[key]) {
        changes.push({
          field: key,
          oldValue: oldData[key],
          newValue: newData[key],
        });
      }
    }
  }

  await logAuditEntry({
    timestamp: new Date(),
    userId,
    username,
    action,
    resource,
    resourceId,
    method: action === 'DELETE' ? 'DELETE' : action === 'CREATE' ? 'POST' : 'PUT',
    path: `/${resource}/${resourceId}`,
    responseStatus: 200,
    ipAddress: '',
    userAgent: '',
    correlationId: generateCorrelationId(),
    changes,
  });
}

// ============================================
// UTILITIES
// ============================================

function determineAction(req: Request): AuditAction {
  switch (req.method) {
    case 'GET':
      return 'READ';
    case 'POST':
      if (req.path.includes('/login')) return 'LOGIN';
      if (req.path.includes('/logout')) return 'LOGOUT';
      if (req.path.includes('/approve')) return 'APPROVE';
      if (req.path.includes('/reject')) return 'REJECT';
      if (req.path.includes('/import')) return 'IMPORT';
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'SYSTEM';
  }
}

function determineResource(req: Request): string {
  const parts = req.path.split('/').filter(Boolean);

  if (parts.length >= 2 && parts[0] === 'api') {
    return parts[1];
  }

  return parts[0] || 'unknown';
}

function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// DATABASE MIGRATION
// ============================================

export async function ensureAuditTable(): Promise<void> {
  try {
    const db = await getKpiDb();

    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
      CREATE TABLE audit_logs (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        timestamp DATETIME NOT NULL DEFAULT GETDATE(),
        user_id INT,
        username NVARCHAR(100) NOT NULL,
        action NVARCHAR(20) NOT NULL,
        resource NVARCHAR(100) NOT NULL,
        resource_id NVARCHAR(100),
        method NVARCHAR(10) NOT NULL,
        path NVARCHAR(500) NOT NULL,
        query_params NVARCHAR(MAX),
        request_body NVARCHAR(MAX),
        response_status INT NOT NULL,
        ip_address NVARCHAR(50) NOT NULL,
        user_agent NVARCHAR(500),
        session_id NVARCHAR(100),
        correlation_id NVARCHAR(100) NOT NULL,
        metadata NVARCHAR(MAX),
        changes NVARCHAR(MAX),
        INDEX IX_audit_logs_timestamp (timestamp),
        INDEX IX_audit_logs_user_id (user_id),
        INDEX IX_audit_logs_action (action),
        INDEX IX_audit_logs_resource (resource),
        INDEX IX_audit_logs_correlation_id (correlation_id)
      )
    `);

    // Create partitioned view for older data (optional optimization)
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.partition_schemes WHERE name = 'AuditLogScheme')
      BEGIN
        -- Partition by month for better performance
        CREATE PARTITION FUNCTION AuditLogPF (DATETIME)
        AS RANGE RIGHT FOR VALUES 
        ('2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01', '2024-05-01', '2024-06-01',
         '2024-07-01', '2024-08-01', '2024-09-01', '2024-10-01', '2024-11-01', '2024-12-01');
        
        CREATE PARTITION SCHEME AuditLogScheme
        AS PARTITION AuditLogPF
        ALL TO ([PRIMARY]);
      END
    `);

    logger.info('Audit log table verified/created');
  } catch (error) {
    logger.error('Failed to create audit table', error);
    throw error;
  }
}

// ============================================
// AUDIT QUERY HELPERS
// ============================================

export async function getAuditLogs(filters: {
  userId?: number;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLogEntry[]> {
  const db = await getKpiDb();

  let whereClause = '1=1';
  const params: Record<string, unknown> = {};

  if (filters.userId) {
    whereClause += ' AND user_id = @userId';
    params.userId = filters.userId;
  }

  if (filters.action) {
    whereClause += ' AND action = @action';
    params.action = filters.action;
  }

  if (filters.resource) {
    whereClause += ' AND resource = @resource';
    params.resource = filters.resource;
  }

  if (filters.startDate) {
    whereClause += ' AND timestamp >= @startDate';
    params.startDate = filters.startDate;
  }

  if (filters.endDate) {
    whereClause += ' AND timestamp <= @endDate';
    params.endDate = filters.endDate;
  }

  const query = `
    SELECT * FROM audit_logs
    WHERE ${whereClause}
    ORDER BY timestamp DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  params.offset = filters.offset || 0;
  params.limit = filters.limit || 100;

  const request = db.request();
  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  const result = await request.query(query);

  return result.recordset.map((row: Record<string, unknown>) => ({
    id: row.id as number,
    timestamp: row.timestamp as Date,
    userId: row.user_id as number,
    username: row.username as string,
    action: row.action as AuditAction,
    resource: row.resource as string,
    resourceId: row.resource_id as string,
    method: row.method as string,
    path: row.path as string,
    queryParams: row.query_params ? JSON.parse(row.query_params as string) : undefined,
    requestBody: row.request_body ? JSON.parse(row.request_body as string) : undefined,
    responseStatus: row.response_status as number,
    ipAddress: row.ip_address as string,
    userAgent: row.user_agent as string,
    sessionId: row.session_id as string,
    correlationId: row.correlation_id as string,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    changes: row.changes ? JSON.parse(row.changes as string) : undefined,
  }));
}

export default auditMiddleware;
