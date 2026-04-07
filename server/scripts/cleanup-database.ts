import sql from 'mssql';
import { getKpiDb, getAppStoreDb } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Database Cleanup Script
 * Analyzes and removes unused tables/columns to keep the database clean
 */

interface TableInfo {
  TABLE_NAME: string;
  TABLE_ROWS: number;
}

async function analyzeDatabase() {
  console.log('='.repeat(80));
  console.log('DATABASE ANALYSIS');
  console.log('='.repeat(80));

  try {
    const kpiDb = await getKpiDb();
    const appDb = await getAppStoreDb();

    // Get all tables in KPI database
    const kpiTables = await kpiDb.request().query(`
      SELECT t.TABLE_NAME, p.rows as TABLE_ROWS
      FROM INFORMATION_SCHEMA.TABLES t
      LEFT JOIN sys.partitions p ON OBJECT_ID(t.TABLE_NAME) = p.object_id
      WHERE t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_NAME
    `);

    console.log('\n📊 KPI Database Tables:');
    console.table(kpiTables.recordset);

    // Get all tables in AppStore database (users, departments)
    const appTables = await appDb.request().query(`
      SELECT t.TABLE_NAME, p.rows as TABLE_ROWS
      FROM INFORMATION_SCHEMA.TABLES t
      LEFT JOIN sys.partitions p ON OBJECT_ID(t.TABLE_NAME) = p.object_id
      WHERE t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY t.TABLE_NAME
    `);

    console.log('\n📊 AppStore Database Tables:');
    console.table(appTables.recordset);

    return { kpiTables: kpiTables.recordset, appTables: appTables.recordset };
  } catch (error) {
    logger.error('Failed to analyze database', error);
    throw error;
  }
}

async function findUnusedTables() {
  console.log('\n' + '='.repeat(80));
  console.log('CHECKING FOR UNUSED TABLES');
  console.log('='.repeat(80));

  const kpiDb = await getKpiDb();

  // Tables that SHOULD exist (used by routes)
  const usedTables = [
    'kpi_categories',
    // Category-specific tables
    'safety_metrics',
    'safety_sub_categories',
    'quality_metrics',
    'quality_sub_categories',
    'delivery_metrics',
    'delivery_sub_categories',
    'compliance_metrics',
    'compliance_sub_categories',
    'hr_metrics',
    'hr_sub_categories',
    'attractive_metrics',
    'attractive_sub_categories',
    'environment_metrics',
    'environment_sub_categories',
    'cost_metrics',
    'cost_sub_categories',
    // New KPI forms tables
    'kpi_yearly_targets',
    'kpi_monthly_entries',
    'kpi_action_plans',
    'departments',
  ];

  // Get all existing tables
  const result = await kpiDb.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
  `);

  const existingTables = result.recordset.map((r: any) => r.TABLE_NAME.toLowerCase());

  // Find tables that exist but are not in used list
  const unusedTables = existingTables.filter(
    (t: string) => !usedTables.map((u) => u.toLowerCase()).includes(t)
  );

  console.log('\n✅ Used tables:', usedTables.length);
  console.log('📁 Existing tables:', existingTables.length);

  if (unusedTables.length > 0) {
    console.log('\n⚠️  Potentially unused tables:');
    unusedTables.forEach((t: string) => console.log(`   - ${t}`));
  } else {
    console.log('\n✅ No unused tables found');
  }

  return unusedTables;
}

async function dropUnusedTables(dryRun: boolean = true) {
  const unusedTables = await findUnusedTables();

  if (unusedTables.length === 0) {
    console.log('\n✅ No tables to drop');
    return;
  }

  const kpiDb = await getKpiDb();

  console.log(`\n${dryRun ? '🔍 DRY RUN - Would drop:' : '🗑️  Dropping unused tables:'}`);

  for (const table of unusedTables) {
    if (dryRun) {
      console.log(`   - DROP TABLE ${table}`);
    } else {
      try {
        await kpiDb.request().query(`DROP TABLE IF EXISTS ${table}`);
        console.log(`   ✓ Dropped: ${table}`);
      } catch (error) {
        console.log(`   ✗ Failed to drop ${table}:`, error);
      }
    }
  }
}

async function checkEmptyTables() {
  console.log('\n' + '='.repeat(80));
  console.log('CHECKING FOR EMPTY TABLES');
  console.log('='.repeat(80));

  const kpiDb = await getKpiDb();

  const result = await kpiDb.request().query(`
    SELECT 
      t.TABLE_NAME,
      p.rows as ROW_COUNT
    FROM INFORMATION_SCHEMA.TABLES t
    LEFT JOIN sys.partitions p ON OBJECT_ID(t.TABLE_NAME) = p.object_id
    WHERE t.TABLE_TYPE = 'BASE TABLE' AND p.index_id IN (0, 1)
    ORDER BY p.rows DESC, t.TABLE_NAME
  `);

  const emptyTables = result.recordset.filter((r: any) => r.ROW_COUNT === 0);

  if (emptyTables.length > 0) {
    console.log('\n⚠️  Empty tables (0 rows):');
    emptyTables.forEach((t: any) => console.log(`   - ${t.TABLE_NAME}`));
  } else {
    console.log('\n✅ All tables have data');
  }

  return result.recordset;
}

async function checkDuplicateData() {
  console.log('\n' + '='.repeat(80));
  console.log('CHECKING FOR DUPLICATE/REDUNDANT DATA');
  console.log('='.repeat(80));

  const kpiDb = await getKpiDb();

  // Check generic kpi_metrics
  const genericMetrics = await kpiDb
    .request()
    .query(
      `
    SELECT COUNT(*) as count FROM kpi_metrics
  `
    )
    .catch(() => ({ recordset: [{ count: 0 }] }));

  // Check category-specific tables existence and counts
  const categoryTables = [
    'safety_metrics',
    'quality_metrics',
    'delivery_metrics',
    'compliance_metrics',
    'hr_metrics',
    'attractive_metrics',
    'environment_metrics',
    'cost_metrics',
  ];

  const categoryCounts: Record<string, number> = {};

  for (const table of categoryTables) {
    try {
      const result = await kpiDb.request().query(`SELECT COUNT(*) as count FROM ${table}`);
      categoryCounts[table] = result.recordset[0].count;
    } catch {
      categoryCounts[table] = -1; // Table doesn't exist
    }
  }

  console.log('\n📊 Generic kpi_metrics rows:', genericMetrics.recordset[0]?.count || 0);
  console.log('📊 Category-specific metrics:');
  Object.entries(categoryCounts).forEach(([table, count]) => {
    if (count === -1) {
      console.log(`   - ${table}: NOT EXISTS`);
    } else {
      console.log(`   - ${table}: ${count} rows`);
    }
  });

  const genericCount = genericMetrics.recordset[0]?.count || 0;
  if (genericCount > 0) {
    console.log('\n⚠️  Found data in generic kpi_metrics table');
    console.log('   Recommendation: Use category-specific tables instead, migrate data if needed');
  }
}

async function generateCleanupReport() {
  console.log('\n' + '='.repeat(80));
  console.log('CLEANUP RECOMMENDATIONS');
  console.log('='.repeat(80));

  const recommendations: string[] = [];

  // Check for unused tables
  const unusedTables = await findUnusedTables();
  if (unusedTables.length > 0) {
    recommendations.push(`Remove ${unusedTables.length} unused tables: ${unusedTables.join(', ')}`);
  }

  // Check for empty tables
  const tableData = await checkEmptyTables();
  const emptyTables = tableData.filter((t: any) => t.ROW_COUNT === 0);
  if (emptyTables.length > 0) {
    recommendations.push(`Consider populating or removing ${emptyTables.length} empty tables`);
  }

  // Check for duplicate structures
  await checkDuplicateData();

  if (recommendations.length === 0) {
    console.log('\n✅ Database is clean!');
  } else {
    console.log('\n📝 Recommendations:');
    recommendations.forEach((r, i) => console.log(`   ${i + 1}. ${r}`));
  }

  return recommendations;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldCleanup = args.includes('--cleanup');
  const dryRun = !args.includes('--force');

  try {
    await analyzeDatabase();
    await generateCleanupReport();

    if (shouldCleanup) {
      console.log('\n' + '='.repeat(80));
      await dropUnusedTables(dryRun);
    }

    console.log('\n✅ Analysis complete!');

    if (!shouldCleanup) {
      console.log('\n💡 Run with --cleanup to remove unused tables');
      console.log('💡 Run with --cleanup --force to actually drop tables (not dry run)');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
