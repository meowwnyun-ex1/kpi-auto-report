"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
/**
 * Seed script for Compliance and HR KPI data
 * Populates tables with initial data from spreadsheet
 */
async function seedKpiCategories() {
    console.log('Starting KPI Categories Seeding...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. SEED COMPLIANCE SUB-CATEGORIES
        // ============================================
        console.log('Seeding Compliance sub-categories...');
        const complianceSubCategories = [
            { name_en: 'SHE', name_th: 'ความปลอดภัย อนามัย และสิ่งแวดล้อม', key: 'she', sort_order: 1 },
            { name_en: 'Security', name_th: 'ความมั่นคงปลอดภัย', key: 'security', sort_order: 2 },
            { name_en: 'Environment', name_th: 'สิ่งแวดล้อม', key: 'environment', sort_order: 3 },
            { name_en: 'Energy', name_th: 'พลังงาน', key: 'energy', sort_order: 4 },
            { name_en: '5S', name_th: '5S', key: '5s', sort_order: 5 },
        ];
        for (const subCat of complianceSubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('name_th', mssql_1.default.NVarChar, subCat.name_th)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM compliance_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO compliance_sub_categories (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ Compliance sub-categories seeded\n');
        // ============================================
        // 2. SEED COMPLIANCE METRICS
        // ============================================
        console.log('Seeding Compliance metrics...');
        // SHE Metrics
        const sheMetrics = [
            { no: '1', measurement: 'Number of accidents', unit: 'Case', fy25_target: '0', main: 'Safety', main_relate: 'SHE' },
            { no: '2', measurement: 'Number of fire incidents', unit: 'Case', fy25_target: '0', main: 'Safety', main_relate: 'SHE' },
            { no: '3', measurement: 'Number of lost time injury', unit: 'Case', fy25_target: '0', main: 'Safety', main_relate: 'SHE' },
            { no: '4', measurement: 'Lost Time Injury Frequency Rate (LTIFR)', unit: 'Case', fy25_target: '≤0.85', main: 'Safety', main_relate: 'SHE' },
            { no: '5', measurement: 'Number of dangerous occurrence', unit: 'Case', fy25_target: '0', main: 'Safety', main_relate: 'SHE' },
            { no: '6', measurement: 'Number of motor vehicle accidents', unit: 'Case', fy25_target: '0', main: 'Safety', main_relate: 'SHE' },
            { no: '7', measurement: 'Number of safety training', unit: 'Training', fy25_target: '≥12', main: 'Safety', main_relate: 'SHE' },
            { no: '8', measurement: 'Number of safety activity', unit: 'Activity', fy25_target: '≥12', main: 'Safety', main_relate: 'SHE' },
            { no: '9', measurement: 'Number of safety audit', unit: 'Audit', fy25_target: '≥4', main: 'Safety', main_relate: 'SHE' },
            { no: '10', measurement: 'Number of safety patrol', unit: 'Patrol', fy25_target: '≥48', main: 'Safety', main_relate: 'SHE' },
        ];
        for (const metric of sheMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'she')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM compliance_metrics m
            INNER JOIN compliance_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO compliance_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM compliance_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        // Security Metrics
        const securityMetrics = [
            { no: '1', measurement: 'Number of security incidents', unit: 'Case', fy25_target: '0', main: 'Security', main_relate: 'Security' },
            { no: '2', measurement: 'Number of security training', unit: 'Training', fy25_target: '≥4', main: 'Security', main_relate: 'Security' },
            { no: '3', measurement: 'Number of security audit', unit: 'Audit', fy25_target: '≥2', main: 'Security', main_relate: 'Security' },
            { no: '4', measurement: 'Number of security patrol', unit: 'Patrol', fy25_target: '≥365', main: 'Security', main_relate: 'Security' },
        ];
        for (const metric of securityMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'security')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM compliance_metrics m
            INNER JOIN compliance_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO compliance_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM compliance_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        // Environment Metrics
        const environmentMetrics = [
            { no: '1', measurement: 'Amount of waste disposal (Hazardous)', unit: 'Ton', fy25_target: '≤34', main: 'Environment', main_relate: 'Environment' },
            { no: '2', measurement: 'Amount of waste disposal (Non-Hazardous)', unit: 'Ton', fy25_target: '≤280', main: 'Environment', main_relate: 'Environment' },
            { no: '3', measurement: 'Amount of waste recycling', unit: 'Ton', fy25_target: '≥200', main: 'Environment', main_relate: 'Environment' },
            { no: '4', measurement: 'Waste recycling rate', unit: '%', fy25_target: '≥80', main: 'Environment', main_relate: 'Environment' },
            { no: '5', measurement: 'Number of environmental incidents', unit: 'Case', fy25_target: '0', main: 'Environment', main_relate: 'Environment' },
            { no: '6', measurement: 'Number of environmental training', unit: 'Training', fy25_target: '≥4', main: 'Environment', main_relate: 'Environment' },
            { no: '7', measurement: 'Number of environmental audit', unit: 'Audit', fy25_target: '≥2', main: 'Environment', main_relate: 'Environment' },
        ];
        for (const metric of environmentMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'environment')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM compliance_metrics m
            INNER JOIN compliance_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO compliance_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM compliance_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        // Energy Metrics
        const energyMetrics = [
            { no: '1', measurement: 'Electricity consumption', unit: 'kWh', fy25_target: '≤3,500,000', main: 'Energy', main_relate: 'Energy' },
            { no: '2', measurement: 'Electricity consumption per unit', unit: 'kWh/Unit', fy25_target: '≤0.85', main: 'Energy', main_relate: 'Energy' },
            { no: '3', measurement: 'Water consumption', unit: 'm³', fy25_target: '≤50,000', main: 'Energy', main_relate: 'Energy' },
            { no: '4', measurement: 'Water consumption per unit', unit: 'm³/Unit', fy25_target: '≤0.012', main: 'Energy', main_relate: 'Energy' },
            { no: '5', measurement: 'Gas consumption', unit: 'kg', fy25_target: '≤100,000', main: 'Energy', main_relate: 'Energy' },
        ];
        for (const metric of energyMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'energy')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM compliance_metrics m
            INNER JOIN compliance_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO compliance_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM compliance_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        // 5S Metrics
        const fiveSMetrics = [
            { no: '1', measurement: '5S audit score', unit: 'Score', fy25_target: '≥90', main: '5S', main_relate: '5S' },
            { no: '2', measurement: 'Number of 5S activity', unit: 'Activity', fy25_target: '≥12', main: '5S', main_relate: '5S' },
            { no: '3', measurement: 'Number of 5S training', unit: 'Training', fy25_target: '≥4', main: '5S', main_relate: '5S' },
            { no: '4', measurement: 'Number of 5S audit', unit: 'Audit', fy25_target: '≥12', main: '5S', main_relate: '5S' },
        ];
        for (const metric of fiveSMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, '5s')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM compliance_metrics m
            INNER JOIN compliance_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO compliance_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM compliance_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        console.log('✅ Compliance metrics seeded\n');
        // ============================================
        // 3. SEED HR SUB-CATEGORIES
        // ============================================
        console.log('Seeding HR sub-categories...');
        const hrSubCategories = [
            { name_en: 'Training', name_th: 'การฝึกอบรม', key: 'training', sort_order: 1 },
            { name_en: 'Engagement', name_th: 'การมีส่วนร่วม', key: 'engagement', sort_order: 2 },
            { name_en: 'Development', name_th: 'การพัฒนา', key: 'development', sort_order: 3 },
            { name_en: 'Welfare', name_th: 'สวัสดิการ', key: 'welfare', sort_order: 4 },
        ];
        for (const subCat of hrSubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('name_th', mssql_1.default.NVarChar, subCat.name_th)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM hr_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO hr_sub_categories (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ HR sub-categories seeded\n');
        // ============================================
        // 4. SEED HR METRICS
        // ============================================
        console.log('Seeding HR metrics...');
        // Training Metrics
        const trainingMetrics = [
            { no: '1', measurement: 'Training hours per employee', unit: 'Hours', fy25_target: '≥40', main: 'Training', main_relate: 'Training' },
            { no: '2', measurement: 'Training completion rate', unit: '%', fy25_target: '≥95', main: 'Training', main_relate: 'Training' },
            { no: '3', measurement: 'Number of training programs', unit: 'Program', fy25_target: '≥50', main: 'Training', main_relate: 'Training' },
            { no: '4', measurement: 'Training effectiveness score', unit: 'Score', fy25_target: '≥4.0', main: 'Training', main_relate: 'Training' },
            { no: '5', measurement: 'Training budget utilization', unit: '%', fy25_target: '≥90', main: 'Training', main_relate: 'Training' },
        ];
        for (const metric of trainingMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'training')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM hr_metrics m
            INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO hr_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM hr_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        // Engagement Metrics
        const engagementMetrics = [
            { no: '1', measurement: 'Employee engagement score', unit: 'Score', fy25_target: '≥4.0', main: 'Engagement', main_relate: 'Engagement' },
            { no: '2', measurement: 'Employee satisfaction score', unit: 'Score', fy25_target: '≥4.0', main: 'Engagement', main_relate: 'Engagement' },
            { no: '3', measurement: 'Employee turnover rate', unit: '%', fy25_target: '≤5', main: 'Engagement', main_relate: 'Engagement' },
            { no: '4', measurement: 'Number of employee activities', unit: 'Activity', fy25_target: '≥12', main: 'Engagement', main_relate: 'Engagement' },
            { no: '5', measurement: 'Employee suggestion rate', unit: 'Suggestion/Employee', fy25_target: '≥2', main: 'Engagement', main_relate: 'Engagement' },
        ];
        for (const metric of engagementMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'engagement')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM hr_metrics m
            INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO hr_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM hr_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        // Development Metrics
        const developmentMetrics = [
            { no: '1', measurement: 'Number of promotions', unit: 'Person', fy25_target: '≥20', main: 'Development', main_relate: 'Development' },
            { no: '2', measurement: 'Career development plan completion', unit: '%', fy25_target: '≥90', main: 'Development', main_relate: 'Development' },
            { no: '3', measurement: 'Number of internal transfers', unit: 'Person', fy25_target: '≥10', main: 'Development', main_relate: 'Development' },
            { no: '4', measurement: 'Skill assessment completion rate', unit: '%', fy25_target: '≥95', main: 'Development', main_relate: 'Development' },
        ];
        for (const metric of developmentMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'development')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM hr_metrics m
            INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO hr_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM hr_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        // Welfare Metrics
        const welfareMetrics = [
            { no: '1', measurement: 'Employee health checkup rate', unit: '%', fy25_target: '≥95', main: 'Welfare', main_relate: 'Welfare' },
            { no: '2', measurement: 'Number of welfare activities', unit: 'Activity', fy25_target: '≥12', main: 'Welfare', main_relate: 'Welfare' },
            { no: '3', measurement: 'Welfare satisfaction score', unit: 'Score', fy25_target: '≥4.0', main: 'Welfare', main_relate: 'Welfare' },
            { no: '4', measurement: 'Number of employee benefits utilized', unit: 'Benefit', fy25_target: '≥10', main: 'Welfare', main_relate: 'Welfare' },
        ];
        for (const metric of welfareMetrics) {
            await pool.request()
                .input('no', mssql_1.default.NVarChar, metric.no)
                .input('measurement', mssql_1.default.NVarChar, metric.measurement)
                .input('unit', mssql_1.default.NVarChar, metric.unit)
                .input('fy25_target', mssql_1.default.NVarChar, metric.fy25_target)
                .input('main', mssql_1.default.NVarChar, metric.main)
                .input('main_relate', mssql_1.default.NVarChar, metric.main_relate)
                .input('sub_category_key', mssql_1.default.NVarChar, 'welfare')
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM hr_metrics m
            INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key
          )
          BEGIN
            INSERT INTO hr_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id
            FROM hr_sub_categories sc
            WHERE sc.[key] = @sub_category_key
          END
        `);
        }
        console.log('✅ HR metrics seeded\n');
        // ============================================
        // 5. SEED DEPARTMENTS
        // ============================================
        console.log('Seeding departments...');
        const departments = [
            { name_en: 'Production', name_th: 'การผลิต', key: 'production', sort_order: 1 },
            { name_en: 'Quality Assurance', name_th: 'การควบคุมคุณภาพ', key: 'qa', sort_order: 2 },
            { name_en: 'Engineering', name_th: 'วิศวกรรม', key: 'engineering', sort_order: 3 },
            { name_en: 'Maintenance', name_th: 'ซ่อมบำรุง', key: 'maintenance', sort_order: 4 },
            { name_en: 'Warehouse', name_th: 'คลังสินค้า', key: 'warehouse', sort_order: 5 },
            { name_en: 'HR & Admin', name_th: 'ทรัพยากรบุคคลและธุรการ', key: 'hr_admin', sort_order: 6 },
            { name_en: 'Finance', name_th: 'การเงิน', key: 'finance', sort_order: 7 },
            { name_en: 'Purchasing', name_th: 'จัดซื้อ', key: 'purchasing', sort_order: 8 },
        ];
        for (const dept of departments) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, dept.name_en)
                .input('name_th', mssql_1.default.NVarChar, dept.name_th)
                .input('key', mssql_1.default.NVarChar, dept.key)
                .input('sort_order', mssql_1.default.Int, dept.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM departments WHERE [key] = @key)
          BEGIN
            INSERT INTO departments (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ Departments seeded\n');
        // ============================================
        // 6. SEED HR DEPT SUB-CATEGORIES
        // ============================================
        console.log('Seeding HR Department sub-categories...');
        const hrDeptSubCategories = [
            { name_en: 'Training', name_th: 'การฝึกอบรม', key: 'training', sort_order: 1 },
            { name_en: 'Engagement', name_th: 'การมีส่วนร่วม', key: 'engagement', sort_order: 2 },
            { name_en: 'Performance', name_th: 'ผลการปฏิบัติงาน', key: 'performance', sort_order: 3 },
        ];
        for (const subCat of hrDeptSubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('name_th', mssql_1.default.NVarChar, subCat.name_th)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM hr_dept_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO hr_dept_sub_categories (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ HR Department sub-categories seeded\n');
        // ============================================
        // 7. SEED HR DEPT METRICS (Sample for each department)
        // ============================================
        console.log('Seeding HR Department metrics...');
        // For each department, add training and engagement metrics
        for (const dept of departments) {
            // Training metrics per department
            await pool.request()
                .input('no', mssql_1.default.NVarChar, '1')
                .input('measurement', mssql_1.default.NVarChar, 'Training hours per employee')
                .input('unit', mssql_1.default.NVarChar, 'Hours')
                .input('fy25_target', mssql_1.default.NVarChar, '≥40')
                .input('main', mssql_1.default.NVarChar, 'Training')
                .input('main_relate', mssql_1.default.NVarChar, 'Training')
                .input('sub_category_key', mssql_1.default.NVarChar, 'training')
                .input('department_key', mssql_1.default.NVarChar, dept.key)
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM hr_dept_metrics m
            INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
            INNER JOIN departments d ON m.department_id = d.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key AND d.[key] = @department_key
          )
          BEGIN
            INSERT INTO hr_dept_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id, department_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id, d.id
            FROM hr_dept_sub_categories sc, departments d
            WHERE sc.[key] = @sub_category_key AND d.[key] = @department_key
          END
        `);
            // Engagement metrics per department
            await pool.request()
                .input('no', mssql_1.default.NVarChar, '1')
                .input('measurement', mssql_1.default.NVarChar, 'Employee engagement score')
                .input('unit', mssql_1.default.NVarChar, 'Score')
                .input('fy25_target', mssql_1.default.NVarChar, '≥4.0')
                .input('main', mssql_1.default.NVarChar, 'Engagement')
                .input('main_relate', mssql_1.default.NVarChar, 'Engagement')
                .input('sub_category_key', mssql_1.default.NVarChar, 'engagement')
                .input('department_key', mssql_1.default.NVarChar, dept.key)
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM hr_dept_metrics m
            INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
            INNER JOIN departments d ON m.department_id = d.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key AND d.[key] = @department_key
          )
          BEGIN
            INSERT INTO hr_dept_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id, department_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id, d.id
            FROM hr_dept_sub_categories sc, departments d
            WHERE sc.[key] = @sub_category_key AND d.[key] = @department_key
          END
        `);
            // Performance metrics per department
            await pool.request()
                .input('no', mssql_1.default.NVarChar, '1')
                .input('measurement', mssql_1.default.NVarChar, 'Department performance score')
                .input('unit', mssql_1.default.NVarChar, 'Score')
                .input('fy25_target', mssql_1.default.NVarChar, '≥85')
                .input('main', mssql_1.default.NVarChar, 'Performance')
                .input('main_relate', mssql_1.default.NVarChar, 'Performance')
                .input('sub_category_key', mssql_1.default.NVarChar, 'performance')
                .input('department_key', mssql_1.default.NVarChar, dept.key)
                .query(`
          IF NOT EXISTS (
            SELECT 1 FROM hr_dept_metrics m
            INNER JOIN hr_dept_sub_categories sc ON m.sub_category_id = sc.id
            INNER JOIN departments d ON m.department_id = d.id
            WHERE m.no = @no AND sc.[key] = @sub_category_key AND d.[key] = @department_key
          )
          BEGIN
            INSERT INTO hr_dept_metrics (no, measurement, unit, fy25_target, main, main_relate, sub_category_id, department_id)
            SELECT @no, @measurement, @unit, @fy25_target, @main, @main_relate, sc.id, d.id
            FROM hr_dept_sub_categories sc, departments d
            WHERE sc.[key] = @sub_category_key AND d.[key] = @department_key
          END
        `);
        }
        console.log('✅ HR Department metrics seeded\n');
        // ============================================
        // 8. SEED SAMPLE DATA ENTRIES
        // ============================================
        console.log('Seeding sample data entries...');
        // Seed sample data for Compliance metrics (FY25 Apr)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Get all compliance metrics
        const complianceMetricsResult = await pool.request().query(`
      SELECT m.id, m.fy25_target, sc.[key] as sub_category_key
      FROM compliance_metrics m
      INNER JOIN compliance_sub_categories sc ON m.sub_category_id = sc.id
    `);
        // Seed sample data for first 4 months of FY25
        for (const metric of complianceMetricsResult.recordset) {
            for (let i = 0; i < 4; i++) {
                const month = months[i];
                const target = metric.fy25_target?.replace(/[≥≤]/g, '').trim() || '0';
                await pool.request()
                    .input('metric_id', mssql_1.default.Int, metric.id)
                    .input('month', mssql_1.default.NVarChar, month)
                    .input('year', mssql_1.default.Int, 2025)
                    .input('target', mssql_1.default.NVarChar, target)
                    .input('result', mssql_1.default.NVarChar, target) // Same as target for sample
                    .input('accu_target', mssql_1.default.NVarChar, target)
                    .input('accu_result', mssql_1.default.NVarChar, target)
                    .query(`
            IF NOT EXISTS (
              SELECT 1 FROM compliance_data_entries 
              WHERE metric_id = @metric_id AND month = @month AND year = @year
            )
            BEGIN
              INSERT INTO compliance_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
            END
          `);
            }
        }
        // Get all HR metrics
        const hrMetricsResult = await pool.request().query(`
      SELECT m.id, m.fy25_target, sc.[key] as sub_category_key
      FROM hr_metrics m
      INNER JOIN hr_sub_categories sc ON m.sub_category_id = sc.id
    `);
        // Seed sample data for HR metrics
        for (const metric of hrMetricsResult.recordset) {
            for (let i = 0; i < 4; i++) {
                const month = months[i];
                const target = metric.fy25_target?.replace(/[≥≤]/g, '').trim() || '0';
                await pool.request()
                    .input('metric_id', mssql_1.default.Int, metric.id)
                    .input('month', mssql_1.default.NVarChar, month)
                    .input('year', mssql_1.default.Int, 2025)
                    .input('target', mssql_1.default.NVarChar, target)
                    .input('result', mssql_1.default.NVarChar, target)
                    .input('accu_target', mssql_1.default.NVarChar, target)
                    .input('accu_result', mssql_1.default.NVarChar, target)
                    .query(`
            IF NOT EXISTS (
              SELECT 1 FROM hr_data_entries 
              WHERE metric_id = @metric_id AND month = @month AND year = @year
            )
            BEGIN
              INSERT INTO hr_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
            END
          `);
            }
        }
        // Get all HR Dept metrics
        const hrDeptMetricsResult = await pool.request().query(`
      SELECT m.id, m.fy25_target
      FROM hr_dept_metrics m
    `);
        // Seed sample data for HR Dept metrics
        for (const metric of hrDeptMetricsResult.recordset) {
            for (let i = 0; i < 4; i++) {
                const month = months[i];
                const target = metric.fy25_target?.replace(/[≥≤]/g, '').trim() || '0';
                await pool.request()
                    .input('metric_id', mssql_1.default.Int, metric.id)
                    .input('month', mssql_1.default.NVarChar, month)
                    .input('year', mssql_1.default.Int, 2025)
                    .input('target', mssql_1.default.NVarChar, target)
                    .input('result', mssql_1.default.NVarChar, target)
                    .input('accu_target', mssql_1.default.NVarChar, target)
                    .input('accu_result', mssql_1.default.NVarChar, target)
                    .query(`
            IF NOT EXISTS (
              SELECT 1 FROM hr_dept_data_entries 
              WHERE metric_id = @metric_id AND month = @month AND year = @year
            )
            BEGIN
              INSERT INTO hr_dept_data_entries (metric_id, month, year, target, result, accu_target, accu_result)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result)
            END
          `);
            }
        }
        console.log('✅ Sample data entries seeded\n');
        console.log('========================================');
        console.log('🎉 KPI Categories Seeding Completed Successfully!');
        console.log('========================================');
        // Summary
        const summary = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM compliance_sub_categories) as compliance_sub_categories,
        (SELECT COUNT(*) FROM compliance_metrics) as compliance_metrics,
        (SELECT COUNT(*) FROM compliance_data_entries) as compliance_entries,
        (SELECT COUNT(*) FROM hr_sub_categories) as hr_sub_categories,
        (SELECT COUNT(*) FROM hr_metrics) as hr_metrics,
        (SELECT COUNT(*) FROM hr_data_entries) as hr_entries,
        (SELECT COUNT(*) FROM departments) as departments,
        (SELECT COUNT(*) FROM hr_dept_sub_categories) as hr_dept_sub_categories,
        (SELECT COUNT(*) FROM hr_dept_metrics) as hr_dept_metrics,
        (SELECT COUNT(*) FROM hr_dept_data_entries) as hr_dept_entries
    `);
        console.log('\nData summary:');
        console.log(`  - Compliance Sub-Categories: ${summary.recordset[0].compliance_sub_categories}`);
        console.log(`  - Compliance Metrics: ${summary.recordset[0].compliance_metrics}`);
        console.log(`  - Compliance Data Entries: ${summary.recordset[0].compliance_entries}`);
        console.log(`  - HR Sub-Categories: ${summary.recordset[0].hr_sub_categories}`);
        console.log(`  - HR Metrics: ${summary.recordset[0].hr_metrics}`);
        console.log(`  - HR Data Entries: ${summary.recordset[0].hr_entries}`);
        console.log(`  - Departments: ${summary.recordset[0].departments}`);
        console.log(`  - HR Dept Sub-Categories: ${summary.recordset[0].hr_dept_sub_categories}`);
        console.log(`  - HR Dept Metrics: ${summary.recordset[0].hr_dept_metrics}`);
        console.log(`  - HR Dept Data Entries: ${summary.recordset[0].hr_dept_entries}`);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
// Run seeding
seedKpiCategories()
    .then(() => {
    console.log('\n✅ Seeding script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
});
