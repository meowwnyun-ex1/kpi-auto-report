"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const VisitorTracking_1 = require("../models/VisitorTracking");
const logger_1 = require("../utils/logger");
const express_rate_limit_1 = require("express-rate-limit");
const crypto_1 = require("crypto");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Rate limiting for tracking endpoints
const trackingLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many tracking requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
// Helper function to parse cookies from header (no cookie-parser dependency needed)
const parseCookies = (req) => {
    const header = req.headers.cookie || '';
    const cookies = {};
    header.split(';').forEach((pair) => {
        const [key, ...rest] = pair.split('=');
        if (key) {
            cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
        }
    });
    return cookies;
};
// Helper function to get client IP
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    return forwarded
        ? forwarded.split(',')[0]
        : realIp || req.connection.remoteAddress || req.socket.remoteAddress || '';
};
// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
    const ua = userAgent.toLowerCase();
    // Browser detection
    let browser = 'Unknown';
    if (ua.includes('chrome'))
        browser = 'Chrome';
    else if (ua.includes('firefox'))
        browser = 'Firefox';
    else if (ua.includes('safari'))
        browser = 'Safari';
    else if (ua.includes('edge'))
        browser = 'Edge';
    else if (ua.includes('opera'))
        browser = 'Opera';
    // OS detection
    let os = 'Unknown';
    if (ua.includes('windows'))
        os = 'Windows';
    else if (ua.includes('mac'))
        os = 'macOS';
    else if (ua.includes('linux'))
        os = 'Linux';
    else if (ua.includes('android'))
        os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad'))
        os = 'iOS';
    // Device type detection
    const isMobile = /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isTablet = /ipad|tablet|kindle/i.test(ua);
    const isDesktop = !isMobile && !isTablet;
    return {
        browser,
        os,
        isMobile,
        isTablet,
        isDesktop,
        deviceType: isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop',
    };
};
// Track page visit
router.post('/track', trackingLimiter, async (req, res) => {
    try {
        const { pageUrl, pageTitle, referrer } = req.body;
        if (!pageUrl) {
            return res.status(400).json({ error: 'pageUrl is required' });
        }
        const cookies = parseCookies(req);
        const sessionId = cookies.visitorSession || (0, crypto_1.randomUUID)();
        const ipAddress = getClientIp(req);
        const userAgent = req.headers['user-agent'] || '';
        const deviceInfo = parseUserAgent(userAgent);
        // Check if session exists
        let session = await VisitorTracking_1.VisitorTrackingModel.getSession(sessionId);
        if (!session) {
            // Create new session
            session = await VisitorTracking_1.VisitorTrackingModel.createSession({
                sessionId,
                ipAddress,
                userAgent,
                referrer,
                landingPage: pageUrl,
                ...deviceInfo,
            });
            // Set session cookie
            res.cookie('visitorSession', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            });
        }
        else {
            // Update existing session
            const now = new Date();
            const duration = Math.floor((now.getTime() - (session.lastActivity?.getTime() || now.getTime())) / 1000);
            await VisitorTracking_1.VisitorTrackingModel.updateSession(sessionId, {
                lastActivity: now,
                durationSeconds: session.durationSeconds + duration,
                pageViews: session.pageViews + 1,
                isBounce: false,
            });
        }
        // Create page view
        await VisitorTracking_1.VisitorTrackingModel.createPageView({
            sessionId,
            pageUrl,
            pageTitle,
            timeOnPage: 0,
        });
        res.json({ success: true, sessionId });
    }
    catch (error) {
        // Gracefully handle missing tables (not yet migrated) or database connection issues
        const errorMessage = error?.message || '';
        const errorCode = error?.code || '';
        if (error?.number === 208 ||
            errorMessage?.includes('Invalid object name') ||
            errorMessage?.includes('Failed to connect') ||
            errorMessage?.includes('ENOTFOUND') ||
            errorMessage?.includes('ECONNREFUSED') ||
            errorMessage?.includes('connection') ||
            errorMessage?.includes('database') ||
            errorMessage?.includes('not available') ||
            errorCode === 'ECONNREFUSED' ||
            errorCode === 'ESOCKET' ||
            error?.name === 'ConnectionError') {
            logger_1.logger.warn('Visitor tracking database not available. Tracking disabled.', {
                error: errorMessage,
            });
            return res.json({ success: true, skipped: true, reason: 'database_not_available' });
        }
        logger_1.logger.error('Error tracking page visit', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Track custom event
router.post('/event', trackingLimiter, async (req, res) => {
    try {
        const { eventType, pageUrl, elementSelector, elementText, additionalData } = req.body;
        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required' });
        }
        const cookies = parseCookies(req);
        const sessionId = cookies.visitorSession;
        if (!sessionId) {
            return res.json({ success: true, skipped: true });
        }
        await VisitorTracking_1.VisitorTrackingModel.trackEvent({
            eventType,
            sessionId,
            pageUrl,
            elementSelector,
            elementText,
            additionalData: additionalData ? JSON.stringify(additionalData) : undefined,
        });
        res.json({ success: true });
    }
    catch (error) {
        if (error?.number === 208 ||
            error?.message?.includes('Invalid object name') ||
            error?.message?.includes('Failed to connect') ||
            error?.message?.includes('ENOTFOUND') ||
            error?.message?.includes('ECONNREFUSED') ||
            error?.code === 'ECONNREFUSED') {
            logger_1.logger.warn('Visitor tracking database not available. Event tracking disabled.');
            return res.json({ success: true, skipped: true, reason: 'database_not_available' });
        }
        logger_1.logger.error('Error tracking event', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get visitor statistics (admin only)
router.get('/stats', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        const [stats, topPages, trends] = await Promise.all([
            VisitorTracking_1.VisitorTrackingModel.getVisitorStats(start, end),
            VisitorTracking_1.VisitorTrackingModel.getTopPages(start, end, 10),
            VisitorTracking_1.VisitorTrackingModel.getVisitorTrends(30),
        ]);
        // Ensure null-safe stats with defaults
        const safeStats = {
            total_visitors: stats?.total_visitors ?? 0,
            unique_visitors: stats?.unique_visitors ?? 0,
            total_page_views: stats?.total_page_views ?? 0,
            bounce_rate: stats?.bounce_rate ?? 0,
            avg_session_duration: stats?.avg_session_duration ?? 0,
            mobile_visitors: stats?.mobile_visitors ?? 0,
            desktop_visitors: stats?.desktop_visitors ?? 0,
            tablet_visitors: stats?.tablet_visitors ?? 0,
        };
        res.json({
            stats: safeStats,
            topPages: topPages || [],
            trends: trends || [],
        });
    }
    catch (error) {
        // Gracefully handle missing tables or database connection issues
        if (error?.number === 208 ||
            error?.message?.includes('Invalid object name') ||
            error?.message?.includes('Failed to connect') ||
            error?.message?.includes('ENOTFOUND') ||
            error?.message?.includes('ECONNREFUSED') ||
            error?.code === 'ECONNREFUSED') {
            logger_1.logger.warn('Visitor tracking database not available. Stats disabled.');
            return res.json({
                stats: {
                    total_visitors: 0,
                    unique_visitors: 0,
                    total_page_views: 0,
                    bounce_rate: 0,
                    avg_session_duration: 0,
                    mobile_visitors: 0,
                    desktop_visitors: 0,
                    tablet_visitors: 0,
                },
                topPages: [],
                trends: [],
                skipped: true,
                reason: 'database_not_available',
            });
        }
        logger_1.logger.error('Error getting visitor stats', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get daily statistics
router.get('/daily-stats', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'date is required' });
        }
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        const stats = await VisitorTracking_1.VisitorTrackingModel.getDailyStats(targetDate);
        res.json(stats);
    }
    catch (error) {
        if (error?.number === 208 ||
            error?.message?.includes('Invalid object name') ||
            error?.message?.includes('Failed to connect') ||
            error?.message?.includes('ENOTFOUND') ||
            error?.message?.includes('ECONNREFUSED') ||
            error?.code === 'ECONNREFUSED') {
            logger_1.logger.warn('Visitor tracking database not available. Daily stats disabled.');
            return res.json(null);
        }
        logger_1.logger.error('Error getting daily stats', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get visitor trends
router.get('/trends', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const parsedDays = parseInt(days);
        if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
            return res.status(400).json({ error: 'days must be between 1 and 365' });
        }
        const trends = await VisitorTracking_1.VisitorTrackingModel.getVisitorTrends(parsedDays);
        res.json(trends);
    }
    catch (error) {
        if (error?.number === 208 ||
            error?.message?.includes('Invalid object name') ||
            error?.message?.includes('Failed to connect') ||
            error?.message?.includes('ENOTFOUND') ||
            error?.message?.includes('ECONNREFUSED') ||
            error?.code === 'ECONNREFUSED') {
            logger_1.logger.warn('Visitor tracking database not available. Trends disabled.');
            return res.json([]);
        }
        logger_1.logger.error('Error getting visitor trends', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get top pages
router.get('/top-pages', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), async (req, res) => {
    try {
        const { startDate, endDate, limit = 10 } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            return res.status(400).json({ error: 'limit must be between 1 and 100' });
        }
        const topPages = await VisitorTracking_1.VisitorTrackingModel.getTopPages(start, end, parsedLimit);
        res.json(topPages);
    }
    catch (error) {
        if (error?.number === 208 ||
            error?.message?.includes('Invalid object name') ||
            error?.message?.includes('Failed to connect') ||
            error?.message?.includes('ENOTFOUND') ||
            error?.message?.includes('ECONNREFUSED') ||
            error?.code === 'ECONNREFUSED') {
            logger_1.logger.warn('Visitor tracking database not available. Top pages disabled.');
            return res.json([]);
        }
        logger_1.logger.error('Error getting top pages', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
