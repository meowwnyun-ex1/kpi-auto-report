"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env.development') });
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
// Database configuration
const dbConfig = {
    server: process.env.KPI_DB_HOST || process.env.DB_HOST,
    user: process.env.KPI_DB_USER || process.env.DB_USER,
    password: process.env.KPI_DB_PASSWORD || process.env.DB_PASSWORD,
    port: parseInt(process.env.KPI_DB_PORT || process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};
const KPI_DB_NAME = process.env.KPI_DB_NAME || 'kpi-db';
async function migrateQualityKPI() {
    console.log('🔄 Starting Quality KPI database migration...\n');
    let masterPool = null;
    let kpiPool = null;
    try {
        // Step 1: Connect to master database to create kpi-db if needed
        console.log('📡 Connecting to SQL Server...');
        masterPool = await new mssql_1.default.ConnectionPool({
            ...dbConfig,
            database: 'master',
        }).connect();
        console.log('✅ Connected to master database\n');
        // Step 2: Create kpi-db database if it doesn't exist
        console.log(`🗄️ Checking if database '${KPI_DB_NAME}' exists...`);
        const dbCheck = await masterPool
            .request()
            .input('dbName', KPI_DB_NAME)
            .query(`SELECT name FROM sys.databases WHERE name = @dbName`);
        if (dbCheck.recordset.length === 0) {
            console.log(`📦 Creating database '${KPI_DB_NAME}'...`);
            await masterPool.request().query(`CREATE DATABASE [${KPI_DB_NAME}]`);
            console.log(`✅ Database '${KPI_DB_NAME}' created\n`);
        }
        else {
            console.log(`✓ Database '${KPI_DB_NAME}' already exists\n`);
        }
        // Close master connection
        await masterPool.close();
        masterPool = null;
        // Step 3: Connect to kpi-db database
        console.log(`📡 Connecting to database '${KPI_DB_NAME}'...`);
        kpiPool = await new mssql_1.default.ConnectionPool({
            ...dbConfig,
            database: KPI_DB_NAME,
        }).connect();
        console.log(`✅ Connected to database '${KPI_DB_NAME}'\n`);
        // ============================================
        // 1. QUALITY_SUB_CATEGORIES TABLE
        // ============================================
        console.log('📋 Creating quality_sub_categories table...');
        await kpiPool.request().query(`
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
      ELSE
      BEGIN
        PRINT '✓ quality_sub_categories table already exists';
      END
    `);
        // ============================================
        // 2. QUALITY_METRICS TABLE
        // ============================================
        console.log('📊 Creating quality_metrics table...');
        await kpiPool.request().query(`
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
      ELSE
      BEGIN
        PRINT '✓ quality_metrics table already exists';
      END
    `);
        // ============================================
        // 3. QUALITY_DATA_ENTRIES TABLE
        // ============================================
        console.log('📝 Creating quality_data_entries table...');
        await kpiPool.request().query(`
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
      ELSE
      BEGIN
        PRINT '✓ quality_data_entries table already exists';
      END
    `);
        // ============================================
        // 4. QUALITY_PRODUCTS TABLE
        // ============================================
        console.log('🏭 Creating quality_products table...');
        await kpiPool.request().query(`
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
      ELSE
      BEGIN
        PRINT '✓ quality_products table already exists';
      END
    `);
        // ============================================
        // 5. QUALITY_PRODUCT_ENTRIES TABLE
        // ============================================
        console.log('📦 Creating quality_product_entries table...');
        await kpiPool.request().query(`
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
      ELSE
      BEGIN
        PRINT '✓ quality_product_entries table already exists';
      END
    `);
        // ============================================
        // 6. CREATE INDEXES
        // ============================================
        console.log('\n📊 Creating indexes...');
        const indexes = [
            {
                name: 'idx_quality_metrics_sub_category',
                table: 'quality_metrics',
                column: 'sub_category_id',
            },
            {
                name: 'idx_quality_data_entries_metric',
                table: 'quality_data_entries',
                column: 'metric_id',
            },
            {
                name: 'idx_quality_data_entries_month_year',
                table: 'quality_data_entries',
                column: 'month, year',
            },
            {
                name: 'idx_quality_product_entries_metric',
                table: 'quality_product_entries',
                column: 'metric_id',
            },
            {
                name: 'idx_quality_product_entries_product',
                table: 'quality_product_entries',
                column: 'product_id',
            },
        ];
        for (const idx of indexes) {
            await kpiPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.name}' AND object_id = OBJECT_ID('${idx.table}'))
        BEGIN
          CREATE INDEX ${idx.name} ON ${idx.table} (${idx.column});
          PRINT '✓ Index ${idx.name} created';
        END
      `);
        }
        // ============================================
        // 7. SEED SUB-CATEGORIES
        // ============================================
        console.log('\n🌱 Seeding Quality sub-categories...');
        const subCategories = [
            { key: 'claim', name_en: 'Claim', name_th: 'เคลม', sort_order: 1 },
            { key: 'loss', name_en: 'Loss', name_th: 'การสูญเสีย', sort_order: 2 },
        ];
        for (const sub of subCategories) {
            await kpiPool
                .request()
                .input('key', sub.key)
                .input('name_en', sub.name_en)
                .input('name_th', sub.name_th)
                .input('sort_order', sub.sort_order).query(`
          IF NOT EXISTS (SELECT 1 FROM quality_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO quality_sub_categories ([key], name_en, name_th, sort_order)
            VALUES (@key, @name_en, @name_th, @sort_order);
            PRINT '✓ Inserted sub-category: ${sub.key}';
          END
        `);
        }
        // ============================================
        // 8. SEED QUALITY METRICS
        // ============================================
        console.log('\n📊 Seeding Quality metrics...');
        // Get sub-category IDs
        const claimSub = await kpiPool
            .request()
            .query(`SELECT id FROM quality_sub_categories WHERE [key] = 'claim'`);
        const claimId = claimSub.recordset[0]?.id;
        const lossSub = await kpiPool
            .request()
            .query(`SELECT id FROM quality_sub_categories WHERE [key] = 'loss'`);
        const lossId = lossSub.recordset[0]?.id;
        const metrics = [
            {
                sub_category: 'claim',
                no: 1,
                measurement: 'Critical claim',
                unit: 'Case',
                main: 'QA',
                main_relate: 'PD,PE, QC',
                fy25_target: '0',
            },
            {
                sub_category: 'claim',
                no: 2,
                measurement: 'Market claim',
                unit: 'Case',
                main: 'QA',
                main_relate: 'PD,PE, QC',
                fy25_target: '0',
            },
            {
                sub_category: 'claim',
                no: 3,
                measurement: '0-km claim (Official)',
                unit: 'Case',
                main: 'QA',
                main_relate: 'PD,PE, QC',
                fy25_target: '4',
            },
            {
                sub_category: 'claim',
                no: 4,
                measurement: '0-km claim (All DN response)',
                unit: 'Case',
                main: 'QA',
                main_relate: 'PD,PE, QC',
                fy25_target: '9',
            },
            {
                sub_category: 'claim',
                no: 5,
                measurement: 'OGC claim',
                unit: 'Case',
                main: 'QA',
                main_relate: 'PD,PE, QC',
                fy25_target: '6',
            },
            {
                sub_category: 'claim',
                no: 6,
                measurement: 'Supplier NCR',
                unit: 'Case',
                main: 'QC',
                main_relate: 'PD,PE, QA, PU',
                fy25_target: '6',
            },
            {
                sub_category: 'claim',
                no: 7,
                measurement: 'Internal NCR',
                unit: 'Case',
                main: 'QC',
                main_relate: 'PD,PE, QA',
                fy25_target: '5',
            },
            {
                sub_category: 'loss',
                no: 8,
                measurement: 'Cost of spoilage',
                unit: '%',
                main: 'PD',
                main_relate: 'PC,PE,QC',
                fy25_target: '0.56%',
            },
            {
                sub_category: 'loss',
                no: 9,
                measurement: 'Cost of spoilage',
                unit: 'MB',
                main: 'PD',
                main_relate: 'PC,PE,QC',
                fy25_target: '163',
            },
            {
                sub_category: 'loss',
                no: 10,
                measurement: 'Quality loss',
                unit: 'MB',
                main: 'AC',
                main_relate: 'PC,PE,QC',
                fy25_target: '232',
            },
        ];
        for (const metric of metrics) {
            const subId = metric.sub_category === 'claim' ? claimId : lossId;
            if (subId) {
                await kpiPool
                    .request()
                    .input('sub_category_id', subId)
                    .input('no', metric.no)
                    .input('measurement', metric.measurement)
                    .input('unit', metric.unit)
                    .input('main', metric.main)
                    .input('main_relate', metric.main_relate)
                    .input('fy25_target', metric.fy25_target)
                    .input('sort_order', metric.no).query(`
            IF NOT EXISTS (SELECT 1 FROM quality_metrics WHERE sub_category_id = @sub_category_id AND no = @no)
            BEGIN
              INSERT INTO quality_metrics (sub_category_id, no, measurement, unit, main, main_relate, fy25_target, sort_order)
              VALUES (@sub_category_id, @no, @measurement, @unit, @main, @main_relate, @fy25_target, @sort_order);
              PRINT '✓ Inserted metric: ${metric.no}. ${metric.measurement}';
            END
          `);
            }
        }
        // ============================================
        // 9. SEED QUALITY PRODUCTS
        // ============================================
        console.log('\n🏭 Seeding Quality products...');
        const products = [
            { key: 'Pump_M', name_en: 'Pump/M', name_th: 'ปั๊ม M', sort_order: 1 },
            { key: 'Pump_A', name_en: 'Pump/A', name_th: 'ปั๊ม A', sort_order: 2 },
            { key: 'INJ_M', name_en: 'INJ/M', name_th: 'INJ M', sort_order: 3 },
            { key: 'INJ_A', name_en: 'INJ/A', name_th: 'INJ A', sort_order: 4 },
            { key: 'Valve', name_en: 'Valve', name_th: 'วาล์ว', sort_order: 5 },
            { key: 'SOL', name_en: 'SOL', name_th: 'SOL', sort_order: 6 },
            { key: 'UC_M', name_en: 'UC/M', name_th: 'UC M', sort_order: 7 },
            { key: 'UC_A', name_en: 'UC/A', name_th: 'UC A', sort_order: 8 },
            { key: 'GDP', name_en: 'GDP', name_th: 'GDP', sort_order: 9 },
            { key: 'SIFS_DF', name_en: 'SIFS/DF', name_th: 'SIFS/DF', sort_order: 10 },
            { key: 'HP3', name_en: 'HP3', name_th: 'HP3', sort_order: 11 },
            { key: 'HP5', name_en: 'HP5', name_th: 'HP5', sort_order: 12 },
            { key: 'HP5E', name_en: 'HP5E', name_th: 'HP5E', sort_order: 13 },
            { key: 'RC', name_en: 'RC', name_th: 'RC', sort_order: 14 },
            { key: 'G2_G3', name_en: 'G2&G3', name_th: 'G2&G3', sort_order: 15 },
            { key: 'G4', name_en: 'G4', name_th: 'G4', sort_order: 16 },
            { key: 'UC', name_en: 'UC', name_th: 'UC', sort_order: 17 },
            { key: 'QC', name_en: 'QC', name_th: 'QC', sort_order: 18 },
            { key: 'SCV', name_en: 'SCV', name_th: 'SCV', sort_order: 19 },
            { key: 'DF', name_en: 'DF', name_th: 'DF', sort_order: 20 },
            { key: 'PCV_PRV', name_en: 'PCV/PRV', name_th: 'PCV/PRV', sort_order: 21 },
        ];
        for (const product of products) {
            await kpiPool
                .request()
                .input('key', product.key)
                .input('name_en', product.name_en)
                .input('name_th', product.name_th)
                .input('sort_order', product.sort_order).query(`
          IF NOT EXISTS (SELECT 1 FROM quality_products WHERE [key] = @key)
          BEGIN
            INSERT INTO quality_products ([key], name_en, name_th, sort_order)
            VALUES (@key, @name_en, @name_th, @sort_order);
            PRINT '✓ Inserted product: ${product.name_en}';
          END
        `);
        }
        console.log('\n==============================================');
        console.log('✅ QUALITY KPI MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('==============================================');
        console.log('\n📊 Tables created/verified:');
        console.log('   • quality_sub_categories');
        console.log('   • quality_metrics');
        console.log('   • quality_data_entries');
        console.log('   • quality_products');
        console.log('   • quality_product_entries');
        console.log('\n🌱 Seeded data:');
        console.log('   • 2 Quality sub-categories (Claim, Loss)');
        console.log('   • 10 Quality metrics');
        console.log('   • 21 Quality products');
        // Close connection
        if (kpiPool) {
            await kpiPool.close();
        }
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        // Clean up connections on error
        if (masterPool) {
            try {
                await masterPool.close();
            }
            catch (e) {
                // Ignore close errors
            }
        }
        if (kpiPool) {
            try {
                await kpiPool.close();
            }
            catch (e) {
                // Ignore close errors
            }
        }
        throw error;
    }
}
// Run migration
migrateQualityKPI()
    .then(() => {
    console.log('\n✨ Quality KPI Migration script finished.');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
});
