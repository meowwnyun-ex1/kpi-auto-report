"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function migrateDeliveryKpi() {
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
    console.log('🔄 Creating Delivery KPI tables...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Create delivery_sub_categories table
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'delivery_sub_categories')
    BEGIN
      CREATE TABLE delivery_sub_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name_en NVARCHAR(100) NOT NULL,
        name_th NVARCHAR(100) NULL,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ delivery_sub_categories table created';
    END
  `);
    // Create delivery_metrics table
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'delivery_metrics')
    BEGIN
      CREATE TABLE delivery_metrics (
        id INT IDENTITY(1,1) PRIMARY KEY,
        no INT NOT NULL,
        measurement NVARCHAR(500) NOT NULL,
        unit NVARCHAR(50) NOT NULL,
        main NVARCHAR(50) NOT NULL,
        main_relate NVARCHAR(200) NULL,
        fy25_target NVARCHAR(50) NULL,
        sub_category_id INT NOT NULL REFERENCES delivery_sub_categories(id),
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ delivery_metrics table created';
    END
  `);
    // Create delivery_data_entries table
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'delivery_data_entries')
    BEGIN
      CREATE TABLE delivery_data_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metric_id INT NOT NULL REFERENCES delivery_metrics(id),
        month NVARCHAR(20) NOT NULL,
        year INT NOT NULL,
        target DECIMAL(18,2) NULL,
        result DECIMAL(18,2) NULL,
        accu_target DECIMAL(18,2) NULL,
        accu_result DECIMAL(18,2) NULL,
        forecast DECIMAL(18,2) NULL,
        reason NVARCHAR(MAX) NULL,
        recover_activity NVARCHAR(MAX) NULL,
        forecast_result_total NVARCHAR(50) NULL,
        recovery_month NVARCHAR(20) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ delivery_data_entries table created';
    END
  `);
    // Create delivery_products table
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'delivery_products')
    BEGIN
      CREATE TABLE delivery_products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ delivery_products table created';
    END
  `);
    // Create delivery_product_entries table
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'delivery_product_entries')
    BEGIN
      CREATE TABLE delivery_product_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metric_id INT NOT NULL REFERENCES delivery_metrics(id),
        product_id INT NOT NULL REFERENCES delivery_products(id),
        month NVARCHAR(20) NOT NULL,
        year INT NOT NULL,
        target DECIMAL(18,2) NULL,
        result DECIMAL(18,2) NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ delivery_product_entries table created';
    END
  `);
    console.log('✅ Tables created successfully!\n');
    // Seed sub-categories
    console.log('🔄 Seeding delivery sub-categories...');
    const subCategories = [
        { name_en: 'Long BM >3 hr', key: 'long_bm', sort_order: 1 },
        { name_en: 'Unplanned holiday working', key: 'unplanned_holiday', sort_order: 2 },
        { name_en: 'On plan delivery', key: 'on_plan_delivery', sort_order: 3 },
        { name_en: 'Nearmiss delivery delay > 30 mins', key: 'nearmiss_delay', sort_order: 4 },
        { name_en: 'Premium/Unplanned freight', key: 'premium_freight', sort_order: 5 },
    ];
    for (const cat of subCategories) {
        await pool.request()
            .input('name_en', cat.name_en)
            .input('key', cat.key)
            .input('sort_order', cat.sort_order)
            .query(`
        IF NOT EXISTS (SELECT 1 FROM delivery_sub_categories WHERE [key] = @key)
        INSERT INTO delivery_sub_categories (name_en, [key], sort_order)
        VALUES (@name_en, @key, @sort_order)
      `);
    }
    console.log('✅ Sub-categories seeded\n');
    // Seed metrics
    console.log('🔄 Seeding delivery metrics...');
    const metrics = [
        { no: 1, measurement: 'Priority shipment line > 3hr', unit: 'Case', main: 'MT', main_relate: 'PD,PE', fy25_target: '322', sub_category_key: 'long_bm' },
        { no: 2, measurement: 'OT unplanned recovery from m/c BM', unit: 'Day', main: 'MT', main_relate: 'PE, PC, MT', fy25_target: '0', sub_category_key: 'unplanned_holiday' },
        { no: 3, measurement: 'On plan delivery', unit: '%', main: 'WH', main_relate: 'PD,PC', fy25_target: '100%', sub_category_key: 'on_plan_delivery' },
        { no: 4, measurement: 'Nearmiss delivery delay > 30 mins', unit: 'Case', main: 'WH', main_relate: 'PD,PC', fy25_target: '0', sub_category_key: 'nearmiss_delay' },
        { no: 5, measurement: 'Premium/Unplanned freight', unit: 'MB', main: 'PC', main_relate: 'PD', fy25_target: '7.7', sub_category_key: 'premium_freight' },
    ];
    for (const m of metrics) {
        await pool.request()
            .input('no', m.no)
            .input('measurement', m.measurement)
            .input('unit', m.unit)
            .input('main', m.main)
            .input('main_relate', m.main_relate)
            .input('fy25_target', m.fy25_target)
            .input('sub_category_key', m.sub_category_key)
            .query(`
        IF NOT EXISTS (SELECT 1 FROM delivery_metrics m JOIN delivery_sub_categories sc ON m.sub_category_id = sc.id WHERE sc.[key] = @sub_category_key AND m.no = @no)
        INSERT INTO delivery_metrics (no, measurement, unit, main, main_relate, fy25_target, sub_category_id)
        SELECT @no, @measurement, @unit, @main, @main_relate, @fy25_target, id FROM delivery_sub_categories WHERE [key] = @sub_category_key
      `);
    }
    console.log('✅ Metrics seeded\n');
    // Seed products
    console.log('🔄 Seeding delivery products...');
    const products = [
        { name: 'Pump/M', key: 'pump_m', sort_order: 1 },
        { name: 'Pump/A', key: 'pump_a', sort_order: 2 },
        { name: 'INJ/M', key: 'inj_m', sort_order: 3 },
        { name: 'INJ/A', key: 'inj_a', sort_order: 4 },
        { name: 'Valve', key: 'valve', sort_order: 5 },
        { name: 'SOL', key: 'sol', sort_order: 6 },
        { name: 'UC/M', key: 'uc_m', sort_order: 7 },
        { name: 'UC/A', key: 'uc_a', sort_order: 8 },
        { name: 'GDP', key: 'gdp', sort_order: 9 },
        { name: 'SIFS/DF', key: 'sifs_df', sort_order: 10 },
    ];
    for (const p of products) {
        await pool.request()
            .input('name', p.name)
            .input('key', p.key)
            .input('sort_order', p.sort_order)
            .query(`
        IF NOT EXISTS (SELECT 1 FROM delivery_products WHERE [key] = @key)
        INSERT INTO delivery_products (name, [key], sort_order)
        VALUES (@name, @key, @sort_order)
      `);
    }
    console.log('✅ Products seeded\n');
    // Seed data entries from the provided spreadsheet
    console.log('🔄 Seeding delivery data entries...');
    // Data entries from the spreadsheet (Apr-25 to Feb-26)
    const dataEntries = [
        // Apr-25
        { metric_no: 1, month: 'Apr-25', year: 2025, target: 27, result: 10, accu_target: 27, accu_result: 10 },
        { metric_no: 2, month: 'Apr-25', year: 2025, target: 4, result: 1, accu_target: 4, accu_result: 1, reason: 'UC Phase #4 SOP - 1st time Hans Robot (Lack of failure evaluation) - Misalignment from index table setting and coupling poor spec (Lack of machine acceptance criteria)', recover_activity: 'Proceeding UC Phase #4 %OR level up activity, daily progress and find out root cause countermeasure' },
        { metric_no: 3, month: 'Apr-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100 },
        { metric_no: 4, month: 'Apr-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Apr-25', year: 2025, target: 0.6, result: 0.5, accu_target: 0.6, accu_result: 0.5, reason: 'HP5S Quality issue Fuel Leakage at Cover Bearing' },
        // May-25
        { metric_no: 1, month: 'May-25', year: 2025, target: 27, result: 15, accu_target: 54, accu_result: 25 },
        { metric_no: 2, month: 'May-25', year: 2025, target: 4, result: 4, accu_target: 8, accu_result: 5, reason: 'UC assy - Auto load mc Gripper alignment & centering; CR - Auto frettage mc spare part 0 stock; Solenoid - PWP mc Cylinder clamp leak', recover_activity: 'UC assy - Change BM→PM; CR - Improve lifetime extension; Solenoid - CBM implement' },
        { metric_no: 3, month: 'May-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100 },
        { metric_no: 4, month: 'May-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'May-25', year: 2025, target: 0.6, result: 0.0, accu_target: 1.3, accu_result: 0.5 },
        // Jun-25
        { metric_no: 1, month: 'Jun-25', year: 2025, target: 27, result: 19, accu_target: 81, accu_result: 44 },
        { metric_no: 2, month: 'Jun-25', year: 2025, target: 4, result: 2, accu_target: 12, accu_result: 7 },
        { metric_no: 3, month: 'Jun-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100 },
        { metric_no: 4, month: 'Jun-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Jun-25', year: 2025, target: 0.6, result: 0.4, accu_target: 1.9, accu_result: 0.9, reason: 'UC M/C: PE Sample test; UC Pipe Assy: Quality issued; GDP: Delay shipment' },
        // Jul-25
        { metric_no: 1, month: 'Jul-25', year: 2025, target: 27, result: 8, accu_target: 108, accu_result: 52 },
        { metric_no: 2, month: 'Jul-25', year: 2025, target: 4, result: 2, accu_target: 16, accu_result: 9 },
        { metric_no: 3, month: 'Jul-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100, forecast: 100 },
        { metric_no: 4, month: 'Jul-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Jul-25', year: 2025, target: 0.6, result: 0.6, accu_target: 2.6, accu_result: 1.5, reason: 'DF product: Quality issued Pump leak; TH-Cambodia cross border situation' },
        // Aug-25
        { metric_no: 1, month: 'Aug-25', year: 2025, target: 27, result: 18, accu_target: 135, accu_result: 70, forecast: 7.00 },
        { metric_no: 2, month: 'Aug-25', year: 2025, target: 3, result: 3, accu_target: 19, accu_result: 12, forecast: 1.00 },
        { metric_no: 3, month: 'Aug-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100, forecast: 100 },
        { metric_no: 4, month: 'Aug-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Aug-25', year: 2025, target: 0.6, result: 0.5, accu_target: 3.2, accu_result: 2.0, reason: 'TH-Cambodia cross border situation; UC Needle S/Avalve: Quality issued; Start UC Phase 4 MC G.05 delay' },
        // Sep-25
        { metric_no: 1, month: 'Sep-25', year: 2025, target: 27, result: 13, accu_target: 162, accu_result: 83 },
        { metric_no: 2, month: 'Sep-25', year: 2025, target: 3, result: 3, accu_target: 22, accu_result: 15 },
        { metric_no: 3, month: 'Sep-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100 },
        { metric_no: 4, month: 'Sep-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Sep-25', year: 2025, target: 0.6, result: 0.2, accu_target: 3.8, accu_result: 2.2, reason: 'TH-Cambodia cross border situation' },
        // Oct-25
        { metric_no: 1, month: 'Oct-25', year: 2025, target: 27, result: 11, accu_target: 189, accu_result: 94 },
        { metric_no: 2, month: 'Oct-25', year: 2025, target: 2, result: 2, accu_target: 24, accu_result: 17 },
        { metric_no: 3, month: 'Oct-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100 },
        { metric_no: 4, month: 'Oct-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Oct-25', year: 2025, target: 0.6, result: 0.1, accu_target: 4.5, accu_result: 2.2, reason: 'TH-Cambodia cross border situation; UC Needle S/Avalve: Quality issued' },
        // Nov-25
        { metric_no: 1, month: 'Nov-25', year: 2025, target: 27, result: 8, accu_target: 216, accu_result: 102 },
        { metric_no: 2, month: 'Nov-25', year: 2025, target: 2, result: 2, accu_target: 26, accu_result: 19 },
        { metric_no: 3, month: 'Nov-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100, forecast: 100 },
        { metric_no: 4, month: 'Nov-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Nov-25', year: 2025, target: 0.6, result: 0.1, accu_target: 5.1, accu_result: 2.3, reason: 'TH-Cambodia cross border situation; Element: Project new machine spin welding M/C 2 delay' },
        // Dec-25
        { metric_no: 1, month: 'Dec-25', year: 2025, target: 27, result: 4, accu_target: 243, accu_result: 106 },
        { metric_no: 2, month: 'Dec-25', year: 2025, target: 1, result: 0, accu_target: 27, accu_result: 19 },
        { metric_no: 3, month: 'Dec-25', year: 2025, target: 100, result: 100, accu_target: 100, accu_result: 100 },
        { metric_no: 4, month: 'Dec-25', year: 2025, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Dec-25', year: 2025, target: 0.6, result: 0.2, accu_target: 5.7, accu_result: 2.5, reason: 'TH-Cambodia cross border situation; Element: Project delay; SCV: Quality issue Air leak NG' },
        // Jan-26
        { metric_no: 1, month: 'Jan-26', year: 2026, target: 27, result: 9, accu_target: 270, accu_result: 115 },
        { metric_no: 2, month: 'Jan-26', year: 2026, target: 1, result: 1, accu_target: 28, accu_result: 20 },
        { metric_no: 3, month: 'Jan-26', year: 2026, target: 100, result: 100, accu_target: 100, accu_result: 100 },
        { metric_no: 4, month: 'Jan-26', year: 2026, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Jan-26', year: 2026, target: 0.6, result: 0.05, accu_target: 6.4, accu_result: 2.5, reason: 'TH-Cambodia cross border situation' },
        // Feb-26
        { metric_no: 1, month: 'Feb-26', year: 2026, target: 26, result: 15, accu_target: 296, accu_result: 130 },
        { metric_no: 2, month: 'Feb-26', year: 2026, target: 0, result: 6, accu_target: 28, accu_result: 26, reason: 'GDP Assy line 2; UC pipe; PCV; DF Plastic; DF ADC' },
        { metric_no: 3, month: 'Feb-26', year: 2026, target: 100, result: 100, accu_target: 100, accu_result: 100, forecast: 100 },
        { metric_no: 4, month: 'Feb-26', year: 2026, target: 0, result: 0, accu_target: 0, accu_result: 0 },
        { metric_no: 5, month: 'Feb-26', year: 2026, target: 0.6, result: 0.05, accu_target: 7.0, accu_result: 2.6, reason: 'TH-Cambodia cross border situation' },
        // Mar-26 (forecast only)
        { metric_no: 1, month: 'Mar-26', year: 2026, target: 26, result: null, accu_target: 322, accu_result: null },
        { metric_no: 2, month: 'Mar-26', year: 2026, target: 0, result: null, accu_target: 28, accu_result: null },
        { metric_no: 3, month: 'Mar-26', year: 2026, target: 100, result: null, accu_target: 100, accu_result: null },
        { metric_no: 4, month: 'Mar-26', year: 2026, target: 0, result: null, accu_target: 0, accu_result: null },
        { metric_no: 5, month: 'Mar-26', year: 2026, target: 0.6, result: null, accu_target: 7.7, accu_result: null, reason: 'TH-Cambodia cross border situation' },
    ];
    for (const entry of dataEntries) {
        await pool.request()
            .input('metric_no', entry.metric_no)
            .input('month', entry.month)
            .input('year', entry.year)
            .input('target', entry.target)
            .input('result', entry.result)
            .input('accu_target', entry.accu_target)
            .input('accu_result', entry.accu_result)
            .input('forecast', entry.forecast || null)
            .input('reason', entry.reason || null)
            .input('recover_activity', entry.recover_activity || null)
            .query(`
        IF NOT EXISTS (
          SELECT 1 FROM delivery_data_entries de
          JOIN delivery_metrics m ON de.metric_id = m.id
          WHERE m.no = @metric_no AND de.month = @month AND de.year = @year
        )
        INSERT INTO delivery_data_entries (metric_id, month, year, target, result, accu_target, accu_result, forecast, reason, recover_activity)
        SELECT m.id, @month, @year, @target, @result, @accu_target, @accu_result, @forecast, @reason, @recover_activity
        FROM delivery_metrics m WHERE m.no = @metric_no
      `);
    }
    console.log('✅ Data entries seeded\n');
    // Show summary
    const summary = await pool.request().query(`
    SELECT 
      (SELECT COUNT(*) FROM delivery_sub_categories) as sub_categories,
      (SELECT COUNT(*) FROM delivery_metrics) as metrics,
      (SELECT COUNT(*) FROM delivery_data_entries) as data_entries,
      (SELECT COUNT(*) FROM delivery_products) as products
  `);
    console.log('=== Migration Summary ===');
    console.log(`Sub-categories: ${summary.recordset[0].sub_categories}`);
    console.log(`Metrics: ${summary.recordset[0].metrics}`);
    console.log(`Data entries: ${summary.recordset[0].data_entries}`);
    console.log(`Products: ${summary.recordset[0].products}`);
    await pool.close();
    console.log('\n✅ Delivery KPI migration completed successfully!');
}
migrateDeliveryKpi().catch(console.error);
