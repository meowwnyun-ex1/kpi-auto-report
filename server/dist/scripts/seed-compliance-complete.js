"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function seedComplianceComplete() {
    const config = {
        server: process.env.DB_HOST || '10.73.148.76',
        database: process.env.DB_NAME || 'kpi-db',
        user: process.env.DB_USER || 'inn@admin',
        password: process.env.DB_PASSWORD || 'i@NN636195',
        port: parseInt(process.env.DB_PORT || '1433'),
        options: {
            trustServerCertificate: true,
            encrypt: false,
        },
    };
    console.log('🔄 Seeding Compliance KPI complete data...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await pool.request().query(`DELETE FROM compliance_data_entries`);
    await pool.request().query(`DELETE FROM compliance_metrics`);
    await pool.request().query(`DELETE FROM compliance_sub_categories`);
    console.log('✅ Existing data cleared\n');
    // Seed sub-categories
    console.log('🔄 Seeding compliance sub-categories...');
    const subCategories = [
        { name_en: 'Compliance', key: 'compliance', sort_order: 1 },
        { name_en: 'Safety', key: 'safety', sort_order: 2 },
        { name_en: 'Environment', key: 'environment', sort_order: 3 },
        { name_en: '5S', key: '5s', sort_order: 4 },
    ];
    for (const cat of subCategories) {
        await pool.request()
            .input('name_en', mssql_1.default.NVarChar, cat.name_en)
            .input('key', mssql_1.default.NVarChar, cat.key)
            .input('sort_order', mssql_1.default.Int, cat.sort_order)
            .query(`
        INSERT INTO compliance_sub_categories (name_en, [key], sort_order)
        VALUES (@name_en, @key, @sort_order)
      `);
    }
    console.log('✅ Sub-categories seeded\n');
    // Seed metrics
    console.log('🔄 Seeding compliance metrics...');
    const metrics = [
        // Compliance sub-category
        { no: 1, measurement: 'Quality Management System (ISO 9001:2015)', unit: 'Certificate', main: 'MT', main_relate: 'ALL', fy25_target: 'Maintain', description: 'Maintain ISO 9001:2015 certification', sub_category_key: 'compliance' },
        { no: 2, measurement: 'Environment Management System (ISO 14001:2015)', unit: 'Certificate', main: 'MT', main_relate: 'ALL', fy25_target: 'Maintain', description: 'Maintain ISO 14001:2015 certification', sub_category_key: 'compliance' },
        { no: 3, measurement: 'Occupational Health & Safety Management System (ISO 45001:2018)', unit: 'Certificate', main: 'MT', main_relate: 'ALL', fy25_target: 'Maintain', description: 'Maintain ISO 45001:2018 certification', sub_category_key: 'compliance' },
        { no: 4, measurement: 'Energy Management System (ISO 50001:2018)', unit: 'Certificate', main: 'MT', main_relate: 'ALL', fy25_target: 'Maintain', description: 'Maintain ISO 50001:2018 certification', sub_category_key: 'compliance' },
        { no: 5, measurement: 'Custom-Trade Partnership Against Terrorism (C-TPAT)', unit: 'Certificate', main: 'MT', main_relate: 'ALL', fy25_target: 'Maintain', description: 'Maintain C-TPAT certification', sub_category_key: 'compliance' },
        { no: 6, measurement: 'Authorized Economic Operator (AEO)', unit: 'Certificate', main: 'MT', main_relate: 'ALL', fy25_target: 'Maintain', description: 'Maintain AEO certification', sub_category_key: 'compliance' },
        // Safety sub-category
        { no: 1, measurement: 'Lost Time Injury Frequency Rate (LTIFR)', unit: 'Case', main: 'MT', main_relate: 'ALL', fy25_target: '0', description: 'Number of lost time injuries per million hours worked', sub_category_key: 'safety' },
        { no: 2, measurement: 'Total Recordable Incident Rate (TRIR)', unit: 'Case', main: 'MT', main_relate: 'ALL', fy25_target: '0', description: 'Total recordable incidents per million hours worked', sub_category_key: 'safety' },
        { no: 3, measurement: 'Near Miss Reporting', unit: 'Case', main: 'MT', main_relate: 'ALL', fy25_target: '100', description: 'Number of near miss reports submitted', sub_category_key: 'safety' },
        { no: 4, measurement: 'Safety Training Completion', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '100%', description: 'Percentage of required safety training completed', sub_category_key: 'safety' },
        { no: 5, measurement: 'Safety Audit Score', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '95%', description: 'Safety audit compliance score', sub_category_key: 'safety' },
        // Environment sub-category
        { no: 1, measurement: 'Energy Consumption Reduction', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '5%', description: 'Percentage reduction in energy consumption vs baseline', sub_category_key: 'environment' },
        { no: 2, measurement: 'Water Consumption Reduction', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '3%', description: 'Percentage reduction in water consumption vs baseline', sub_category_key: 'environment' },
        { no: 3, measurement: 'Waste Recycling Rate', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '80%', description: 'Percentage of waste recycled', sub_category_key: 'environment' },
        { no: 4, measurement: 'GHG Emission Reduction', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '5%', description: 'Percentage reduction in GHG emissions vs baseline', sub_category_key: 'environment' },
        { no: 5, measurement: 'Environmental Compliance', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '100%', description: 'Environmental regulatory compliance rate', sub_category_key: 'environment' },
        // 5S sub-category
        { no: 1, measurement: '5S Audit Score', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '90%', description: 'Overall 5S audit compliance score', sub_category_key: '5s' },
        { no: 2, measurement: '5S Training Completion', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '100%', description: 'Percentage of employees trained on 5S', sub_category_key: '5s' },
        { no: 3, measurement: 'Workplace Organization Score', unit: '%', main: 'MT', main_relate: 'ALL', fy25_target: '95%', description: 'Workplace organization and cleanliness score', sub_category_key: '5s' },
    ];
    for (const m of metrics) {
        await pool.request()
            .input('no', mssql_1.default.Int, m.no)
            .input('measurement', mssql_1.default.NVarChar, m.measurement)
            .input('unit', mssql_1.default.NVarChar, m.unit)
            .input('main', mssql_1.default.NVarChar, m.main)
            .input('main_relate', mssql_1.default.NVarChar, m.main_relate)
            .input('fy25_target', mssql_1.default.NVarChar, m.fy25_target)
            .input('description', mssql_1.default.NVarChar, m.description)
            .input('sub_category_key', mssql_1.default.NVarChar, m.sub_category_key)
            .query(`
        INSERT INTO compliance_metrics (no, measurement, unit, main, main_relate, fy25_target, description_of_target, sub_category_id)
        SELECT @no, @measurement, @unit, @main, @main_relate, @fy25_target, @description, id FROM compliance_sub_categories WHERE [key] = @sub_category_key
      `);
    }
    console.log('✅ Metrics seeded\n');
    // Seed data entries
    console.log('🔄 Seeding compliance data entries...');
    // Get metric IDs
    const metricResult = await pool.request().query(`
    SELECT m.id, m.no, sc.[key] as sub_category_key
    FROM compliance_metrics m
    INNER JOIN compliance_sub_categories sc ON m.sub_category_id = sc.id
  `);
    const metricIds = {};
    for (const row of metricResult.recordset) {
        metricIds[`${row.sub_category_key}_${row.no}`] = row.id;
    }
    // Data entries for each metric
    const dataEntries = [
        // Compliance - ISO 9001 (metric 1)
        { metricKey: 'compliance_1', month: 'Apr', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'compliance_1', month: 'May', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'compliance_1', month: 'Jun', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Compliance - ISO 14001 (metric 2)
        { metricKey: 'compliance_2', month: 'Apr', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'compliance_2', month: 'May', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'compliance_2', month: 'Jun', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Compliance - ISO 45001 (metric 3)
        { metricKey: 'compliance_3', month: 'Apr', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'compliance_3', month: 'May', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'compliance_3', month: 'Jun', year: 2024, target: 'Maintain', result: 'Maintain', accu_target: 'Maintain', accu_result: 'Maintain', forecast: 'Maintain', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Safety - LTIFR (metric 1)
        { metricKey: 'safety_1', month: 'Apr', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_1', month: 'May', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_1', month: 'Jun', year: 2024, target: '0', result: '1', accu_target: '0', accu_result: '1', forecast: '0', reason: 'Worker slipped on wet floor', recover_activity: 'Install non-slip mats, improve cleaning procedures', forecast_result_total: '1', recovery_month: 'Jul' },
        { metricKey: 'safety_1', month: 'Jul', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_1', month: 'Aug', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_1', month: 'Sep', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Safety - TRIR (metric 2)
        { metricKey: 'safety_2', month: 'Apr', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_2', month: 'May', year: 2024, target: '0', result: '1', accu_target: '0', accu_result: '1', forecast: '0', reason: 'Minor cut from equipment', recover_activity: 'Equipment guard installed', forecast_result_total: '1', recovery_month: 'Jun' },
        { metricKey: 'safety_2', month: 'Jun', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_2', month: 'Jul', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_2', month: 'Aug', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_2', month: 'Sep', year: 2024, target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Safety - Near Miss Reporting (metric 3)
        { metricKey: 'safety_3', month: 'Apr', year: 2024, target: '10', result: '12', accu_target: '10', accu_result: '12', forecast: '100', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_3', month: 'May', year: 2024, target: '10', result: '15', accu_target: '20', accu_result: '27', forecast: '100', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_3', month: 'Jun', year: 2024, target: '10', result: '8', accu_target: '30', accu_result: '35', forecast: '100', reason: 'Lower reporting due to holiday', recover_activity: 'Encourage reporting through safety meetings', forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_3', month: 'Jul', year: 2024, target: '10', result: '18', accu_target: '40', accu_result: '53', forecast: '100', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_3', month: 'Aug', year: 2024, target: '10', result: '14', accu_target: '50', accu_result: '67', forecast: '100', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_3', month: 'Sep', year: 2024, target: '10', result: '11', accu_target: '60', accu_result: '78', forecast: '100', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Safety - Training Completion (metric 4)
        { metricKey: 'safety_4', month: 'Apr', year: 2024, target: '100%', result: '95%', accu_target: '100%', accu_result: '95%', forecast: '100%', reason: '5 employees on leave', recover_activity: 'Schedule makeup training', forecast_result_total: '100%', recovery_month: 'May' },
        { metricKey: 'safety_4', month: 'May', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_4', month: 'Jun', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_4', month: 'Jul', year: 2024, target: '100%', result: '98%', accu_target: '100%', accu_result: '98%', forecast: '100%', reason: 'New hires pending training', recover_activity: 'Schedule orientation training', forecast_result_total: '100%', recovery_month: 'Aug' },
        { metricKey: 'safety_4', month: 'Aug', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_4', month: 'Sep', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Safety - Audit Score (metric 5)
        { metricKey: 'safety_5', month: 'Apr', year: 2024, target: '95%', result: '92%', accu_target: '95%', accu_result: '92%', forecast: '95%', reason: 'Minor findings in documentation', recover_activity: 'Update safety procedures documentation', forecast_result_total: '95%', recovery_month: 'May' },
        { metricKey: 'safety_5', month: 'May', year: 2024, target: '95%', result: '96%', accu_target: '95%', accu_result: '96%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_5', month: 'Jun', year: 2024, target: '95%', result: '95%', accu_target: '95%', accu_result: '95%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_5', month: 'Jul', year: 2024, target: '95%', result: '94%', accu_target: '95%', accu_result: '94%', forecast: '95%', reason: 'Equipment maintenance backlog', recover_activity: 'Prioritize maintenance schedule', forecast_result_total: '95%', recovery_month: 'Aug' },
        { metricKey: 'safety_5', month: 'Aug', year: 2024, target: '95%', result: '97%', accu_target: '95%', accu_result: '97%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'safety_5', month: 'Sep', year: 2024, target: '95%', result: '96%', accu_target: '95%', accu_result: '96%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Environment - Energy Reduction (metric 1)
        { metricKey: 'environment_1', month: 'Apr', year: 2024, target: '1%', result: '0.8%', accu_target: '1%', accu_result: '0.8%', forecast: '5%', reason: 'Higher production volume', recover_activity: 'Implement energy efficiency measures', forecast_result_total: '5%', recovery_month: 'Sep' },
        { metricKey: 'environment_1', month: 'May', year: 2024, target: '1%', result: '1.2%', accu_target: '2%', accu_result: '2%', forecast: '5%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_1', month: 'Jun', year: 2024, target: '1%', result: '0.9%', accu_target: '3%', accu_result: '2.9%', forecast: '5%', reason: 'Summer cooling load', recover_activity: 'Optimize HVAC settings', forecast_result_total: '4%', recovery_month: 'Oct' },
        { metricKey: 'environment_1', month: 'Jul', year: 2024, target: '1%', result: '0.7%', accu_target: '4%', accu_result: '3.6%', forecast: '5%', reason: 'Peak summer demand', recover_activity: 'Install solar panels', forecast_result_total: '4%', recovery_month: 'Dec' },
        { metricKey: 'environment_1', month: 'Aug', year: 2024, target: '1%', result: '0.6%', accu_target: '5%', accu_result: '4.2%', forecast: '5%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_1', month: 'Sep', year: 2024, target: '1%', result: '1.1%', accu_target: '5%', accu_result: '5.3%', forecast: '5%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Environment - Water Reduction (metric 2)
        { metricKey: 'environment_2', month: 'Apr', year: 2024, target: '0.5%', result: '0.4%', accu_target: '0.5%', accu_result: '0.4%', forecast: '3%', reason: null, recover_activity: 'Fix water leaks identified', forecast_result_total: '3%', recovery_month: 'Jun' },
        { metricKey: 'environment_2', month: 'May', year: 2024, target: '0.5%', result: '0.6%', accu_target: '1%', accu_result: '1%', forecast: '3%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_2', month: 'Jun', year: 2024, target: '0.5%', result: '0.5%', accu_target: '1.5%', accu_result: '1.5%', forecast: '3%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_2', month: 'Jul', year: 2024, target: '0.5%', result: '0.4%', accu_target: '2%', accu_result: '1.9%', forecast: '3%', reason: 'Higher water usage for cooling', recover_activity: 'Install water recycling system', forecast_result_total: '2.5%', recovery_month: 'Sep' },
        { metricKey: 'environment_2', month: 'Aug', year: 2024, target: '0.5%', result: '0.3%', accu_target: '2.5%', accu_result: '2.2%', forecast: '3%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_2', month: 'Sep', year: 2024, target: '0.5%', result: '0.5%', accu_target: '3%', accu_result: '2.7%', forecast: '3%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Environment - Waste Recycling (metric 3)
        { metricKey: 'environment_3', month: 'Apr', year: 2024, target: '80%', result: '78%', accu_target: '80%', accu_result: '78%', forecast: '80%', reason: 'Contamination in recycling bins', recover_activity: 'Improve waste segregation training', forecast_result_total: '80%', recovery_month: 'May' },
        { metricKey: 'environment_3', month: 'May', year: 2024, target: '80%', result: '82%', accu_target: '80%', accu_result: '82%', forecast: '80%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_3', month: 'Jun', year: 2024, target: '80%', result: '81%', accu_target: '80%', accu_result: '81%', forecast: '80%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_3', month: 'Jul', year: 2024, target: '80%', result: '79%', accu_target: '80%', accu_result: '79%', forecast: '80%', reason: 'New waste contractor adjustment', recover_activity: 'Work with contractor on sorting', forecast_result_total: '80%', recovery_month: 'Aug' },
        { metricKey: 'environment_3', month: 'Aug', year: 2024, target: '80%', result: '83%', accu_target: '80%', accu_result: '83%', forecast: '80%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_3', month: 'Sep', year: 2024, target: '80%', result: '85%', accu_target: '80%', accu_result: '85%', forecast: '80%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Environment - GHG Emission (metric 4)
        { metricKey: 'environment_4', month: 'Apr', year: 2024, target: '1%', result: '0.9%', accu_target: '1%', accu_result: '0.9%', forecast: '5%', reason: null, recover_activity: 'Switch to renewable energy source', forecast_result_total: '5%', recovery_month: 'Dec' },
        { metricKey: 'environment_4', month: 'May', year: 2024, target: '1%', result: '1.1%', accu_target: '2%', accu_result: '2%', forecast: '5%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_4', month: 'Jun', year: 2024, target: '1%', result: '0.8%', accu_target: '3%', accu_result: '2.8%', forecast: '5%', reason: 'Increased production', recover_activity: 'Optimize production scheduling', forecast_result_total: '4%', recovery_month: 'Sep' },
        { metricKey: 'environment_4', month: 'Jul', year: 2024, target: '1%', result: '0.7%', accu_target: '4%', accu_result: '3.5%', forecast: '5%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_4', month: 'Aug', year: 2024, target: '1%', result: '0.8%', accu_target: '5%', accu_result: '4.3%', forecast: '5%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_4', month: 'Sep', year: 2024, target: '1%', result: '1%', accu_target: '5%', accu_result: '5.3%', forecast: '5%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // Environment - Compliance (metric 5)
        { metricKey: 'environment_5', month: 'Apr', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_5', month: 'May', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_5', month: 'Jun', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_5', month: 'Jul', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_5', month: 'Aug', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: 'environment_5', month: 'Sep', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // 5S - Audit Score (metric 1)
        { metricKey: '5s_1', month: 'Apr', year: 2024, target: '90%', result: '88%', accu_target: '90%', accu_result: '88%', forecast: '90%', reason: 'Storage area disorganization', recover_activity: 'Implement 5S audit checklist', forecast_result_total: '90%', recovery_month: 'May' },
        { metricKey: '5s_1', month: 'May', year: 2024, target: '90%', result: '91%', accu_target: '90%', accu_result: '91%', forecast: '90%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_1', month: 'Jun', year: 2024, target: '90%', result: '89%', accu_target: '90%', accu_result: '89%', forecast: '90%', reason: 'End of quarter backlog', recover_activity: 'Schedule extra cleanup sessions', forecast_result_total: '90%', recovery_month: 'Jul' },
        { metricKey: '5s_1', month: 'Jul', year: 2024, target: '90%', result: '92%', accu_target: '90%', accu_result: '92%', forecast: '90%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_1', month: 'Aug', year: 2024, target: '90%', result: '93%', accu_target: '90%', accu_result: '93%', forecast: '90%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_1', month: 'Sep', year: 2024, target: '90%', result: '94%', accu_target: '90%', accu_result: '94%', forecast: '90%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // 5S - Training (metric 2)
        { metricKey: '5s_2', month: 'Apr', year: 2024, target: '100%', result: '85%', accu_target: '100%', accu_result: '85%', forecast: '100%', reason: 'Training schedule conflict', recover_activity: 'Reschedule training sessions', forecast_result_total: '100%', recovery_month: 'May' },
        { metricKey: '5s_2', month: 'May', year: 2024, target: '100%', result: '95%', accu_target: '100%', accu_result: '95%', forecast: '100%', reason: null, recover_activity: 'Complete remaining trainings', forecast_result_total: '100%', recovery_month: 'Jun' },
        { metricKey: '5s_2', month: 'Jun', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_2', month: 'Jul', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_2', month: 'Aug', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_2', month: 'Sep', year: 2024, target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        // 5S - Organization Score (metric 3)
        { metricKey: '5s_3', month: 'Apr', year: 2024, target: '95%', result: '92%', accu_target: '95%', accu_result: '92%', forecast: '95%', reason: 'Tool organization pending', recover_activity: 'Install shadow boards for tools', forecast_result_total: '95%', recovery_month: 'May' },
        { metricKey: '5s_3', month: 'May', year: 2024, target: '95%', result: '94%', accu_target: '95%', accu_result: '94%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_3', month: 'Jun', year: 2024, target: '95%', result: '96%', accu_target: '95%', accu_result: '96%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_3', month: 'Jul', year: 2024, target: '95%', result: '95%', accu_target: '95%', accu_result: '95%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_3', month: 'Aug', year: 2024, target: '95%', result: '97%', accu_target: '95%', accu_result: '97%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
        { metricKey: '5s_3', month: 'Sep', year: 2024, target: '95%', result: '98%', accu_target: '95%', accu_result: '98%', forecast: '95%', reason: null, recover_activity: null, forecast_result_total: null, recovery_month: null },
    ];
    let entryCount = 0;
    for (const entry of dataEntries) {
        const metricId = metricIds[entry.metricKey];
        if (!metricId) {
            console.log(`⚠️ Metric not found for key: ${entry.metricKey}`);
            continue;
        }
        await pool.request()
            .input('metric_id', mssql_1.default.Int, metricId)
            .input('month', mssql_1.default.NVarChar, entry.month)
            .input('year', mssql_1.default.Int, entry.year)
            .input('target', mssql_1.default.NVarChar, entry.target)
            .input('result', mssql_1.default.NVarChar, entry.result)
            .input('accu_target', mssql_1.default.NVarChar, entry.accu_target)
            .input('accu_result', mssql_1.default.NVarChar, entry.accu_result)
            .input('forecast', mssql_1.default.NVarChar, entry.forecast)
            .input('reason', mssql_1.default.NVarChar, entry.reason)
            .input('recover_activity', mssql_1.default.NVarChar, entry.recover_activity)
            .input('forecast_result_total', mssql_1.default.NVarChar, entry.forecast_result_total)
            .input('recovery_month', mssql_1.default.NVarChar, entry.recovery_month)
            .query(`
        INSERT INTO compliance_data_entries 
        (metric_id, month, year, target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month)
        VALUES 
        (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result, @forecast, @reason, @recover_activity, @forecast_result_total, @recovery_month)
      `);
        entryCount++;
    }
    console.log(`✅ ${entryCount} data entries seeded\n`);
    await pool.close();
    console.log('✅ Compliance KPI seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Sub-categories: ${subCategories.length}`);
    console.log(`   - Metrics: ${metrics.length}`);
    console.log(`   - Data entries: ${entryCount}`);
}
seedComplianceComplete().catch(console.error);
