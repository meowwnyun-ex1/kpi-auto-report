import sql from 'mssql';
import { config } from 'dotenv';
import { getKpiDbConfig } from '../config/app-config';

// Load environment variables
config();

async function addFiscalYearColumn() {
  const config = getKpiDbConfig();

  const pool = new sql.ConnectionPool({
    server: config.host,
    database: config.database,
    user: process.env.KPI_DB_USER,
    password: process.env.KPI_DB_PASSWORD,
    port: config.port,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });

  try {
    await pool.connect();
    console.log('Connected to database');

    // Check and add fiscal_year to kpi_yearly_targets
    const checkResult = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME='kpi_yearly_targets' AND COLUMN_NAME='fiscal_year'
    `);

    if (checkResult.recordset[0].cnt === 0) {
      await pool.request().query(`
        ALTER TABLE kpi_yearly_targets ADD fiscal_year INT NULL
      `);
      console.log('✓ Added fiscal_year column to kpi_yearly_targets');
    } else {
      console.log('✓ fiscal_year column already exists in kpi_yearly_targets');
    }

    // Check and add fiscal_year to kpi_monthly_targets
    const checkMonthlyResult = await pool.request().query(`
      SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME='kpi_monthly_targets' AND COLUMN_NAME='fiscal_year'
    `);

    if (checkMonthlyResult.recordset[0].cnt === 0) {
      await pool.request().query(`
        ALTER TABLE kpi_monthly_targets ADD fiscal_year INT NULL
      `);
      console.log('✓ Added fiscal_year column to kpi_monthly_targets');
    } else {
      console.log('✓ fiscal_year column already exists in kpi_monthly_targets');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.close();
    process.exit(0);
  }
}

addFiscalYearColumn();
