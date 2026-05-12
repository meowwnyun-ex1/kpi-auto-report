-- ============================================
-- KPI Management System - Database Schema
-- Complete implementation with approval flow
-- ============================================

-- Drop existing tables if needed (for clean setup)
IF OBJECT_ID('kpi_ms_approval_logs', 'U') IS NOT NULL DROP TABLE kpi_ms_approval_logs;
IF OBJECT_ID('kpi_ms_result_source_links', 'U') IS NOT NULL DROP TABLE kpi_ms_result_source_links;
IF OBJECT_ID('kpi_ms_monthly_results', 'U') IS NOT NULL DROP TABLE kpi_ms_monthly_results;
IF OBJECT_ID('kpi_ms_monthly_targets', 'U') IS NOT NULL DROP TABLE kpi_ms_monthly_targets;
IF OBJECT_ID('kpi_ms_yearly_targets', 'U') IS NOT NULL DROP TABLE kpi_ms_yearly_targets;
IF OBJECT_ID('kpi_ms_result_sources', 'U') IS NOT NULL DROP TABLE kpi_ms_result_sources;
IF OBJECT_ID('kpi_ms_departments', 'U') IS NOT NULL DROP TABLE kpi_ms_departments;
IF OBJECT_ID('kpi_ms_sub_categories', 'U') IS NOT NULL DROP TABLE kpi_ms_sub_categories;
IF OBJECT_ID('kpi_ms_categories', 'U') IS NOT NULL DROP TABLE kpi_ms_categories;

-- ============================================
-- MASTER DATA TABLES
-- ============================================

-- Categories Table
CREATE TABLE kpi_ms_categories (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  color NVARCHAR(20) DEFAULT '#3B82F6',
  sort_order INT DEFAULT 0,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Sub-categories Table
CREATE TABLE kpi_ms_sub_categories (
  id INT IDENTITY(1,1) PRIMARY KEY,
  category_id INT NOT NULL,
  name NVARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (category_id) REFERENCES kpi_ms_categories(id) ON DELETE CASCADE
);

-- Departments Table (Master Data)
CREATE TABLE kpi_ms_departments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(20) NOT NULL UNIQUE,
  name NVARCHAR(100) NOT NULL,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE()
);

-- Result Sources Table
CREATE TABLE kpi_ms_result_sources (
  id INT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(20) NOT NULL UNIQUE,
  name NVARCHAR(100) NOT NULL,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE()
);

-- ============================================
-- TRANSACTIONAL TABLES
-- ============================================

-- Yearly Targets Table (with draft system & approval flow)
CREATE TABLE kpi_ms_yearly_targets (
  id INT IDENTITY(1,1) PRIMARY KEY,
  category_id INT NOT NULL,
  sub_category_id INT NULL,
  kpi_name NVARCHAR(200) NOT NULL,
  kpi_type NVARCHAR(20) DEFAULT 'New', -- 'New', 'Existing'
  frequency NVARCHAR(20) DEFAULT '1/Y',
  unit NVARCHAR(50) NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  main_department_id INT NOT NULL,
  related_department_ids NVARCHAR(500) NULL, -- comma-separated department IDs
  year INT NOT NULL DEFAULT YEAR(GETDATE()),
  
  -- Draft system
  is_draft BIT DEFAULT 1,
  draft_data NVARCHAR(MAX) NULL, -- JSON storage for draft
  
  -- Status tracking
  status NVARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'hod_approved', 'hos_approved', 'approved', 'rejected'
  
  -- Approval flow tracking
  selected_approver_id INT NULL,
  submitted_at DATETIME NULL,
  submitted_by INT NULL,
  
  -- HoD approval (Step 1)
  hod_approved BIT DEFAULT 0,
  hod_approved_by INT NULL,
  hod_approved_at DATETIME NULL,
  hod_comments NVARCHAR(500) NULL,
  
  -- HoS approval (Step 2)
  hos_approved BIT DEFAULT 0,
  hos_approved_by INT NULL,
  hos_approved_at DATETIME NULL,
  hos_comments NVARCHAR(500) NULL,
  
  -- Admin approval (Step 3 - Final)
  admin_approved BIT DEFAULT 0,
  admin_approved_by INT NULL,
  admin_approved_at DATETIME NULL,
  admin_comments NVARCHAR(500) NULL,
  
  -- Metadata
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  
  FOREIGN KEY (category_id) REFERENCES kpi_ms_categories(id),
  FOREIGN KEY (sub_category_id) REFERENCES kpi_ms_sub_categories(id),
  FOREIGN KEY (main_department_id) REFERENCES kpi_ms_departments(id)
);

-- Monthly Targets Table (Pool allocation)
CREATE TABLE kpi_ms_monthly_targets (
  id INT IDENTITY(1,1) PRIMARY KEY,
  yearly_target_id INT NOT NULL,
  department_id INT NOT NULL,
  month INT NOT NULL, -- 1-12 (April = 4, March = 3 for fiscal year)
  year INT NOT NULL, -- Fiscal year (e.g., 2025)
  allocated_value DECIMAL(10,2) NOT NULL,
  
  -- Status tracking
  status NVARCHAR(50) DEFAULT 'draft', -- 'draft', 'pending', 'hod_approved', 'hos_approved', 'approved', 'rejected'
  
  -- Approval flow
  selected_approver_id INT NULL,
  submitted_at DATETIME NULL,
  submitted_by INT NULL,
  
  -- HoD approval
  hod_approved BIT DEFAULT 0,
  hod_approved_by INT NULL,
  hod_approved_at DATETIME NULL,
  hod_comments NVARCHAR(500) NULL,
  
  -- HoS approval
  hos_approved BIT DEFAULT 0,
  hos_approved_by INT NULL,
  hos_approved_at DATETIME NULL,
  hos_comments NVARCHAR(500) NULL,
  
  -- Admin approval
  admin_approved BIT DEFAULT 0,
  admin_approved_by INT NULL,
  admin_approved_at DATETIME NULL,
  admin_comments NVARCHAR(500) NULL,
  
  -- Metadata
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  
  FOREIGN KEY (yearly_target_id) REFERENCES kpi_ms_yearly_targets(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES kpi_ms_departments(id)
);

-- Monthly Results Table (with source validation)
CREATE TABLE kpi_ms_monthly_results (
  id INT IDENTITY(1,1) PRIMARY KEY,
  monthly_target_id INT NOT NULL,
  result_value DECIMAL(10,2) NOT NULL,
  
  -- Status: 'not_entered', 'full_complete', 'partial_complete', 'pending_approval', 'approved'
  status NVARCHAR(50) DEFAULT 'not_entered',
  
  -- For partial complete declarations
  declaration_reason NVARCHAR(500) NULL,
  declared_by INT NULL,
  declared_at DATETIME NULL,
  
  -- HoD approval for partial complete
  hod_approved BIT DEFAULT 0,
  hod_approved_by INT NULL,
  hod_approved_at DATETIME NULL,
  hod_comments NVARCHAR(500) NULL,
  
  -- Metadata
  created_by INT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  
  FOREIGN KEY (monthly_target_id) REFERENCES kpi_ms_monthly_targets(id) ON DELETE CASCADE
);

-- Result Source Links (Many-to-Many)
CREATE TABLE kpi_ms_result_source_links (
  id INT IDENTITY(1,1) PRIMARY KEY,
  monthly_result_id INT NOT NULL,
  source_id INT NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (monthly_result_id) REFERENCES kpi_ms_monthly_results(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES kpi_ms_result_sources(id)
);

-- Approval Logs (Audit trail)
CREATE TABLE kpi_ms_approval_logs (
  id INT IDENTITY(1,1) PRIMARY KEY,
  entity_type NVARCHAR(50) NOT NULL, -- 'yearly_target', 'monthly_target', 'monthly_result'
  entity_id INT NOT NULL,
  action NVARCHAR(50) NOT NULL, -- 'submit', 'approve', 'reject', 'submit_declaration'
  from_status NVARCHAR(50) NULL,
  to_status NVARCHAR(50) NOT NULL,
  approver_id INT NULL,
  approver_role NVARCHAR(50) NULL,
  comments NVARCHAR(500) NULL,
  created_at DATETIME DEFAULT GETDATE()
);

-- ============================================
-- SEED DATA
-- ============================================

-- Seed Categories
INSERT INTO kpi_ms_categories (name, color, sort_order) VALUES
('Safety', '#EF4444', 1),
('Quality', '#3B82F6', 2),
('Delivery', '#10B981', 3),
('Cost', '#F59E0B', 4),
('HR', '#8B5CF6', 5);

-- Seed Sub-categories
INSERT INTO kpi_ms_sub_categories (category_id, name, sort_order) VALUES
(1, 'Worksite', 1),
(1, 'Process', 2),
(2, 'Product', 1),
(2, 'Process', 2),
(3, 'On-time', 1),
(4, 'Budget', 1),
(5, 'Training', 1);

-- Seed Departments
INSERT INTO kpi_ms_departments (code, name) VALUES
('SE', 'Systems Engineering'),
('GA', 'General Affairs'),
('Pump/M', 'Pump Manufacturing'),
('Pump/A', 'Pump Assembly'),
('INJ/M', 'Injection Manufacturing'),
('INJ/A', 'Injection Assembly'),
('Valve', 'Valve Department'),
('SOL', 'Solenoid Department'),
('UC/M', 'UC Manufacturing'),
('UC/A', 'UC Assembly'),
('GDP', 'GDP Department'),
('SIFS/DF', 'SIFS/DF Department'),
('TIE', 'TIE Department'),
('WH', 'Warehouse'),
('MT', 'Maintenance'),
('QA&QC', 'Quality Assurance & Control'),
('ADM', 'Administration'),
('PE', 'Process Engineering'),
('PC', 'Production Control'),
('SPD', 'Speed');

-- Seed Result Sources
INSERT INTO kpi_ms_result_sources (code, name) VALUES
('Pump/M', 'Pump Manufacturing'),
('Pump/A', 'Pump Assembly'),
('INJ/M', 'Injection Manufacturing'),
('INJ/A', 'Injection Assembly'),
('Valve', 'Valve Department'),
('SOL', 'Solenoid Department'),
('UC/M', 'UC Manufacturing'),
('UC/A', 'UC Assembly'),
('GDP', 'GDP Department'),
('SIFS/DF', 'SIFS/DF Department'),
('TIE', 'TIE Department'),
('WH', 'Warehouse'),
('MT', 'Maintenance'),
('QA&QC', 'Quality Assurance & Control'),
('ADM', 'Administration'),
('PE', 'Process Engineering'),
('PC', 'Production Control'),
('SPD', 'Speed'),
('SE', 'Systems Engineering');
