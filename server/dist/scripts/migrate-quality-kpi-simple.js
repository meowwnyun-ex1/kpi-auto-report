"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
require("dotenv/config");
/**
 * Simple Migration script for Quality KPI tables
 * Creates database and tables for Quality metrics
 */
const DB_HOST = process.env.DB_HOST || '10.73.148.76';
const DB_USER = process.env.DB_USER || 'inn@admin';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_PORT = parseInt(process.env.DB_PORT || '1433');
const KPI_DB_NAME = process.env.KPI_DB_NAME || 'kpi-db';
async function migrateQualityKPI() {
    console.log('🔄 Starting Quality KPI database migration...\n');
    console.log(`📡 Connecting to SQL Server at ${DB_HOST}:${DB_PORT}...`);
    // Step 1: Connect to master to create database if needed
    const masterConfig = {
        server: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        port: DB_PORT,
        database: 'master',
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
        },
    };
    let pool = null;
    try {
        // Connect to master
        pool = await new mssql_1.default.ConnectionPool(masterConfig).connect();
        console.log('✅ Connected to master database\n');
        // Check if kpi-db exists
        const dbCheck = await pool.request()
            .input('dbName', KPI_DB_NAME)
            .query(`SELECT name FROM sys.databases WHERE name = @dbName`);
        if (dbCheck.recordset.length === 0) {
            console.log(`📦 Creating database '${KPI_DB_NAME}'...`);
            await pool.request().query(`CREATE DATABASE [${KPI_DB_NAME}]`);
            console.log(`✅ Database '${KPI_DB_NAME}' created\n`);
        }
        else {
            console.log(`✓ Database '${KPI_DB_NAME}' already exists\n`);
        }
        // Close and reconnect to kpi-db
        await pool.close();
        const kpiConfig = {
            ...masterConfig,
            database: KPI_DB_NAME,
        };
        pool = await new mssql_1.default.ConnectionPool(kpiConfig).connect();
        console.log(`✅ Connected to database '${KPI_DB_NAME}'\n`);
        // Create tables
        console.log('📋 Creating tables...\n');
        // 1. quality_sub_categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'quality_sub_categories')
      BEGIN
        CREATE TABLE quality_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          name_en NVARCHAR(100) NOT NULL,
          name_th NVARCHAR(100) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        PRINT '✓ quality_sub_categories table created';
      END
    `);
        // 2. quality_metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'quality_metrics')
      BEGIN
        CREATE TABLE quality_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          sub_category_id INT NOT NULL,
          no INT NOT NULL,
          measurement NVARCHAR(200) NOT NULL,
          unit NVARCHAR(50) NOT NULL,
          main NVARCHAR(50) NOT NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(100) NULL,
          is_active BIT NOT NULL DEFAULT 1,
          sort_order INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_quality_metric_sub_category FOREIGN KEY (sub_category_id) REFERENCES quality_sub_categories(id),
          CONSTRAINT UQ_quality_metric UNIQUE (sub_category_id, no)
        );
        PRINT '✓ quality_metrics table created';
      END
    `);
        // 3. quality_data_entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'quality_data_entries')
      BEGIN
        CREATE TABLE quality_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
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
          CONSTRAINT FK_quality_entry_metric FOREIGN KEY (metric_id) REFERENCES quality_metrics(id),
          CONSTRAINT UQ_quality_entry UNIQUE (metric_id, month, year)
        );
        PRINT '✓ quality_data_entries table created';
      END
    `);
        // 4. quality_products
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'quality_products')
      BEGIN
        CREATE TABLE quality_products (
          id INT IDENTITY(1,1) PRIMARY KEY,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          name_en NVARCHAR(100) NOT NULL,
          name_th NVARCHAR(100) NULL,
          sort_order INT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        PRINT '✓ quality_products table created';
      END
    `);
        // 5. quality_product_entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'quality_product_entries')
      BEGIN
        CREATE TABLE quality_product_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          product_id INT NOT NULL,
          value NVARCHAR(100) NULL,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_quality_product_entry_metric FOREIGN KEY (metric_id) REFERENCES quality_metrics(id),
          CONSTRAINT FK_quality_product_entry_product FOREIGN KEY (product_id) REFERENCES quality_products(id),
          CONSTRAINT UQ_quality_product_entry UNIQUE (metric_id, month, year, product_id)
        );
        PRINT '✓ quality_product_entries table created';
      END
    `);
        console.log('✅ All tables created/verified\n');
        // Seed sub-categories
        console.log('🌱 Seeding sub-categories...');
        const subCategories = [
            { key: 'claim', name_en: 'Claim', name_th: 'เคลม', sort_order: 1 },
            { key: 'loss', name_en: 'Loss', name_th: 'การสูญเสีย', sort_order: 2 },
        ];
        for (const sub of subCategories) {
            await pool.request()
                .input('key', sub.key)
                .input('name_en', sub.name_en)
                .input('name_th', sub.name_th)
                .input('sort_order', sub.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM quality_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO quality_sub_categories ([key], name_en, name_th, sort_order)
            VALUES (@key, @name_en, @name_th, @sort_order);
          END
        `);
        }
        console.log('✅ Sub-categories seeded\n');
        // Get sub-category IDs
        const claimResult = await pool.request()
            .query(`SELECT id FROM quality_sub_categories WHERE [key] = 'claim'`);
        const claimId = claimResult.recordset[0]?.id;
        const lossResult = await pool.request()
            .query(`SELECT id FROM quality_sub_categories WHERE [key] = 'loss'`);
        const lossId = lossResult.recordset[0]?.id;
        // Seed metrics
        console.log('📊 Seeding metrics...');
        const metrics = [
            { sub_category: 'claim', no: 1, measurement: 'Critical claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '0' },
            { sub_category: 'claim', no: 2, measurement: 'Market claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '0' },
            { sub_category: 'claim', no: 3, measurement: '0-km claim (Official)', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '4' },
            { sub_category: 'claim', no: 4, measurement: '0-km claim (All DN response)', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '9' },
            { sub_category: 'claim', no: 5, measurement: 'OGC claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '6' },
            { sub_category: 'claim', no: 6, measurement: 'Supplier NCR', unit: 'Case', main: 'QC', main_relate: 'PD,PE, QA, PU', fy25_target: '6' },
            { sub_category: 'claim', no: 7, measurement: 'Internal NCR', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '45' },
            { sub_category: 'loss', no: 1, measurement: 'Cost of spoilage', unit: '%', main: 'AC', main_relate: 'PC,PE,QC', fy25_target: '0.95' },
            { sub_category: 'loss', no: 2, measurement: 'Cost of spoilage', unit: 'MB', main: 'AC', main_relate: 'PC,PE,QC', fy25_target: '232' },
            { sub_category: 'loss', no: 3, measurement: 'Quality loss', unit: 'MB', main: 'AC', main_relate: 'PC,PE,QC', fy25_target: '232' },
        ];
        for (const metric of metrics) {
            const subId = metric.sub_category === 'claim' ? claimId : lossId;
            if (subId) {
                await pool.request()
                    .input('sub_category_id', subId)
                    .input('no', metric.no)
                    .input('measurement', metric.measurement)
                    .input('unit', metric.unit)
                    .input('main', metric.main)
                    .input('main_relate', metric.main_relate)
                    .input('fy25_target', metric.fy25_target)
                    .input('sort_order', metric.no)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM quality_metrics WHERE sub_category_id = @sub_category_id AND no = @no)
            BEGIN
              INSERT INTO quality_metrics (sub_category_id, no, measurement, unit, main, main_relate, fy25_target, sort_order)
              VALUES (@sub_category_id, @no, @measurement, @unit, @main, @main_relate, @fy25_target, @sort_order);
            END
          `);
            }
        }
        console.log('✅ Metrics seeded\n');
        // Seed products
        console.log('🏭 Seeding products...');
        const products = [
            { key: 'Pump_M', name_en: 'Pump/M', name_th: 'Pump/M' },
            { key: 'Pump_A', name_en: 'Pump/A', name_th: 'Pump/A' },
            { key: 'INJ_M', name_en: 'INJ/M', name_th: 'INJ/M' },
            { key: 'INJ_A', name_en: 'INJ/A', name_th: 'INJ/A' },
            { key: 'Valve', name_en: 'Valve', name_th: 'Valve' },
            { key: 'SOL', name_en: 'SOL', name_th: 'SOL' },
            { key: 'UC_M', name_en: 'UC/M', name_th: 'UC/M' },
            { key: 'UC_A', name_en: 'UC/A', name_th: 'UC/A' },
            { key: 'GDP', name_en: 'GDP', name_th: 'GDP' },
            { key: 'SIFS_DF', name_en: 'SIFS/DF', name_th: 'SIFS/DF' },
            { key: 'HP3', name_en: 'HP3', name_th: 'HP3' },
            { key: 'HP5', name_en: 'HP5', name_th: 'HP5' },
            { key: 'HP5E', name_en: 'HP5E', name_th: 'HP5E' },
            { key: 'RC', name_en: 'RC', name_th: 'RC' },
            { key: 'G2_G3', name_en: 'G2&G3', name_th: 'G2&G3' },
            { key: 'G4', name_en: 'G4', name_th: 'G4' },
            { key: 'UC', name_en: 'UC', name_th: 'UC' },
            { key: 'QC', name_en: 'QC', name_th: 'QC' },
            { key: 'SCV', name_en: 'SCV', name_th: 'SCV' },
            { key: 'DF', name_en: 'DF', name_th: 'DF' },
            { key: 'PCV_PRV', name_en: 'PCV/PRV', name_th: 'PCV/PRV' },
        ];
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            await pool.request()
                .input('key', product.key)
                .input('name_en', product.name_en)
                .input('name_th', product.name_th)
                .input('sort_order', i + 1)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM quality_products WHERE [key] = @key)
          BEGIN
            INSERT INTO quality_products ([key], name_en, name_th, sort_order)
            VALUES (@key, @name_en, @name_th, @sort_order);
          END
        `);
        }
        console.log('✅ Products seeded\n');
        console.log('==============================================');
        console.log('✅ QUALITY KPI MIGRATION COMPLETED!');
        console.log('==============================================');
        console.log('\n📊 Tables: quality_sub_categories, quality_metrics, quality_data_entries, quality_products, quality_product_entries');
        console.log('🌱 Seeded: 2 sub-categories, 10 metrics, 21 products\n');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
    finally {
        if (pool) {
            await pool.close();
        }
    }
}
// Run migration
migrateQualityKPI()
    .then(() => {
    console.log('✨ Migration finished.');
    process.exit(0);
})
    .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});
