"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
/**
 * Seed script for Cost, Safety, and Quality KPIs
 */
async function seedCostSafetyQuality() {
    console.log('Starting Cost, Safety, Quality KPI Seeding...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. COST KPI SEEDING
        // ============================================
        console.log('Seeding Cost KPI data...');
        // Cost Sub-Categories
        const costSubCategories = [
            { name_en: 'Sale', key: 'sale', sort_order: 1 },
            { name_en: 'Profit', key: 'profit', sort_order: 2 },
            { name_en: 'BEP', key: 'bep', sort_order: 3 },
            { name_en: 'Fixed cost C/D', key: 'fixed_cost_cd', sort_order: 4 },
            { name_en: 'Productivity', key: 'productivity', sort_order: 5 },
            { name_en: 'Labour cost', key: 'labour_cost', sort_order: 6 }
        ];
        for (const subCat of costSubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM cost_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO cost_sub_categories (name_en, [key], sort_order)
            VALUES (@name_en, @key, @sort_order)
          END
        `);
        }
        // Cost Metrics
        const costMetrics = [
            // Sale
            { no: '1', measurement: 'Sale', unit: 'MB', main: 'ACC', main_relate: '-', fy25_target: '31,107.79', sub_category_key: 'sale' },
            // Profit
            { no: '2', measurement: 'Amount', unit: 'MB', main: 'ACC', main_relate: 'All Expense (KB),Investment (KB) Manpower (Prs)', fy25_target: '3,713.11', sub_category_key: 'profit' },
            { no: '3', measurement: 'Ratio', unit: '%', main: '', main_relate: '', fy25_target: '11.9%', sub_category_key: 'profit' },
            // BEP
            { no: '4', measurement: '-', unit: '%', main: 'ACC', main_relate: '-', fy25_target: '45.45%', sub_category_key: 'bep' },
            // Fixed cost C/D
            { no: '5', measurement: '-', unit: '%', main: 'Acc', main_relate: '-', fy25_target: '9.95%', sub_category_key: 'fixed_cost_cd' },
            // Productivity
            { no: '6', measurement: 'Direct (%)', unit: '%', main: 'ACC', main_relate: 'All (IOT, DX, Attractive etc.)', fy25_target: '100%', sub_category_key: 'productivity' },
            { no: '7', measurement: 'Direct (Ninku)', unit: 'Ninku', main: 'ACC', main_relate: 'All (IOT, DX, Attractive etc.)', fy25_target: '32,918.01', sub_category_key: 'productivity' },
            { no: '8', measurement: 'Indirect (%)', unit: '%', main: 'ACC', main_relate: 'All (IOT, DX, Attractive etc.)', fy25_target: '100%', sub_category_key: 'productivity' },
            { no: '9', measurement: 'Indirect (Ninku)', unit: 'Ninku', main: 'ACC', main_relate: 'All (IOT, DX, Attractive etc.)', fy25_target: '9,984.00', sub_category_key: 'productivity' },
            // Labour cost
            { no: '10', measurement: 'Direct', unit: 'MB', main: 'ACC', main_relate: 'All', fy25_target: '1,174', sub_category_key: 'labour_cost' },
            { no: '11', measurement: 'Indirect', unit: 'MB', main: 'ACC', main_relate: 'All', fy25_target: '962', sub_category_key: 'labour_cost' }
        ];
        for (const metric of costMetrics) {
            const subCatResult = await pool.request()
                .input('key', mssql_1.default.NVarChar, metric.sub_category_key)
                .query(`SELECT id FROM cost_sub_categories WHERE [key] = @key`);
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
            IF NOT EXISTS (SELECT 1 FROM cost_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO cost_metrics (no, measurement, unit, main, main_relate, fy25_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @sub_category_id)
            END
          `);
            }
        }
        // Cost Data Entries (FY25 monthly data)
        const costEntries = [
            // April 2025
            { no: '1', month: 'Apr-25', year: 2025, target: '2,433.59', result: '2,357.22', accu_target: '2,433.59', accu_result: '2,357.22' },
            { no: '2', month: 'Apr-25', year: 2025, target: '156.39', result: '184.07', accu_target: '156.39', accu_result: '184.07' },
            { no: '3', month: 'Apr-25', year: 2025, target: '6.4%', result: '7.8%', accu_target: '6.4%', accu_result: '7.8%' },
            { no: '4', month: 'Apr-25', year: 2025, target: '-', result: '-', accu_target: '64.12%', accu_result: '55.73%' },
            { no: '5', month: 'Apr-25', year: 2025, target: '-', result: '-', accu_target: '11.48%', accu_result: '9.83%' },
            { no: '6', month: 'Apr-25', year: 2025, target: '100%', result: '96%', accu_target: '100%', accu_result: '96%' },
            { no: '7', month: 'Apr-25', year: 2025, target: '2,530.62', result: '2,416.96', accu_target: '2,530.62', accu_result: '2,416.96' },
            { no: '8', month: 'Apr-25', year: 2025, target: '100%', result: '90%', accu_target: '100%', accu_result: '90%' },
            { no: '9', month: 'Apr-25', year: 2025, target: '836.00', result: '751.00', accu_target: '836.00', accu_result: '751.00' },
            { no: '10', month: 'Apr-25', year: 2025, target: '68.17', result: '64.89', accu_target: '68.17', accu_result: '64.89' },
            { no: '11', month: 'Apr-25', year: 2025, target: '88.80', result: '79.07', accu_target: '88.80', accu_result: '79.07' },
            // May 2025
            { no: '1', month: 'May-25', year: 2025, target: '2,465.24', result: '2770.01', accu_target: '4898.83', accu_result: '5127.23' },
            { no: '2', month: 'May-25', year: 2025, target: '300.26', result: '510.55', accu_target: '456.65', accu_result: '694.61' },
            { no: '3', month: 'May-25', year: 2025, target: '12.2%', result: '18.4%', accu_target: '9.3%', accu_result: '13.5%' },
            { no: '4', month: 'May-25', year: 2025, target: '-', result: '-', accu_target: '50.17%', accu_result: '35.37%' },
            { no: '5', month: 'May-25', year: 2025, target: '-', result: '-', accu_target: '9.39%', accu_result: '7.42%' },
            { no: '6', month: 'May-25', year: 2025, target: '100%', result: '95%', accu_target: '100%', accu_result: '95%' },
            { no: '7', month: 'May-25', year: 2025, target: '3330.00', result: '3168.00', accu_target: '5860.62', accu_result: '5584.96' },
            { no: '8', month: 'May-25', year: 2025, target: '100%', result: '94%', accu_target: '100%', accu_result: '92%' },
            { no: '9', month: 'May-25', year: 2025, target: '987.00', result: '930.00', accu_target: '1823.00', accu_result: '1681.00' },
            { no: '10', month: 'May-25', year: 2025, target: '82.02', result: '87.07', accu_target: '150.18', accu_result: '151.96' },
            { no: '11', month: 'May-25', year: 2025, target: '69.00', result: '69.00', accu_target: '157.80', accu_result: '148.07' }
        ];
        for (const entry of costEntries) {
            const metricResult = await pool.request()
                .input('no', mssql_1.default.NVarChar, entry.no)
                .query(`SELECT id FROM cost_metrics WHERE no = @no`);
            if (metricResult.recordset.length > 0) {
                await pool.request()
                    .input('metric_id', mssql_1.default.Int, metricResult.recordset[0].id)
                    .input('month', mssql_1.default.NVarChar, entry.month)
                    .input('year', mssql_1.default.Int, entry.year)
                    .input('target', mssql_1.default.NVarChar, entry.target)
                    .input('result', mssql_1.default.NVarChar, entry.result)
                    .input('accu_target', mssql_1.default.NVarChar, entry.accu_target)
                    .input('accu_result', mssql_1.default.NVarChar, entry.accu_result)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM cost_data_entries WHERE metric_id = @metric_id AND month = @month AND year = @year)
            BEGIN
              INSERT INTO cost_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
            END
          `);
            }
        }
        console.log('✅ Cost KPI data seeded successfully\n');
        // ============================================
        // 2. SAFETY KPI SEEDING
        // ============================================
        console.log('Seeding Safety KPI data...');
        // Safety Sub-Categories
        const safetySubCategories = [
            { name_en: 'worksite', key: 'worksite', sort_order: 1 },
            { name_en: 'Traffic', key: 'traffic', sort_order: 2 }
        ];
        for (const subCat of safetySubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM safety_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO safety_sub_categories (name_en, [key], sort_order)
            VALUES (@name_en, @key, @sort_order)
          END
        `);
        }
        // Safety Metrics
        const safetyMetrics = [
            // Worksite
            { no: '1', measurement: '1-Grade accident', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '0', description_of_target: '', sub_category_key: 'worksite' },
            { no: '2', measurement: 'Reoccurrence', unit: 'Case', main: 'SE', main_relate: 'PD,PC', fy25_target: '0', description_of_target: '', sub_category_key: 'worksite' },
            { no: '3', measurement: 'Nearm', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '4', description_of_target: 'Reduce 50% from FY24', sub_category_key: 'worksite' },
            { no: '4', measurement: '8-High risk audit', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '4', description_of_target: 'Reduce 50% from FY24', sub_category_key: 'worksite' },
            // Traffic
            { no: '5', measurement: 'Fatal', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', description_of_target: '', sub_category_key: 'traffic' },
            { no: '6', measurement: 'Injury', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', description_of_target: '', sub_category_key: 'traffic' },
            { no: '7', measurement: 'Illegal & dangerous driving', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', description_of_target: '', sub_category_key: 'traffic' },
            { no: '8', measurement: 'Hit', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', description_of_target: '', sub_category_key: 'traffic' },
            { no: '9', measurement: 'Been-hit & Other', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', description_of_target: '', sub_category_key: 'traffic' }
        ];
        for (const metric of safetyMetrics) {
            const subCatResult = await pool.request()
                .input('key', mssql_1.default.NVarChar, metric.sub_category_key)
                .query(`SELECT id FROM safety_sub_categories WHERE [key] = @key`);
            if (subCatResult.recordset.length > 0) {
                await pool.request()
                    .input('no', mssql_1.default.NVarChar, metric.no)
                    .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                    .input('unit', mssql_1.default.NVarChar, metric.unit)
                    .input('main', mssql_1.default.NVarChar, metric.main)
                    .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                    .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                    .input('description_of_target', mssql_1.default.NVarChar, metric.description_of_target)
                    .input('sub_category_id', mssql_1.default.Int, subCatResult.recordset[0].id)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM safety_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO safety_metrics (no, measurement, unit, main, main_relate, fy25_target, description_of_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @description_of_target, @sub_category_id)
            END
          `);
            }
        }
        // Safety Data Entries (FY25 monthly data - April to July)
        const months = ['Apr-25', 'May-25', 'Jun-25', 'Jul-25'];
        const years = [2025, 2025, 2025, 2025];
        for (let i = 0; i < months.length; i++) {
            for (let no = 1; no <= 9; no++) {
                const metricResult = await pool.request()
                    .input('no', mssql_1.default.NVarChar, String(no))
                    .query(`SELECT id, fy25_target FROM safety_metrics WHERE no = @no`);
                if (metricResult.recordset.length > 0) {
                    const fyTarget = metricResult.recordset[0].fy25_target;
                    // Calculate monthly target (fy_target / 12)
                    const monthlyTarget = fyTarget ? (parseFloat(fyTarget.replace(/,/g, '')) / 12).toFixed(2) : '0.00';
                    await pool.request()
                        .input('metric_id', mssql_1.default.Int, metricResult.recordset[0].id)
                        .input('month', mssql_1.default.NVarChar, months[i])
                        .input('year', mssql_1.default.Int, years[i])
                        .input('target', mssql_1.default.NVarChar, monthlyTarget)
                        .input('result', mssql_1.default.NVarChar, monthlyTarget)
                        .input('accu_target', mssql_1.default.NVarChar, monthlyTarget)
                        .input('accu_result', mssql_1.default.NVarChar, monthlyTarget)
                        .query(`
              IF NOT EXISTS (SELECT 1 FROM safety_data_entries WHERE metric_id = @metric_id AND month = @month AND year = @year)
              BEGIN
                INSERT INTO safety_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
                VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
              END
            `);
                }
            }
        }
        console.log('✅ Safety KPI data seeded successfully\n');
        // ============================================
        // 3. QUALITY KPI SEEDING
        // ============================================
        console.log('Seeding Quality KPI data...');
        // Quality Sub-Categories
        const qualitySubCategories = [
            { name_en: 'Claim', key: 'claim', sort_order: 1 },
            { name_en: 'Loss', key: 'loss', sort_order: 2 }
        ];
        for (const subCat of qualitySubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM quality_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO quality_sub_categories (name_en, [key], sort_order)
            VALUES (@name_en, @key, @sort_order)
          END
        `);
        }
        // Quality Metrics
        const qualityMetrics = [
            // Claim
            { no: '10', measurement: 'Critical claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '0', description_of_target: '', sub_category_key: 'claim' },
            { no: '11', measurement: '0-km claim (Official)', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '4', description_of_target: '', sub_category_key: 'claim' },
            { no: '12', measurement: '0-km claim (All DN response)', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '9', description_of_target: '', sub_category_key: 'claim' },
            { no: '13', measurement: 'OGC claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '6', description_of_target: '', sub_category_key: 'claim' },
            { no: '14', measurement: 'Supplier NCR', unit: 'Case', main: 'QC', main_relate: 'PD,PE, QA, PU', fy25_target: '6', description_of_target: '', sub_category_key: 'claim' },
            { no: '15', measurement: 'Internal NCR', unit: 'Case', main: 'QC', main_relate: 'PD,PE, QA', fy25_target: '5', description_of_target: '', sub_category_key: 'claim' },
            // Loss
            { no: '16', measurement: 'Cost of spoilage', unit: '%', main: 'PD', main_relate: 'PC,PE,QC', fy25_target: '0.56%', description_of_target: '', sub_category_key: 'loss' },
            { no: '16b', measurement: 'Cost of spoilage', unit: 'MB', main: 'PD', main_relate: 'PC,PE,QC', fy25_target: '162.9', description_of_target: '', sub_category_key: 'loss' },
            { no: '17', measurement: 'Quality loss', unit: 'MB', main: 'AC', main_relate: 'PC,PE,QC', fy25_target: '231.814', description_of_target: '', sub_category_key: 'loss' }
        ];
        for (const metric of qualityMetrics) {
            const subCatResult = await pool.request()
                .input('key', mssql_1.default.NVarChar, metric.sub_category_key)
                .query(`SELECT id FROM quality_sub_categories WHERE [key] = @key`);
            if (subCatResult.recordset.length > 0) {
                await pool.request()
                    .input('no', mssql_1.default.NVarChar, metric.no)
                    .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                    .input('unit', mssql_1.default.NVarChar, metric.unit)
                    .input('main', mssql_1.default.NVarChar, metric.main)
                    .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                    .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                    .input('description_of_target', mssql_1.default.NVarChar, metric.description_of_target)
                    .input('sub_category_id', mssql_1.default.Int, subCatResult.recordset[0].id)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM quality_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO quality_metrics (no, measurement, unit, main, main_relate, fy25_target, description_of_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @description_of_target, @sub_category_id)
            END
          `);
            }
        }
        // Quality Data Entries (FY25 monthly data - April to July)
        for (let i = 0; i < months.length; i++) {
            for (const metric of qualityMetrics) {
                const metricResult = await pool.request()
                    .input('no', mssql_1.default.NVarChar, metric.no)
                    .query(`SELECT id, fy25_target FROM quality_metrics WHERE no = @no`);
                if (metricResult.recordset.length > 0) {
                    const fyTarget = metricResult.recordset[0].fy25_target;
                    // Calculate monthly target (fy_target / 12)
                    let monthlyTarget = '0.00';
                    if (metric.unit === '%') {
                        monthlyTarget = '0.00';
                    }
                    else if (fyTarget) {
                        const numTarget = parseFloat(fyTarget.replace(/,/g, '').replace('%', ''));
                        monthlyTarget = (numTarget / 12).toFixed(2);
                    }
                    await pool.request()
                        .input('metric_id', mssql_1.default.Int, metricResult.recordset[0].id)
                        .input('month', mssql_1.default.NVarChar, months[i])
                        .input('year', mssql_1.default.Int, years[i])
                        .input('target', mssql_1.default.NVarChar, monthlyTarget)
                        .input('result', mssql_1.default.NVarChar, monthlyTarget)
                        .input('accu_target', mssql_1.default.NVarChar, monthlyTarget)
                        .input('accu_result', mssql_1.default.NVarChar, monthlyTarget)
                        .query(`
              IF NOT EXISTS (SELECT 1 FROM quality_data_entries WHERE metric_id = @metric_id AND month = @month AND year = @year)
              BEGIN
                INSERT INTO quality_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
                VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
              END
            `);
                }
            }
        }
        console.log('✅ Quality KPI data seeded successfully\n');
        console.log('========================================');
        console.log('🎉 Cost, Safety, Quality KPI Seeding Completed Successfully!');
        console.log('========================================');
        console.log('\nData seeded:');
        console.log('  - Cost: 6 sub-categories, 11 metrics, monthly entries');
        console.log('  - Safety: 2 sub-categories, 9 metrics, monthly entries');
        console.log('  - Quality: 2 sub-categories, 9 metrics, monthly entries');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
// Run seeding
seedCostSafetyQuality()
    .then(() => {
    console.log('\n✅ Seeding script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
});
