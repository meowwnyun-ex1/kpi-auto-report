"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
/**
 * Seed script for Quality by Product KPIs - FY25 Data (Apr-25 to Mar-26)
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
async function seedQualityByProduct() {
    console.log('Starting Quality by Product KPI Seeding...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. PRODUCTS
        // ============================================
        console.log('Seeding Products...');
        const products = [
            { name: 'HP3', code: 'HP3' },
            { name: 'HP5', code: 'HP5' },
            { name: 'HP5E', code: 'HP5E' },
            { name: 'RC', code: 'RC' },
            { name: 'G2&G3', code: 'G2G3' },
            { name: 'G4', code: 'G4' },
            { name: 'UC', code: 'UC' },
            { name: 'GDP', code: 'GDP' },
            { name: 'QC', code: 'QC' },
            { name: 'SCV', code: 'SCV' },
            { name: 'DF', code: 'DF' },
            { name: 'PCV/PRV', code: 'PCVPRV' },
            { name: 'SOL', code: 'SOL' },
            // Additional products from Quality by Product data
            { name: 'Pump/M', code: 'PumpM' },
            { name: 'Pump/A', code: 'PumpA' },
            { name: 'INJ/M', code: 'INJM' },
            { name: 'INJ/A', code: 'INJA' },
            { name: 'Valve', code: 'Valve' },
            { name: 'T_Pump/M', code: 'T_PumpM' },
            { name: 'T_Pump/A', code: 'T_PumpA' },
            { name: 'T_INJ/M', code: 'T_INJM' },
            { name: 'T_INJ/A', code: 'T_INJA' },
            { name: 'T_Valve', code: 'T_Valve' },
            { name: 'T_SOL', code: 'T_SOL' },
            { name: 'T_UC/M', code: 'T_UCM' },
            { name: 'T_UC/A', code: 'T_UCA' },
            { name: 'T_GDP', code: 'T_GDP' },
            { name: 'T_SIFS/DF', code: 'T_SIFSDF' }
        ];
        for (const product of products) {
            await pool.request()
                .input('name', mssql_1.default.NVarChar, product.name)
                .input('code', mssql_1.default.NVarChar, product.code)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM products WHERE code = @code)
          BEGIN
            INSERT INTO products (name, code, is_active)
            VALUES (@name, @code, 1)
          END
        `);
        }
        console.log(`✅ Products seeded (${products.length} products)\n`);
        // ============================================
        // 2. QUALITY PRODUCT SUB-CATEGORIES
        // ============================================
        console.log('Seeding Quality Product Sub-Categories...');
        const qualityProductSubCategories = [
            { name_en: 'Claim', name_th: 'Claim', key: 'claim', sort_order: 1 },
            { name_en: 'Loss', name_th: 'Loss', key: 'loss', sort_order: 2 }
        ];
        for (const subCat of qualityProductSubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('name_th', mssql_1.default.NVarChar, subCat.name_th)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM quality_product_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO quality_product_sub_categories (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ Quality Product Sub-Categories seeded\n');
        // ============================================
        // 3. QUALITY PRODUCT METRICS
        // ============================================
        console.log('Seeding Quality Product Metrics...');
        const qualityProductMetrics = [
            // Claim
            { no: '1', measurement: 'Critical claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '0', sub_category_key: 'claim' },
            { no: '2', measurement: 'Market claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '-', sub_category_key: 'claim' },
            { no: '3', measurement: '0-km claim (Official)', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '4', sub_category_key: 'claim' },
            { no: '4', measurement: '0-km claim (All DN response)', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '9', sub_category_key: 'claim' },
            { no: '5', measurement: 'OGC claim', unit: 'Case', main: 'QA', main_relate: 'PD,PE, QC', fy25_target: '6', sub_category_key: 'claim' },
            { no: '6', measurement: 'Supplier NCR', unit: 'Case', main: 'QC', main_relate: 'PD,PE, QA, PU', fy25_target: '6', sub_category_key: 'claim' },
            { no: '7', measurement: 'Internal NCR', unit: 'Case', main: 'QC', main_relate: 'PD,PE, QA', fy25_target: '5', sub_category_key: 'claim' },
            // Loss
            { no: '8', measurement: 'Cost of spoilage', unit: '%', main: 'PD', main_relate: 'PC,PE,QC', fy25_target: '0.56%', sub_category_key: 'loss' },
            { no: '9', measurement: 'Cost of spoilage', unit: 'MB', main: 'PD', main_relate: 'PC,PE,QC', fy25_target: '163', sub_category_key: 'loss' }
        ];
        for (const metric of qualityProductMetrics) {
            const subCatResult = await pool.request()
                .input('key', mssql_1.default.NVarChar, metric.sub_category_key)
                .query(`SELECT id FROM quality_product_sub_categories WHERE [key] = @key`);
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
            IF NOT EXISTS (SELECT 1 FROM quality_product_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO quality_product_metrics (no, measurement, unit, main, main_relate, fy25_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @sub_category_id)
            END
          `);
            }
        }
        console.log('✅ Quality Product Metrics seeded\n');
        // ============================================
        // 4. QUALITY PRODUCT DATA ENTRIES - FY25
        // ============================================
        console.log('Seeding Quality Product Data Entries (FY25: Apr-25 to Mar-26)...');
        // Get product map
        const productResult = await pool.request().query(`SELECT id, code FROM products`);
        const productMap = {};
        for (const prod of productResult.recordset) {
            productMap[prod.code] = prod.id;
        }
        // Quality by Product data - Cost of spoilage MB (metric no: 9)
        const qualityProductDataEntries = [
            // Apr-25
            { no: '9', month: 'Apr-25', values: { 'PumpM': '0.2', 'PumpA': '1.6', 'INJM': '1.7', 'INJA': '3.8', 'Valve': '1.0', 'SOL': '1.8', 'UCM': '1.9', 'UCA': '0.6', 'GDP': '1.4', 'SIFSDF': '0.1', 'T_PumpM': '0.27', 'T_PumpA': '2.15', 'T_INJM': '1.98', 'T_INJA': '4.59', 'T_Valve': '1.12', 'T_SOL': '2.05', 'T_UCM': '1.96', 'T_UCA': '0.85', 'T_GDP': '1.90', 'T_SIFSDF': '0.16' } },
            // May-25
            { no: '9', month: 'May-25', values: { 'PumpM': '0.3', 'PumpA': '1.7', 'INJM': '2.4', 'INJA': '4.8', 'Valve': '1.2', 'SOL': '2.6', 'UCM': '1.8', 'UCA': '0.7', 'GDP': '2.0', 'SIFSDF': '0.1', 'T_PumpM': '0.26', 'T_PumpA': '2.23', 'T_INJM': '2.07', 'T_INJA': '4.55', 'T_Valve': '1.17', 'T_SOL': '2.14', 'T_UCM': '1.31', 'T_UCA': '0.88', 'T_GDP': '2.07', 'T_SIFSDF': '0.16' } },
            // Jun-25
            { no: '9', month: 'Jun-25', values: { 'PumpM': '0.6', 'PumpA': '1.9', 'INJM': '2.4', 'INJA': '4.7', 'Valve': '1.5', 'SOL': '2.4', 'UCM': '1.8', 'UCA': '0.6', 'GDP': '2.1', 'SIFSDF': '0.2', 'T_PumpM': '0.28', 'T_PumpA': '2.23', 'T_INJM': '2.09', 'T_INJA': '4.75', 'T_Valve': '1.26', 'T_SOL': '2.25', 'T_UCM': '1.49', 'T_UCA': '0.94', 'T_GDP': '2.15', 'T_SIFSDF': '0.19' } },
            // Jul-25
            { no: '9', month: 'Jul-25', values: { 'PumpM': '0.2', 'PumpA': '1.9', 'INJM': '2.2', 'INJA': '4.3', 'Valve': '1.0', 'SOL': '2.9', 'UCM': '1.5', 'UCA': '0.7', 'GDP': '2.2', 'SIFSDF': '0.1', 'T_PumpM': '0.25', 'T_PumpA': '2.17', 'T_INJM': '2.08', 'T_INJA': '4.51', 'T_Valve': '1.21', 'T_SOL': '2.06', 'T_UCM': '1.47', 'T_UCA': '0.97', 'T_GDP': '2.02', 'T_SIFSDF': '0.14' } },
            // Aug-25
            { no: '9', month: 'Aug-25', values: { 'PumpM': '0.2', 'PumpA': '1.6', 'INJM': '2.2', 'INJA': '5.4', 'Valve': '1.2', 'SOL': '3.2', 'UCM': '1.8', 'UCA': '1.8', 'GDP': '4.0', 'SIFSDF': '0.2', 'T_PumpM': '0.29', 'T_PumpA': '2.29', 'T_INJM': '2.10', 'T_INJA': '4.86', 'T_Valve': '1.26', 'T_SOL': '2.19', 'T_UCM': '1.48', 'T_UCA': '1.00', 'T_GDP': '2.01', 'T_SIFSDF': '0.19' } },
            // Sep-25
            { no: '9', month: 'Sep-25', values: { 'PumpM': '0.2', 'PumpA': '1.2', 'INJM': '2.5', 'INJA': '5.1', 'Valve': '1.3', 'SOL': '2.8', 'UCM': '2.8', 'UCA': '0.8', 'GDP': '3.5', 'SIFSDF': '0.2', 'T_PumpM': '0.28', 'T_PumpA': '2.21', 'T_INJM': '2.10', 'T_INJA': '4.82', 'T_Valve': '1.28', 'T_SOL': '2.20', 'T_UCM': '1.42', 'T_UCA': '0.93', 'T_GDP': '1.98', 'T_SIFSDF': '0.17' } },
            // Oct-25
            { no: '9', month: 'Oct-25', values: { 'PumpM': '0.2', 'PumpA': '1.3', 'INJM': '2.0', 'INJA': '4.1', 'Valve': '1.3', 'SOL': '2.2', 'UCM': '2.1', 'UCA': '0.6', 'GDP': '4.2', 'SIFSDF': '0.2', 'T_PumpM': '0.28', 'T_PumpA': '2.24', 'T_INJM': '2.08', 'T_INJA': '4.80', 'T_Valve': '1.23', 'T_SOL': '2.11', 'T_UCM': '1.47', 'T_UCA': '0.91', 'T_GDP': '1.99', 'T_SIFSDF': '0.18' } },
            // Nov-25
            { no: '9', month: 'Nov-25', values: { 'PumpM': '0.2', 'PumpA': '1.5', 'INJM': '2.3', 'INJA': '4.3', 'Valve': '0.0', 'SOL': '0.0', 'UCM': '2.2', 'UCA': '0.5', 'GDP': '2.4', 'SIFSDF': '0.0', 'T_PumpM': '0.26', 'T_PumpA': '2.20', 'T_INJM': '2.04', 'T_INJA': '4.55', 'T_Valve': '1.15', 'T_SOL': '1.91', 'T_UCM': '1.51', 'T_UCA': '0.99', 'T_GDP': '2.03', 'T_SIFSDF': '0.16' } },
            // Dec-25
            { no: '9', month: 'Dec-25', values: { 'PumpM': '0.3', 'PumpA': '1.5', 'INJM': '2.0', 'INJA': '4.0', 'Valve': '1.1', 'SOL': '1.7', 'UCM': '1.7', 'UCA': '0.5', 'GDP': '1.7', 'SIFSDF': '0.3', 'T_PumpM': '0.27', 'T_PumpA': '2.23', 'T_INJM': '2.07', 'T_INJA': '4.72', 'T_Valve': '1.17', 'T_SOL': '1.92', 'T_UCM': '1.42', 'T_UCA': '0.97', 'T_GDP': '1.80', 'T_SIFSDF': '0.17' } },
            // Jan-26
            { no: '9', month: 'Jan-26', values: { 'PumpM': '0.3', 'PumpA': '1.8', 'INJM': '2.5', 'INJA': '4.8', 'Valve': '1.1', 'SOL': '2.2', 'UCM': '1.9', 'UCA': '0.8', 'GDP': '2.8', 'SIFSDF': '0.3', 'T_PumpM': '0.27', 'T_PumpA': '2.25', 'T_INJM': '2.11', 'T_INJA': '4.60', 'T_Valve': '1.15', 'T_SOL': '1.88', 'T_UCM': '1.38', 'T_UCA': '1.00', 'T_GDP': '1.75', 'T_SIFSDF': '0.17' } },
            // Feb-26
            { no: '9', month: 'Feb-26', values: { 'PumpM': '0.3', 'PumpA': '1.6', 'INJM': '2.3', 'INJA': '5.3', 'Valve': '', 'SOL': '', 'UCM': '2.6', 'UCA': '0.6', 'GDP': '4.1', 'SIFSDF': '', 'T_PumpM': '0.28', 'T_PumpA': '2.30', 'T_INJM': '2.14', 'T_INJA': '4.63', 'T_Valve': '1.12', 'T_SOL': '1.83', 'T_UCM': '1.39', 'T_UCA': '0.69', 'T_GDP': '1.74', 'T_SIFSDF': '0.18' } },
            // Mar-26
            { no: '9', month: 'Mar-26', values: {} }
        ];
        // Seed data entries
        const months = ['Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26'];
        for (const month of months) {
            const year = getFyYear(month);
            for (const metric of qualityProductMetrics) {
                const metricResult = await pool.request()
                    .input('no', mssql_1.default.NVarChar, metric.no)
                    .query(`SELECT id FROM quality_product_metrics WHERE no = @no`);
                if (metricResult.recordset.length > 0) {
                    const metricId = metricResult.recordset[0].id;
                    // Find specific data for this metric/month
                    const specificData = qualityProductDataEntries.find(d => d.no === metric.no && d.month === month);
                    // Seed data for each product
                    for (const [productCode, productId] of Object.entries(productMap)) {
                        const value = specificData?.values?.[productCode] || '0';
                        await pool.request()
                            .input('metric_id', mssql_1.default.Int, metricId)
                            .input('product_id', mssql_1.default.Int, productId)
                            .input('month', mssql_1.default.NVarChar, month)
                            .input('year', mssql_1.default.Int, year)
                            .input('target', mssql_1.default.NVarChar, metric.fy25_target)
                            .input('result', mssql_1.default.NVarChar, value)
                            .input('accu_target', mssql_1.default.NVarChar, metric.fy25_target)
                            .input('accu_result', mssql_1.default.NVarChar, value)
                            .query(`
                IF NOT EXISTS (SELECT 1 FROM quality_product_data_entries WHERE metric_id = @metric_id AND product_id = @product_id AND month = @month AND year = @year)
                BEGIN
                  INSERT INTO quality_product_data_entries (metric_id, product_id, month, year, target, result, accu_target, accu_result)
                  VALUES (@metric_id, @product_id, @month, @year, @target, @result, @accu_target, @accu_result)
                END
              `);
                    }
                }
            }
        }
        console.log('✅ Quality Product Data Entries seeded\n');
        // ============================================
        // 5. QUALITY LOSS BY PRODUCT - FY25
        // ============================================
        console.log('Seeding Quality Loss by Product Data Entries (FY25)...');
        // Quality Loss by Product data (metric no: 9, Quality loss MB)
        const qualityLossByProductData = [
            // Apr-25
            { month: 'Apr-25', values: { 'HP3': '0.00', 'HP5': '3.11', 'HP5E': '0.08', 'RC': '0.00', 'G2G3': '0.06', 'G4': '0.56', 'UC': '0.00', 'GDP': '0.97', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // May-25
            { month: 'May-25', values: { 'HP3': '0.00', 'HP5': '2.00', 'HP5E': '0.44', 'RC': '0.01', 'G2G3': '0.25', 'G4': '2.63', 'UC': '0.00', 'GDP': '0.39', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Jun-25
            { month: 'Jun-25', values: { 'HP3': '0.00', 'HP5': '1.06', 'HP5E': '1.01', 'RC': '0.00', 'G2G3': '0.40', 'G4': '3.36', 'UC': '0.35', 'GDP': '0.00', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Jul-25
            { month: 'Jul-25', values: { 'HP3': '0.00', 'HP5': '2.72', 'HP5E': '0.12', 'RC': '0.07', 'G2G3': '0.63', 'G4': '2.84', 'UC': '0.25', 'GDP': '0.00', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Aug-25
            { month: 'Aug-25', values: { 'HP3': '0.00', 'HP5': '2.98', 'HP5E': '0.66', 'RC': '0.01', 'G2G3': '1.17', 'G4': '2.28', 'UC': '0.32', 'GDP': '1.11', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Sep-25
            { month: 'Sep-25', values: { 'HP3': '0.00', 'HP5': '2.40', 'HP5E': '0.70', 'RC': '0.12', 'G2G3': '0.11', 'G4': '1.39', 'UC': '0.78', 'GDP': '0.09', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Oct-25
            { month: 'Oct-25', values: { 'HP3': '0.00', 'HP5': '1.03', 'HP5E': '0.44', 'RC': '0.00', 'G2G3': '1.35', 'G4': '2.17', 'UC': '0.62', 'GDP': '0.52', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Nov-25
            { month: 'Nov-25', values: { 'HP3': '0.00', 'HP5': '0.78', 'HP5E': '0.46', 'RC': '0.00', 'G2G3': '1.74', 'G4': '2.66', 'UC': '0.53', 'GDP': '0.06', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Dec-25
            { month: 'Dec-25', values: { 'HP3': '0.00', 'HP5': '0.76', 'HP5E': '2.12', 'RC': '0.00', 'G2G3': '1.74', 'G4': '2.66', 'UC': '0.53', 'GDP': '0.06', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.04', 'SOL': '0.00' } },
            // Jan-26
            { month: 'Jan-26', values: { 'HP3': '0.00', 'HP5': '2.93', 'HP5E': '2.18', 'RC': '0.00', 'G2G3': '0.37', 'G4': '2.28', 'UC': '0.59', 'GDP': '0.00', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Feb-26
            { month: 'Feb-26', values: { 'HP3': '0.00', 'HP5': '2.63', 'HP5E': '0.96', 'RC': '0.00', 'G2G3': '0.23', 'G4': '2.89', 'UC': '0.47', 'GDP': '7.51', 'QC': '0.00', 'SCV': '0.00', 'DF': '0.00', 'PCVPRV': '0.00', 'SOL': '0.00' } },
            // Mar-26
            { month: 'Mar-26', values: {} }
        ];
        // Get or create Quality Loss metric
        const lossMetricResult = await pool.request()
            .input('no', mssql_1.default.NVarChar, '9')
            .query(`SELECT id FROM quality_product_metrics WHERE no = @no`);
        if (lossMetricResult.recordset.length > 0) {
            const lossMetricId = lossMetricResult.recordset[0].id;
            for (const lossData of qualityLossByProductData) {
                const year = getFyYear(lossData.month);
                for (const [productCode, value] of Object.entries(lossData.values)) {
                    const productId = productMap[productCode];
                    if (productId) {
                        await pool.request()
                            .input('metric_id', mssql_1.default.Int, lossMetricId)
                            .input('product_id', mssql_1.default.Int, productId)
                            .input('month', mssql_1.default.NVarChar, lossData.month)
                            .input('year', mssql_1.default.Int, year)
                            .input('target', mssql_1.default.NVarChar, '231.8')
                            .input('result', mssql_1.default.NVarChar, value)
                            .input('accu_target', mssql_1.default.NVarChar, '231.8')
                            .input('accu_result', mssql_1.default.NVarChar, value)
                            .query(`
                IF NOT EXISTS (SELECT 1 FROM quality_product_data_entries WHERE metric_id = @metric_id AND product_id = @product_id AND month = @month AND year = @year)
                BEGIN
                  INSERT INTO quality_product_data_entries (metric_id, product_id, month, year, target, result, accu_target, accu_result)
                  VALUES (@metric_id, @product_id, @month, @year, @target, @result, @accu_target, @accu_result)
                END
              `);
                    }
                }
            }
        }
        console.log('✅ Quality Loss by Product Data Entries seeded\n');
        // ============================================
        // SUMMARY
        // ============================================
        console.log('========================================');
        console.log('🎉 Quality by Product KPI Seeding Finished!');
        console.log('========================================');
        console.log('\nData Summary:');
        console.log('  - Products: 28');
        console.log('  - Sub-Categories: 2 (Claim, Loss)');
        console.log('  - Metrics: 9');
        console.log('  - FY25 Period: Apr-25 to Mar-26');
        console.log('\nNote: FY25 = April 2025 to March 2026');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
// Run seeding
seedQualityByProduct()
    .then(() => {
    console.log('\n✅ Seeding script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
});
