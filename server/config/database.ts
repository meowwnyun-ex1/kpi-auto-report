import sql from 'mssql';
import { getKpiDbConfig } from './app-config';
import { logger } from '../utils/logger';

/**
 * Database Configuration
 *
 * Server 76 (10.73.148.76) - ALL DATABASES
 * - kpi-db: Main KPI application database (READ-WRITE)
 * - SPO_Dev: Department names (READ-WRITE)
 * - CAS_Dev: Employee data (READ-ONLY)
 */

// KPI database - Main application database
const kpiConfig: sql.config = {
  server: process.env.KPI_DB_HOST || '',
  database: process.env.KPI_DB_NAME || '',
  user: process.env.KPI_DB_USER || '',
  password: process.env.KPI_DB_PASSWORD || '',
  port: parseInt(process.env.KPI_DB_PORT || '1433'),
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

// CAS_Dev database - Employee data
const casConfig: sql.config = {
  server: process.env.CAS_DB_HOST || '',
  database: process.env.CAS_DB_NAME || '',
  user: process.env.CAS_DB_USER || '',
  password: process.env.CAS_DB_PASSWORD || '',
  port: parseInt(process.env.CAS_DB_PORT || '1433'),
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

// SPO_Dev database - Department names
const spoConfig: sql.config = {
  server: process.env.SPO_DB_HOST || '',
  database: process.env.SPO_DB_NAME || '',
  user: process.env.SPO_DB_USER || '',
  password: process.env.SPO_DB_PASSWORD || '',
  port: parseInt(process.env.SPO_DB_PORT || '1433'),
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
    logger.info('Initializing KPI Management Tool database connection...');

    const kpiDbConfig = getKpiDbConfig();
    logger.info('KPI DB Config loaded', {
      host: kpiDbConfig.host,
      database: kpiDbConfig.database,
      port: kpiDbConfig.port,
    });

    if (!kpiDbConfig.host || !kpiDbConfig.database) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(
          'KPI database configuration incomplete. Running in development mode without database.',
          { host: kpiDbConfig.host, database: kpiDbConfig.database }
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
      logger.info('KPI Management Tool database initialized successfully');
    } else {
      logger.info('Database initialization skipped - running without database in development mode');
    }
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
};

const ensureSchema = async (db: sql.ConnectionPool): Promise<void> => {
  logger.info('Checking schema...');

  // Create approval system tables if they don't exist
  const tableMigrations = [
    {
      name: 'kpi_department_approvers',
      sql: `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kpi_department_approvers')
        CREATE TABLE kpi_department_approvers (
            id INT IDENTITY(1,1) PRIMARY KEY,
            department_id INT NOT NULL,
            department_name NVARCHAR(200) NOT NULL,
            hos_approvers NVARCHAR(MAX),
            hod_approvers NVARCHAR(MAX),
            is_active BIT DEFAULT 1,
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE()
        )
      `,
    },
    {
      name: 'kpi_approval_logs',
      sql: `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kpi_approval_logs')
        CREATE TABLE kpi_approval_logs (
            id INT IDENTITY(1,1) PRIMARY KEY,
            entity_type NVARCHAR(50) NOT NULL,
            entity_id INT NOT NULL,
            approval_level NVARCHAR(50) NOT NULL,
            approver_id INT,
            action NVARCHAR(20) NOT NULL,
            comments NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE()
        )
      `,
    },
    {
      name: 'kpi_result_declarations',
      sql: `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kpi_result_declarations')
        CREATE TABLE kpi_result_declarations (
            id INT IDENTITY(1,1) PRIMARY KEY,
            monthly_result_id INT NOT NULL,
            declaration_text NVARCHAR(MAX) NOT NULL,
            attachment_url NVARCHAR(500),
            created_at DATETIME DEFAULT GETDATE()
        )
      `,
    },
    {
      name: 'kpi_notifications',
      sql: `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'kpi_notifications')
        CREATE TABLE kpi_notifications (
            id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT NOT NULL,
            notification_type NVARCHAR(50) NOT NULL,
            entity_type NVARCHAR(50) NOT NULL,
            entity_id INT NOT NULL,
            title NVARCHAR(200) NOT NULL,
            message NVARCHAR(MAX) NOT NULL,
            is_read BIT DEFAULT 0,
            created_at DATETIME DEFAULT GETDATE()
        )
      `,
    },
  ];

  for (const table of tableMigrations) {
    try {
      await db.request().query(table.sql);
      logger.info(`Checked/created table: ${table.name}`);
    } catch (err) {
      logger.warn(`Could not create table ${table.name}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const migrations: { table: string; column: string; type: string; default?: string }[] = [
    // ── kpi_categories ──
    { table: 'kpi_categories', column: 'color', type: 'NVARCHAR(20)' },
    { table: 'kpi_categories', column: 'sort_order', type: 'INT', default: '0' },
    { table: 'kpi_categories', column: 'is_active', type: 'BIT', default: '1' },
    // ── kpi_yearly_targets ──
    { table: 'kpi_yearly_targets', column: 'fiscal_year', type: 'INT' },
    { table: 'kpi_yearly_targets', column: 'measurement_id', type: 'INT' },
    { table: 'kpi_yearly_targets', column: 'company_policy', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'department_policy', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'key_actions', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'fy_target_text', type: 'NVARCHAR(500)' },
    { table: 'kpi_yearly_targets', column: 'main_pic', type: 'NVARCHAR(200)' },
    { table: 'kpi_yearly_targets', column: 'main_support', type: 'NVARCHAR(200)' },
    { table: 'kpi_yearly_targets', column: 'president_approved', type: 'BIT', default: '0' },
    { table: 'kpi_yearly_targets', column: 'vp_approved', type: 'BIT', default: '0' },
    { table: 'kpi_yearly_targets', column: 'dept_head_approved', type: 'BIT', default: '0' },
    { table: 'kpi_yearly_targets', column: 'remaining_kadai', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'environment_changes', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'support_sdm', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'support_skd', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'total_quota', type: 'DECIMAL(18,4)', default: '0' },
    { table: 'kpi_yearly_targets', column: 'used_quota', type: 'DECIMAL(18,4)', default: '0' },
    { table: 'kpi_yearly_targets', column: 'dept_quota', type: 'DECIMAL(18,4)', default: '0' },
    { table: 'kpi_yearly_targets', column: 'target_type', type: 'NVARCHAR(50)' },
    { table: 'kpi_yearly_targets', column: 'main_relate', type: 'NVARCHAR(255)' },
    { table: 'kpi_yearly_targets', column: 'measurement', type: 'NVARCHAR(500)' },
    { table: 'kpi_yearly_targets', column: 'unit', type: 'NVARCHAR(50)' },
    { table: 'kpi_yearly_targets', column: 'main', type: 'NVARCHAR(50)' },
    { table: 'kpi_yearly_targets', column: 'description_of_target', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_yearly_targets', column: 'sort_order', type: 'INT', default: '0' },
    // ── kpi_monthly_targets ──
    { table: 'kpi_monthly_targets', column: 'measurement', type: 'NVARCHAR(500)' },
    { table: 'kpi_monthly_targets', column: 'unit', type: 'NVARCHAR(50)' },
    { table: 'kpi_monthly_targets', column: 'main', type: 'NVARCHAR(50)' },
    { table: 'kpi_monthly_targets', column: 'main_relate', type: 'NVARCHAR(255)' },
    { table: 'kpi_monthly_targets', column: 'ev', type: 'NVARCHAR(10)' },
    { table: 'kpi_monthly_targets', column: 'accu_target', type: 'DECIMAL(18,4)' },
    { table: 'kpi_monthly_targets', column: 'accu_result', type: 'DECIMAL(18,4)' },
    { table: 'kpi_monthly_targets', column: 'forecast', type: 'DECIMAL(18,4)' },
    { table: 'kpi_monthly_targets', column: 'reason', type: 'NVARCHAR(1000)' },
    { table: 'kpi_monthly_targets', column: 'recover_activity', type: 'NVARCHAR(1000)' },
    { table: 'kpi_monthly_targets', column: 'recovery_month', type: 'INT' },
    { table: 'kpi_monthly_targets', column: 'comment', type: 'NVARCHAR(MAX)' },
    { table: 'kpi_monthly_targets', column: 'image_url', type: 'NVARCHAR(500)' },
    { table: 'kpi_monthly_targets', column: 'image_caption', type: 'NVARCHAR(500)' },
    { table: 'kpi_monthly_targets', column: 'dept_head_approved', type: 'BIT', default: '0' },
    { table: 'kpi_monthly_targets', column: 'approved_by', type: 'INT' },
    { table: 'kpi_monthly_targets', column: 'approved_at', type: 'DATETIME' },
    { table: 'kpi_monthly_targets', column: 'total_quota', type: 'DECIMAL(18,4)' },
    { table: 'kpi_monthly_targets', column: 'dept_quota', type: 'DECIMAL(18,4)' },
    { table: 'kpi_monthly_targets', column: 'target_type', type: 'NVARCHAR(50)' },
    // ── kpi_measurements ──
    { table: 'kpi_measurements', column: 'main', type: 'NVARCHAR(50)' },
    { table: 'kpi_measurements', column: 'main_relate', type: 'NVARCHAR(255)' },
    { table: 'kpi_measurements', column: 'description_of_target', type: 'NVARCHAR(MAX)' },
    // ── kpi_department_mapping ──
    { table: 'kpi_department_mapping', column: 'company', type: 'NVARCHAR(100)' },
    { table: 'kpi_department_mapping', column: 'is_active', type: 'BIT', default: '1' },
    // ── Approval System: yearly_targets ──
    {
      table: 'kpi_yearly_targets',
      column: 'approval_status',
      type: 'NVARCHAR(50)',
      default: "'pending'",
    },
    { table: 'kpi_yearly_targets', column: 'hos_approved', type: 'BIT', default: '0' },
    { table: 'kpi_yearly_targets', column: 'hod_approved', type: 'BIT', default: '0' },
    { table: 'kpi_yearly_targets', column: 'approval_version', type: 'INT', default: '1' },
    // ── Approval System: monthly_targets ──
    {
      table: 'kpi_monthly_targets',
      column: 'approval_status',
      type: 'NVARCHAR(50)',
      default: "'pending'",
    },
    { table: 'kpi_monthly_targets', column: 'hos_approved', type: 'BIT', default: '0' },
    { table: 'kpi_monthly_targets', column: 'hod_approved', type: 'BIT', default: '0' },
    { table: 'kpi_monthly_targets', column: 'approval_version', type: 'INT', default: '1' },
    {
      table: 'kpi_monthly_targets',
      column: 'result_approval_status',
      type: 'NVARCHAR(50)',
      default: "'pending'",
    },
    { table: 'kpi_monthly_targets', column: 'result_hos_approved', type: 'BIT', default: '0' },
    { table: 'kpi_monthly_targets', column: 'result_hod_approved', type: 'BIT', default: '0' },
    { table: 'kpi_monthly_targets', column: 'result_admin_approved', type: 'BIT', default: '0' },
    { table: 'kpi_monthly_targets', column: 'is_incomplete', type: 'BIT', default: '0' },
    // ── Approval System: additional columns for yearly_targets ──
    { table: 'kpi_yearly_targets', column: 'hos_approved_by', type: 'INT' },
    { table: 'kpi_yearly_targets', column: 'hod_approved_by', type: 'INT' },
    { table: 'kpi_yearly_targets', column: 'hos_approved_at', type: 'DATETIME' },
    { table: 'kpi_yearly_targets', column: 'hod_approved_at', type: 'DATETIME' },
    // ── Approval System: additional columns for monthly_targets (approval) ──
    { table: 'kpi_monthly_targets', column: 'hos_approved_by', type: 'INT' },
    { table: 'kpi_monthly_targets', column: 'hod_approved_by', type: 'INT' },
    { table: 'kpi_monthly_targets', column: 'hos_approved_at', type: 'DATETIME' },
    { table: 'kpi_monthly_targets', column: 'hod_approved_at', type: 'DATETIME' },
    // ── Approval System: additional columns for monthly_targets (result approval) ──
    { table: 'kpi_monthly_targets', column: 'result_hos_approved_by', type: 'INT' },
    { table: 'kpi_monthly_targets', column: 'result_hod_approved_by', type: 'INT' },
    { table: 'kpi_monthly_targets', column: 'result_admin_approved_by', type: 'INT' },
    { table: 'kpi_monthly_targets', column: 'result_hos_approved_at', type: 'DATETIME' },
    { table: 'kpi_monthly_targets', column: 'result_hod_approved_at', type: 'DATETIME' },
    { table: 'kpi_monthly_targets', column: 'result_admin_approved_at', type: 'DATETIME' },
    { table: 'kpi_monthly_targets', column: 'result_approval_version', type: 'INT', default: '1' },
  ];

  try {
    for (const m of migrations) {
      try {
        const colCheck = await db
          .request()
          .query(
            `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${m.table}' AND COLUMN_NAME='${m.column}'`
          );
        if (colCheck.recordset[0].cnt === 0) {
          const defClause = m.default ? ` DEFAULT ${m.default}` : '';
          await db.request().query(`ALTER TABLE ${m.table} ADD ${m.column} ${m.type}${defClause}`);
          logger.info(`Added column ${m.table}.${m.column}`);
        }
      } catch (colErr: unknown) {
        logger.warn(
          `Could not add column ${m.table}.${m.column}:`,
          colErr as Record<string, unknown>
        );
      }
    }
  } catch (error) {
    logger.error('Schema migration failed, but continuing...', error);
  }
};

const ensureAdminUser = async (_db: sql.ConnectionPool): Promise<void> => {
  logger.info('Admin user management: Users are managed directly in the database');
};

export const initializeDatabase = async (): Promise<void> => {
  return initializeDatabasePools();
};

export const getKpiDb = async (): Promise<sql.ConnectionPool> => {
  if (!dbInitialized) {
    await initializeDatabasePools();
  }
  if (!kpiPool) {
    // Try to connect if not already
    try {
      logger.info('Attempting to connect to KPI database...');
      kpiPool = await new sql.ConnectionPool(kpiConfig).connect();
      logger.info('KPI database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to KPI database', error);
      throw new Error('KPI database not available');
    }
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

// Get SPO_Dev database (for dept_master - department master data)
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
  getKpiDb,
  getCasDb,
  getSpoDb,
  closeDatabase,
  testConnections,
};
