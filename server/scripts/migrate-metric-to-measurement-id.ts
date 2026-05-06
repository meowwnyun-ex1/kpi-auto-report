import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '../../.env' });
} else {
  dotenv.config({ path: '../../.env.development' });
}

/**
 * MIGRATION SCRIPT: Rename metric_id to measurement_id
 * 
 * This script renames the column 'metric_id' to 'measurement_id' in the kpi_yearly_targets table
 * to make the naming more consistent and clear.
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

async function migrateMetricToMeasurementId() {
  console.log('='.repeat(80));
  console.log('MIGRATION: Rename metric_id to measurement_id');
  console.log('='.repeat(80));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}\n`);

  const pool = await new sql.ConnectionPool(config).connect();
  const request = pool.request();

  try {
    // Check if column metric_id exists
    const columnCheck = await request.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kpi_yearly_targets' 
      AND COLUMN_NAME = 'metric_id'
    `);

    if (columnCheck.recordset[0].count === 0) {
      console.log('Column metric_id does not exist. Migration may have already been run.');
      console.log('Checking if measurement_id column exists...');
      
      const measurementCheck = await request.query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'kpi_yearly_targets' 
        AND COLUMN_NAME = 'measurement_id'
      `);

      if (measurementCheck.recordset[0].count > 0) {
        console.log('Column measurement_id already exists. Migration complete.');
      } else {
        console.log('Neither metric_id nor measurement_id exists. Please check database schema.');
      }
      await pool.close();
      return;
    }

    console.log('Found metric_id column. Proceeding with migration...');

    // Rename the column
    await request.query(`
      EXEC sp_rename 'kpi_yearly_targets.metric_id', 'measurement_id', 'COLUMN'
    `);

    console.log('✓ Successfully renamed metric_id to measurement_id');

    // Verify the change
    const verifyCheck = await request.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kpi_yearly_targets' 
      AND COLUMN_NAME = 'measurement_id'
    `);

    if (verifyCheck.recordset[0].count > 0) {
      console.log('✓ Verification successful: measurement_id column exists');
    } else {
      console.log('✗ Verification failed: measurement_id column not found');
    }

  } catch (error: any) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.close();
    console.log('\nMigration completed.');
  }
}

migrateMetricToMeasurementId().catch(console.error);
