import sql from 'mssql';
import { getKpiDbConfig } from './app-config';
import { logger } from '../utils/logger';

// KPI Auto Report database
const kpiConfig: sql.config = {
  server: process.env.KPI_DB_HOST || process.env.DB_HOST!,
  database: process.env.KPI_DB_NAME || 'kpi-db',
  user: process.env.KPI_DB_USER || process.env.DB_USER!,
  password: process.env.KPI_DB_PASSWORD || process.env.DB_PASSWORD!,
  port: parseInt(process.env.KPI_DB_PORT || process.env.DB_PORT!),
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

// CAS database (for employees)
const casConfig: sql.config = {
  server: process.env.CAS_DB_HOST || process.env.DB_HOST!,
  database: process.env.CAS_DB_NAME || 'CAS',
  user: process.env.CAS_DB_USER || process.env.DB_USER!,
  password: process.env.CAS_DB_PASSWORD || process.env.DB_PASSWORD!,
  port: parseInt(process.env.CAS_DB_PORT || process.env.DB_PORT!),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 60000,
    requestTimeout: 60000,
    integratedSecurity: false,
  },
  pool: {
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
  },
};

// SPO_Dev database (for departments)
const spoConfig: sql.config = {
  server: process.env.SPO_DB_HOST || process.env.DB_HOST!,
  database: process.env.SPO_DB_NAME || 'SPO_Dev',
  user: process.env.SPO_DB_USER || process.env.DB_USER!,
  password: process.env.SPO_DB_PASSWORD || process.env.DB_PASSWORD!,
  port: parseInt(process.env.SPO_DB_PORT || process.env.DB_PORT!),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 60000,
    requestTimeout: 60000,
    integratedSecurity: false,
  },
  pool: {
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
  },
};

let kpiPool: sql.ConnectionPool | null = null;
let casPool: sql.ConnectionPool | null = null;
let spoPool: sql.ConnectionPool | null = null;

let dbInitialized = false;

const initializeDatabasePools = async (): Promise<void> => {
  if (dbInitialized) return;

  try {
    logger.info('Initializing KPI Auto Report database connection...');

    const kpiDbConfig = getKpiDbConfig();
    if (!kpiDbConfig.host || !kpiDbConfig.database) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(
          'KPI database configuration incomplete. Running in development mode without database.'
        );
        dbInitialized = true;
        return;
      }
      throw new Error(
        'KPI database configuration is incomplete. Check DB_HOST, DB_NAME environment variables.'
      );
    }

    try {
      logger.info('Connecting to KPI database', {
        host: kpiDbConfig.host,
        port: kpiDbConfig.port,
        database: kpiDbConfig.database,
      });
      kpiPool = await new sql.ConnectionPool(kpiConfig).connect();
      logger.info('KPI database connected successfully');

      await ensureSchema(kpiPool);
      await ensureAdminUser(kpiPool);
    } catch (kpiError: unknown) {
      const errMsg = kpiError instanceof Error ? kpiError.message : String(kpiError);
      if (process.env.NODE_ENV === 'development') {
        logger.warn(
          'KPI database connection failed. Continuing in development mode without database.',
          {
            error: errMsg,
            config: {
              host: kpiDbConfig.host,
              port: kpiDbConfig.port,
              database: kpiDbConfig.database,
            },
          }
        );
      } else {
        logger.error('KPI database connection failed', {
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
      logger.info('KPI Auto Report database initialized successfully');
    } else {
      logger.info('Database initialization skipped - running without database in development mode');
    }
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
};

const ensureSchema = async (db: sql.ConnectionPool): Promise<void> => {
  logger.info('Verifying database schema...');

  // KPI tables instead of app-store tables
  const tables = [
    'departments',
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
          .input('tableName', sql.NVarChar, table)
          .query(
            `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName`
          );

        if (result.recordset[0].count === 0) {
          logger.warn(`Table '${table}' does not exist`);
        } else {
          logger.info(`Table '${table}' verified`);
        }
      } catch (tableError: unknown) {
        logger.warn(`Could not verify table '${table}':`, tableError as Record<string, unknown>);
        // Continue with other tables instead of crashing
      }
    }
  } catch (error) {
    logger.error('Schema verification failed, but continuing...', error);
    // Don't throw error, just log and continue
  }
};

const ensureAdminUser = async (_db: sql.ConnectionPool): Promise<void> => {
  logger.info('Admin user management: Users are managed directly in the database');
};

export const initializeDatabase = async (): Promise<void> => {
  return initializeDatabasePools();
};

// Alias for backward compatibility - returns the KPI database
export const getAppStoreDb = async (): Promise<sql.ConnectionPool> => {
  return getKpiDb();
};

export const getKpiDb = async (): Promise<sql.ConnectionPool> => {
  if (!dbInitialized) {
    await initializeDatabasePools();
  }
  if (!kpiPool) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        'KPI database not available in development mode - configure database connection'
      );
    }
    throw new Error('KPI database not available');
  }
  return kpiPool;
};

// Get CAS database (for employees)
export const getCasDb = async (): Promise<sql.ConnectionPool> => {
  if (!dbInitialized) {
    await initializeDatabasePools();
  }
  if (!casPool) {
    // Try to connect if not already
    try {
      casPool = await new sql.ConnectionPool(casConfig).connect();
      logger.info('CAS database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to CAS database', error);
      throw new Error('CAS database not available');
    }
  }
  return casPool;
};

// Get SPO_Dev database (for departments)
export const getSpoDb = async (): Promise<sql.ConnectionPool> => {
  if (!dbInitialized) {
    await initializeDatabasePools();
  }
  if (!spoPool) {
    // Try to connect if not already
    try {
      spoPool = await new sql.ConnectionPool(spoConfig).connect();
      logger.info('SPO_Dev database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to SPO_Dev database', error);
      throw new Error('SPO_Dev database not available');
    }
  }
  return spoPool;
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (kpiPool) {
      await kpiPool.close();
      kpiPool = null;
      logger.info('KPI database connection closed');
    }
    if (casPool) {
      await casPool.close();
      casPool = null;
      logger.info('CAS database connection closed');
    }
    if (spoPool) {
      await spoPool.close();
      spoPool = null;
      logger.info('SPO_Dev database connection closed');
    }
    dbInitialized = false;
  } catch (error) {
    logger.error('Error closing database connection', error);
  }
};

export const testConnections = async (): Promise<{
  kpi: boolean;
  cas: boolean;
  spo: boolean;
  errors: string[];
}> => {
  const results = {
    kpi: false,
    cas: false,
    spo: false,
    errors: [] as string[],
  };

  try {
    const kpiDb = await getKpiDb();
    const result = await kpiDb.request().query('SELECT 1 as test');
    results.kpi = result.recordset[0].test === 1;
  } catch (error: unknown) {
    results.errors.push(`KPI DB: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const casDb = await getCasDb();
    const result = await casDb.request().query('SELECT 1 as test');
    results.cas = result.recordset[0].test === 1;
  } catch (error: unknown) {
    results.errors.push(`CAS DB: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const spoDb = await getSpoDb();
    const result = await spoDb.request().query('SELECT 1 as test');
    results.spo = result.recordset[0].test === 1;
  } catch (error: unknown) {
    results.errors.push(`SPO DB: ${error instanceof Error ? error.message : String(error)}`);
  }

  return results;
};

export default {
  initializeDatabase,
  getAppStoreDb,
  getKpiDb,
  getCasDb,
  getSpoDb,
  closeDatabase,
  testConnections,
};
