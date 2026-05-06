import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '../../.env' });
} else {
  dotenv.config({ path: '../../.env.development' });
}

/**
 * MIGRATION SCRIPT: Change 'actual' terminology to 'result'
 * 
 * This script updates database column names and references from 'actual' to 'result'
 * to maintain consistency with the new terminology.
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

async function migrateActualToResult() {
  console.log('='.repeat(80));
  console.log('MIGRATION: Change actual to result terminology');
  console.log('='.repeat(80));
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}\n`);

  const pool = await new sql.ConnectionPool(config).connect();
  const request = pool.request();

  try {
    // Check and rename actual_value to result_value in yearly_targets
    console.log('Checking yearly_targets table...');
    const yearlyActualCheck = await request.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kpi_yearly_targets' 
      AND COLUMN_NAME = 'actual_value'
    `);

    if (yearlyActualCheck.recordset[0].count > 0) {
      console.log('Renaming actual_value to result_value in kpi_yearly_targets...');
      await request.query(`
        EXEC sp_rename 'kpi_yearly_targets.actual_value', 'result_value', 'COLUMN'
      `);
      console.log('✓ Renamed actual_value to result_value in kpi_yearly_targets');
    }

    // Check and rename actual_value to result_value in monthly_targets
    console.log('Checking monthly_targets table...');
    const monthlyActualCheck = await request.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kpi_monthly_targets' 
      AND COLUMN_NAME = 'actual_value'
    `);

    if (monthlyActualCheck.recordset[0].count > 0) {
      console.log('Renaming actual_value to result_value in kpi_monthly_targets...');
      await request.query(`
        EXEC sp_rename 'kpi_monthly_targets.actual_value', 'result_value', 'COLUMN'
      `);
      console.log('✓ Renamed actual_value to result_value in kpi_monthly_targets');
    }

    // Update any views or stored procedures that reference actual_value
    console.log('Checking for views that reference actual_value...');
    const viewsCheck = await request.query(`
      SELECT TABLE_NAME, VIEW_DEFINITION 
      FROM INFORMATION_SCHEMA.VIEWS 
      WHERE VIEW_DEFINITION LIKE '%actual_value%'
    `);

    for (const view of viewsCheck.recordset) {
      console.log(`Found view ${view.TABLE_NAME} referencing actual_value`);
      // Note: Manual update may be required for complex views
    }

    // Update any computed columns or constraints that use actual_value
    console.log('Checking for computed columns...');
    const computedCheck = await request.query(`
      SELECT TABLE_NAME, COLUMN_NAME, COMPUTED_COLUMN_DEFINITION 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE COMPUTED_COLUMN_DEFINITION IS NOT NULL
      AND COMPUTED_COLUMN_DEFINITION LIKE '%actual_value%'
    `);

    for (const col of computedCheck.recordset) {
      console.log(`Found computed column ${col.COLUMN_NAME} in table ${col.TABLE_NAME} using actual_value`);
      // Note: Manual update may be required for computed columns
    }

    console.log('\n✓ Migration completed successfully!');
    console.log('Note: Review any views, stored procedures, or computed columns that may need manual updates.');

  } catch (error: any) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.close();
    console.log('\nDatabase connection closed.');
  }
}

migrateActualToResult().catch(console.error);
