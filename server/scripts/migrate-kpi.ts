import { getAppStoreDb } from '../config/database';
import bcrypt from 'bcryptjs';

/**
 * KPI Database Migration Script
 * Creates KPI tables and seeds initial data
 *
 * Run: npx tsx server/scripts/migrate-kpi.ts
 */

async function migrateKPI() {
  console.log('🔄 Starting KPI database migration...\n');

  try {
    const pool = await getAppStoreDb();
    console.log('✅ Connected to database\n');

    // ============================================
    // 1. KPI_CATEGORIES TABLE
    // ============================================
    console.log('📋 Creating kpi_categories table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_categories')
      BEGIN
        CREATE TABLE kpi_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          name_en NVARCHAR(100) NOT NULL,
          name_th NVARCHAR(100) NOT NULL,
          description NVARCHAR(500) NULL,
          color NVARCHAR(20) NOT NULL DEFAULT '#3B82F6',
          icon NVARCHAR(50) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        PRINT '✓ kpi_categories table created';
      END
      ELSE
      BEGIN
        PRINT '✓ kpi_categories table already exists';
      END
    `);

    // ============================================
    // 2. KPI_SUB_CATEGORIES TABLE
    // ============================================
    console.log('📂 Creating kpi_sub_categories table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_sub_categories')
      BEGIN
        CREATE TABLE kpi_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          category_id INT NOT NULL,
          [key] NVARCHAR(50) NOT NULL,
          name_en NVARCHAR(100) NOT NULL,
          name_th NVARCHAR(100) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_sub_category_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id),
          CONSTRAINT UQ_sub_category_key UNIQUE (category_id, [key])
        );
        PRINT '✓ kpi_sub_categories table created';
      END
      ELSE
      BEGIN
        PRINT '✓ kpi_sub_categories table already exists';
      END
    `);

    // ============================================
    // 3. KPI_METRICS TABLE (Main data entry)
    // ============================================
    console.log('📊 Creating kpi_metrics table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_metrics')
      BEGIN
        CREATE TABLE kpi_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          category_id INT NOT NULL,
          sub_category_id INT NULL,
          metric_no INT NOT NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(50) NOT NULL,
          main NVARCHAR(50) NULL,
          main_relate NVARCHAR(100) NULL,
          fy_target DECIMAL(10,2) NULL,
          sort_order INT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_metric_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id),
          CONSTRAINT FK_metric_sub_category FOREIGN KEY (sub_category_id) REFERENCES kpi_sub_categories(id)
        );
        PRINT '✓ kpi_metrics table created';
      END
      ELSE
      BEGIN
        PRINT '✓ kpi_metrics table already exists';
      END
    `);

    // ============================================
    // 4. KPI_DATA_ENTRIES TABLE (Monthly entries)
    // ============================================
    console.log('📝 Creating kpi_data_entries table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_data_entries')
      BEGIN
        CREATE TABLE kpi_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target DECIMAL(10,2) NULL,
          result DECIMAL(10,2) NULL,
          accu_target DECIMAL(10,2) NULL,
          accu_result DECIMAL(10,2) NULL,
          forecast DECIMAL(10,2) NULL,
          reason NVARCHAR(1000) NULL,
          recover_activity NVARCHAR(1000) NULL,
          forecast_result_total DECIMAL(10,2) NULL,
          recovery_month NVARCHAR(20) NULL,
          created_by INT NULL,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_entry_metric FOREIGN KEY (metric_id) REFERENCES kpi_metrics(id),
          CONSTRAINT FK_entry_user FOREIGN KEY (created_by) REFERENCES users(id),
          CONSTRAINT UQ_entry_month UNIQUE (metric_id, month, year)
        );
        PRINT '✓ kpi_data_entries table created';
      END
      ELSE
      BEGIN
        PRINT '✓ kpi_data_entries table already exists';
      END
    `);

    // ============================================
    // 5. KPI_DEPARTMENTS TABLE
    // ============================================
    console.log('🏢 Creating kpi_departments table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_departments')
      BEGIN
        CREATE TABLE kpi_departments (
          id INT IDENTITY(1,1) PRIMARY KEY,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          name_en NVARCHAR(100) NOT NULL,
          name_th NVARCHAR(100) NOT NULL,
          short_name NVARCHAR(20) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        PRINT '✓ kpi_departments table created';
      END
      ELSE
      BEGIN
        PRINT '✓ kpi_departments table already exists';
      END
    `);

    // ============================================
    // 6. KPI_DEPARTMENT_ENTRIES TABLE (By Department)
    // ============================================
    console.log('🏭 Creating kpi_department_entries table...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_department_entries')
      BEGIN
        CREATE TABLE kpi_department_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          department_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          value DECIMAL(10,2) NULL,
          created_by INT NULL,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_dept_entry_metric FOREIGN KEY (metric_id) REFERENCES kpi_metrics(id),
          CONSTRAINT FK_dept_entry_department FOREIGN KEY (department_id) REFERENCES kpi_departments(id),
          CONSTRAINT FK_dept_entry_user FOREIGN KEY (created_by) REFERENCES users(id),
          CONSTRAINT UQ_dept_entry UNIQUE (metric_id, department_id, month, year)
        );
        PRINT '✓ kpi_department_entries table created';
      END
      ELSE
      BEGIN
        PRINT '✓ kpi_department_entries table already exists';
      END
    `);

    // ============================================
    // 7. CREATE INDEXES
    // ============================================
    console.log('\n📊 Creating indexes...');

    const indexes = [
      { name: 'idx_kpi_categories_key', table: 'kpi_categories', column: '[key]' },
      {
        name: 'idx_kpi_sub_categories_category',
        table: 'kpi_sub_categories',
        column: 'category_id',
      },
      { name: 'idx_kpi_metrics_category', table: 'kpi_metrics', column: 'category_id' },
      { name: 'idx_kpi_data_entries_metric', table: 'kpi_data_entries', column: 'metric_id' },
      { name: 'idx_kpi_data_entries_month_year', table: 'kpi_data_entries', column: 'month, year' },
      { name: 'idx_kpi_departments_key', table: 'kpi_departments', column: '[key]' },
      { name: 'idx_kpi_dept_entries_metric', table: 'kpi_department_entries', column: 'metric_id' },
      {
        name: 'idx_kpi_dept_entries_department',
        table: 'kpi_department_entries',
        column: 'department_id',
      },
    ];

    for (const idx of indexes) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.name}' AND object_id = OBJECT_ID('${idx.table}'))
        BEGIN
          CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column});
          PRINT '✓ Created index ${idx.name}';
        END
      `);
    }

    // ============================================
    // 8. SEED KPI CATEGORIES
    // ============================================
    console.log('\n🌱 Seeding KPI categories...');

    const categories = [
      {
        key: 'safety',
        name_en: 'Safety',
        name_th: 'ความปลอดภัย',
        color: '#EF4444',
        icon: 'Shield',
        sort_order: 1,
      },
      {
        key: 'quality',
        name_en: 'Quality',
        name_th: 'คุณภาพ',
        color: '#22C55E',
        icon: 'Award',
        sort_order: 2,
      },
      {
        key: 'delivery',
        name_en: 'Delivery',
        name_th: 'การส่งมอบ',
        color: '#3B82F6',
        icon: 'Truck',
        sort_order: 3,
      },
      {
        key: 'compliance',
        name_en: 'Compliance',
        name_th: 'การปฏิบัติตามกฎระเบียบ',
        color: '#8B5CF6',
        icon: 'FileCheck',
        sort_order: 4,
      },
      {
        key: 'hr',
        name_en: 'HR',
        name_th: 'ทรัพยากรบุคคล',
        color: '#F59E0B',
        icon: 'Users',
        sort_order: 5,
      },
      {
        key: 'attractive',
        name_en: 'Attractive',
        name_th: 'ความน่าดึงดูด',
        color: '#EC4899',
        icon: 'Star',
        sort_order: 6,
      },
      {
        key: 'environment',
        name_en: 'Environment',
        name_th: 'สิ่งแวดล้อม',
        color: '#14B8A6',
        icon: 'Leaf',
        sort_order: 7,
      },
      {
        key: 'cost',
        name_en: 'Cost',
        name_th: 'ต้นทุน',
        color: '#6366F1',
        icon: 'DollarSign',
        sort_order: 8,
      },
    ];

    for (const cat of categories) {
      await pool
        .request()
        .input('key', cat.key)
        .input('name_en', cat.name_en)
        .input('name_th', cat.name_th)
        .input('color', cat.color)
        .input('icon', cat.icon)
        .input('sort_order', cat.sort_order).query(`
          IF NOT EXISTS (SELECT 1 FROM kpi_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO kpi_categories ([key], name_en, name_th, color, icon, sort_order)
            VALUES (@key, @name_en, @name_th, @color, @icon, @sort_order);
            PRINT '✓ Inserted category: ${cat.key}';
          END
        `);
    }

    // ============================================
    // 9. SEED KPI SUB-CATEGORIES (Safety)
    // ============================================
    console.log('\n📂 Seeding KPI sub-categories...');

    const safetyCategory = await pool
      .request()
      .query(`SELECT id FROM kpi_categories WHERE [key] = 'safety'`);
    const safetyId = safetyCategory.recordset[0]?.id;

    if (safetyId) {
      const subCategories = [
        { key: 'worksite', name_en: 'Worksite', name_th: 'สถานที่ทำงาน', sort_order: 1 },
        { key: 'traffic', name_en: 'Traffic', name_th: 'จราจร', sort_order: 2 },
      ];

      for (const sub of subCategories) {
        await pool
          .request()
          .input('category_id', safetyId)
          .input('key', sub.key)
          .input('name_en', sub.name_en)
          .input('name_th', sub.name_th)
          .input('sort_order', sub.sort_order).query(`
            IF NOT EXISTS (SELECT 1 FROM kpi_sub_categories WHERE category_id = @category_id AND [key] = @key)
            BEGIN
              INSERT INTO kpi_sub_categories (category_id, [key], name_en, name_th, sort_order)
              VALUES (@category_id, @key, @name_en, @name_th, @sort_order);
              PRINT '✓ Inserted sub-category: ${sub.key}';
            END
          `);
      }
    }

    // ============================================
    // 10. SEED KPI DEPARTMENTS
    // ============================================
    console.log('\n🏢 Seeding KPI departments...');

    const departments = [
      { key: 'pump_m', name_en: 'Pump/M', name_th: 'Pump/M', short_name: 'Pump/M' },
      { key: 'pump_a', name_en: 'Pump/A', name_th: 'Pump/A', short_name: 'Pump/A' },
      { key: 'inj_m', name_en: 'INJ/M', name_th: 'INJ/M', short_name: 'INJ/M' },
      { key: 'inj_a', name_en: 'INJ/A', name_th: 'INJ/A', short_name: 'INJ/A' },
      { key: 'valve', name_en: 'Valve', name_th: 'Valve', short_name: 'Valve' },
      { key: 'sol', name_en: 'SOL', name_th: 'SOL', short_name: 'SOL' },
      { key: 'uc_m', name_en: 'UC/M', name_th: 'UC/M', short_name: 'UC/M' },
      { key: 'uc_a', name_en: 'UC/A', name_th: 'UC/A', short_name: 'UC/A' },
      { key: 'gdp', name_en: 'GDP', name_th: 'GDP', short_name: 'GDP' },
      { key: 'sifs_df', name_en: 'SIFS/DF', name_th: 'SIFS/DF', short_name: 'SIFS/DF' },
      { key: 'tie', name_en: 'TIE', name_th: 'TIE', short_name: 'TIE' },
      { key: 'wh', name_en: 'WH', name_th: 'WH', short_name: 'WH' },
      { key: 'mt', name_en: 'MT', name_th: 'MT', short_name: 'MT' },
      { key: 'qa_qc', name_en: 'QA&QC', name_th: 'QA&QC', short_name: 'QA&QC' },
      { key: 'adm', name_en: 'ADM', name_th: 'ADM', short_name: 'ADM' },
      { key: 'pe', name_en: 'PE', name_th: 'PE', short_name: 'PE' },
      { key: 'pc', name_en: 'PC', name_th: 'PC', short_name: 'PC' },
      { key: 'spd', name_en: 'SPD', name_th: 'SPD', short_name: 'SPD' },
      { key: 'se', name_en: 'SE', name_th: 'SE', short_name: 'SE' },
    ];

    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      await pool
        .request()
        .input('key', dept.key)
        .input('name_en', dept.name_en)
        .input('name_th', dept.name_th)
        .input('short_name', dept.short_name)
        .input('sort_order', i + 1).query(`
          IF NOT EXISTS (SELECT 1 FROM kpi_departments WHERE [key] = @key)
          BEGIN
            INSERT INTO kpi_departments ([key], name_en, name_th, short_name, sort_order)
            VALUES (@key, @name_en, @name_th, @short_name, @sort_order);
            PRINT '✓ Inserted department: ${dept.key}';
          END
        `);
    }

    // ============================================
    // 11. CREATE/UPDATE ADMIN USER
    // ============================================
    console.log('\n👤 Creating admin user...');

    const password = 'i@NN636195';
    const passwordHash = await bcrypt.hash(password, 10);

    await pool
      .request()
      .input('username', 'Admin')
      .input('email', 'admin@denso.com')
      .input('password_hash', passwordHash)
      .input('full_name', 'Administrator')
      .input('role', 'admin').query(`
        IF NOT EXISTS (SELECT 1 FROM users WHERE username = @username)
        BEGIN
          INSERT INTO users (username, email, password_hash, full_name, role, is_active)
          VALUES (@username, @email, @password_hash, @full_name, @role, 1);
          PRINT '✓ Created admin user: Admin';
        END
        ELSE
        BEGIN
          UPDATE users
          SET password_hash = @password_hash, email = @email, full_name = @full_name, role = @role
          WHERE username = @username;
          PRINT '✓ Updated admin user: Admin';
        END
      `);

    // ============================================
    // 12. SEED SAFETY METRICS
    // ============================================
    console.log('\n📊 Seeding Safety metrics...');

    if (safetyId) {
      const worksiteSub = await pool
        .request()
        .input('category_id', safetyId)
        .query(
          `SELECT id FROM kpi_sub_categories WHERE category_id = @category_id AND [key] = 'worksite'`
        );
      const worksiteId = worksiteSub.recordset[0]?.id;

      const trafficSub = await pool
        .request()
        .input('category_id', safetyId)
        .query(
          `SELECT id FROM kpi_sub_categories WHERE category_id = @category_id AND [key] = 'traffic'`
        );
      const trafficId = trafficSub.recordset[0]?.id;

      const safetyMetrics = [
        {
          sub_id: worksiteId,
          no: 1,
          measurement: '1-Grade accident',
          unit: 'Case',
          main: 'SE',
          main_relate: 'All',
          fy_target: 0,
        },
        {
          sub_id: worksiteId,
          no: 2,
          measurement: 'Reoccurrence',
          unit: 'Case',
          main: 'SE',
          main_relate: 'PD,PC',
          fy_target: 0,
        },
        {
          sub_id: worksiteId,
          no: 3,
          measurement: 'Near miss',
          unit: 'Case',
          main: 'SE',
          main_relate: 'All',
          fy_target: 4,
        },
        {
          sub_id: worksiteId,
          no: 4,
          measurement: '8-High risk audit',
          unit: 'Case',
          main: 'SE',
          main_relate: 'All',
          fy_target: 4,
        },
        {
          sub_id: trafficId,
          no: 5,
          measurement: 'Fatal',
          unit: 'Case',
          main: 'GA',
          main_relate: 'ALL',
          fy_target: 0,
        },
        {
          sub_id: trafficId,
          no: 6,
          measurement: 'Injury',
          unit: 'Case',
          main: 'GA',
          main_relate: 'ALL',
          fy_target: 0,
        },
        {
          sub_id: trafficId,
          no: 7,
          measurement: 'Illegal & dangerous driving',
          unit: 'Case',
          main: 'GA',
          main_relate: 'ALL',
          fy_target: 0,
        },
        {
          sub_id: trafficId,
          no: 8,
          measurement: 'Hit',
          unit: 'Case',
          main: 'GA',
          main_relate: 'ALL',
          fy_target: 0,
        },
        {
          sub_id: trafficId,
          no: 9,
          measurement: 'Hit something',
          unit: 'Case',
          main: 'GA',
          main_relate: 'ALL',
          fy_target: 1,
        },
      ];

      for (const metric of safetyMetrics) {
        await pool
          .request()
          .input('category_id', safetyId)
          .input('sub_category_id', metric.sub_id)
          .input('metric_no', metric.no)
          .input('measurement', metric.measurement)
          .input('unit', metric.unit)
          .input('main', metric.main)
          .input('main_relate', metric.main_relate)
          .input('fy_target', metric.fy_target)
          .input('sort_order', metric.no).query(`
            IF NOT EXISTS (
              SELECT 1 FROM kpi_metrics 
              WHERE category_id = @category_id AND metric_no = @metric_no
            )
            BEGIN
              INSERT INTO kpi_metrics (category_id, sub_category_id, metric_no, measurement, unit, main, main_relate, fy_target, sort_order)
              VALUES (@category_id, @sub_category_id, @metric_no, @measurement, @unit, @main, @main_relate, @fy_target, @sort_order);
              PRINT '✓ Inserted metric: ${metric.measurement}';
            END
          `);
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ KPI MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Tables created/verified:');
    console.log('   • kpi_categories');
    console.log('   • kpi_sub_categories');
    console.log('   • kpi_metrics');
    console.log('   • kpi_data_entries');
    console.log('   • kpi_departments');
    console.log('   • kpi_department_entries');
    console.log('\n👤 Admin user:');
    console.log('   • Username: Admin');
    console.log('   • Password: i@NN636195');
    console.log('\n🌱 Seeded data:');
    console.log('   • 8 KPI categories');
    console.log('   • 2 Safety sub-categories');
    console.log('   • 19 departments');
    console.log('   • 9 Safety metrics');
    console.log('\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateKPI()
  .then(() => {
    console.log('KPI Migration script finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
