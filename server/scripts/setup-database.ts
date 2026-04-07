import sql from 'mssql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * MASTER DATABASE SETUP SCRIPT
 * Creates a clean, minimal database structure for KPI Auto Report
 *
 * Tables created:
 * - departments (shared across all categories)
 * - users (authentication)
 * - user_department_access (RBAC for managers)
 * - kpi_yearly_targets (Page 1 - Yearly Form)
 * - kpi_monthly_entries (Page 2&3 - Monthly Entry)
 * - kpi_action_plans (Page 4 - Action Plans)
 *
 * Category-specific tables (for dashboard views):
 * - {category}_sub_categories
 * - {category}_metrics
 * - {category}_data_entries
 */

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

async function setupDatabase() {
  console.log('='.repeat(80));
  console.log('KPI AUTO REPORT - DATABASE SETUP');
  console.log('='.repeat(80));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}\n`);

  const pool = await new sql.ConnectionPool(config).connect();
  const request = pool.request();

  // ============================================
  // 1. DEPARTMENTS TABLE (Master)
  // ============================================
  console.log('📋 Creating departments table...');
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'departments')
    BEGIN
      CREATE TABLE departments (
        dept_id NVARCHAR(20) PRIMARY KEY,
        dept_code NVARCHAR(20) NOT NULL,
        name_en NVARCHAR(100) NOT NULL,
        name_th NVARCHAR(100) NOT NULL,
        division NVARCHAR(100) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ departments table created';
    END
    ELSE
    BEGIN
      PRINT '✓ departments table already exists';
    END
  `);

  // ============================================
  // 2. USERS TABLE
  // ============================================
  console.log('👥 Creating users table...');
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
        is_active BIT NOT NULL DEFAULT 1,
        last_login DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_user_department FOREIGN KEY (department_id) REFERENCES departments(dept_id)
      );
      PRINT '✓ users table created';
    END
    ELSE
    BEGIN
      PRINT '✓ users table already exists';
    END
  `);

  // ============================================
  // 3. USER_DEPARTMENT_ACCESS TABLE (RBAC)
  // ============================================
  console.log('🔐 Creating user_department_access table...');
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
        CONSTRAINT FK_access_department FOREIGN KEY (department_id) REFERENCES departments(dept_id),
        CONSTRAINT UQ_user_department UNIQUE (user_id, department_id)
      );
      PRINT '✓ user_department_access table created';
    END
    ELSE
    BEGIN
      PRINT '✓ user_department_access table already exists';
    END
  `);

  // ============================================
  // 4. KPI FORMS TABLES (Yearly/Monthly/Action Plans)
  // ============================================
  console.log('\n📊 Creating KPI Forms tables...');

  // kpi_yearly_targets
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_yearly_targets')
    BEGIN
      CREATE TABLE kpi_yearly_targets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_id NVARCHAR(20) NOT NULL,
        fiscal_year INT NOT NULL,
        category NVARCHAR(50) NOT NULL,
        metric_name NVARCHAR(500) NOT NULL,
        unit NVARCHAR(50) NULL,
        fy_target DECIMAL(18,4) NULL,
        policy NVARCHAR(MAX) NULL,
        key_action NVARCHAR(MAX) NULL,
        responsible_person NVARCHAR(200) NULL,
        is_approved BIT DEFAULT 0,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_yearly_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id)
      );
      CREATE INDEX IX_yearly_dept_year ON kpi_yearly_targets(department_id, fiscal_year);
      PRINT '✓ kpi_yearly_targets table created';
    END
    ELSE
    BEGIN
      PRINT '✓ kpi_yearly_targets table already exists';
    END
  `);

  // kpi_monthly_entries
  await request.query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_monthly_entries')
    BEGIN
      CREATE TABLE kpi_monthly_entries (
        id INT IDENTITY(1,1) PRIMARY KEY,
        yearly_target_id INT NULL,
        department_id NVARCHAR(20) NOT NULL,
        fiscal_year INT NOT NULL,
        month INT NOT NULL,
        category NVARCHAR(50) NOT NULL,
        metric_name NVARCHAR(500) NOT NULL,
        unit NVARCHAR(50) NULL,
        target DECIMAL(18,4) NULL,
        result DECIMAL(18,4) NULL,
        ev NVARCHAR(10) NULL,
        is_approved BIT DEFAULT 0,
        approved_by INT NULL,
        approved_at DATETIME NULL,
        created_by INT NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_monthly_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id),
        CONSTRAINT FK_monthly_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id)
      );
      CREATE INDEX IX_monthly_dept_year ON kpi_monthly_entries(department_id, fiscal_year, month);
      PRINT '✓ kpi_monthly_entries table created';
    END
    ELSE
    BEGIN
      PRINT '✓ kpi_monthly_entries table already exists';
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
        CONSTRAINT FK_action_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
        CONSTRAINT FK_action_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id)
      );
      CREATE INDEX IX_action_dept_year ON kpi_action_plans(department_id, fiscal_year);
      PRINT '✓ kpi_action_plans table created';
    END
    ELSE
    BEGIN
      PRINT '✓ kpi_action_plans table already exists';
    END
  `);

  // ============================================
  // 5. CATEGORY-SPECIFIC TABLES (For Dashboard)
  // ============================================
  console.log('\n📊 Creating category-specific tables...');

  for (const category of CATEGORIES) {
    console.log(`  Creating ${category} tables...`);

    // Sub-categories
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${category}_sub_categories')
      BEGIN
        CREATE TABLE ${category}_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          [key] NVARCHAR(50) NOT NULL,
          name_en NVARCHAR(100) NOT NULL,
          name_th NVARCHAR(100) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE()
        );
        PRINT '  ✓ ${category}_sub_categories created';
      END
    `);

    // Metrics
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${category}_metrics')
      BEGIN
        CREATE TABLE ${category}_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          sub_category_id INT NULL,
          metric_no INT NOT NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(50) NULL,
          fy_target DECIMAL(18,4) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE(),
          CONSTRAINT FK_${category}_metric_subcat FOREIGN KEY (sub_category_id) REFERENCES ${category}_sub_categories(id)
        );
        PRINT '  ✓ ${category}_metrics created';
      END
    `);

    // Data entries
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${category}_data_entries')
      BEGIN
        CREATE TABLE ${category}_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          department_id NVARCHAR(20) NULL,
          fiscal_year INT NOT NULL,
          month INT NOT NULL,
          target DECIMAL(18,4) NULL,
          result DECIMAL(18,4) NULL,
          ev NVARCHAR(10) NULL,
          notes NVARCHAR(MAX) NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          CONSTRAINT FK_${category}_entry_metric FOREIGN KEY (metric_id) REFERENCES ${category}_metrics(id),
          CONSTRAINT FK_${category}_entry_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id)
        );
        CREATE INDEX IX_${category}_entries ON ${category}_data_entries(fiscal_year, month);
        PRINT '  ✓ ${category}_data_entries created';
      END
    `);
  }

  // ============================================
  // 6. SEED DEFAULT DATA
  // ============================================
  console.log('\n🌱 Seeding default data...');

  // Seed departments
  const deptCount = await request.query('SELECT COUNT(*) as count FROM departments');
  if (deptCount.recordset[0].count === 0) {
    await request.query(`
      INSERT INTO departments (dept_id, dept_code, name_en, name_th, division) VALUES
      ('D001', 'A2S', 'Assembly Section 2', 'แผนกประกอบ 2', 'Production'),
      ('D002', 'A1S', 'Assembly Section 1', 'แผนกประกอบ 1', 'Production'),
      ('D003', 'M1S', 'Machining Section 1', 'แผนกกลึง 1', 'Production'),
      ('D004', 'M2S', 'Machining Section 2', 'แผนกกลึง 2', 'Production'),
      ('D005', 'QC', 'Quality Control', 'แผนกควบคุมคุณภาพ', 'Quality'),
      ('D006', 'QA', 'Quality Assurance', 'แผนกประกันคุณภาพ', 'Quality'),
      ('D007', 'HR', 'Human Resources', 'แผนกทรัพยากรบุคคล', 'Admin'),
      ('D008', 'GA', 'General Affairs', 'แผนกธุรการ', 'Admin'),
      ('D009', 'ACC', 'Accounting', 'แผนกบัญชี', 'Admin'),
      ('D010', 'PUR', 'Purchasing', 'แผนกจัดซื้อ', 'Admin'),
      ('D011', 'ENG', 'Engineering', 'แผนกวิศวกรรม', 'Engineering'),
      ('D012', 'MNT', 'Maintenance', 'แผนกซ่อมบำรุง', 'Engineering'),
      ('D013', 'PLN', 'Planning', 'แผนกวางแผน', 'Production'),
      ('D014', 'WH', 'Warehouse', 'แผนกคลัง', 'Logistics'),
      ('D015', 'LOG', 'Logistics', 'แผนกขนส่ง', 'Logistics'),
      ('D016', 'SEC', 'Security', 'แผนกรักษาความปลอดภัย', 'Admin'),
      ('D017', 'SAF', 'Safety', 'แผนกความปลอดภัย', 'Safety'),
      ('D018', 'ENV', 'Environment', 'แผนกสิ่งแวดล้อม', 'Safety'),
      ('D019', 'IT', 'Information Technology', 'แผนกเทคโนโลยีสารสนเทศ', 'Admin'),
      ('D020', 'R&D', 'Research & Development', 'แผนกวิจัยและพัฒนา', 'Engineering')
    `);
    console.log('  ✓ 20 departments seeded');
  } else {
    console.log(`  ✓ ${deptCount.recordset[0].count} departments already exist`);
  }

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
    console.log('  ✓ 3 default users seeded (Admin, SuperAdmin, Manager)');
  } else {
    console.log(`  ✓ ${userCount.recordset[0].count} users already exist`);
  }

  // ============================================
  // 7. SUMMARY
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

  console.log('\n📊 Tables created:');
  tables.recordset.forEach((t: any) => {
    console.log(`   ${t.TABLE_NAME}: ${t.ROW_COUNT || 0} rows`);
  });

  await pool.close();
  console.log('\n✅ Database setup completed successfully!');
}

setupDatabase().catch(console.error);
