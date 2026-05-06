import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env.development');
dotenv.config({ path: envPath });

console.log('Environment loaded from:', envPath);

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

async function dropMetricNoColumn() {
  try {
    console.log('='.repeat(80));
    console.log('DROP metric_no COLUMN');
    console.log('='.repeat(80));
    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}\n`);

    const pool = await new sql.ConnectionPool(config).connect();
    console.log('✓ Connected to database\n');

    // Check if metric_no column exists
    const columnCheck = await pool.request().query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kpi_measurements' AND COLUMN_NAME = 'metric_no'
    `);

    if (columnCheck.recordset.length === 0) {
      console.log('✓ metric_no column does not exist in kpi_measurements table');
    } else {
      console.log('✓ Found metric_no column, dropping it...');
      await pool.request().query(`ALTER TABLE kpi_measurements DROP COLUMN metric_no`);
      console.log('✓ metric_no column dropped successfully');
    }

    await pool.close();
    console.log('\n✓ Database connection closed');
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    throw error;
  }
}

dropMetricNoColumn().catch(console.error);
