"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
/**
 * Migration script for Compliance and HR KPI tables
 * Creates all necessary tables for KPI categories
 */
async function migrateKpiCategories() {
    console.log('Starting KPI Categories Migration...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. COMPLIANCE KPI TABLES
        // ============================================
        console.log('Creating Compliance KPI tables...');
        // Compliance Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='compliance_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE compliance_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: compliance_sub_categories';
      END
    `);
        // Compliance Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='compliance_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE compliance_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_compliance_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES compliance_sub_categories(id)
        );
        PRINT 'Created table: compliance_metrics';
      END
    `);
        // Compliance Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='compliance_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE compliance_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          forecast NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_compliance_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES compliance_metrics(id),
          CONSTRAINT UQ_compliance_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: compliance_data_entries';
      END
    `);
        // Create indexes for Compliance tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_compliance_metrics_sub_category')
        CREATE INDEX IX_compliance_metrics_sub_category ON compliance_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_compliance_entries_metric')
        CREATE INDEX IX_compliance_entries_metric ON compliance_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_compliance_entries_year_month')
        CREATE INDEX IX_compliance_entries_year_month ON compliance_data_entries(year, month);
    `);
        console.log('✅ Compliance KPI tables created successfully\n');
        // ============================================
        // 2. HR KPI TABLES
        // ============================================
        console.log('Creating HR KPI tables...');
        // HR Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hr_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE hr_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: hr_sub_categories';
      END
    `);
        // HR Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hr_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE hr_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_hr_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES hr_sub_categories(id)
        );
        PRINT 'Created table: hr_metrics';
      END
    `);
        // HR Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hr_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE hr_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          forecast NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_hr_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES hr_metrics(id),
          CONSTRAINT UQ_hr_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: hr_data_entries';
      END
    `);
        // Create indexes for HR tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_hr_metrics_sub_category')
        CREATE INDEX IX_hr_metrics_sub_category ON hr_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_hr_entries_metric')
        CREATE INDEX IX_hr_entries_metric ON hr_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_hr_entries_year_month')
        CREATE INDEX IX_hr_entries_year_month ON hr_data_entries(year, month);
    `);
        console.log('✅ HR KPI tables created successfully\n');
        // ============================================
        // 3. HR BY DEPARTMENT KPI TABLES
        // ============================================
        console.log('Creating HR by Department KPI tables...');
        // Departments
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='departments' AND xtype='U')
      BEGIN
        CREATE TABLE departments (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: departments';
      END
    `);
        // HR Department Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hr_dept_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE hr_dept_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: hr_dept_sub_categories';
      END
    `);
        // HR Department Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hr_dept_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE hr_dept_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          department_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_hr_dept_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES hr_dept_sub_categories(id),
          CONSTRAINT FK_hr_dept_metrics_department FOREIGN KEY (department_id) 
            REFERENCES departments(id)
        );
        PRINT 'Created table: hr_dept_metrics';
      END
    `);
        // HR Department Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hr_dept_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE hr_dept_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          forecast NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_hr_dept_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES hr_dept_metrics(id),
          CONSTRAINT UQ_hr_dept_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: hr_dept_data_entries';
      END
    `);
        // Create indexes for HR Department tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_hr_dept_metrics_sub_category')
        CREATE INDEX IX_hr_dept_metrics_sub_category ON hr_dept_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_hr_dept_metrics_department')
        CREATE INDEX IX_hr_dept_metrics_department ON hr_dept_metrics(department_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_hr_dept_entries_metric')
        CREATE INDEX IX_hr_dept_entries_metric ON hr_dept_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_hr_dept_entries_year_month')
        CREATE INDEX IX_hr_dept_entries_year_month ON hr_dept_data_entries(year, month);
    `);
        console.log('✅ HR by Department KPI tables created successfully\n');
        // ============================================
        // 4. ATTRACTIVE KPI TABLES
        // ============================================
        console.log('Creating Attractive KPI tables...');
        // Attractive Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attractive_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE attractive_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: attractive_sub_categories';
      END
    `);
        // Attractive Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attractive_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE attractive_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_attractive_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES attractive_sub_categories(id)
        );
        PRINT 'Created table: attractive_metrics';
      END
    `);
        // Attractive Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attractive_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE attractive_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          forecast NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          remark NVARCHAR(MAX) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_attractive_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES attractive_metrics(id),
          CONSTRAINT UQ_attractive_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: attractive_data_entries';
      END
    `);
        // Create indexes for Attractive tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_attractive_metrics_sub_category')
        CREATE INDEX IX_attractive_metrics_sub_category ON attractive_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_attractive_entries_metric')
        CREATE INDEX IX_attractive_entries_metric ON attractive_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_attractive_entries_year_month')
        CREATE INDEX IX_attractive_entries_year_month ON attractive_data_entries(year, month);
    `);
        console.log('✅ Attractive KPI tables created successfully\n');
        // ============================================
        // 5. ATTRACTIVE BY DEPARTMENT KPI TABLES
        // ============================================
        console.log('Creating Attractive by Department KPI tables...');
        // Attractive Department Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attractive_dept_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE attractive_dept_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: attractive_dept_sub_categories';
      END
    `);
        // Attractive Department Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attractive_dept_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE attractive_dept_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          department_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_attractive_dept_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES attractive_dept_sub_categories(id),
          CONSTRAINT FK_attractive_dept_metrics_department FOREIGN KEY (department_id) 
            REFERENCES departments(id)
        );
        PRINT 'Created table: attractive_dept_metrics';
      END
    `);
        // Attractive Department Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attractive_dept_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE attractive_dept_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          result NVARCHAR(200) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_attractive_dept_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES attractive_dept_metrics(id),
          CONSTRAINT UQ_attractive_dept_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: attractive_dept_data_entries';
      END
    `);
        // Create indexes for Attractive Department tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_attractive_dept_metrics_sub_category')
        CREATE INDEX IX_attractive_dept_metrics_sub_category ON attractive_dept_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_attractive_dept_metrics_department')
        CREATE INDEX IX_attractive_dept_metrics_department ON attractive_dept_metrics(department_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_attractive_dept_entries_metric')
        CREATE INDEX IX_attractive_dept_entries_metric ON attractive_dept_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_attractive_dept_entries_year_month')
        CREATE INDEX IX_attractive_dept_entries_year_month ON attractive_dept_data_entries(year, month);
    `);
        console.log('✅ Attractive by Department KPI tables created successfully\n');
        // ============================================
        // 6. ENVIRONMENT KPI TABLES
        // ============================================
        console.log('Creating Environment KPI tables...');
        // Environment Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='environment_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE environment_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: environment_sub_categories';
      END
    `);
        // Environment Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='environment_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE environment_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_environment_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES environment_sub_categories(id)
        );
        PRINT 'Created table: environment_metrics';
      END
    `);
        // Environment Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='environment_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE environment_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          forecast NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_environment_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES environment_metrics(id),
          CONSTRAINT UQ_environment_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: environment_data_entries';
      END
    `);
        // Create indexes for Environment tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_environment_metrics_sub_category')
        CREATE INDEX IX_environment_metrics_sub_category ON environment_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_environment_entries_metric')
        CREATE INDEX IX_environment_entries_metric ON environment_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_environment_entries_year_month')
        CREATE INDEX IX_environment_entries_year_month ON environment_data_entries(year, month);
    `);
        console.log('✅ Environment KPI tables created successfully\n');
        // ============================================
        // 7. ENVIRONMENT BY DEPARTMENT KPI TABLES
        // ============================================
        console.log('Creating Environment by Department KPI tables...');
        // Environment Department Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='environment_dept_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE environment_dept_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: environment_dept_sub_categories';
      END
    `);
        // Environment Department Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='environment_dept_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE environment_dept_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          department_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_environment_dept_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES environment_dept_sub_categories(id),
          CONSTRAINT FK_environment_dept_metrics_department FOREIGN KEY (department_id) 
            REFERENCES departments(id)
        );
        PRINT 'Created table: environment_dept_metrics';
      END
    `);
        // Environment Department Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='environment_dept_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE environment_dept_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          result NVARCHAR(200) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_environment_dept_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES environment_dept_metrics(id),
          CONSTRAINT UQ_environment_dept_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: environment_dept_data_entries';
      END
    `);
        // Create indexes for Environment Department tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_environment_dept_metrics_sub_category')
        CREATE INDEX IX_environment_dept_metrics_sub_category ON environment_dept_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_environment_dept_metrics_department')
        CREATE INDEX IX_environment_dept_metrics_department ON environment_dept_metrics(department_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_environment_dept_entries_metric')
        CREATE INDEX IX_environment_dept_entries_metric ON environment_dept_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_environment_dept_entries_year_month')
        CREATE INDEX IX_environment_dept_entries_year_month ON environment_dept_data_entries(year, month);
    `);
        console.log('✅ Environment by Department KPI tables created successfully\n');
        // ============================================
        // 9. COST KPI TABLES
        // ============================================
        console.log('Creating Cost KPI tables...');
        // Cost Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cost_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE cost_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: cost_sub_categories';
      END
    `);
        // Cost Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cost_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE cost_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_cost_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES cost_sub_categories(id)
        );
        PRINT 'Created table: cost_metrics';
      END
    `);
        // Cost Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='cost_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE cost_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          forecast NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_cost_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES cost_metrics(id),
          CONSTRAINT UQ_cost_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: cost_data_entries';
      END
    `);
        // Create indexes for Cost tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_cost_metrics_sub_category')
        CREATE INDEX IX_cost_metrics_sub_category ON cost_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_cost_entries_metric')
        CREATE INDEX IX_cost_entries_metric ON cost_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_cost_entries_year_month')
        CREATE INDEX IX_cost_entries_year_month ON cost_data_entries(year, month);
    `);
        console.log('✅ Cost KPI tables created successfully\n');
        // ============================================
        // 10. SAFETY KPI TABLES
        // ============================================
        console.log('Creating Safety KPI tables...');
        // Safety Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='safety_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE safety_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: safety_sub_categories';
      END
    `);
        // Safety Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='safety_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE safety_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_safety_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES safety_sub_categories(id)
        );
        PRINT 'Created table: safety_metrics';
      END
    `);
        // Safety Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='safety_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE safety_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_safety_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES safety_metrics(id),
          CONSTRAINT UQ_safety_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: safety_data_entries';
      END
    `);
        // Create indexes for Safety tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_safety_metrics_sub_category')
        CREATE INDEX IX_safety_metrics_sub_category ON safety_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_safety_entries_metric')
        CREATE INDEX IX_safety_entries_metric ON safety_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_safety_entries_year_month')
        CREATE INDEX IX_safety_entries_year_month ON safety_data_entries(year, month);
    `);
        console.log('✅ Safety KPI tables created successfully\n');
        // ============================================
        // 11. QUALITY KPI TABLES
        // ============================================
        console.log('Creating Quality KPI tables...');
        // Quality Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quality_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE quality_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: quality_sub_categories';
      END
    `);
        // Quality Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quality_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE quality_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_quality_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES quality_sub_categories(id)
        );
        PRINT 'Created table: quality_metrics';
      END
    `);
        // Quality Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quality_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE quality_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          forecast NVARCHAR(200) NULL,
          reason NVARCHAR(MAX) NULL,
          recover_activity NVARCHAR(MAX) NULL,
          forecast_result_total NVARCHAR(200) NULL,
          recovery_month NVARCHAR(50) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_quality_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES quality_metrics(id),
          CONSTRAINT UQ_quality_entry UNIQUE (metric_id, month, year)
        );
        PRINT 'Created table: quality_data_entries';
      END
    `);
        // Create indexes for Quality tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_quality_metrics_sub_category')
        CREATE INDEX IX_quality_metrics_sub_category ON quality_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_quality_entries_metric')
        CREATE INDEX IX_quality_entries_metric ON quality_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_quality_entries_year_month')
        CREATE INDEX IX_quality_entries_year_month ON quality_data_entries(year, month);
    `);
        console.log('✅ Quality KPI tables created successfully\n');
        // ============================================
        // 12. SAFETY BY DEPARTMENT TABLES
        // ============================================
        console.log('Creating Safety by Department KPI tables...');
        // Safety Department Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='safety_dept_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE safety_dept_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: safety_dept_sub_categories';
      END
    `);
        // Safety Department Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='safety_dept_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE safety_dept_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_safety_dept_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES safety_dept_sub_categories(id)
        );
        PRINT 'Created table: safety_dept_metrics';
      END
    `);
        // Safety Department Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='safety_dept_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE safety_dept_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          department_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_safety_dept_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES safety_dept_metrics(id),
          CONSTRAINT FK_safety_dept_entries_department FOREIGN KEY (department_id) 
            REFERENCES departments(id),
          CONSTRAINT UQ_safety_dept_entry UNIQUE (metric_id, department_id, month, year)
        );
        PRINT 'Created table: safety_dept_data_entries';
      END
    `);
        // Create indexes for Safety Department tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_safety_dept_metrics_sub_category')
        CREATE INDEX IX_safety_dept_metrics_sub_category ON safety_dept_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_safety_dept_entries_metric')
        CREATE INDEX IX_safety_dept_entries_metric ON safety_dept_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_safety_dept_entries_department')
        CREATE INDEX IX_safety_dept_entries_department ON safety_dept_data_entries(department_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_safety_dept_entries_year_month')
        CREATE INDEX IX_safety_dept_entries_year_month ON safety_dept_data_entries(year, month);
    `);
        console.log('✅ Safety by Department KPI tables created successfully\n');
        // ============================================
        // 13. QUALITY BY PRODUCT TABLES
        // ============================================
        console.log('Creating Quality by Product KPI tables...');
        // Quality Product Sub-Categories
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quality_product_sub_categories' AND xtype='U')
      BEGIN
        CREATE TABLE quality_product_sub_categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name_en NVARCHAR(200) NOT NULL,
          name_th NVARCHAR(200) NULL,
          [key] NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          sort_order INT DEFAULT 0,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: quality_product_sub_categories';
      END
    `);
        // Quality Product Metrics
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quality_product_metrics' AND xtype='U')
      BEGIN
        CREATE TABLE quality_product_metrics (
          id INT IDENTITY(1,1) PRIMARY KEY,
          no NVARCHAR(50) NULL,
          measurement NVARCHAR(500) NOT NULL,
          unit NVARCHAR(100) NULL,
          main NVARCHAR(200) NULL,
          main_relate NVARCHAR(200) NULL,
          fy25_target NVARCHAR(200) NULL,
          description_of_target NVARCHAR(MAX) NULL,
          sub_category_id INT NOT NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_quality_product_metrics_sub_category FOREIGN KEY (sub_category_id) 
            REFERENCES quality_product_sub_categories(id)
        );
        PRINT 'Created table: quality_product_metrics';
      END
    `);
        // Quality Product Data Entries
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quality_product_data_entries' AND xtype='U')
      BEGIN
        CREATE TABLE quality_product_data_entries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          metric_id INT NOT NULL,
          product_id INT NOT NULL,
          month NVARCHAR(20) NOT NULL,
          year INT NOT NULL,
          target NVARCHAR(200) NULL,
          result NVARCHAR(200) NULL,
          accu_target NVARCHAR(200) NULL,
          accu_result NVARCHAR(200) NULL,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE(),
          CONSTRAINT FK_quality_product_entries_metric FOREIGN KEY (metric_id) 
            REFERENCES quality_product_metrics(id),
          CONSTRAINT FK_quality_product_entries_product FOREIGN KEY (product_id) 
            REFERENCES products(id),
          CONSTRAINT UQ_quality_product_entry UNIQUE (metric_id, product_id, month, year)
        );
        PRINT 'Created table: quality_product_data_entries';
      END
    `);
        // Create indexes for Quality Product tables
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_quality_product_metrics_sub_category')
        CREATE INDEX IX_quality_product_metrics_sub_category ON quality_product_metrics(sub_category_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_quality_product_entries_metric')
        CREATE INDEX IX_quality_product_entries_metric ON quality_product_data_entries(metric_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_quality_product_entries_product')
        CREATE INDEX IX_quality_product_entries_product ON quality_product_data_entries(product_id);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_quality_product_entries_year_month')
        CREATE INDEX IX_quality_product_entries_year_month ON quality_product_data_entries(year, month);
    `);
        // Create products table if not exists
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='products' AND xtype='U')
      BEGIN
        CREATE TABLE products (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(200) NOT NULL,
          code NVARCHAR(50) NOT NULL UNIQUE,
          description NVARCHAR(500) NULL,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          updated_at DATETIME2 DEFAULT GETDATE()
        );
        PRINT 'Created table: products';
      END
    `);
        console.log('✅ Quality by Product KPI tables created successfully\n');
        console.log('========================================');
        console.log('🎉 KPI Categories Migration Completed Successfully!');
        console.log('========================================');
        console.log('\nTables created:');
        console.log('  - compliance_sub_categories');
        console.log('  - compliance_metrics');
        console.log('  - compliance_data_entries');
        console.log('  - hr_sub_categories');
        console.log('  - hr_metrics');
        console.log('  - hr_data_entries');
        console.log('  - departments');
        console.log('  - hr_dept_sub_categories');
        console.log('  - hr_dept_metrics');
        console.log('  - hr_dept_data_entries');
        console.log('  - attractive_sub_categories');
        console.log('  - attractive_metrics');
        console.log('  - attractive_data_entries');
        console.log('  - attractive_dept_sub_categories');
        console.log('  - attractive_dept_metrics');
        console.log('  - attractive_dept_data_entries');
        console.log('  - environment_sub_categories');
        console.log('  - environment_metrics');
        console.log('  - environment_data_entries');
        console.log('  - environment_dept_sub_categories');
        console.log('  - environment_dept_metrics');
        console.log('  - environment_dept_data_entries');
        console.log('  - cost_sub_categories');
        console.log('  - cost_metrics');
        console.log('  - cost_data_entries');
        console.log('  - safety_sub_categories');
        console.log('  - safety_metrics');
        console.log('  - safety_data_entries');
        console.log('  - quality_sub_categories');
        console.log('  - quality_metrics');
        console.log('  - quality_data_entries');
        console.log('  - safety_dept_sub_categories');
        console.log('  - safety_dept_metrics');
        console.log('  - safety_dept_data_entries');
        console.log('  - quality_product_sub_categories');
        console.log('  - quality_product_metrics');
        console.log('  - quality_product_data_entries');
        console.log('  - products');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
// Run migration
migrateKpiCategories()
    .then(() => {
    console.log('\n✅ Migration script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
});
