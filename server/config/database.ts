import sql from 'mssql';
import { getAppStoreDbConfig } from './app-config';
import { logger } from '../utils/logger';

const appStoreConfig: sql.config = {
  server: process.env.DB_HOST!,
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  port: parseInt(process.env.DB_PORT!),
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

let appStorePool: sql.ConnectionPool | null = null;

let dbInitialized = false;

const initializeDatabasePools = async (): Promise<void> => {
  if (dbInitialized) return;

  try {
    logger.info('Initializing database connections...');

    const appStoreDbConfig = getAppStoreDbConfig();
    if (!appStoreDbConfig.host || !appStoreDbConfig.database) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(
          'App Store database configuration incomplete. Running in development mode without database.'
        );
        dbInitialized = true;
        return;
      }
      throw new Error(
        'App Store database configuration is incomplete. Check DB_HOST, DB_NAME environment variables.'
      );
    }

    try {
      logger.info('Connecting to App Store database', {
        host: appStoreDbConfig.host,
        port: appStoreDbConfig.port,
        database: appStoreDbConfig.database,
      });
      appStorePool = await new sql.ConnectionPool(appStoreConfig).connect();
      logger.info('App Store database connected');

      await ensureSchema(appStorePool);
      await ensureAdminUser(appStorePool);
    } catch (appStoreError: unknown) {
      const errMsg = appStoreError instanceof Error ? appStoreError.message : String(appStoreError);
      if (process.env.NODE_ENV === 'development') {
        logger.warn(
          'App Store database connection failed. Continuing in development mode without database.',
          {
            error: errMsg,
            config: {
              host: appStoreDbConfig.host,
              port: appStoreDbConfig.port,
              database: appStoreDbConfig.database,
            },
          }
        );
        // Don't throw error in development, continue without database
      } else {
        logger.error('App Store database connection failed', {
          error: errMsg,
          config: {
            host: appStoreDbConfig.host,
            port: appStoreDbConfig.port,
            database: appStoreDbConfig.database,
          },
        });
        throw new Error(`Failed to connect to App Store database: ${errMsg}`);
      }
    }

    if (!appStorePool && process.env.NODE_ENV !== 'development') {
      throw new Error('App Store database connection is required');
    }

    dbInitialized = true;
    if (appStorePool) {
      logger.info('Database initialization completed successfully');
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

  const tables = ['applications', 'categories', 'users', 'banners', 'trips'];

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

export const getAppStoreDb = async (): Promise<sql.ConnectionPool> => {
  if (!dbInitialized) {
    await initializeDatabasePools();
  }
  if (!appStorePool) {
    if (process.env.NODE_ENV === 'development') {
      throw new Error(
        'Database not available in development mode - configure database connection or check if endpoints handle database errors gracefully'
      );
    }
    throw new Error('App Store database not available');
  }
  return appStorePool;
};

export const closeDatabase = async (): Promise<void> => {
  try {
    if (appStorePool) {
      await appStorePool.close();
      appStorePool = null;
      logger.info('App Store database connection closed');
    }
    dbInitialized = false;
  } catch (error) {
    logger.error('Error closing database connections', error);
  }
};

export const testConnections = async (): Promise<{
  appStore: boolean;
  errors: string[];
}> => {
  const results = {
    appStore: false,
    errors: [] as string[],
  };

  try {
    const appStoreDb = await getAppStoreDb();
    const result = await appStoreDb.request().query('SELECT 1 as test');
    results.appStore = result.recordset[0].test === 1;
  } catch (error: unknown) {
    results.errors.push(`App Store DB: ${error instanceof Error ? error.message : String(error)}`);
  }

  return results;
};

export default {
  initializeDatabase,
  getAppStoreDb,
  closeDatabase,
  testConnections,
};
