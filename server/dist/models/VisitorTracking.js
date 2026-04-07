"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorTrackingModelSingleton = exports.VisitorTrackingModel = void 0;
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
class VisitorTrackingModel {
    static async createSession(sessionData) {
        const pool = await (0, database_1.getAppStoreDb)();
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
                .input('sessionId', mssql_1.default.NVarChar, sessionData.sessionId)
                .input('ipAddress', mssql_1.default.NVarChar, sessionData.ipAddress)
                .input('userAgent', mssql_1.default.NVarChar, sessionData.userAgent)
                .input('referrer', mssql_1.default.NVarChar, sessionData.referrer || null)
                .input('landingPage', mssql_1.default.NVarChar, sessionData.landingPage)
                .input('browser', mssql_1.default.NVarChar, sessionData.browser || null)
                .input('os', mssql_1.default.NVarChar, sessionData.os || null)
                .input('deviceType', mssql_1.default.NVarChar, sessionData.deviceType || null)
                .input('isMobile', mssql_1.default.Bit, sessionData.isMobile || false)
                .input('isTablet', mssql_1.default.Bit, sessionData.isTablet || false)
                .input('isDesktop', mssql_1.default.Bit, sessionData.isDesktop || false)
                .query(query);
            return {
                ...sessionData,
                createdAt: new Date(),
                lastActivity: new Date(),
                durationSeconds: 0,
                pageViews: 1,
                isBounce: true,
            };
        }
        catch (error) {
            throw error;
        }
    }
    static async getSession(sessionId) {
        const pool = await (0, database_1.getAppStoreDb)();
        const query = `
      SELECT * FROM VisitorSessions WHERE sessionId = @sessionId
    `;
        try {
            const result = await pool.request().input('sessionId', mssql_1.default.NVarChar, sessionId).query(query);
            return result.recordset[0] || null;
        }
        catch (error) {
            throw error;
        }
    }
    static async updateSession(sessionId, updates) {
        const pool = await (0, database_1.getAppStoreDb)();
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
        if (setClause.length === 0)
            return;
        const query = `UPDATE VisitorSessions SET ${setClause.join(', ')} WHERE sessionId = @sessionId`;
        try {
            const request = pool.request();
            inputs.forEach((input) => {
                if (input.key === 'lastActivity') {
                    request.input(input.key, mssql_1.default.DateTime2, input.value);
                }
                else if (input.key === 'durationSeconds' || input.key === 'pageViews') {
                    request.input(input.key, mssql_1.default.Int, input.value);
                }
                else if (input.key === 'isBounce') {
                    request.input(input.key, mssql_1.default.Bit, input.value);
                }
            });
            request.input('sessionId', mssql_1.default.NVarChar, sessionId);
            await request.query(query);
        }
        catch (error) {
            throw error;
        }
    }
    static async createPageView(pageViewData) {
        const pool = await (0, database_1.getAppStoreDb)();
        const query = `
      INSERT INTO PageViews (sessionId, pageUrl, pageTitle, timeOnPage, visitedAt)
      VALUES (@sessionId, @pageUrl, @pageTitle, @timeOnPage, GETDATE())
    `;
        try {
            await pool
                .request()
                .input('sessionId', mssql_1.default.NVarChar, pageViewData.sessionId)
                .input('pageUrl', mssql_1.default.NVarChar, pageViewData.pageUrl)
                .input('pageTitle', mssql_1.default.NVarChar, pageViewData.pageTitle || null)
                .input('timeOnPage', mssql_1.default.Int, pageViewData.timeOnPage)
                .query(query);
        }
        catch (error) {
            throw error;
        }
    }
    static async trackEvent(eventData) {
        const pool = await (0, database_1.getAppStoreDb)();
        const query = `
      INSERT INTO VisitorEvents (sessionId, eventType, pageUrl, elementSelector, elementText, additionalData, createdAt)
      VALUES (@sessionId, @eventType, @pageUrl, @elementSelector, @elementText, @additionalData, GETDATE())
    `;
        try {
            await pool
                .request()
                .input('sessionId', mssql_1.default.NVarChar, eventData.sessionId)
                .input('eventType', mssql_1.default.NVarChar, eventData.eventType)
                .input('pageUrl', mssql_1.default.NVarChar, eventData.pageUrl || null)
                .input('elementSelector', mssql_1.default.NVarChar, eventData.elementSelector || null)
                .input('elementText', mssql_1.default.NVarChar, eventData.elementText || null)
                .input('additionalData', mssql_1.default.NVarChar, eventData.additionalData || null)
                .query(query);
        }
        catch (error) {
            throw error;
        }
    }
    static async getVisitorStats(startDate, endDate) {
        const pool = await (0, database_1.getAppStoreDb)();
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
                .input('startDate', mssql_1.default.DateTime2, startDate)
                .input('endDate', mssql_1.default.DateTime2, endDate)
                .query(query);
            return result.recordset[0];
        }
        catch (error) {
            throw error;
        }
    }
    static async getTopPages(startDate, endDate, limit) {
        const pool = await (0, database_1.getAppStoreDb)();
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
                .input('limit', mssql_1.default.Int, limit)
                .input('startDate', mssql_1.default.DateTime2, startDate)
                .input('endDate', mssql_1.default.DateTime2, endDate)
                .query(query);
            return result.recordset;
        }
        catch (error) {
            throw error;
        }
    }
    static async getVisitorTrends(days) {
        const pool = await (0, database_1.getAppStoreDb)();
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
            const result = await pool.request().input('days', mssql_1.default.Int, days).query(query);
            return result.recordset;
        }
        catch (error) {
            throw error;
        }
    }
    static async getDailyStats(date) {
        const pool = await (0, database_1.getAppStoreDb)();
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
            const result = await pool.request().input('date', mssql_1.default.DateTime2, date).query(query);
            return result.recordset[0];
        }
        catch (error) {
            throw error;
        }
    }
}
exports.VisitorTrackingModel = VisitorTrackingModel;
exports.VisitorTrackingModelSingleton = VisitorTrackingModel;
