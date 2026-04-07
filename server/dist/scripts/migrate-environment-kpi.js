"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function migrateEnvironmentKpi() {
    const config = {
        server: process.env.DB_HOST || '10.73.148.76',
        database: process.env.DB_NAME || 'kpi-db',
        user: process.env.DB_USER || 'inn@admin',
        password: process.env.DB_PASSWORD || 'i@NN636195',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            trustServerCertificate: true,
            encrypt: false,
        },
    };
    console.log('🔄 Starting Environment KPI database migration...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Create environment_sub_categories table
    console.log('📋 Creating environment_sub_categories table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'environment_sub_categories')
    BEGIN
      CREATE TABLE environment_sub_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name_en NVARCHAR(100) NOT NULL,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ environment_sub_categories table created';
    END
    ELSE
    BEGIN
      PRINT '✓ environment_sub_categories table already exists';
    END
  `);
    console.log('✅ environment_sub_categories done\n');
    // Create environment_metrics table
    console.log('📊 Creating environment_metrics table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'environment_metrics')
    BEGIN
      CREATE TABLE environment_metrics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sub_category_id INT NOT NULL REFERENCES environment_sub_categories(id),
        no INT NOT NULL,
        measurement NVARCHAR(500) NOT NULL,
        unit NVARCHAR(50) NULL,
        main NVARCHAR(50) NULL,
        main_relate NVARCHAR(100) NULL,
        fy25_target NVARCHAR(200) NULL,
        description_of_target NVARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ environment_metrics table created';
    END
    ELSE
    BEGIN
      PRINT '✓ environment_metrics table already exists';
    END
  `);
    console.log('✅ environment_metrics done\n');
    // Create environment_data_entries table
    console.log('📝 Creating environment_data_entries table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'environment_data_entries')
    BEGIN
      CREATE TABLE environment_data_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metric_id INT NOT NULL REFERENCES environment_metrics(id),
        month NVARCHAR(20) NOT NULL,
        year INT NOT NULL,
        target NVARCHAR(100) NULL,
        result NVARCHAR(100) NULL,
        accu_target NVARCHAR(100) NULL,
        accu_result NVARCHAR(100) NULL,
        forecast NVARCHAR(100) NULL,
        reason NVARCHAR(MAX) NULL,
        recover_activity NVARCHAR(MAX) NULL,
        forecast_result_total NVARCHAR(100) NULL,
        recovery_month NVARCHAR(50) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_environment_entry_month UNIQUE (metric_id, month, year)
      );
      PRINT '✓ environment_data_entries table created';
    END
    ELSE
    BEGIN
      PRINT '✓ environment_data_entries table already exists';
    END
  `);
    console.log('✅ environment_data_entries done\n');
    // Create environment_departments table
    console.log('🏢 Creating environment_departments table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'environment_departments')
    BEGIN
      CREATE TABLE environment_departments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ environment_departments table created';
    END
    ELSE
    BEGIN
      PRINT '✓ environment_departments table already exists';
    END
  `);
    console.log('✅ environment_departments done\n');
    // Create environment_department_entries table
    console.log('📊 Creating environment_department_entries table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'environment_department_entries')
    BEGIN
      CREATE TABLE environment_department_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metric_id INT NOT NULL REFERENCES environment_metrics(id),
        department_id INT NOT NULL REFERENCES environment_departments(id),
        month NVARCHAR(20) NOT NULL,
        year INT NOT NULL,
        value NVARCHAR(100) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_environment_dept_entry UNIQUE (metric_id, department_id, month, year)
      );
      PRINT '✓ environment_department_entries table created';
    END
    ELSE
    BEGIN
      PRINT '✓ environment_department_entries table already exists';
    END
  `);
    console.log('✅ environment_department_entries done\n');
    await pool.close();
    console.log('✅ Environment KPI migration completed successfully!');
}
migrateEnvironmentKpi().catch(console.error);
