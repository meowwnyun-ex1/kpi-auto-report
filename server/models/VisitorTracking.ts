import sql from 'mssql';
import { getAppStoreDb } from '../config/database';

export interface VisitorSession {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  landingPage: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
  createdAt?: Date;
  lastActivity?: Date;
  durationSeconds?: number;
  pageViews?: number;
  isBounce?: boolean;
}

export interface PageView {
  id?: number;
  sessionId: string;
  pageUrl: string;
  pageTitle?: string;
  timeOnPage: number;
  visitedAt?: Date;
}

export interface VisitorEvent {
  id?: number;
  sessionId: string;
  eventType: string;
  pageUrl?: string;
  elementSelector?: string;
  elementText?: string;
  additionalData?: string;
  createdAt?: Date;
}

export class VisitorTrackingModel {
  static async createSession(
    sessionData: Omit<
      VisitorSession,
      'createdAt' | 'lastActivity' | 'durationSeconds' | 'pageViews' | 'isBounce'
    >
  ): Promise<VisitorSession> {
    const pool = await getAppStoreDb();
    const query = `
      INSERT INTO VisitorSessions (
        sessionId, ipAddress, userAgent, referrer, landingPage, 
        browser, os, deviceType, isMobile, isTablet, isDesktop,
        createdAt, lastActivity, durationSeconds, pageViews, isBounce
      ) VALUES (@sessionId, @ipAddress, @userAgent, @referrer, @landingPage, 
              @browser, @os, @deviceType, @isMobile, @isTablet, @isDesktop, 
              GETDATE(), GETDATE(), 0, 1, 1)
    `;

    try {
      await pool
        .request()
        .input('sessionId', sql.NVarChar, sessionData.sessionId)
        .input('ipAddress', sql.NVarChar, sessionData.ipAddress)
        .input('userAgent', sql.NVarChar, sessionData.userAgent)
        .input('referrer', sql.NVarChar, sessionData.referrer || null)
        .input('landingPage', sql.NVarChar, sessionData.landingPage)
        .input('browser', sql.NVarChar, sessionData.browser || null)
        .input('os', sql.NVarChar, sessionData.os || null)
        .input('deviceType', sql.NVarChar, sessionData.deviceType || null)
        .input('isMobile', sql.Bit, sessionData.isMobile || false)
        .input('isTablet', sql.Bit, sessionData.isTablet || false)
        .input('isDesktop', sql.Bit, sessionData.isDesktop || false)
        .query(query);

      return {
        ...sessionData,
        createdAt: new Date(),
        lastActivity: new Date(),
        durationSeconds: 0,
        pageViews: 1,
        isBounce: true,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getSession(sessionId: string): Promise<VisitorSession | null> {
    const pool = await getAppStoreDb();
    const query = `
      SELECT * FROM VisitorSessions WHERE sessionId = @sessionId
    `;

    try {
      const result = await pool.request().input('sessionId', sql.NVarChar, sessionId).query(query);

      return result.recordset[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async updateSession(sessionId: string, updates: Partial<VisitorSession>): Promise<void> {
    const pool = await getAppStoreDb();
    const setClause = [];
    const inputs = [];

    if (updates.lastActivity) {
      setClause.push('lastActivity = @lastActivity');
      inputs.push({ key: 'lastActivity', value: updates.lastActivity });
    }
    if (updates.durationSeconds !== undefined) {
      setClause.push('durationSeconds = @durationSeconds');
      inputs.push({ key: 'durationSeconds', value: updates.durationSeconds });
    }
    if (updates.pageViews !== undefined) {
      setClause.push('pageViews = @pageViews');
      inputs.push({ key: 'pageViews', value: updates.pageViews });
    }
    if (updates.isBounce !== undefined) {
      setClause.push('isBounce = @isBounce');
      inputs.push({ key: 'isBounce', value: updates.isBounce });
    }

    if (setClause.length === 0) return;

    const query = `UPDATE VisitorSessions SET ${setClause.join(', ')} WHERE sessionId = @sessionId`;

    try {
      const request = pool.request();
      inputs.forEach((input) => {
        if (input.key === 'lastActivity') {
          request.input(input.key, sql.DateTime2, input.value);
        } else if (input.key === 'durationSeconds' || input.key === 'pageViews') {
          request.input(input.key, sql.Int, input.value);
        } else if (input.key === 'isBounce') {
          request.input(input.key, sql.Bit, input.value);
        }
      });
      request.input('sessionId', sql.NVarChar, sessionId);
      await request.query(query);
    } catch (error) {
      throw error;
    }
  }

  static async createPageView(pageViewData: Omit<PageView, 'id' | 'visitedAt'>): Promise<void> {
    const pool = await getAppStoreDb();
    const query = `
      INSERT INTO PageViews (sessionId, pageUrl, pageTitle, timeOnPage, visitedAt)
      VALUES (@sessionId, @pageUrl, @pageTitle, @timeOnPage, GETDATE())
    `;

    try {
      await pool
        .request()
        .input('sessionId', sql.NVarChar, pageViewData.sessionId)
        .input('pageUrl', sql.NVarChar, pageViewData.pageUrl)
        .input('pageTitle', sql.NVarChar, pageViewData.pageTitle || null)
        .input('timeOnPage', sql.Int, pageViewData.timeOnPage)
        .query(query);
    } catch (error) {
      throw error;
    }
  }

  static async trackEvent(eventData: Omit<VisitorEvent, 'id' | 'createdAt'>): Promise<void> {
    const pool = await getAppStoreDb();
    const query = `
      INSERT INTO VisitorEvents (sessionId, eventType, pageUrl, elementSelector, elementText, additionalData, createdAt)
      VALUES (@sessionId, @eventType, @pageUrl, @elementSelector, @elementText, @additionalData, GETDATE())
    `;

    try {
      await pool
        .request()
        .input('sessionId', sql.NVarChar, eventData.sessionId)
        .input('eventType', sql.NVarChar, eventData.eventType)
        .input('pageUrl', sql.NVarChar, eventData.pageUrl || null)
        .input('elementSelector', sql.NVarChar, eventData.elementSelector || null)
        .input('elementText', sql.NVarChar, eventData.elementText || null)
        .input('additionalData', sql.NVarChar, eventData.additionalData || null)
        .query(query);
    } catch (error) {
      throw error;
    }
  }

  static async getVisitorStats(startDate: Date, endDate: Date): Promise<any> {
    const pool = await getAppStoreDb();
    const query = `
      SELECT 
        COUNT(DISTINCT s.sessionId) as total_visitors,
        COUNT(DISTINCT s.sessionId) as unique_visitors,
        COUNT(pv.id) as total_page_views,
        CASE 
          WHEN COUNT(DISTINCT s.sessionId) > 0 
          THEN SUM(CASE WHEN s.isBounce = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT s.sessionId)
          ELSE 0 
        END as bounce_rate,
        AVG(s.durationSeconds) as avg_session_duration,
        SUM(CASE WHEN s.isMobile = 1 THEN 1 ELSE 0 END) as mobile_visitors,
        SUM(CASE WHEN s.isDesktop = 1 THEN 1 ELSE 0 END) as desktop_visitors,
        SUM(CASE WHEN s.isTablet = 1 THEN 1 ELSE 0 END) as tablet_visitors
      FROM VisitorSessions s
      LEFT JOIN PageViews pv ON s.sessionId = pv.sessionId
      WHERE s.createdAt BETWEEN @startDate AND @endDate
    `;

    try {
      const result = await pool
        .request()
        .input('startDate', sql.DateTime2, startDate)
        .input('endDate', sql.DateTime2, endDate)
        .query(query);

      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async getTopPages(startDate: Date, endDate: Date, limit: number): Promise<any[]> {
    const pool = await getAppStoreDb();
    const query = `
      SELECT TOP (?) 
        pv.pageUrl,
        pv.pageTitle,
        COUNT(*) as views,
        COUNT(DISTINCT pv.sessionId) as unique_visitors
      FROM PageViews pv
      WHERE pv.visitedAt BETWEEN @startDate AND @endDate
      GROUP BY pv.pageUrl, pv.pageTitle
      ORDER BY views DESC
    `;

    try {
      const result = await pool
        .request()
        .input('limit', sql.Int, limit)
        .input('startDate', sql.DateTime2, startDate)
        .input('endDate', sql.DateTime2, endDate)
        .query(query);

      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async getVisitorTrends(days: number): Promise<any[]> {
    const pool = await getAppStoreDb();
    const query = `
      SELECT 
        CAST(s.createdAt as DATE) as date,
        COUNT(DISTINCT s.sessionId) as visitors,
        COUNT(pv.id) as page_views
      FROM VisitorSessions s
      LEFT JOIN PageViews pv ON s.sessionId = pv.sessionId
      WHERE s.createdAt >= DATEADD(day, -@days, GETDATE())
      GROUP BY CAST(s.createdAt as DATE)
      ORDER BY date DESC
    `;

    try {
      const result = await pool.request().input('days', sql.Int, days).query(query);

      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async getDailyStats(date: Date): Promise<any> {
    const pool = await getAppStoreDb();
    const query = `
      SELECT 
        COUNT(DISTINCT s.sessionId) as visitors,
        COUNT(pv.id) as page_views,
        AVG(s.durationSeconds) as avg_session_duration,
        SUM(CASE WHEN s.isBounce = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(DISTINCT s.sessionId) as bounce_rate
      FROM VisitorSessions s
      LEFT JOIN PageViews pv ON s.sessionId = pv.sessionId
      WHERE CAST(s.createdAt as DATE) = @date
    `;

    try {
      const result = await pool.request().input('date', sql.DateTime2, date).query(query);

      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }
}

export const VisitorTrackingModelSingleton = VisitorTrackingModel;
