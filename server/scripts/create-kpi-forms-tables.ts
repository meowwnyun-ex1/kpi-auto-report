import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

/**
 * Create tables for KPI forms based on Excel format:
 * - Page 1: Yearly Form (FY targets)
 * - Page 2&3: Monthly entries
 * - Page 4: Action Plan (Gantt chart)
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

async function createKpiFormTables(): Promise<void> {
  console.log('='.repeat(80));
  console.log('KPI FORM TABLES CREATION');
  console.log('='.repeat(80));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}\n`);

  try {
    const db = await new sql.ConnectionPool(config).connect();

    // ============================================
    // 1. KPI_YEARLY_TARGETS (Page 1 - Yearly Form)
    // ============================================
    console.log('Creating kpi_yearly_targets table...');
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_yearly_targets')
      BEGIN
        CREATE TABLE kpi_yearly_targets (
          id INT IDENTITY(1,1) PRIMARY KEY,
          department_id NVARCHAR(50) NOT NULL,
          category_id INT NOT NULL,
          metric_id INT NULL,
          fiscal_year INT NOT NULL,
          
          -- Policy and key actions
          company_policy NVARCHAR(MAX) NULL,
          department_policy NVARCHAR(MAX) NULL,
          key_actions NVARCHAR(MAX) NULL,
          remaining_kadai NVARCHAR(MAX) NULL,
          environment_changes NVARCHAR(MAX) NULL,
          
          -- Targets
          fy_target DECIMAL(18,4) NULL,
          fy_target_text NVARCHAR(100) NULL,
          main_pic NVARCHAR(100) NULL,
          main_support NVARCHAR(255) NULL,
          support_sdm NVARCHAR(255) NULL,
          support_skd NVARCHAR(255) NULL,
          
          -- Approval
          president_approved BIT DEFAULT 0,
          vp_approved BIT DEFAULT 0,
          dept_head_approved BIT DEFAULT 0,
          
          -- Metadata
          created_by INT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          
          CONSTRAINT FK_yearly_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
          CONSTRAINT FK_yearly_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id),
          CONSTRAINT FK_yearly_metric FOREIGN KEY (metric_id) REFERENCES kpi_metrics(id),
          CONSTRAINT UQ_yearly_target UNIQUE (department_id, category_id, metric_id, fiscal_year)
        );
        
        CREATE INDEX IX_yearly_dept ON kpi_yearly_targets(department_id);
        CREATE INDEX IX_yearly_year ON kpi_yearly_targets(fiscal_year);
        CREATE INDEX IX_yearly_category ON kpi_yearly_targets(category_id);
        
        PRINT 'Created kpi_yearly_targets table';
      END
    `);

    // ============================================
    // 2. KPI_MONTHLY_ENTRIES (Page 2&3 - Monthly)
    // ============================================
    console.log('Creating kpi_monthly_entries table...');
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_monthly_entries')
      BEGIN
        CREATE TABLE kpi_monthly_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          yearly_target_id INT NULL,
          department_id NVARCHAR(50) NOT NULL,
          category_id INT NOT NULL,
          metric_id INT NULL,
          fiscal_year INT NOT NULL,
          month TINYINT NOT NULL, -- 1-12 for Jan-Dec
          
          -- Measurement info
          way_of_measurement NVARCHAR(500) NULL,
          
          -- Monthly values
          target DECIMAL(18,4) NULL,
          target_text NVARCHAR(100) NULL,
          result DECIMAL(18,4) NULL,
          result_text NVARCHAR(100) NULL,
          ev NVARCHAR(10) NULL, -- Evaluation: G/Y/R or score
          
          -- Accumulated values
          accu_target DECIMAL(18,4) NULL,
          accu_result DECIMAL(18,4) NULL,
          
          -- Forecast and recovery
          forecast DECIMAL(18,4) NULL,
          reason NVARCHAR(1000) NULL,
          recover_activity NVARCHAR(1000) NULL,
          recovery_month TINYINT NULL,
          
          -- Approval
          dept_head_approved BIT DEFAULT 0,
          approved_at DATETIME NULL,
          approved_by INT NULL,
          
          -- Revision tracking
          revision_flag BIT DEFAULT 0,
          revision_note NVARCHAR(500) NULL,
          
          -- Metadata
          created_by INT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          
          CONSTRAINT FK_monthly_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id),
          CONSTRAINT FK_monthly_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
          CONSTRAINT FK_monthly_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id),
          CONSTRAINT FK_monthly_metric FOREIGN KEY (metric_id) REFERENCES kpi_metrics(id),
          CONSTRAINT UQ_monthly_entry UNIQUE (department_id, category_id, metric_id, fiscal_year, month)
        );
        
        CREATE INDEX IX_monthly_dept ON kpi_monthly_entries(department_id);
        CREATE INDEX IX_monthly_year ON kpi_monthly_entries(fiscal_year);
        CREATE INDEX IX_monthly_month ON kpi_monthly_entries(month);
        CREATE INDEX IX_monthly_category ON kpi_monthly_entries(category_id);
        
        PRINT 'Created kpi_monthly_entries table';
      END
    `);

    // ============================================
    // 3. KPI_ACTION_PLANS (Page 4 - Gantt Chart)
    // ============================================
    console.log('Creating kpi_action_plans table...');
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_action_plans')
      BEGIN
        CREATE TABLE kpi_action_plans (
          id INT IDENTITY(1,1) PRIMARY KEY,
          department_id NVARCHAR(50) NOT NULL,
          yearly_target_id INT NULL,
          fiscal_year INT NOT NULL,
          
          -- Action details
          key_action NVARCHAR(500) NOT NULL,
          action_plan NVARCHAR(1000) NULL,
          action_detail NVARCHAR(MAX) NULL,
          
          -- Targets
          target_of_action NVARCHAR(500) NULL,
          result_of_action NVARCHAR(500) NULL,
          
          -- Person in charge
          person_in_charge NVARCHAR(100) NULL,
          
          -- Gantt chart timing
          start_month TINYINT NULL, -- 1-12
          end_month TINYINT NULL, -- 1-12
          lead_time_months TINYINT NULL,
          
          -- Actual dates
          actual_start_date DATE NULL,
          actual_end_date DATE NULL,
          actual_kickoff DATE NULL,
          
          -- Status
          status NVARCHAR(20) DEFAULT 'Planned', -- Planned, In Progress, Completed, Delayed
          progress_percent TINYINT DEFAULT 0,
          
          -- PDCA cycle
          pdca_stage NVARCHAR(10) NULL, -- P, D, C, A
          pdca_notes NVARCHAR(500) NULL,
          
          -- Monthly progress tracking
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
          
          -- Metadata
          sort_order INT DEFAULT 0,
          created_by INT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE(),
          
          CONSTRAINT FK_action_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
          CONSTRAINT FK_action_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id),
        );
        
        CREATE INDEX IX_action_dept ON kpi_action_plans(department_id);
        CREATE INDEX IX_action_year ON kpi_action_plans(fiscal_year);
        CREATE INDEX IX_action_status ON kpi_action_plans(status);
        
        PRINT 'Created kpi_action_plans table';
      END
    `);

    // ============================================
    // 4. USER_DEPARTMENT_ACCESS (Manager access control)
    // ============================================
    console.log('Creating user_department_access table...');
    await db.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_department_access')
      BEGIN
        CREATE TABLE user_department_access (
          id INT IDENTITY(1,1) PRIMARY KEY,
          user_id INT NOT NULL,
          department_id NVARCHAR(50) NOT NULL,
          access_level NVARCHAR(20) NOT NULL, -- 'view', 'edit', 'approve'
          granted_by INT NULL,
          granted_at DATETIME DEFAULT GETDATE(),
          
          CONSTRAINT FK_access_user FOREIGN KEY (user_id) REFERENCES users(id),
          CONSTRAINT FK_access_dept FOREIGN KEY (department_id) REFERENCES departments(dept_id),
          CONSTRAINT UQ_user_dept_access UNIQUE (user_id, department_id)
        );
        
        CREATE INDEX IX_access_user ON user_department_access(user_id);
        CREATE INDEX IX_access_dept ON user_department_access(department_id);
        
        PRINT 'Created user_department_access table';
      END
    `);

    console.log('All KPI form tables created successfully');
    console.log('='.repeat(80));
    console.log('KPI FORM TABLES CREATION COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Failed to create KPI form tables', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createKpiFormTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed', error);
      process.exit(1);
    });
}
