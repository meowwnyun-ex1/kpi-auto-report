"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
/**
 * Seed script for Safety by Department KPIs - FY25 Data (Apr-25 to Mar-26)
 * FY = Fiscal Year (April 1 - March 31)
 */
// Helper function to get FY year from month string
function getFyYear(monthStr) {
    const month = monthStr.split('-')[0];
    const yearSuffix = parseInt(monthStr.split('-')[1]);
    if (['Jan', 'Feb', 'Mar'].includes(month)) {
        return 2000 + yearSuffix;
    }
    return 2000 + yearSuffix;
}
// Department mapping
const departmentMapping = {
    'Pump/M': 'Pump/M',
    'Pump/A': 'Pump/A',
    'INJ/M': 'INJ/M',
    'INJ/A': 'INJ/A',
    'Valve': 'Valve',
    'SOL': 'SOL',
    'UC/M': 'UC/M',
    'UC/A': 'UC/A',
    'GDP': 'GDP',
    'SIFS/DF': 'SIFS/DF',
    'TIE': 'TIE',
    'WH': 'WH',
    'MT': 'MT',
    'QA&QC': 'QA&QC',
    'ADM': 'ADM',
    'PE': 'PE',
    'PC': 'PC',
    'SPD': 'SPD',
    'SE': 'SE'
};
async function seedSafetyByDept() {
    console.log('Starting Safety by Department KPI Seeding...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. SAFETY DEPT SUB-CATEGORIES
        // ============================================
        console.log('Seeding Safety Dept Sub-Categories...');
        const safetyDeptSubCategories = [
            { name_en: 'worksite', name_th: 'worksite', key: 'worksite', sort_order: 1 },
            { name_en: 'Traffic', name_th: 'Traffic', key: 'traffic', sort_order: 2 }
        ];
        for (const subCat of safetyDeptSubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('name_th', mssql_1.default.NVarChar, subCat.name_th)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM safety_dept_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO safety_dept_sub_categories (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ Safety Dept Sub-Categories seeded\n');
        // ============================================
        // 2. SAFETY DEPT METRICS
        // ============================================
        console.log('Seeding Safety Dept Metrics...');
        const safetyDeptMetrics = [
            // Worksite
            { no: '1', measurement: '1-Grade accident', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '0', sub_category_key: 'worksite' },
            { no: '2', measurement: 'Reoccurrence', unit: 'Case', main: 'SE', main_relate: 'PD,PC', fy25_target: '0', sub_category_key: 'worksite' },
            { no: '3', measurement: 'Near miss', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '4', sub_category_key: 'worksite' },
            { no: '4', measurement: '8-High risk audit', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '4', sub_category_key: 'worksite' },
            // Traffic
            { no: '5', measurement: 'Fatal', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '6', measurement: 'Injury', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '7', measurement: 'Illegal & dangerous driving', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '8', measurement: 'Hit', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '9', measurement: 'Hit something', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '1', sub_category_key: 'traffic' }
        ];
        for (const metric of safetyDeptMetrics) {
            const subCatResult = await pool.request()
                .input('key', mssql_1.default.NVarChar, metric.sub_category_key)
                .query(`SELECT id FROM safety_dept_sub_categories WHERE [key] = @key`);
            if (subCatResult.recordset.length > 0) {
                await pool.request()
                    .input('no', mssql_1.default.NVarChar, metric.no)
                    .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                    .input('unit', mssql_1.default.NVarChar, metric.unit)
                    .input('main', mssql_1.default.NVarChar, metric.main)
                    .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                    .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                    .input('sub_category_id', mssql_1.default.Int, subCatResult.recordset[0].id)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM safety_dept_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO safety_dept_metrics (no, measurement, unit, main, main_relate, fy25_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @sub_category_id)
            END
          `);
            }
        }
        console.log('✅ Safety Dept Metrics seeded\n');
        // ============================================
        // 3. GET DEPARTMENT IDs
        // ============================================
        console.log('Getting Department IDs...');
        const deptResult = await pool.request().query(`
      SELECT id, name, code FROM departments
    `);
        const deptMap = {};
        for (const dept of deptResult.recordset) {
            deptMap[dept.name] = dept.id;
            deptMap[dept.code] = dept.id;
        }
        console.log(`✅ Found ${deptResult.recordset.length} departments\n`);
        // ============================================
        // 4. SAFETY DEPT DATA ENTRIES - FY25
        // ============================================
        console.log('Seeding Safety Dept Data Entries (FY25: Apr-25 to Mar-26)...');
        // Department columns in the data
        const deptColumns = ['Pump/M', 'Pump/A', 'INJ/M', 'INJ/A', 'Valve', 'SOL', 'UC/M', 'UC/A', 'GDP', 'SIFS/DF', 'TIE', 'WH', 'MT', 'QA&QC', 'ADM', 'PE', 'PC', 'SPD', 'SE'];
        // Safety by Dept data from user (simplified - all zeros for most, with specific values where noted)
        const safetyDeptDataEntries = [
            // Apr-25 - All zeros for most metrics
            { no: '1', month: 'Apr-25', values: {} },
            { no: '2', month: 'Apr-25', values: {} },
            { no: '3', month: 'Apr-25', values: {} },
            { no: '4', month: 'Apr-25', values: {} },
            { no: '5', month: 'Apr-25', values: {} },
            { no: '6', month: 'Apr-25', values: {} },
            { no: '7', month: 'Apr-25', values: {} },
            { no: '8', month: 'Apr-25', values: {} },
            { no: '9', month: 'Apr-25', values: {} },
            // May-25
            { no: '2', month: 'May-25', values: { 'UC/M': '1' } }, // Reoccurrence at UC/M
            { no: '9', month: 'May-25', values: { 'WH': '1' } }, // Hit something at WH
            // Jun-25 - All zeros
            { no: '1', month: 'Jun-25', values: {} },
            { no: '2', month: 'Jun-25', values: {} },
            { no: '3', month: 'Jun-25', values: {} },
            { no: '4', month: 'Jun-25', values: {} },
            { no: '5', month: 'Jun-25', values: {} },
            { no: '6', month: 'Jun-25', values: {} },
            { no: '7', month: 'Jun-25', values: {} },
            { no: '8', month: 'Jun-25', values: {} },
            { no: '9', month: 'Jun-25', values: {} },
            // Jul-25
            { no: '2', month: 'Jul-25', values: { 'WH': '1' } }, // Reoccurrence at WH
            { no: '6', month: 'Jul-25', values: { 'ADM': '1' } }, // Injury at ADM (marked with -)
            // Aug-25
            { no: '2', month: 'Aug-25', values: { 'GDP': '1' } }, // Reoccurrence at GDP
            // Sep-25
            { no: '3', month: 'Sep-25', values: { 'UC/M': '1' } }, // Near miss at UC/M
            // Oct-25
            { no: '4', month: 'Oct-25', values: { 'UC/M': '2', 'UC/A': '1', 'GDP': '2', 'MT': '2' } }, // 8-High risk audit
            { no: '7', month: 'Oct-25', values: { 'SPD': '1' } }, // Illegal & dangerous driving at SPD
            // Nov-25
            { no: '3', month: 'Nov-25', values: { 'Pump/M': '1', 'MT': '1' } }, // Near miss
            { no: '5', month: 'Nov-25', values: { 'ADM': '1' } }, // Fatal at ADM
            { no: '9', month: 'Nov-25', values: { 'INJ/M': '1' } }, // Hit something at INJ/M
            // Dec-25
            { no: '6', month: 'Dec-25', values: { 'Valve': '1' } }, // Injury at Valve
            // Jan-26
            { no: '8', month: 'Jan-26', values: { 'SPD': '1' } }, // Hit at SPD
            // Feb-26
            { no: '2', month: 'Feb-26', values: { 'SPD': '1' } }, // Reoccurrence at SPD
        ];
        // Seed all metrics for all months with department data
        const months = ['Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26'];
        for (const month of months) {
            const year = getFyYear(month);
            for (const metric of safetyDeptMetrics) {
                const metricResult = await pool.request()
                    .input('no', mssql_1.default.NVarChar, metric.no)
                    .query(`SELECT id FROM safety_dept_metrics WHERE no = @no`);
                if (metricResult.recordset.length > 0) {
                    const metricId = metricResult.recordset[0].id;
                    // Find if there's specific data for this metric/month
                    const specificData = safetyDeptDataEntries.find(d => d.no === metric.no && d.month === month);
                    // Seed data for each department
                    for (const deptName of deptColumns) {
                        const deptId = deptMap[deptName];
                        if (!deptId) {
                            // Create department if not exists
                            const insertResult = await pool.request()
                                .input('name', mssql_1.default.NVarChar, deptName)
                                .input('code', mssql_1.default.NVarChar, deptName)
                                .query(`
                  IF NOT EXISTS (SELECT 1 FROM departments WHERE name = @name)
                  BEGIN
                    INSERT INTO departments (name, code, is_active)
                    VALUES (@name, @code, 1);
                    SELECT SCOPE_IDENTITY() as id;
                  END
                  ELSE
                  BEGIN
                    SELECT id FROM departments WHERE name = @name;
                  END
                `);
                            if (insertResult.recordset.length > 0) {
                                deptMap[deptName] = insertResult.recordset[0].id;
                            }
                        }
                        const value = specificData?.values?.[deptName] || '0';
                        await pool.request()
                            .input('metric_id', mssql_1.default.Int, metricId)
                            .input('department_id', mssql_1.default.Int, deptMap[deptName])
                            .input('month', mssql_1.default.NVarChar, month)
                            .input('year', mssql_1.default.Int, year)
                            .input('target', mssql_1.default.NVarChar, metric.fy25_target)
                            .input('result', mssql_1.default.NVarChar, value)
                            .input('accu_target', mssql_1.default.NVarChar, metric.fy25_target)
                            .input('accu_result', mssql_1.default.NVarChar, value)
                            .query(`
                IF NOT EXISTS (SELECT 1 FROM safety_dept_data_entries WHERE metric_id = @metric_id AND department_id = @department_id AND month = @month AND year = @year)
                BEGIN
                  INSERT INTO safety_dept_data_entries (metric_id, department_id, month, year, target, result, accu_target, accu_result)
                  VALUES (@metric_id, @department_id, @month, @year, @target, @result, @accu_target, @accu_result)
                END
              `);
                    }
                }
            }
        }
        console.log('✅ Safety Dept Data Entries seeded (12 months × 9 metrics × 19 departments)\n');
        // ============================================
        // SUMMARY
        // ============================================
        console.log('========================================');
        console.log('🎉 Safety by Department KPI Seeding Finished!');
        console.log('========================================');
        console.log('\nData Summary:');
        console.log('  - Sub-Categories: 2 (worksite, Traffic)');
        console.log('  - Metrics: 9 (4 worksite + 5 Traffic)');
        console.log('  - Departments: 19');
        console.log('  - Data Entries: 2,052 (9 metrics × 12 months × 19 departments)');
        console.log('  - FY25 Period: Apr-25 to Mar-26');
        console.log('\nNote: FY25 = April 2025 to March 2026');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
// Run seeding
seedSafetyByDept()
    .then(() => {
    console.log('\n✅ Seeding script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
});
