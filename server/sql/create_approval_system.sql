-- Approval System Tables
CREATE TABLE kpi_department_approvers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    department_id INT NOT NULL,
    department_name NVARCHAR(200) NOT NULL,
    hos_approvers NVARCHAR(MAX),
    hod_approvers NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE kpi_approval_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    entity_type NVARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    approval_level NVARCHAR(50) NOT NULL,
    approver_id INT,
    action NVARCHAR(20) NOT NULL,
    comments NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE kpi_result_declarations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    monthly_result_id INT NOT NULL,
    declaration_text NVARCHAR(MAX) NOT NULL,
    attachment_url NVARCHAR(500),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE kpi_notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    notification_type NVARCHAR(50) NOT NULL,
    entity_type NVARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);

-- Add status columns to yearly_targets
ALTER TABLE kpi_yearly_targets ADD
    approval_status NVARCHAR(50) DEFAULT 'pending',
    hos_approved BIT DEFAULT 0,
    hod_approved BIT DEFAULT 0,
    hos_approved_by INT,
    hod_approved_by INT,
    hos_approved_at DATETIME,
    hod_approved_at DATETIME,
    approval_version INT DEFAULT 1;

-- Add status columns to monthly_targets
ALTER TABLE kpi_monthly_targets ADD
    approval_status NVARCHAR(50) DEFAULT 'pending',
    hos_approved BIT DEFAULT 0,
    hod_approved BIT DEFAULT 0,
    hos_approved_by INT,
    hod_approved_by INT,
    hos_approved_at DATETIME,
    hod_approved_at DATETIME,
    approval_version INT DEFAULT 1;

-- Add status columns to monthly_results
ALTER TABLE kpi_monthly_targets ADD
    result_approval_status NVARCHAR(50) DEFAULT 'pending',
    result_hos_approved BIT DEFAULT 0,
    result_hod_approved BIT DEFAULT 0,
    result_admin_approved BIT DEFAULT 0,
    result_hos_approved_by INT,
    result_hod_approved_by INT,
    result_admin_approved_by INT,
    result_hos_approved_at DATETIME,
    result_hod_approved_at DATETIME,
    result_admin_approved_at DATETIME,
    is_incomplete BIT DEFAULT 0,
    result_approval_version INT DEFAULT 1;
