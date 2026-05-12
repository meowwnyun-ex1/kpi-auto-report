-- Add fiscal_year column to kpi_yearly_targets table if it doesn't exist
USE [kpi-db];
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'kpi_yearly_targets' AND COLUMN_NAME = 'fiscal_year')
BEGIN
    ALTER TABLE kpi_yearly_targets ADD fiscal_year INT NULL;
    PRINT 'Added fiscal_year column to kpi_yearly_targets';
END
ELSE
BEGIN
    PRINT 'fiscal_year column already exists in kpi_yearly_targets';
END
GO

-- Also check if fiscal_year column exists in kpi_monthly_targets
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'kpi_monthly_targets' AND COLUMN_NAME = 'fiscal_year')
BEGIN
    ALTER TABLE kpi_monthly_targets ADD fiscal_year INT NULL;
    PRINT 'Added fiscal_year column to kpi_monthly_targets';
END
ELSE
BEGIN
    PRINT 'fiscal_year column already exists in kpi_monthly_targets';
END
GO

PRINT 'Migration completed';
