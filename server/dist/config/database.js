"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnections = exports.closeDatabase = exports.getKpiDb = exports.getAppStoreDb = exports.initializeDatabase = void 0;
const mssql_1 = __importDefault(require("mssql"));
const app_config_1 = require("./app-config");
const logger_1 = require("../utils/logger");
// KPI Auto Report uses a single database: kpi-db
const kpiConfig = {
    server: process.env.KPI_DB_HOST || process.env.DB_HOST,
    database: process.env.KPI_DB_NAME || 'kpi-db',
    user: process.env.KPI_DB_USER || process.env.DB_USER,
    password: process.env.KPI_DB_PASSWORD || process.env.DB_PASSWORD,
    port: parseInt(process.env.KPI_DB_PORT || process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectionTimeout: 60000,
        requestTimeout: 60000,
        integratedSecurity: false,
    },
    pool: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
    },
};
let kpiPool = null;
let dbInitialized = false;
const initializeDatabasePools = async () => {
    if (dbInitialized)
        return;
    try {
        logger_1.logger.info('Initializing KPI Auto Report database connection...');
        const kpiDbConfig = (0, app_config_1.getKpiDbConfig)();
        if (!kpiDbConfig.host || !kpiDbConfig.database) {
            if (process.env.NODE_ENV === 'development') {
                logger_1.logger.warn('KPI database configuration incomplete. Running in development mode without database.');
                dbInitialized = true;
                return;
            }
            throw new Error('KPI database configuration is incomplete. Check DB_HOST, DB_NAME environment variables.');
        }
        try {
            logger_1.logger.info('Connecting to KPI database', {
                host: kpiDbConfig.host,
                port: kpiDbConfig.port,
                database: kpiDbConfig.database,
            });
            kpiPool = await new mssql_1.default.ConnectionPool(kpiConfig).connect();
            logger_1.logger.info('KPI database connected successfully');
            await ensureSchema(kpiPool);
            await ensureAdminUser(kpiPool);
        }
        catch (kpiError) {
            const errMsg = kpiError instanceof Error ? kpiError.message : String(kpiError);
            if (process.env.NODE_ENV === 'development') {
                logger_1.logger.warn('KPI database connection failed. Continuing in development mode without database.', {
                    error: errMsg,
                    config: {
                        host: kpiDbConfig.host,
                        port: kpiDbConfig.port,
                        database: kpiDbConfig.database,
                    },
                });
            }
            else {
                logger_1.logger.error('KPI database connection failed', {
                    error: errMsg,
                    config: {
                        host: kpiDbConfig.host,
                        port: kpiDbConfig.port,
                        database: kpiDbConfig.database,
                    },
                });
                throw new Error(`Failed to connect to KPI database: ${errMsg}`);
            }
        }
        if (!kpiPool && process.env.NODE_ENV !== 'development') {
            throw new Error('Database connection is required');
        }
        dbInitialized = true;
        if (kpiPool) {
            logger_1.logger.info('KPI Auto Report database initialized successfully');
        }
        else {
            logger_1.logger.info('Database initialization skipped - running without database in development mode');
        }
    }
    catch (error) {
        logger_1.logger.error('Database initialization failed', error);
        throw error;
    }
};
const ensureSchema = async (db) => {
    logger_1.logger.info('Verifying database schema...');
    // KPI tables instead of app-store tables
    const tables = [
        'kpi_categories',
        'kpi_sub_categories',
        'kpi_metrics',
        'kpi_data_entries',
        'quality_sub_categories',
        'quality_metrics',
    ];
    try {
        for (const table of tables) {
            try {
                const result = await db
                    .request()
                    .input('tableName', mssql_1.default.NVarChar, table)
                    .query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName`);
                if (result.recordset[0].count === 0) {
                    logger_1.logger.warn(`Table '${table}' does not exist`);
                }
                else {
                    logger_1.logger.info(`Table '${table}' verified`);
                }
            }
            catch (tableError) {
                logger_1.logger.warn(`Could not verify table '${table}':`, tableError);
                // Continue with other tables instead of crashing
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Schema verification failed, but continuing...', error);
        // Don't throw error, just log and continue
    }
};
const ensureAdminUser = async (_db) => {
    logger_1.logger.info('Admin user management: Users are managed directly in the database');
};
const initializeDatabase = async () => {
    return initializeDatabasePools();
};
exports.initializeDatabase = initializeDatabase;
// Alias for backward compatibility - returns the KPI database
const getAppStoreDb = async () => {
    return (0, exports.getKpiDb)();
};
exports.getAppStoreDb = getAppStoreDb;
const getKpiDb = async () => {
    if (!dbInitialized) {
        await initializeDatabasePools();
    }
    if (!kpiPool) {
        if (process.env.NODE_ENV === 'development') {
            throw new Error('KPI database not available in development mode - configure database connection');
        }
        throw new Error('KPI database not available');
    }
    return kpiPool;
};
exports.getKpiDb = getKpiDb;
const closeDatabase = async () => {
    try {
        if (kpiPool) {
            await kpiPool.close();
            kpiPool = null;
            logger_1.logger.info('KPI database connection closed');
        }
        dbInitialized = false;
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection', error);
    }
};
exports.closeDatabase = closeDatabase;
const testConnections = async () => {
    const results = {
        kpi: false,
        errors: [],
    };
    try {
        const kpiDb = await (0, exports.getKpiDb)();
        const result = await kpiDb.request().query('SELECT 1 as test');
        results.kpi = result.recordset[0].test === 1;
    }
    catch (error) {
        results.errors.push(`KPI DB: ${error instanceof Error ? error.message : String(error)}`);
    }
    return results;
};
exports.testConnections = testConnections;
exports.default = {
    initializeDatabase: exports.initializeDatabase,
    getAppStoreDb: exports.getAppStoreDb,
    getKpiDb: exports.getKpiDb,
    closeDatabase: exports.closeDatabase,
    testConnections: exports.testConnections,
};
