/**
 * Safe KPI-DB Database Migration
 * This script creates tables only if they don't exist
 * Does NOT drop existing tables - safe for production
 * Run this on kpi-db database
 */

USE [kpi-db];
GO

PRINT '========================================';
PRINT 'Safe KPI-DB Database Migration';
PRINT '========================================';
PRINT '';

-- ============================================
-- CREATE AUTHENTICATION TABLES
-- ============================================

PRINT 'Creating authentication tables...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        full_name NVARCHAR(200) NOT NULL,
        password_hash NVARCHAR(255),
        role NVARCHAR(20) NOT NULL DEFAULT 'user',
        department_id NVARCHAR(50),
        department_name NVARCHAR(200),
        profile_image_url NVARCHAR(500),
        is_active BIT DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        
        CONSTRAINT CK_users_role CHECK (role IN ('superadmin', 'admin', 'manager', 'hod', 'hos', 'user', 'guest'))
    );
    PRINT 'Created users table';
END
ELSE
BEGIN
    PRINT 'users table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_department_access')
BEGIN
    CREATE TABLE user_department_access (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        department_id NVARCHAR(50) NOT NULL,
        access_level NVARCHAR(20) DEFAULT 'full',
        granted_by INT,
        granted_at DATETIME DEFAULT GETDATE(),
        is_active BIT DEFAULT 1,
        
        CONSTRAINT FK_user_department_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT CK_access_level CHECK (access_level IN ('full', 'read_only', 'approve'))
    );
    PRINT 'Created user_department_access table';
END
ELSE
BEGIN
    PRINT 'user_department_access table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_department_mapping')
BEGIN
    CREATE TABLE kpi_department_mapping (
        kpi_code NVARCHAR(50) PRIMARY KEY,
        spo_dept_id NVARCHAR(50),
        description NVARCHAR(200) NOT NULL,
        company NVARCHAR(100),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created kpi_department_mapping table';
END
ELSE
BEGIN
    PRINT 'kpi_department_mapping table already exists';
END

PRINT 'Authentication tables check complete';
PRINT '';
GO

-- ============================================
-- CREATE MASTER DATA TABLES
-- ============================================

PRINT 'Creating master data tables...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_categories')
BEGIN
    CREATE TABLE kpi_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        [key] NVARCHAR(50) NOT NULL UNIQUE,
        name NVARCHAR(200) NOT NULL,
        name_th NVARCHAR(200),
        description NVARCHAR(MAX),
        icon NVARCHAR(100),
        color NVARCHAR(20),
        priority NVARCHAR(20) DEFAULT 'medium',
        sort_order INT DEFAULT 0,
        parent_id INT,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        
        CONSTRAINT FK_kpi_categories_parent FOREIGN KEY (parent_id) REFERENCES kpi_categories(id)
    );
    PRINT 'Created kpi_categories table';
END
ELSE
BEGIN
    PRINT 'kpi_categories table already exists';
END

PRINT 'Master data tables check complete';
PRINT '';
GO

-- ============================================
-- CREATE KPI TABLES
-- ============================================

PRINT 'Creating KPI tables...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_measurements')
BEGIN
    CREATE TABLE kpi_measurements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category_id INT NOT NULL,
        name NVARCHAR(500) NOT NULL,
        name_th NVARCHAR(500),
        description NVARCHAR(MAX),
        unit NVARCHAR(50) NOT NULL,
        data_type NVARCHAR(20) NOT NULL DEFAULT 'number',
        calculation_formula NVARCHAR(MAX),
        target_direction NVARCHAR(20) NOT NULL DEFAULT 'higher_is_better',
        sort_order INT DEFAULT 0,
        main_department_id NVARCHAR(50),
        related_department_ids NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        
        CONSTRAINT FK_kpi_measurements_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id),
        CONSTRAINT FK_kpi_measurements_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_measurements_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
    PRINT 'Created kpi_measurements table';
END
ELSE
BEGIN
    PRINT 'kpi_measurements table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_yearly_targets')
BEGIN
    CREATE TABLE kpi_yearly_targets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category_id INT NOT NULL,
        measurement_id INT,
        measurement NVARCHAR(500) NOT NULL,
        unit NVARCHAR(50) NOT NULL,
        main NVARCHAR(50),
        main_relate NVARCHAR(255),
        description_of_target NVARCHAR(MAX),
        fy_target DECIMAL(18,4),
        fy_target_text NVARCHAR(500),
        stretch_target DECIMAL(18,4),
        minimum_target DECIMAL(18,4),
        key_actions NVARCHAR(MAX),
        main_pic NVARCHAR(200),
        main_support NVARCHAR(200),
        company_policy NVARCHAR(MAX),
        department_policy NVARCHAR(MAX),
        remaining_kadai NVARCHAR(MAX),
        environment_changes NVARCHAR(MAX),
        support_sdm NVARCHAR(MAX),
        support_skd NVARCHAR(MAX),
        total_quota DECIMAL(18,4) DEFAULT 0,
        used_quota DECIMAL(18,4) DEFAULT 0,
        dept_quota DECIMAL(18,4) DEFAULT 0,
        target_type NVARCHAR(50),
        fiscal_year INT NOT NULL,
        
        approval_status NVARCHAR(50) DEFAULT 'draft',
        hos_approved BIT DEFAULT 0,
        hod_approved BIT DEFAULT 0,
        hos_approved_by INT,
        hod_approved_by INT,
        hos_approved_at DATETIME,
        hod_approved_at DATETIME,
        approval_version INT DEFAULT 1,
        
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        
        CONSTRAINT FK_kpi_yearly_targets_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id),
        CONSTRAINT FK_kpi_yearly_targets_measurement FOREIGN KEY (measurement_id) REFERENCES kpi_measurements(id),
        CONSTRAINT FK_kpi_yearly_targets_hos_by FOREIGN KEY (hos_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_yearly_targets_hod_by FOREIGN KEY (hod_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_yearly_targets_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_yearly_targets_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
    PRINT 'Created kpi_yearly_targets table';
END
ELSE
BEGIN
    PRINT 'kpi_yearly_targets table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_monthly_targets')
BEGIN
    CREATE TABLE kpi_monthly_targets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        yearly_target_id INT NOT NULL,
        month INT NOT NULL,
        target DECIMAL(18,4) DEFAULT 0,
        result DECIMAL(18,4),
        ev NVARCHAR(10),
        accu_target DECIMAL(18,4),
        accu_result DECIMAL(18,4),
        forecast DECIMAL(18,4),
        reason NVARCHAR(1000),
        recover_activity NVARCHAR(1000),
        recovery_month INT,
        comment NVARCHAR(MAX),
        image_url NVARCHAR(500),
        image_caption NVARCHAR(500),
        main NVARCHAR(50),
        main_relate NVARCHAR(255),
        
        approval_status NVARCHAR(50) DEFAULT 'draft',
        hos_approved BIT DEFAULT 0,
        hod_approved BIT DEFAULT 0,
        hos_approved_by INT,
        hod_approved_by INT,
        hos_approved_at DATETIME,
        hod_approved_at DATETIME,
        approval_version INT DEFAULT 1,
        
        result_approval_status NVARCHAR(50) DEFAULT 'draft',
        result_hos_approved BIT DEFAULT 0,
        result_hod_approved BIT DEFAULT 0,
        result_admin_approved BIT DEFAULT 0,
        result_hos_approved_by INT,
        result_hod_approved_by INT,
        result_admin_approved_by INT,
        result_hos_approved_at DATETIME,
        result_hod_approved_at DATETIME,
        result_admin_approved_at DATETIME,
        result_approval_version INT DEFAULT 1,
        is_incomplete BIT DEFAULT 0,
        
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        
        CONSTRAINT FK_kpi_monthly_targets_yearly FOREIGN KEY (yearly_target_id) REFERENCES kpi_yearly_targets(id) ON DELETE CASCADE,
        CONSTRAINT FK_kpi_monthly_targets_hos_by FOREIGN KEY (hos_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_targets_hod_by FOREIGN KEY (hod_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_targets_result_hos_by FOREIGN KEY (result_hos_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_targets_result_hod_by FOREIGN KEY (result_hod_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_targets_result_admin_by FOREIGN KEY (result_admin_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_targets_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_targets_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
    PRINT 'Created kpi_monthly_targets table';
END
ELSE
BEGIN
    -- Check if main and main_relate columns exist, add them if they don't
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'kpi_monthly_targets' AND COLUMN_NAME = 'main')
    BEGIN
        ALTER TABLE kpi_monthly_targets ADD main NVARCHAR(50);
        PRINT 'Added main column to kpi_monthly_targets';
    END
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'kpi_monthly_targets' AND COLUMN_NAME = 'main_relate')
    BEGIN
        ALTER TABLE kpi_monthly_targets ADD main_relate NVARCHAR(255);
        PRINT 'Added main_relate column to kpi_monthly_targets';
    END
    
    PRINT 'kpi_monthly_targets table already exists and updated';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_monthly_results')
BEGIN
    CREATE TABLE kpi_monthly_results (
        id INT IDENTITY(1,1) PRIMARY KEY,
        monthly_target_id INT NOT NULL,
        result_value DECIMAL(18,4) NOT NULL DEFAULT 0,
        achievement_percentage DECIMAL(5,2),
        variance DECIMAL(18,4),
        comments NVARCHAR(MAX),
        evidence_attachments NVARCHAR(MAX),
        declaration_text NVARCHAR(MAX),
        approval_status NVARCHAR(50) NOT NULL DEFAULT 'draft',
        hos_approved BIT DEFAULT 0,
        hod_approved BIT DEFAULT 0,
        admin_approved BIT DEFAULT 0,
        hos_approved_by INT,
        hod_approved_by INT,
        admin_approved_by INT,
        hos_approved_at DATETIME,
        hod_approved_at DATETIME,
        admin_approved_at DATETIME,
        is_incomplete BIT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        
        CONSTRAINT FK_kpi_monthly_results_monthly FOREIGN KEY (monthly_target_id) REFERENCES kpi_monthly_targets(id) ON DELETE CASCADE,
        CONSTRAINT FK_kpi_monthly_results_hos_by FOREIGN KEY (hos_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_results_hod_by FOREIGN KEY (hod_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_results_admin_by FOREIGN KEY (admin_approved_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_results_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_monthly_results_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
    PRINT 'Created kpi_monthly_results table';
END
ELSE
BEGIN
    PRINT 'kpi_monthly_results table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_action_plans')
BEGIN
    CREATE TABLE kpi_action_plans (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_id NVARCHAR(50) NOT NULL,
        category_id INT NOT NULL,
        measurement_id INT,
        measurement NVARCHAR(500) NOT NULL,
        fiscal_year INT NOT NULL,
        month INT,
        action_plan NVARCHAR(MAX),
        pic NVARCHAR(200),
        target_date DATE,
        status NVARCHAR(20) DEFAULT 'pending',
        progress DECIMAL(5,2) DEFAULT 0,
        budget_allocated DECIMAL(18,2),
        budget_spent DECIMAL(18,2),
        remarks NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        created_by INT,
        updated_by INT,
        
        CONSTRAINT FK_kpi_action_plans_category FOREIGN KEY (category_id) REFERENCES kpi_categories(id),
        CONSTRAINT FK_kpi_action_plans_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT FK_kpi_action_plans_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
    );
    PRINT 'Created kpi_action_plans table';
END
ELSE
BEGIN
    PRINT 'kpi_action_plans table already exists';
END

PRINT 'KPI tables check complete';
PRINT '';
GO

-- ============================================
-- CREATE APPROVAL SYSTEM TABLES
-- ============================================

PRINT 'Creating approval system tables...';

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_department_approvers')
BEGIN
    CREATE TABLE kpi_department_approvers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        department_id NVARCHAR(50) NOT NULL,
        department_name NVARCHAR(200) NOT NULL,
        hos_approvers NVARCHAR(MAX),
        hod_approvers NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created kpi_department_approvers table';
END
ELSE
BEGIN
    PRINT 'kpi_department_approvers table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_approval_logs')
BEGIN
    CREATE TABLE kpi_approval_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        entity_type NVARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        approval_level NVARCHAR(50) NOT NULL,
        approver_id INT,
        action NVARCHAR(20) NOT NULL,
        comments NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT FK_kpi_approval_logs_approver FOREIGN KEY (approver_id) REFERENCES users(id)
    );
    PRINT 'Created kpi_approval_logs table';
END
ELSE
BEGIN
    PRINT 'kpi_approval_logs table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_result_declarations')
BEGIN
    CREATE TABLE kpi_result_declarations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        monthly_result_id INT NOT NULL,
        declaration_text NVARCHAR(MAX) NOT NULL,
        attachment_url NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT FK_kpi_result_declarations_result FOREIGN KEY (monthly_result_id) REFERENCES kpi_monthly_results(id) ON DELETE CASCADE
    );
    PRINT 'Created kpi_result_declarations table';
END
ELSE
BEGIN
    PRINT 'kpi_result_declarations table already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_notifications')
BEGIN
    CREATE TABLE kpi_notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        notification_type NVARCHAR(50) NOT NULL,
        entity_type NVARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_read BIT DEFAULT 0,
        read_at DATETIME,
        action_url NVARCHAR(500),
        metadata NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        
        CONSTRAINT FK_kpi_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    PRINT 'Created kpi_notifications table';
END
ELSE
BEGIN
    PRINT 'kpi_notifications table already exists';
END

PRINT 'Approval system tables check complete';
PRINT '';
GO

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

PRINT 'Inserting default data...';

IF NOT EXISTS (SELECT * FROM kpi_categories)
BEGIN
    INSERT INTO kpi_categories ([key], name, name_th, description, icon, color, priority, sort_order) VALUES
    ('safety', 'Safety', 'ความปลอดภัย', 'Occupational health and safety metrics', 'shield', '#EF4444', 'critical', 1),
    ('quality', 'Quality', 'คุณภาพ', 'Product and service quality indicators', 'check-circle', '#3B82F6', 'high', 2),
    ('delivery', 'Delivery', 'การจัดส่ง', 'On-time delivery and logistics metrics', 'truck', '#10B981', 'medium', 3),
    ('cost', 'Cost', 'ต้นทุน', 'Cost control and efficiency measures', 'dollar-sign', '#F59E0B', 'high', 4),
    ('hr', 'Human Resources', 'ทรัพยากรบุคคล', 'Employee satisfaction and development', 'users', '#8B5CF6', 'low', 5),
    ('environment', 'Environment', 'สิ่งแวดล้อม', 'Environmental impact and sustainability', 'leaf', '#06B6D4', 'medium', 6),
    ('compliance', 'Compliance', 'ความสอดคล้อง', 'Regulatory compliance metrics', 'balance-scale', '#6366F1', 'high', 7),
    ('attractive', 'Attractive', 'ความน่าดึงดูด', 'Workplace attractiveness and engagement', 'star', '#DB2777', 'low', 8);
    PRINT 'Inserted KPI categories';
END
ELSE
BEGIN
    PRINT 'KPI categories already exist';
END

IF NOT EXISTS (SELECT * FROM kpi_department_mapping)
BEGIN
    INSERT INTO kpi_department_mapping (kpi_code, spo_dept_id, description, company) VALUES
    ('SE', 'SE001', 'Systems Engineering', 'DENSO'),
    ('GA', 'GA001', 'General Affairs', 'DENSO'),
    ('Pump/M', 'PM001', 'Pump Manufacturing', 'DENSO'),
    ('Pump/A', 'PA001', 'Pump Assembly', 'DENSO'),
    ('INJ/M', 'IM001', 'Injection Manufacturing', 'DENSO'),
    ('INJ/A', 'IA001', 'Injection Assembly', 'DENSO'),
    ('Valve', 'VL001', 'Valve Department', 'DENSO'),
    ('SOL', 'SL001', 'Solenoid Department', 'DENSO'),
    ('UC/M', 'UM001', 'UC Manufacturing', 'DENSO'),
    ('UC/A', 'UA001', 'UC Assembly', 'DENSO'),
    ('GDP', 'GD001', 'GDP Department', 'DENSO'),
    ('SIFS/DF', 'SD001', 'SIFS/DF Department', 'DENSO'),
    ('TIE', 'TE001', 'TIE Department', 'DENSO'),
    ('WH', 'WH001', 'Warehouse', 'DENSO'),
    ('MT', 'MT001', 'Maintenance', 'DENSO'),
    ('QA&QC', 'QC001', 'Quality Assurance & Control', 'DENSO'),
    ('ADM', 'AD001', 'Administration', 'DENSO'),
    ('PE', 'PE001', 'Process Engineering', 'DENSO'),
    ('PC', 'PC001', 'Production Control', 'DENSO'),
    ('SPD', 'SP001', 'Speed', 'DENSO');
    PRINT 'Inserted KPI department mappings';
END
ELSE
BEGIN
    PRINT 'KPI department mappings already exist';
END

PRINT 'Default data check complete';
PRINT '';
GO

PRINT '========================================';
PRINT 'Safe Migration Completed!';
PRINT '========================================';
PRINT 'Tables created/verified in kpi-db';
PRINT 'Default data inserted';
PRINT 'Ready for user seeding';
PRINT '========================================';
