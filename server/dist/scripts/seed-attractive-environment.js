"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
/**
 * Seed script for Attractive and Environment KPI data
 */
async function seedAttractiveEnvironment() {
    console.log('Starting Attractive & Environment KPI Seeding...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. SEED DEPARTMENTS (if not exists)
        // ============================================
        console.log('Seeding departments...');
        const departments = [
            { key: 'PUMP_M', name_en: 'Pump/M', name_th: 'Pump/M', sort_order: 1 },
            { key: 'PUMP_A', name_en: 'Pump/A', name_th: 'Pump/A', sort_order: 2 },
            { key: 'RAIL', name_en: 'Rail', name_th: 'Rail', sort_order: 3 },
            { key: 'INJ_M', name_en: 'INJ/M', name_th: 'INJ/M', sort_order: 4 },
            { key: 'INJ_A', name_en: 'INJ/A', name_th: 'INJ/A', sort_order: 5 },
            { key: 'VALVE', name_en: 'Valve', name_th: 'Valve', sort_order: 6 },
            { key: 'SOL', name_en: 'SOL', name_th: 'SOL', sort_order: 7 },
            { key: 'UC_M', name_en: 'UC/M', name_th: 'UC/M', sort_order: 8 },
            { key: 'UC_A', name_en: 'UC/A', name_th: 'UC/A', sort_order: 9 },
            { key: 'GDP', name_en: 'GDP', name_th: 'GDP', sort_order: 10 },
            { key: 'SIFS_DF', name_en: 'SIFS/DF', name_th: 'SIFS/DF', sort_order: 11 },
            { key: 'TIE', name_en: 'TIE', name_th: 'TIE', sort_order: 12 },
            { key: 'WH', name_en: 'WH', name_th: 'WH', sort_order: 13 },
            { key: 'MT', name_en: 'MT', name_th: 'MT', sort_order: 14 },
            { key: 'QA', name_en: 'QA', name_th: 'QA', sort_order: 15 },
            { key: 'QC', name_en: 'QC', name_th: 'QC', sort_order: 16 },
            { key: 'ADM', name_en: 'ADM', name_th: 'ADM', sort_order: 17 },
            { key: 'PE', name_en: 'PE', name_th: 'PE', sort_order: 18 },
            { key: 'PC', name_en: 'PC', name_th: 'PC', sort_order: 19 },
            { key: 'SPD', name_en: 'SPD', name_th: 'SPD', sort_order: 20 },
            { key: 'SE', name_en: 'SE', name_th: 'SE', sort_order: 21 },
            { key: 'USER', name_en: 'User', name_th: 'User', sort_order: 22 },
            { key: 'HP3', name_en: 'HP3', name_th: 'HP3', sort_order: 23 },
            { key: 'HP5', name_en: 'HP5', name_th: 'HP5', sort_order: 24 },
            { key: 'HP5E', name_en: 'HP5E', name_th: 'HP5E', sort_order: 25 },
            { key: 'INJ_G2_G3', name_en: 'INJ G2 G3', name_th: 'INJ G2 G3', sort_order: 26 },
            { key: 'INJ_G4_G4S', name_en: 'INJ G4&G4S', name_th: 'INJ G4&G4S', sort_order: 27 },
            { key: 'UC_ASSY', name_en: 'UC Assy', name_th: 'UC Assy', sort_order: 28 },
            { key: 'UC_MACHINE', name_en: 'UC Machine', name_th: 'UC Machine', sort_order: 29 },
            { key: 'SKD_DF', name_en: 'SKD/DF', name_th: 'SKD/DF', sort_order: 30 },
            { key: 'SKD_SIFS', name_en: 'SKD/SIFs', name_th: 'SKD/SIFs', sort_order: 31 },
            { key: 'SKD_SOL_G2_G3', name_en: 'SKD/Solenoid G2 G3', name_th: 'SKD/Solenoid G2 G3', sort_order: 32 },
            { key: 'SKD_SOL_G4_G45', name_en: 'SKD/Solenoid G4 G4.5', name_th: 'SKD/Solenoid G4 G4.5', sort_order: 33 },
            { key: 'SKD_SCV', name_en: 'SKD/SCV', name_th: 'SKD/SCV', sort_order: 34 },
            { key: 'SKD_PCV', name_en: 'SKD/PCV', name_th: 'SKD/PCV', sort_order: 35 },
            { key: 'SKD_PRV', name_en: 'SKD/PRV', name_th: 'SKD/PRV', sort_order: 36 },
            { key: 'SKD_PE', name_en: 'SKD/PE', name_th: 'SKD/PE', sort_order: 37 },
            { key: 'SDM_PE', name_en: 'SDM/PE', name_th: 'SDM/PE', sort_order: 38 },
            { key: 'QA_SDM', name_en: 'QA SDM', name_th: 'QA SDM', sort_order: 39 },
            { key: 'QA_SKD', name_en: 'QA SKD', name_th: 'QA SKD', sort_order: 40 },
            { key: 'PDI', name_en: 'PDI', name_th: 'PDI', sort_order: 41 },
            { key: 'PI_SDM', name_en: 'PI SDM', name_th: 'PI SDM', sort_order: 42 },
            { key: 'PI_SKD', name_en: 'PI SKD', name_th: 'PI SKD', sort_order: 43 },
            { key: 'WAREHOUSE', name_en: 'Warehouse', name_th: 'Warehouse', sort_order: 44 },
            { key: 'PU', name_en: 'PU', name_th: 'PU', sort_order: 45 },
            { key: 'FC', name_en: 'FC', name_th: 'FC', sort_order: 46 },
            { key: 'CN_PUMP_CR', name_en: 'PUMP+CR', name_th: 'PUMP+CR', sort_order: 47 },
            { key: 'CN_INJ', name_en: 'INJ', name_th: 'INJ', sort_order: 48 },
            { key: 'CN_UC', name_en: 'UC', name_th: 'UC', sort_order: 49 },
            { key: 'CN_GDP', name_en: 'GDP', name_th: 'GDP', sort_order: 50 },
            { key: 'CN_SKD', name_en: 'SKD', name_th: 'SKD', sort_order: 51 },
            { key: 'WAREHOUSE_FAC1', name_en: 'Warehouse Fac#1', name_th: 'Warehouse Fac#1', sort_order: 52 },
            { key: 'WAREHOUSE_FAC2', name_en: 'Warehouse Fac#2', name_th: 'Warehouse Fac#2', sort_order: 53 },
            { key: 'OFFICE_FAC2', name_en: 'Office Fac#2', name_th: 'Office Fac#2', sort_order: 54 },
            { key: 'PD', name_en: 'PD', name_th: 'PD', sort_order: 55 },
            { key: 'UTILITY', name_en: 'Utility', name_th: 'Utility', sort_order: 56 },
        ];
        for (const dept of departments) {
            await pool.request()
                .input('key', mssql_1.default.NVarChar, dept.key)
                .input('name_en', mssql_1.default.NVarChar, dept.name_en)
                .input('name_th', mssql_1.default.NVarChar, dept.name_th)
                .input('sort_order', mssql_1.default.Int, dept.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM departments WHERE [key] = @key)
          BEGIN
            INSERT INTO departments ([key], name_en, name_th, sort_order)
            VALUES (@key, @name_en, @name_th, @sort_order)
          END
        `);
        }
        console.log('✅ Departments seeded\n');
        // ============================================
        // 2. SEED ATTRACTIVE SUB-CATEGORIES
        // ============================================
        console.log('Seeding Attractive sub-categories...');
        const attractiveSubCategories = [
            { key: 'non_value_reduction', name_en: 'Non-value work reduction', sort_order: 1 },
            { key: 'university_projects', name_en: 'Projects with Universities', sort_order: 2 },
        ];
        for (const sc of attractiveSubCategories) {
            await pool.request()
                .input('key', mssql_1.default.NVarChar, sc.key)
                .input('name_en', mssql_1.default.NVarChar, sc.name_en)
                .input('sort_order', mssql_1.default.Int, sc.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM attractive_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO attractive_sub_categories ([key], name_en, sort_order)
            VALUES (@key, @name_en, @sort_order)
          END
        `);
        }
        console.log('✅ Attractive sub-categories seeded\n');
        // ============================================
        // 3. SEED ATTRACTIVE METRICS
        // ============================================
        console.log('Seeding Attractive metrics...');
        const attractiveMetrics = [
            { no: '1', measurement: 'Direct', unit: 'Hrs/Month', main: 'PE', main_relate: 'All', fy25_target: '3,500 (33%)', description: 'Non-value work reduction', sub_category_key: 'non_value_reduction' },
            { no: '2', measurement: 'Indirect', unit: 'Hrs', main: 'INN', main_relate: 'All', fy25_target: '42,350 (10%)', description: 'Non-value work reduction', sub_category_key: 'non_value_reduction' },
            { no: '3', measurement: '-', unit: 'Project', main: 'INN', main_relate: 'All', fy25_target: '70', description: 'Projects with Universities', sub_category_key: 'university_projects' },
        ];
        for (const m of attractiveMetrics) {
            const subCatResult = await pool.request()
                .input('key', mssql_1.default.NVarChar, m.sub_category_key)
                .query(`SELECT id FROM attractive_sub_categories WHERE [key] = @key`);
            if (subCatResult.recordset.length > 0) {
                await pool.request()
                    .input('no', mssql_1.default.NVarChar, m.no)
                    .input('measurement', mssql_1.default.NVarChar, m.measurement)
                    .input('unit', mssql_1.default.NVarChar, m.unit)
                    .input('main', mssql_1.default.NVarChar, m.main)
                    .input('main_relate', mssql_1.default.NVarChar, m.main_relate)
                    .input('fy25_target', mssql_1.default.NVarChar, m.fy25_target)
                    .input('description', mssql_1.default.NVarChar, m.description)
                    .input('sub_category_id', mssql_1.default.Int, subCatResult.recordset[0].id)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM attractive_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO attractive_metrics (no, measurement, unit, main, main_relate, fy25_target, description_of_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @description, @sub_category_id)
            END
          `);
            }
        }
        console.log('✅ Attractive metrics seeded\n');
        // ============================================
        // 4. SEED ATTRACTIVE DATA ENTRIES (FY25)
        // ============================================
        console.log('Seeding Attractive data entries...');
        const attractiveEntries = [
            // Non-value work reduction - Direct (metric no 1)
            { month: 'Apr-25', target: '0.00', result: '0.00', accu_target: '0.00', accu_result: '0.00', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'May-25', target: '0.00', result: '0.00', accu_target: '0.00', accu_result: '0.00', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Jun-25', target: '0.00', result: '0.00', accu_target: '0.00', accu_result: '0.00', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Jul-25', target: '0.00', result: '0.00', accu_target: '0.00', accu_result: '0.00', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Aug-25', target: '15.45', result: '131.4', accu_target: '15.45', accu_result: '131.4', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Sep-25', target: '245.35', result: '100', accu_target: '260.80', accu_result: '231.40', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Oct-25', target: '509.16', result: '810.00', accu_target: '769.96', accu_result: '1,041.40', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Nov-25', target: '338.12', result: '346.20', accu_target: '1108.08', accu_result: '1,108.08', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Dec-25', target: '418.73', result: '419.12', accu_target: '1526.81', accu_result: '1527.20', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Jan-26', target: '379.54', result: '379.70', accu_target: '1906.35', accu_result: '1906.90', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Feb-26', target: '1122.77', result: '401.33', accu_target: '3029.12', accu_result: '2308.23', metric_no: '1', sub_category_key: 'non_value_reduction' },
            { month: 'Mar-26', target: '621.70', result: '', accu_target: '3650.82', accu_result: '', metric_no: '1', sub_category_key: 'non_value_reduction' },
            // Non-value work reduction - Indirect (metric no 2)
            { month: 'Apr-25', target: '350', result: '150', accu_target: '350', accu_result: '150', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'May-25', target: '500', result: '500', accu_target: '850', accu_result: '650', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Jun-25', target: '1000', result: '1500', accu_target: '1850.00', accu_result: '2150.00', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Jul-25', target: '1500', result: '1650.00', accu_target: '3350.00', accu_result: '3800.00', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Aug-25', target: '2000', result: '1740.00', accu_target: '5350.00', accu_result: '5540.00', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Sep-25', target: '4000.00', result: '2044', accu_target: '9350.00', accu_result: '7584', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Oct-25', target: '4500', result: '3670.00', accu_target: '13850.00', accu_result: '11,254.00', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Nov-25', target: '5000', result: '3076', accu_target: '18850', accu_result: '14330', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Dec-25', target: '5000', result: '5941', accu_target: '23850', accu_result: '17195', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Jan-26', target: '5000', result: '4632.00', accu_target: '28850.00', accu_result: '18962', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Feb-26', target: '6500', result: '6320.00', accu_target: '35350.00', accu_result: '25282', metric_no: '2', sub_category_key: 'non_value_reduction' },
            { month: 'Mar-26', target: '7000', result: '', accu_target: '42350.00', accu_result: '', metric_no: '2', sub_category_key: 'non_value_reduction' },
            // University Projects (metric no 3)
            { month: 'Apr-25', target: '4', result: '4', accu_target: '4', accu_result: '4', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'May-25', target: '4', result: '4', accu_target: '8', accu_result: '8', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Jun-25', target: '8', result: '8', accu_target: '16', accu_result: '16', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Jul-25', target: '3', result: '3', accu_target: '19', accu_result: '19', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Aug-25', target: '3', result: '3', accu_target: '22', accu_result: '22', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Sep-25', target: '6', result: '6', accu_target: '28', accu_result: '28', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Oct-25', target: '7', result: '7', accu_target: '35', accu_result: '35', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Nov-25', target: '7', result: '7', accu_target: '42', accu_result: '42', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Dec-25', target: '7', result: '7', accu_target: '49', accu_result: '49.00', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Jan-26', target: '7', result: '7', accu_target: '56', accu_result: '56.00', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Feb-26', target: '7', result: '7', accu_target: '63', accu_result: '63', metric_no: '3', sub_category_key: 'university_projects' },
            { month: 'Mar-26', target: '7', result: '', accu_target: '70', accu_result: '', metric_no: '3', sub_category_key: 'university_projects' },
        ];
        for (const entry of attractiveEntries) {
            const metricResult = await pool.request()
                .input('no', mssql_1.default.NVarChar, entry.metric_no)
                .input('sub_category_key', mssql_1.default.NVarChar, entry.sub_category_key)
                .query(`
          SELECT m.id FROM attractive_metrics m
          INNER JOIN attractive_sub_categories sc ON m.sub_category_id = sc.id
          WHERE m.no = @no AND sc.[key] = @sub_category_key
        `);
            if (metricResult.recordset.length > 0) {
                await pool.request()
                    .input('metric_id', mssql_1.default.Int, metricResult.recordset[0].id)
                    .input('month', mssql_1.default.NVarChar, entry.month)
                    .input('year', mssql_1.default.Int, 2025)
                    .input('target', mssql_1.default.NVarChar, entry.target)
                    .input('result', mssql_1.default.NVarChar, entry.result)
                    .input('accu_target', mssql_1.default.NVarChar, entry.accu_target)
                    .input('accu_result', mssql_1.default.NVarChar, entry.accu_result)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM attractive_data_entries WHERE metric_id = @metric_id AND month = @month AND year = @year)
            BEGIN
              INSERT INTO attractive_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
            END
          `);
            }
        }
        console.log('✅ Attractive data entries seeded\n');
        // ============================================
        // 5. SEED ENVIRONMENT SUB-CATEGORIES
        // ============================================
        console.log('Seeding Environment sub-categories...');
        const environmentSubCategories = [
            { key: 'energy', name_en: 'Energy', sort_order: 1 },
            { key: 'water', name_en: 'Water', sort_order: 2 },
            { key: 'waste', name_en: 'Waste', sort_order: 3 },
        ];
        for (const sc of environmentSubCategories) {
            await pool.request()
                .input('key', mssql_1.default.NVarChar, sc.key)
                .input('name_en', mssql_1.default.NVarChar, sc.name_en)
                .input('sort_order', mssql_1.default.Int, sc.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM environment_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO environment_sub_categories ([key], name_en, sort_order)
            VALUES (@key, @name_en, @sort_order)
          END
        `);
        }
        console.log('✅ Environment sub-categories seeded\n');
        // ============================================
        // 6. SEED ENVIRONMENT METRICS
        // ============================================
        console.log('Seeding Environment metrics...');
        const environmentMetrics = [
            { no: '1', measurement: 'CO2 emission', unit: 'ton', main: 'MT', main_relate: 'All', fy25_target: '<40,244', description: 'CO2 emission', sub_category_key: 'energy' },
            { no: '2', measurement: 'CO2 basic unit', unit: '%', main: 'MT', main_relate: 'All', fy25_target: '-2% FY24', description: '-2% FY24 (2.45 Ton/VAP-MB)', sub_category_key: 'energy' },
            { no: '3', measurement: 'Energy saving', unit: '%', main: 'MT', main_relate: 'PD,PE,SE', fy25_target: '-7% FY24', description: 'Energy saving', sub_category_key: 'energy' },
            { no: '4', measurement: 'Energy saving', unit: 'ton', main: 'MT', main_relate: 'PD,PE,SE', fy25_target: '-7% FY24 (3,020 Ton)', description: 'Energy saving', sub_category_key: 'energy' },
            { no: '5', measurement: 'Energy saving day', unit: 'Day', main: 'MT', main_relate: 'All', fy25_target: '39', description: 'Energy saving day', sub_category_key: 'energy' },
            { no: '6', measurement: 'Energy cost', unit: 'MB', main: 'MT', main_relate: 'All', fy25_target: '<263.314', description: 'Energy cost (Electricity + Natural gas +N2)', sub_category_key: 'energy' },
            { no: '7', measurement: 'Water usage', unit: 'm3', main: 'MT', main_relate: 'All', fy25_target: '<306,790', description: 'Water usage', sub_category_key: 'water' },
            { no: '8', measurement: 'Water reduction', unit: '%', main: 'MT', main_relate: 'PD,PE,GA,SE', fy25_target: '-1% FY24', description: '-1% FY24 (17.05 Ton/VAP-MB)', sub_category_key: 'water' },
            { no: '9', measurement: 'Water cost', unit: 'MB', main: 'MT', main_relate: 'All', fy25_target: '<10.43', description: 'Water cost (Water treatment + Wastewater)', sub_category_key: 'water' },
            { no: '10', measurement: 'Waste reduction', unit: 'Ton/VAP-MB', main: 'SE', main_relate: 'PD,PE', fy25_target: '-1% FY24', description: '-1% FY24 (0.1920 Ton/VAP-MB)', sub_category_key: 'waste' },
            { no: '11', measurement: 'Waste reduction', unit: 'Ton', main: 'SE', main_relate: 'PD,PE', fy25_target: '< 3,298 Tons', description: '< 3,298 Tons', sub_category_key: 'waste' },
        ];
        for (const m of environmentMetrics) {
            const subCatResult = await pool.request()
                .input('key', mssql_1.default.NVarChar, m.sub_category_key)
                .query(`SELECT id FROM environment_sub_categories WHERE [key] = @key`);
            if (subCatResult.recordset.length > 0) {
                await pool.request()
                    .input('no', mssql_1.default.NVarChar, m.no)
                    .input('measurement', mssql_1.default.NVarChar, m.measurement)
                    .input('unit', mssql_1.default.NVarChar, m.unit)
                    .input('main', mssql_1.default.NVarChar, m.main)
                    .input('main_relate', mssql_1.default.NVarChar, m.main_relate)
                    .input('fy25_target', mssql_1.default.NVarChar, m.fy25_target)
                    .input('description', mssql_1.default.NVarChar, m.description)
                    .input('sub_category_id', mssql_1.default.Int, subCatResult.recordset[0].id)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM environment_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO environment_metrics (no, measurement, unit, main, main_relate, fy25_target, description_of_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @description, @sub_category_id)
            END
          `);
            }
        }
        console.log('✅ Environment metrics seeded\n');
        // ============================================
        // 7. SEED ENVIRONMENT DATA ENTRIES (FY25)
        // ============================================
        console.log('Seeding Environment data entries...');
        const environmentEntries = [
            // CO2 emission (metric no 1)
            { month: 'Apr-25', target: '2,986', result: '2,793', accu_target: '2,986', accu_result: '2,793', metric_no: '1', sub_category_key: 'energy' },
            { month: 'May-25', target: '3,655', result: '3,988', accu_target: '6,641', accu_result: '6,781', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Jun-25', target: '3,369', result: '3,709', accu_target: '10,010', accu_result: '10,490', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Jul-25', target: '3,278', result: '3,564', accu_target: '13,288', accu_result: '14,054', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Aug-25', target: '3,527', result: '3,626', accu_target: '16,815', accu_result: '17,680', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Sep-25', target: '3,713', result: '3,477', accu_target: '20,528', accu_result: '21,157', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Oct-25', target: '3,406', result: '3,204', accu_target: '23,934', accu_result: '24,361', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Nov-25', target: '3,664', result: '3,701', accu_target: '27,598', accu_result: '28,062', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Dec-25', target: '3,099', result: '2,928', accu_target: '30,697', accu_result: '30,990', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Jan-26', target: '2,767', result: '2,909', accu_target: '33,464', accu_result: '33,898', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Feb-26', target: '3,171', result: '3,598', accu_target: '36,635', accu_result: '37,494', metric_no: '1', sub_category_key: 'energy' },
            { month: 'Mar-26', target: '3,609', result: '', accu_target: '40,244', accu_result: '', metric_no: '1', sub_category_key: 'energy' },
            // Energy saving day (metric no 5)
            { month: 'Apr-25', target: '6', result: '5', accu_target: '6', accu_result: '5', metric_no: '5', sub_category_key: 'energy' },
            { month: 'May-25', target: '3', result: '0', accu_target: '9', accu_result: '5', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Jun-25', target: '3', result: '0', accu_target: '12', accu_result: '5', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Jul-25', target: '4', result: '1', accu_target: '16', accu_result: '6', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Aug-25', target: '2', result: '0', accu_target: '18', accu_result: '6', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Sep-25', target: '2', result: '0', accu_target: '20', accu_result: '6', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Oct-25', target: '3', result: '3', accu_target: '23', accu_result: '9', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Nov-25', target: '2', result: '2', accu_target: '25', accu_result: '11', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Dec-25', target: '7', result: '7', accu_target: '32', accu_result: '18', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Jan-26', target: '3', result: '3', accu_target: '35', accu_result: '21', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Feb-26', target: '2', result: '2', accu_target: '37', accu_result: '23', metric_no: '5', sub_category_key: 'energy' },
            { month: 'Mar-26', target: '2', result: '', accu_target: '39', accu_result: '', metric_no: '5', sub_category_key: 'energy' },
            // Energy cost (metric no 6)
            { month: 'Apr-25', target: '17.8', result: '18.3', accu_target: '17.8', accu_result: '18.3', metric_no: '6', sub_category_key: 'energy' },
            { month: 'May-25', target: '21.4', result: '24.1', accu_target: '39.2', accu_result: '42.4', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Jun-25', target: '21', result: '23', accu_target: '60', accu_result: '66', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Jul-25', target: '20.6', result: '22.1', accu_target: '80.7', accu_result: '87.6', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Aug-25', target: '21.4', result: '22.7', accu_target: '102.1', accu_result: '110.3', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Sep-25', target: '22.7', result: '21.3', accu_target: '124.8', accu_result: '131.6', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Oct-25', target: '24.2', result: '19.3', accu_target: '149.0', accu_result: '150.9', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Nov-25', target: '24.2', result: '21.6', accu_target: '173.2', accu_result: '172.5', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Dec-25', target: '22.0', result: '16.5', accu_target: '195.2', accu_result: '189.1', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Jan-26', target: '22.0', result: '16.3', accu_target: '217.1', accu_result: '205.4', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Feb-26', target: '20.9', result: '20.8', accu_target: '238.0', accu_result: '226.2', metric_no: '6', sub_category_key: 'energy' },
            { month: 'Mar-26', target: '25.3', result: '', accu_target: '263.3', accu_result: '', metric_no: '6', sub_category_key: 'energy' },
            // Water usage (metric no 7)
            { month: 'Apr-25', target: '23,223', result: '18,296', accu_target: '23,223', accu_result: '18,296', metric_no: '7', sub_category_key: 'water' },
            { month: 'May-25', target: '23,337', result: '22,866', accu_target: '46,560', accu_result: '41,162', metric_no: '7', sub_category_key: 'water' },
            { month: 'Jun-25', target: '25,735', result: '23,916', accu_target: '72,295', accu_result: '65,078', metric_no: '7', sub_category_key: 'water' },
            { month: 'Jul-25', target: '24,193', result: '21,452', accu_target: '96,488', accu_result: '86,530', metric_no: '7', sub_category_key: 'water' },
            { month: 'Aug-25', target: '25,498', result: '22,764', accu_target: '121,986', accu_result: '109,294', metric_no: '7', sub_category_key: 'water' },
            { month: 'Sep-25', target: '25,271', result: '25,515', accu_target: '147,257', accu_result: '134,809', metric_no: '7', sub_category_key: 'water' },
            { month: 'Oct-25', target: '27,345', result: '26,455', accu_target: '174,602', accu_result: '161,264', metric_no: '7', sub_category_key: 'water' },
            { month: 'Nov-25', target: '26,362', result: '27,970', accu_target: '200,964', accu_result: '189,234', metric_no: '7', sub_category_key: 'water' },
            { month: 'Dec-25', target: '23,721', result: '29,490', accu_target: '224,685', accu_result: '218,724', metric_no: '7', sub_category_key: 'water' },
            { month: 'Jan-26', target: '26,274', result: '22,398', accu_target: '250,959', accu_result: '241,122', metric_no: '7', sub_category_key: 'water' },
            { month: 'Feb-26', target: '25,286', result: '28,677', accu_target: '276,245', accu_result: '269,799', metric_no: '7', sub_category_key: 'water' },
            { month: 'Mar-26', target: '30,545', result: '', accu_target: '306,790', accu_result: '', metric_no: '7', sub_category_key: 'water' },
            // Water cost (metric no 9)
            { month: 'Apr-25', target: '0.79', result: '0.58', accu_target: '0.79', accu_result: '0.58', metric_no: '9', sub_category_key: 'water' },
            { month: 'May-25', target: '0.83', result: '0.79', accu_target: '1.62', accu_result: '1.37', metric_no: '9', sub_category_key: 'water' },
            { month: 'Jun-25', target: '0.74', result: '0.83', accu_target: '2.36', accu_result: '2.20', metric_no: '9', sub_category_key: 'water' },
            { month: 'Jul-25', target: '0.72', result: '0.73', accu_target: '3.08', accu_result: '2.93', metric_no: '9', sub_category_key: 'water' },
            { month: 'Aug-25', target: '0.67', result: '0.78', accu_target: '3.75', accu_result: '3.70', metric_no: '9', sub_category_key: 'water' },
            { month: 'Sep-25', target: '0.76', result: '0.89', accu_target: '4.51', accu_result: '4.60', metric_no: '9', sub_category_key: 'water' },
            { month: 'Oct-25', target: '1.03', result: '0.94', accu_target: '5.54', accu_result: '5.54', metric_no: '9', sub_category_key: 'water' },
            { month: 'Nov-25', target: '1.03', result: '1.00', accu_target: '6.58', accu_result: '6.54', metric_no: '9', sub_category_key: 'water' },
            { month: 'Dec-25', target: '0.94', result: '1.08', accu_target: '7.52', accu_result: '7.62', metric_no: '9', sub_category_key: 'water' },
            { month: 'Jan-26', target: '0.94', result: '0.78', accu_target: '8.46', accu_result: '8.40', metric_no: '9', sub_category_key: 'water' },
            { month: 'Feb-26', target: '0.89', result: '1.05', accu_target: '9.35', accu_result: '9.45', metric_no: '9', sub_category_key: 'water' },
            { month: 'Mar-26', target: '1.08', result: '', accu_target: '10.43', accu_result: '', metric_no: '9', sub_category_key: 'water' },
            // Waste reduction (metric no 11)
            { month: 'Apr-25', target: '260', result: '209', accu_target: '260', accu_result: '209', metric_no: '11', sub_category_key: 'waste' },
            { month: 'May-25', target: '262', result: '297', accu_target: '522', accu_result: '506', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Jun-25', target: '289', result: '248', accu_target: '811', accu_result: '754', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Jul-25', target: '272', result: '274', accu_target: '1,083', accu_result: '1,028', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Aug-25', target: '287', result: '271', accu_target: '1,370', accu_result: '1,299', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Sep-25', target: '284', result: '289', accu_target: '1,654', accu_result: '1,588', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Oct-25', target: '287', result: '284', accu_target: '1,941', accu_result: '1,872', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Nov-25', target: '270', result: '243', accu_target: '2,211', accu_result: '2,114', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Dec-25', target: '270', result: '271', accu_target: '2,481', accu_result: '2,386', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Jan-26', target: '269', result: '269', accu_target: '2,750', accu_result: '2,655', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Feb-26', target: '263', result: '267', accu_target: '3,013', accu_result: '2,922', metric_no: '11', sub_category_key: 'waste' },
            { month: 'Mar-26', target: '285', result: '', accu_target: '3,298', accu_result: '', metric_no: '11', sub_category_key: 'waste' },
        ];
        for (const entry of environmentEntries) {
            const metricResult = await pool.request()
                .input('no', mssql_1.default.NVarChar, entry.metric_no)
                .input('sub_category_key', mssql_1.default.NVarChar, entry.sub_category_key)
                .query(`
          SELECT m.id FROM environment_metrics m
          INNER JOIN environment_sub_categories sc ON m.sub_category_id = sc.id
          WHERE m.no = @no AND sc.[key] = @sub_category_key
        `);
            if (metricResult.recordset.length > 0) {
                await pool.request()
                    .input('metric_id', mssql_1.default.Int, metricResult.recordset[0].id)
                    .input('month', mssql_1.default.NVarChar, entry.month)
                    .input('year', mssql_1.default.Int, 2025)
                    .input('target', mssql_1.default.NVarChar, entry.target)
                    .input('result', mssql_1.default.NVarChar, entry.result)
                    .input('accu_target', mssql_1.default.NVarChar, entry.accu_target)
                    .input('accu_result', mssql_1.default.NVarChar, entry.accu_result)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM environment_data_entries WHERE metric_id = @metric_id AND month = @month AND year = @year)
            BEGIN
              INSERT INTO environment_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
            END
          `);
            }
        }
        console.log('✅ Environment data entries seeded\n');
        // ============================================
        // 8. SEED ATTRACTIVE BY DEPT SUB-CATEGORIES
        // ============================================
        console.log('Seeding Attractive by Department sub-categories...');
        const attractiveDeptSubCategories = [
            { key: 'non_value_reduction', name_en: 'Non-value work reduction', sort_order: 1 },
            { key: 'university_projects', name_en: 'Projects with Universities', sort_order: 2 },
        ];
        for (const sc of attractiveDeptSubCategories) {
            await pool.request()
                .input('key', mssql_1.default.NVarChar, sc.key)
                .input('name_en', mssql_1.default.NVarChar, sc.name_en)
                .input('sort_order', mssql_1.default.Int, sc.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM attractive_dept_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO attractive_dept_sub_categories ([key], name_en, sort_order)
            VALUES (@key, @name_en, @sort_order)
          END
        `);
        }
        console.log('✅ Attractive by Department sub-categories seeded\n');
        // ============================================
        // 9. SEED ENVIRONMENT BY DEPT SUB-CATEGORIES
        // ============================================
        console.log('Seeding Environment by Department sub-categories...');
        const environmentDeptSubCategories = [
            { key: 'energy', name_en: 'Energy', sort_order: 1 },
            { key: 'water', name_en: 'Water', sort_order: 2 },
            { key: 'waste', name_en: 'Waste', sort_order: 3 },
        ];
        for (const sc of environmentDeptSubCategories) {
            await pool.request()
                .input('key', mssql_1.default.NVarChar, sc.key)
                .input('name_en', mssql_1.default.NVarChar, sc.name_en)
                .input('sort_order', mssql_1.default.Int, sc.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM environment_dept_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO environment_dept_sub_categories ([key], name_en, sort_order)
            VALUES (@key, @name_en, @sort_order)
          END
        `);
        }
        console.log('✅ Environment by Department sub-categories seeded\n');
        console.log('========================================');
        console.log('🎉 Attractive & Environment KPI Seeding Completed Successfully!');
        console.log('========================================');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
// Run seeding
seedAttractiveEnvironment()
    .then(() => {
    console.log('\n✅ Seeding script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
});
