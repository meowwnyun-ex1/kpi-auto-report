"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function migrateAttractiveKpi() {
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
    console.log('🔄 Starting Attractive KPI database migration...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Create attractive_sub_categories table
    console.log('📋 Creating attractive_sub_categories table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'attractive_sub_categories')
    BEGIN
      CREATE TABLE attractive_sub_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name_en NVARCHAR(100) NOT NULL,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ attractive_sub_categories table created';
    END
    ELSE
    BEGIN
      PRINT '✓ attractive_sub_categories table already exists';
    END
  `);
    console.log('✅ attractive_sub_categories done\n');
    // Create attractive_metrics table
    console.log('📊 Creating attractive_metrics table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'attractive_metrics')
    BEGIN
      CREATE TABLE attractive_metrics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sub_category_id INT NOT NULL REFERENCES attractive_sub_categories(id),
        no INT NOT NULL,
        measurement NVARCHAR(500) NOT NULL,
        unit NVARCHAR(50) NULL,
        main NVARCHAR(50) NULL,
        main_relate NVARCHAR(100) NULL,
        fy25_target NVARCHAR(200) NULL,
        description_of_target NVARCHAR(MAX) NULL,
        remark NVARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ attractive_metrics table created';
    END
    ELSE
    BEGIN
      PRINT '✓ attractive_metrics table already exists';
    END
  `);
    console.log('✅ attractive_metrics done\n');
    // Create attractive_data_entries table
    console.log('📝 Creating attractive_data_entries table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'attractive_data_entries')
    BEGIN
      CREATE TABLE attractive_data_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metric_id INT NOT NULL REFERENCES attractive_metrics(id),
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
        remark NVARCHAR(MAX) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_attractive_entry_month UNIQUE (metric_id, month, year)
      );
      PRINT '✓ attractive_data_entries table created';
    END
    ELSE
    BEGIN
      PRINT '✓ attractive_data_entries table already exists';
    END
  `);
    console.log('✅ attractive_data_entries done\n');
    // Create attractive_departments table
    console.log('🏢 Creating attractive_departments table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'attractive_departments')
    BEGIN
      CREATE TABLE attractive_departments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ attractive_departments table created';
    END
    ELSE
    BEGIN
      PRINT '✓ attractive_departments table already exists';
    END
  `);
    console.log('✅ attractive_departments done\n');
    // Create attractive_department_entries table
    console.log('📊 Creating attractive_department_entries table...');
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'attractive_department_entries')
    BEGIN
      CREATE TABLE attractive_department_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metric_id INT NOT NULL REFERENCES attractive_metrics(id),
        department_id INT NOT NULL REFERENCES attractive_departments(id),
        month NVARCHAR(20) NOT NULL,
        year INT NOT NULL,
        value NVARCHAR(100) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_attractive_dept_entry UNIQUE (metric_id, department_id, month, year)
      );
      PRINT '✓ attractive_department_entries table created';
    END
    ELSE
    BEGIN
      PRINT '✓ attractive_department_entries table already exists';
    END
  `);
    console.log('✅ attractive_department_entries done\n');
    await pool.close();
    console.log('✅ Attractive KPI migration completed successfully!');
}
migrateAttractiveKpi().catch(console.error);
