import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * RESET KPI DATABASE
 * Creates only tables actually used in CRUD operations
 *
 * Server 76 (10.73.148.76) - ALL DATABASES
 * - kpi-db: Main KPI application database
 * - SPO_Dev: Department names
 * - CAS_Dev: Employee data
 */

const config = {
  server: process.env.KPI_DB_HOST || '10.73.148.76',
  database: process.env.KPI_DB_NAME || 'kpi-db',
  user: process.env.KPI_DB_USER || 'inn@admin',
  password: process.env.KPI_DB_PASSWORD || 'i@NN636195',
  port: parseInt(process.env.KPI_DB_PORT || '1433'),
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
};

const CATEGORIES = [
  'safety',
  'quality',
  'delivery',
  'compliance',
  'hr',
  'attractive',
  'environment',
  'cost',
];

async function resetKpiDatabase() {
  console.log('='.repeat(80));
  console.log('RESET KPI DATABASE - Only Required Tables');
  console.log('='.repeat(80));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}\n`);

  const pool = await new sql.ConnectionPool(config).connect();

  try {
    // ============================================
    // 1. DROP ALL EXISTING TABLES
    // ============================================
    console.log('Dropping all foreign key constraints...');

    await pool.request().query(`
      DECLARE @sql NVARCHAR(MAX) = '';
      SELECT @sql = @sql + 'ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + '].[' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];' + CHAR(10)
      FROM sys.foreign_keys
      WHERE OBJECT_SCHEMA_NAME(parent_object_id) = 'dbo';
      EXEC sp_executesql @sql;
    `);
    console.log('  All foreign keys dropped');

    console.log('Dropping all KPI tables...');

    // Tables to drop (only KPI related)
    const tablesToDrop = [
      'kpi_monthly_entries',
      'kpi_action_plans',
      'kpi_yearly_targets',
      'user_department_access',
      // Category-specific tables (used by routes)
      ...CATEGORIES.map((c) => `${c}_data_entries`),
      ...CATEGORIES.map((c) => `${c}_metrics`),
      ...CATEGORIES.map((c) => `${c}_sub_categories`),
      // Core tables
      'kpi_metrics',
      'kpi_sub_categories',
      'kpi_categories',
      'users',
      'Users',
      'departments',
    ];

    for (const table of tablesToDrop) {
      try {
        await pool.request().query(`DROP TABLE IF EXISTS [${table}]`);
        console.log(`  Dropped: ${table}`);
      } catch (err) {
        // Table might not exist, continue
      }
    }

    // ============================================
    // 2. CREATE CORE TABLES
    // ============================================
    console.log('\nCreating core tables...');

    // Departments
    console.log('  Creating departments...');
    await pool.request().query(`
      CREATE TABLE departments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        dept_code NVARCHAR(50) NOT NULL,
        dept_id NVARCHAR(50) NOT NULL UNIQUE,
        name_en NVARCHAR(255) NOT NULL,
        name_th NVARCHAR(255) NULL,
        [type] NVARCHAR(100) NULL,
        company NVARCHAR(100) NULL,
        status NVARCHAR(20) DEFAULT 'Active',
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      );
      CREATE INDEX IX_departments_dept_id ON departments(dept_id);
    `);

    // Users
    console.log('  Creating users...');
    await pool.request().query(`
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(200) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        department_id NVARCHAR(50) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        last_login DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    `);

    // KPI Categories
    console.log('  Creating kpi_categories...');
    await pool.request().query(`
      CREATE TABLE kpi_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL UNIQUE,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        sort_order INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      );
    `);

    // ============================================
    // 3. CREATE CATEGORY-SPECIFIC TABLES
    // ============================================
    console.log('\nCreating category-specific tables...');

    for (const category of CATEGORIES) {
      console.log(`  Creating ${category} tables...`);

      // Sub-categories
      await pool.request().query(`
        CREATE TABLE ${category}_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(255) NOT NULL,
          name_th NVARCHAR(255) NULL,
          [key] NVARCHAR(50) NULL,
          sort_order INT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
      `);

      // Metrics
      await pool.request().query(`
        CREATE TABLE ${category}_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          department_id NVARCHAR(50) NULL,
          sub_category_id INT NULL,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(50) NULL,
          fy25_target NVARCHAR(200) NULL,
          main NVARCHAR(100) NULL,
          main_relate NVARCHAR(200) NULL,
          description_of_target NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          CONSTRAINT FK_${category}_metrics_subcat FOREIGN KEY (sub_category_id) REFERENCES ${category}_sub_categories(id),
          CONSTRAINT FK_${category}_metrics_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id)
        );
        CREATE INDEX IX_${category}_metrics_dept ON ${category}_metrics(department_id);
      `);

      // Data entries
      await pool.request().query(`
        CREATE TABLE ${category}_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month TINYINT NULL,
          year INT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          reason NVARCHAR(1000) NULL,
          recover_activity NVARCHAR(1000) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month TINYINT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          CONSTRAINT FK_${category}_entries_metric FOREIGN KEY (metric_id) REFERENCES ${category}_metrics(id)
        );
        CREATE INDEX IX_${category}_entries_year ON ${category}_data_entries(year);
        CREATE INDEX IX_${category}_entries_metric ON ${category}_data_entries(metric_id);
      `);
    }

    // ============================================
    // 4. CREATE KPI FORM TABLES
    // ============================================
    console.log('\nCreating KPI form tables...');

    // KPI Yearly Targets
    console.log('  Creating kpi_yearly_targets...');
    await pool.request().query(`
      CREATE TABLE kpi_yearly_targets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_id NVARCHAR(50) NOT NULL,
        category_id INT NOT NULL,
        metric_id INT NULL,
        fiscal_year INT NOT NULL,
        company_policy NVARCHAR(MAX) NULL,
        department_policy NVARCHAR(MAX) NULL,
        key_actions NVARCHAR(MAX) NULL,
        fy_target DECIMAL(18,4) NULL,
        fy_target_text NVARCHAR(100) NULL,
        main_pic NVARCHAR(100) NULL,
        main_support NVARCHAR(255) NULL,
        president_approved BIT DEFAULT 0,
        vp_approved BIT DEFAULT 0,
        dept_head_approved BIT DEFAULT 0,
        created_by INT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_yearly_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
        CONSTRAINT FK_yearly_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id)
      );
      CREATE INDEX IX_yearly_dept ON kpi_yearly_targets(department_id);
      CREATE INDEX IX_yearly_year ON kpi_yearly_targets(fiscal_year);
    `);

    // KPI Monthly Entries
    console.log('  Creating kpi_monthly_entries...');
    await pool.request().query(`
      CREATE TABLE kpi_monthly_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        yearly_target_id INT NULL,
        department_id NVARCHAR(50) NOT NULL,
        category_id INT NOT NULL,
        metric_id INT NULL,
        fiscal_year INT NOT NULL,
        month TINYINT NOT NULL,
        way_of_measurement NVARCHAR(500) NULL,
        target DECIMAL(18,4) NULL,
        target_text NVARCHAR(100) NULL,
        result DECIMAL(18,4) NULL,
        result_text NVARCHAR(100) NULL,
        ev NVARCHAR(10) NULL,
        accu_target DECIMAL(18,4) NULL,
        accu_result DECIMAL(18,4) NULL,
        forecast DECIMAL(18,4) NULL,
        reason NVARCHAR(1000) NULL,
        recover_activity NVARCHAR(1000) NULL,
        recovery_month TINYINT NULL,
        dept_head_approved BIT DEFAULT 0,
        approved_at DATETIME NULL,
        approved_by INT NULL,
        revision_flag BIT DEFAULT 0,
        revision_note NVARCHAR(500) NULL,
        created_by INT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_monthly_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id),
        CONSTRAINT FK_monthly_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
        CONSTRAINT FK_monthly_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id)
      );
      CREATE INDEX IX_monthly_dept ON kpi_monthly_entries(department_id);
      CREATE INDEX IX_monthly_year ON kpi_monthly_entries(fiscal_year);
    `);

    // KPI Action Plans
    console.log('  Creating kpi_action_plans...');
    await pool.request().query(`
      CREATE TABLE kpi_action_plans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_id NVARCHAR(50) NOT NULL,
        yearly_target_id INT NULL,
        fiscal_year INT NOT NULL,
        key_action NVARCHAR(500) NOT NULL,
        action_plan NVARCHAR(1000) NULL,
        action_detail NVARCHAR(MAX) NULL,
        target_of_action NVARCHAR(500) NULL,
        result_of_action NVARCHAR(500) NULL,
        person_in_charge NVARCHAR(100) NULL,
        start_month TINYINT NULL,
        end_month TINYINT NULL,
        lead_time_months TINYINT NULL,
        actual_start_date DATE NULL,
        actual_end_date DATE NULL,
        actual_kickoff DATE NULL,
        status NVARCHAR(20) DEFAULT 'Planned',
        progress_percent TINYINT DEFAULT 0,
        pdca_stage NVARCHAR(10) NULL,
        pdca_notes NVARCHAR(500) NULL,
        jan_status NVARCHAR(10) NULL,
        feb_status NVARCHAR(10) NULL,
        mar_status NVARCHAR(10) NULL,
        apr_status NVARCHAR(10) NULL,
        may_status NVARCHAR(10) NULL,
        jun_status NVARCHAR(10) NULL,
        jul_status NVARCHAR(10) NULL,
        aug_status NVARCHAR(10) NULL,
        sep_status NVARCHAR(10) NULL,
        oct_status NVARCHAR(10) NULL,
        nov_status NVARCHAR(10) NULL,
        dec_status NVARCHAR(10) NULL,
        sort_order INT DEFAULT 0,
        created_by INT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_action_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
        CONSTRAINT FK_action_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id)
      );
      CREATE INDEX IX_action_dept ON kpi_action_plans(department_id);
      CREATE INDEX IX_action_year ON kpi_action_plans(fiscal_year);
    `);

    // User Department Access
    console.log('  Creating user_department_access...');
    await pool.request().query(`
      CREATE TABLE user_department_access (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        department_id NVARCHAR(50) NOT NULL,
        access_level NVARCHAR(20) NOT NULL DEFAULT 'view',
        granted_by INT NULL,
        granted_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_access_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT FK_access_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
        CONSTRAINT UQ_user_dept_access UNIQUE (user_id, department_id)
      );
    `);

    // ============================================
    // 5. SEED DEFAULT DATA
    // ============================================
    console.log('\nSeeding default data...');

    console.log('  Seeding kpi_categories...');
    const categories = [
      { name: 'Safety', key: 'safety', description: 'Safety KPIs' },
      { name: 'Quality', key: 'quality', description: 'Quality KPIs' },
      { name: 'Delivery', key: 'delivery', description: 'Delivery KPIs' },
      { name: 'Compliance', key: 'compliance', description: 'Compliance KPIs' },
      { name: 'HR', key: 'hr', description: 'Human Resources KPIs' },
      { name: 'Attractive', key: 'attractive', description: 'Attractive Workplace KPIs' },
      { name: 'Environment', key: 'environment', description: 'Environment KPIs' },
      { name: 'Cost', key: 'cost', description: 'Cost KPIs' },
    ];

    for (const cat of categories) {
      await pool
        .request()
        .input('name', cat.name)
        .input('key', cat.key)
        .input('description', cat.description).query(`
          INSERT INTO kpi_categories (name, [key], description, sort_order, is_active)
          VALUES (@name, @key, @description, 0, 1)
        `);
    }
    console.log(`    Inserted ${categories.length} categories`);

    // ============================================
    // 6. VERIFY TABLES
    // ============================================
    console.log('\nVerifying KPI tables...');
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME IN (
        'departments', 'users', 'user_department_access',
        'kpi_categories', 'kpi_yearly_targets', 'kpi_monthly_entries', 'kpi_action_plans',
        ${CATEGORIES.map((c) => `'${c}_sub_categories', '${c}_metrics', '${c}_data_entries'`).join(', ')}
      )
      ORDER BY TABLE_NAME
    `);

    console.log('\nKPI Tables created:');
    for (const row of result.recordset) {
      console.log(`  - ${row.TABLE_NAME}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('KPI DATABASE RESET COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  } finally {
    await pool.close();
  }
}

resetKpiDatabase().catch(console.error);
