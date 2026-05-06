import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env.development');
dotenv.config({ path: envPath });

console.log('Environment loaded from:', envPath);
console.log('KPI_DB_HOST:', process.env.KPI_DB_HOST);
console.log('KPI_DB_NAME:', process.env.KPI_DB_NAME);
console.log('KPI_DB_USER:', process.env.KPI_DB_USER);
console.log('KPI_DB_PORT:', process.env.KPI_DB_PORT);

/**
 * SEED SCRIPT: Monthly Targets for All Months
 *
 * This script seeds monthly targets for all 12 months for each yearly target
 * to provide mockup data for testing the Monthly Results page.
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

// Fiscal year to seed
const FISCAL_YEAR = 2025;

// Department to seed (use first available department)
const DEPARTMENT_ID = 'PD'; // Production Department as example

// Months to seed (April to March)
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

async function seedMonthlyTargets() {
  let pool: sql.ConnectionPool;
  try {
    console.log('='.repeat(80));
    console.log('SEED: Monthly Targets for All Months');
    console.log('='.repeat(80));
    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}`);
    console.log(`Fiscal Year: ${FISCAL_YEAR}`);
    console.log(`Department: ${DEPARTMENT_ID}\n`);

    pool = await new sql.ConnectionPool(config).connect();
    console.log('✓ Connected to database\n');

    const request = pool.request();

    // Step 1: Get all yearly targets for the department and fiscal year
    console.log('Step 1: Fetching yearly targets...');
    const yearlyTargetsResult = await request
      .input('department_id', sql.NVarChar, DEPARTMENT_ID)
      .input('fiscal_year', sql.Int, FISCAL_YEAR).query(`
        SELECT 
          yt.id as yearly_target_id,
          yt.department_id,
          yt.category_id,
          yt.fiscal_year,
          yt.total_quota,
          yt.used_quota,
          yt.fy_target,
          mm.measurement,
          mm.unit,
          kc.name as category_name,
          kc.[key] as category_key
        FROM kpi_yearly_targets yt
        LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
        LEFT JOIN kpi_categories kc ON yt.category_id = kc.id
        WHERE yt.department_id = @department_id 
          AND yt.fiscal_year = @fiscal_year
        ORDER BY kc.sort_order, mm.id
      `);

    const yearlyTargets = yearlyTargetsResult.recordset;
    console.log(`  ✓ Found ${yearlyTargets.length} yearly targets\n`);

    if (yearlyTargets.length === 0) {
      console.log('No yearly targets found. Please seed yearly targets first.');
      return;
    }

    // Step 2: Check existing monthly targets
    console.log('Step 2: Checking existing monthly targets...');
    const existingRequest = pool.request();
    const existingResult = await existingRequest
      .input('department_id', sql.NVarChar, DEPARTMENT_ID)
      .input('fiscal_year', sql.Int, FISCAL_YEAR).query(`
        SELECT COUNT(*) as count
        FROM kpi_monthly_targets
        WHERE department_id = @department_id AND fiscal_year = @fiscal_year
      `);
    const existingCount = existingResult.recordset[0].count;
    console.log(`  ✓ Existing monthly targets: ${existingCount}\n`);

    // Step 3: Seed monthly targets for each yearly target and each month
    console.log('Step 3: Seeding monthly targets...');
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const yt of yearlyTargets) {
      const totalTarget = yt.total_quota || 0;

      // Calculate target per month (distribute evenly)
      const targetPerMonth = totalTarget > 0 ? parseFloat((totalTarget / 12).toFixed(2)) : 0;

      for (const month of MONTHS) {
        // Check if monthly target already exists
        const checkRequest = pool.request();
        const checkResult = await checkRequest
          .input('yearly_target_id', sql.Int, yt.yearly_target_id)
          .input('month', sql.TinyInt, month)
          .input('fiscal_year', sql.Int, FISCAL_YEAR)
          .input('department_id', sql.NVarChar, DEPARTMENT_ID).query(`
            SELECT id FROM kpi_monthly_targets
            WHERE yearly_target_id = @yearly_target_id
              AND month = @month
              AND fiscal_year = @fiscal_year
              AND department_id = @department_id
          `);

        if (checkResult.recordset.length > 0) {
          totalSkipped++;
          continue;
        }

        // Insert monthly target
        const insertRequest = pool.request();
        await insertRequest
          .input('yearly_target_id', sql.Int, yt.yearly_target_id)
          .input('department_id', sql.NVarChar, DEPARTMENT_ID)
          .input('category_id', sql.Int, yt.category_id)
          .input('fiscal_year', sql.Int, FISCAL_YEAR)
          .input('month', sql.TinyInt, month)
          .input('target', sql.Decimal(18, 4), targetPerMonth)
          .input('measurement', sql.NVarChar, yt.measurement)
          .input('unit', sql.NVarChar, yt.unit)
          .input('main', sql.NVarChar, 'ALL')
          .input('main_relate', sql.NVarChar, 'ALL').query(`
            INSERT INTO kpi_monthly_targets
              (yearly_target_id, department_id, category_id, fiscal_year, month,
               target, measurement, unit, main, main_relate, created_at, updated_at)
            VALUES
              (@yearly_target_id, @department_id, @category_id, @fiscal_year, @month,
               @target, @measurement, @unit, @main, @main_relate, GETDATE(), GETDATE())
          `);

        totalInserted++;
      }

      console.log(`  ✓ ${yt.measurement} (${yt.category_name}): ${MONTHS.length} months`);
    }

    console.log(`\nSummary:`);
    console.log(`  Total inserted: ${totalInserted}`);
    console.log(`  Total skipped (already exists): ${totalSkipped}`);
    console.log(`  Total yearly targets: ${yearlyTargets.length}`);
    console.log(`  Total months per target: ${MONTHS.length}`);

    // Step 4: Update used_quota on yearly targets
    console.log('\nStep 4: Updating used_quota on yearly targets...');
    for (const yt of yearlyTargets) {
      const updateRequest = pool.request();
      await updateRequest.input('yearly_target_id', sql.Int, yt.yearly_target_id).query(`
          UPDATE kpi_yearly_targets
          SET used_quota = (
            SELECT COALESCE(SUM(target), 0)
            FROM kpi_monthly_targets
            WHERE yearly_target_id = @yearly_target_id
          ),
          updated_at = GETDATE()
          WHERE id = @yearly_target_id
        `);
    }
    console.log('  ✓ Updated used_quota for all yearly targets');

    console.log('\n' + '='.repeat(80));
    console.log('✓ Monthly targets seeded successfully!');
    console.log('='.repeat(80));
  } catch (error: any) {
    console.error('\n✗ Error seeding monthly targets:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✓ Database connection closed');
    }
  }
}

// Run the seed
seedMonthlyTargets()
  .then(() => {
    console.log('\nScript completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
