import sql from 'mssql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '../../.env' });
} else {
  dotenv.config({ path: '../../.env.development' });
}

/**
 * MASTER DATABASE SETUP SCRIPT
 * Creates a clean, minimal database structure for KPI Management Tool
 *
 * Tables created:
 * - users (authentication)
 * - user_department_access (RBAC for managers)
 * - password_reset_otps (OTP for password change)
 * - kpi_categories (KPI category master)
 * - kpi_department_mapping (KPI code <-> SPO dept mapping)
 * - kpi_yearly_targets (Page 1 - Yearly Form)
 * - kpi_monthly_targets (Page 2&3 - Monthly Entry)
 * - kpi_action_plans (Page 4 - Action Plans)
 * - kpi_measurement_sub_categories (measurement sub-categories)
 * - kpi_measurements (measurement master)
 *
 * Note: Department data comes from SPO_Dev.dept_master (not a local table)
 */

const config = {
  server: process.env.KPI_DB_HOST || '',
  database: process.env.KPI_DB_NAME || '',
  user: process.env.KPI_DB_USER || '',
  password: process.env.KPI_DB_PASSWORD || '',
  port: parseInt(process.env.KPI_DB_PORT || '1433'),
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
};

async function setupDatabase() {
  console.log('='.repeat(80));
  console.log('KPI Management Tool - DATABASE SETUP');
  console.log('='.repeat(80));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}\n`);

  const pool = await new sql.ConnectionPool(config).connect();
  const request = pool.request();

  // ============================================
  // 1. USERS TABLE
  // ============================================
  console.log('Creating users table...');
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
    BEGIN
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(200) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        department_id NVARCHAR(20) NULL,
        department_name NVARCHAR(100) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        last_login DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT 'users table created';
    END
    ELSE
    BEGIN
      PRINT 'users table already exists';
    END
  `);

  // ============================================
  // 2. USER_DEPARTMENT_ACCESS TABLE (RBAC)
  // ============================================
  console.log('Creating user_department_access table...');
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_department_access')
    BEGIN
      CREATE TABLE user_department_access (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        department_id NVARCHAR(20) NOT NULL,
        access_level NVARCHAR(20) NOT NULL DEFAULT 'view',
        granted_by INT NULL,
        granted_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_access_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT UQ_user_department UNIQUE (user_id, department_id)
      );
      PRINT 'user_department_access table created';
    END
    ELSE
    BEGIN
      PRINT 'user_department_access table already exists';
    END
  `);

  // ============================================
  // 3. PASSWORD_RESET_OTPS TABLE
  // ============================================
  console.log('Creating password_reset_otps table...');
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'password_reset_otps')
    BEGIN
      CREATE TABLE password_reset_otps (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        otp_hash NVARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        used BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_password_reset_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IX_password_reset_otps_user ON password_reset_otps(user_id);
      CREATE INDEX IX_password_reset_otps_expires ON password_reset_otps(expires_at);
      PRINT 'password_reset_otps table created';
    END
    ELSE
    BEGIN
      PRINT 'password_reset_otps table already exists';
    END
  `);

  // ============================================
  // 4. KPI CATEGORIES TABLE
  // ============================================
  console.log('Creating kpi_categories table...');
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_categories')
    BEGIN
      CREATE TABLE kpi_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(500) NULL,
        color NVARCHAR(20) NULL,
        sort_order INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT 'kpi_categories table created';
    END
    ELSE
    BEGIN
      PRINT 'kpi_categories table already exists';
    END
  `);

  // ============================================
  // 5. KPI DEPARTMENT MAPPING TABLE
  // ============================================
  console.log('Creating kpi_department_mapping table...');
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_department_mapping')
    BEGIN
      CREATE TABLE kpi_department_mapping (
        id INT IDENTITY(1,1) PRIMARY KEY,
        kpi_code NVARCHAR(50) NOT NULL UNIQUE,
        spo_dept_id NVARCHAR(50) NULL,
        description NVARCHAR(200) NOT NULL,
        company NVARCHAR(100) NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      CREATE INDEX IX_kpi_dept_code ON kpi_department_mapping(kpi_code);
      CREATE INDEX IX_kpi_spo_dept ON kpi_department_mapping(spo_dept_id);
      PRINT 'kpi_department_mapping table created';
    END
    ELSE
    BEGIN
      PRINT 'kpi_department_mapping table already exists';
    END
  `);

  // ============================================
  // 6. KPI FORMS TABLES (Yearly/Monthly/Action Plans)
  // ============================================
  console.log('Creating KPI Forms tables...');

  // kpi_yearly_targets
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_yearly_targets')
    BEGIN
      CREATE TABLE kpi_yearly_targets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_id NVARCHAR(50) NOT NULL,
        category_id INT NULL,
        measurement_id INT NULL,
        fiscal_year INT NOT NULL,
        company_policy NVARCHAR(MAX) NULL,
        department_policy NVARCHAR(MAX) NULL,
        key_actions NVARCHAR(MAX) NULL,
        fy_target DECIMAL(18,4) NULL,
        fy_target_text NVARCHAR(500) NULL,
        main_pic NVARCHAR(200) NULL,
        main_support NVARCHAR(200) NULL,
        president_approved BIT DEFAULT 0,
        vp_approved BIT DEFAULT 0,
        dept_head_approved BIT DEFAULT 0,
        remaining_kadai NVARCHAR(MAX) NULL,
        environment_changes NVARCHAR(MAX) NULL,
        support_sdm NVARCHAR(MAX) NULL,
        support_skd NVARCHAR(MAX) NULL,
        total_quota DECIMAL(18,4) DEFAULT 0,
        used_quota DECIMAL(18,4) DEFAULT 0,
        dept_quota DECIMAL(18,4) DEFAULT 0,
        target_type NVARCHAR(50) NULL,
        main_relate NVARCHAR(255) NULL,
        measurement NVARCHAR(500) NULL,
        unit NVARCHAR(50) NULL,
        main NVARCHAR(50) NULL,
        description_of_target NVARCHAR(MAX) NULL,
        sort_order INT DEFAULT 0,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by INT NULL
      );
      CREATE INDEX IX_yearly_dept_year ON kpi_yearly_targets(department_id, fiscal_year);
      CREATE INDEX IX_yearly_category ON kpi_yearly_targets(category_id);
      PRINT 'kpi_yearly_targets table created';
    END
    ELSE
    BEGIN
      PRINT 'kpi_yearly_targets table already exists';
    END
  `);

  // kpi_monthly_targets
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_monthly_targets')
    BEGIN
      CREATE TABLE kpi_monthly_targets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        yearly_target_id INT NULL,
        department_id NVARCHAR(50) NOT NULL,
        category_id INT NULL,
        fiscal_year INT NOT NULL,
        month INT NOT NULL,
        measurement NVARCHAR(500) NULL,
        unit NVARCHAR(50) NULL,
        main NVARCHAR(50) NULL,
        main_relate NVARCHAR(255) NULL,
        target DECIMAL(18,4) NULL,
        result DECIMAL(18,4) NULL,
        ev NVARCHAR(10) NULL,
        accu_target DECIMAL(18,4) NULL,
        accu_result DECIMAL(18,4) NULL,
        forecast DECIMAL(18,4) NULL,
        reason NVARCHAR(1000) NULL,
        recover_activity NVARCHAR(1000) NULL,
        recovery_month INT NULL,
        comment NVARCHAR(MAX) NULL,
        image_url NVARCHAR(500) NULL,
        image_caption NVARCHAR(500) NULL,
        dept_head_approved BIT DEFAULT 0,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        total_quota DECIMAL(18,4) NULL,
        dept_quota DECIMAL(18,4) NULL,
        target_type NVARCHAR(50) NULL,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_by INT NULL
      );
      CREATE INDEX IX_monthly_dept_year ON kpi_monthly_targets(department_id, fiscal_year, month);
      CREATE INDEX IX_monthly_yearly ON kpi_monthly_targets(yearly_target_id);
      PRINT 'kpi_monthly_targets table created';
    END
    ELSE
    BEGIN
      PRINT 'kpi_monthly_targets table already exists';
    END
  `);

  // kpi_action_plans
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_action_plans')
    BEGIN
      CREATE TABLE kpi_action_plans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_id NVARCHAR(20) NOT NULL,
        yearly_target_id INT NULL,
        fiscal_year INT NOT NULL,
        key_action NVARCHAR(500) NOT NULL,
        action_plan NVARCHAR(MAX) NULL,
        action_detail NVARCHAR(MAX) NULL,
        target_of_action NVARCHAR(500) NULL,
        result_of_action NVARCHAR(500) NULL,
        person_in_charge NVARCHAR(200) NULL,
        start_month INT NULL,
        end_month INT NULL,
        lead_time_months INT NULL,
        actual_start_date DATE NULL,
        actual_end_date DATE NULL,
        actual_kickoff DATE NULL,
        status NVARCHAR(50) DEFAULT 'Planned',
        progress_percent INT DEFAULT 0,
        pdca_stage NVARCHAR(10) NULL,
        pdca_notes NVARCHAR(MAX) NULL,
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
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_action_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id)
      );
      CREATE INDEX IX_action_dept_year ON kpi_action_plans(department_id, fiscal_year);
      PRINT 'kpi_action_plans table created';
    END
    ELSE
    BEGIN
      PRINT 'kpi_action_plans table already exists';
    END
  `);

  // ============================================
  // 7. KPI MEASUREMENTS TABLES (Master Data)
  // ============================================
  console.log('Creating KPI Measurements tables...');

  // kpi_measurement_sub_categories
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_measurement_sub_categories')
    BEGIN
      CREATE TABLE kpi_measurement_sub_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category_id INT NOT NULL,
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(500) NULL,
        sort_order INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      CREATE INDEX IX_subcat_category ON kpi_measurement_sub_categories(category_id);
      PRINT 'kpi_measurement_sub_categories table created';
    END
    ELSE
    BEGIN
      PRINT 'kpi_measurement_sub_categories table already exists';
    END
  `);

  // kpi_measurements
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_measurements')
    BEGIN
      CREATE TABLE kpi_measurements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category_id INT NOT NULL,
        sub_category_id INT NULL,
        name NVARCHAR(500) NOT NULL,
        description NVARCHAR(MAX) NULL,
        unit NVARCHAR(50) NULL,
        unit_type NVARCHAR(20) NULL,
        target_type NVARCHAR(50) NULL,
        measurement NVARCHAR(500) NULL,
        main_department_id NVARCHAR(20) NOT NULL,
        related_departments NVARCHAR(500) NULL,
        main_relate NVARCHAR(255) NULL,
        sort_order INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_measurement_subcat FOREIGN KEY (sub_category_id) REFERENCES kpi_measurement_sub_categories(id)
      );
      CREATE INDEX IX_measurement_category ON kpi_measurements(category_id);
      CREATE INDEX IX_measurement_subcat ON kpi_measurements(sub_category_id);
      PRINT 'kpi_measurements table created';
    END
    ELSE
    BEGIN
      PRINT 'kpi_measurements table already exists';
    END
  `);

  // ============================================
  // 8. SEED DEFAULT DATA
  // ============================================
  console.log('\nSeeding default data...');

  // Seed kpi_categories — must match CATEGORY_CONFIG keys in frontend
  const catCount = await request.query('SELECT COUNT(*) as count FROM kpi_categories');
  if (catCount.recordset[0].count === 0) {
    await request.query(`
      INSERT INTO kpi_categories (name, [key], description, color, sort_order) VALUES
      ('Safety',      'safety',      'Safety KPIs',      '#DC2626', 1),
      ('Quality',     'quality',     'Quality KPIs',     '#16A34A', 2),
      ('Delivery',    'delivery',    'Delivery KPIs',    '#2563EB', 3),
      ('Compliance',  'compliance',  'Compliance KPIs',  '#9333EA', 4),
      ('HR',          'hr',          'HR KPIs',          '#EA580C', 5),
      ('Attractive',  'attractive',  'Attractive KPIs',  '#DB2777', 6),
      ('Environment', 'environment', 'Environment KPIs', '#0D9488', 7),
      ('Cost',        'cost',        'Cost KPIs',        '#4F46E5', 8)
    `);
    console.log('  8 KPI categories seeded');
  } else {
    // Migrate: update existing categories to match correct keys/colors
    await request.query(`
      UPDATE kpi_categories SET [key] = 'compliance', name = 'Compliance', color = '#9333EA' WHERE [key] IN ('morale','sdm') AND sort_order = 4;
      UPDATE kpi_categories SET [key] = 'attractive',  name = 'Attractive',  color = '#DB2777' WHERE [key] IN ('skd') AND sort_order IN (7,8);
      UPDATE kpi_categories SET color = '#DC2626' WHERE [key] = 'safety';
      UPDATE kpi_categories SET color = '#16A34A' WHERE [key] = 'quality';
      UPDATE kpi_categories SET color = '#2563EB' WHERE [key] = 'delivery';
      UPDATE kpi_categories SET color = '#0D9488' WHERE [key] = 'environment';
      UPDATE kpi_categories SET color = '#4F46E5' WHERE [key] = 'cost';
    `);
    console.log(
      `  ${catCount.recordset[0].count} KPI categories already exist — colors/keys updated`
    );
  }

  // Note: Departments are managed in SPO_Dev.dept_master
  // KPI department mapping is seeded separately via seed-department-mapping.ts
  console.log('Skipping department seeding - using SPO_Dev.dept_master');

  // Seed admin users
  const userCount = await request.query('SELECT COUNT(*) as count FROM users');
  if (userCount.recordset[0].count === 0) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
    const managerPassword = await bcrypt.hash('Manager@123', 10);

    await request
      .input('admin_hash', hashedPassword)
      .input('superadmin_hash', superAdminPassword)
      .input('manager_hash', managerPassword).query(`
        INSERT INTO users (username, email, password_hash, full_name, role) VALUES
        ('Admin', 'admin@denso.com', @admin_hash, 'Administrator', 'admin'),
        ('SuperAdmin', 'superadmin@denso.com', @superadmin_hash, 'Super Administrator', 'superadmin'),
        ('Manager', 'manager@denso.com', @manager_hash, 'KPI Manager', 'manager')
      `);
    console.log('  3 default users seeded (Admin, SuperAdmin, Manager)');
  } else {
    console.log(`  ${userCount.recordset[0].count} users already exist`);
  }

  // ============================================
  // 9. SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(80));
  console.log('DATABASE SETUP COMPLETE');
  console.log('='.repeat(80));

  // Show all tables
  const tables = await request.query(`
    SELECT t.TABLE_NAME, p.rows as ROW_COUNT
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN sys.partitions p ON OBJECT_ID(t.TABLE_NAME) = p.object_id AND p.index_id IN (0, 1)
    WHERE t.TABLE_TYPE = 'BASE TABLE'
    ORDER BY t.TABLE_NAME
  `);

  console.log('\nTables created:');
  tables.recordset.forEach((t: any) => {
    console.log(`   ${t.TABLE_NAME}: ${t.ROW_COUNT || 0} rows`);
  });

  await pool.close();
  console.log('\nDatabase setup completed successfully!');
}

setupDatabase().catch(console.error);
