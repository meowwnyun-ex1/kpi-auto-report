"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function seedAttractiveComplete() {
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
    console.log('🔄 Seeding Attractive KPI complete data...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await pool.request().query(`DELETE FROM attractive_department_entries`);
    await pool.request().query(`DELETE FROM attractive_data_entries`);
    await pool.request().query(`DELETE FROM attractive_metrics`);
    await pool.request().query(`DELETE FROM attractive_sub_categories`);
    await pool.request().query(`DELETE FROM attractive_departments`);
    console.log('✅ Existing data cleared\n');
    // Seed sub-categories
    console.log('🔄 Seeding Attractive sub-categories...');
    const subCategories = [
        { name_en: 'Non-value work reduction', key: 'non_value_reduction', sort_order: 1 },
        { name_en: 'Projects with Universities', key: 'university_projects', sort_order: 2 },
    ];
    for (const cat of subCategories) {
        await pool
            .request()
            .input('name_en', mssql_1.default.NVarChar, cat.name_en)
            .input('key', mssql_1.default.NVarChar, cat.key)
            .input('sort_order', mssql_1.default.Int, cat.sort_order).query(`
        INSERT INTO attractive_sub_categories (name_en, [key], sort_order)
        VALUES (@name_en, @key, @sort_order)
      `);
    }
    console.log('✅ Sub-categories seeded\n');
    // Seed departments
    console.log('🔄 Seeding Attractive departments...');
    const departments = [
        { name: 'Pump/M', key: 'pump_m', sort_order: 1 },
        { name: 'Pump/A', key: 'pump_a', sort_order: 2 },
        { name: 'Rail', key: 'rail', sort_order: 3 },
        { name: 'INJ/M', key: 'inj_m', sort_order: 4 },
        { name: 'INJ/A', key: 'inj_a', sort_order: 5 },
        { name: 'Valve', key: 'valve', sort_order: 6 },
        { name: 'SOL', key: 'sol', sort_order: 7 },
        { name: 'UC/M', key: 'uc_m', sort_order: 8 },
        { name: 'UC/A', key: 'uc_a', sort_order: 9 },
        { name: 'GDP', key: 'gdp', sort_order: 10 },
        { name: 'SIFS/DF', key: 'sifs_df', sort_order: 11 },
        { name: 'TIE', key: 'tie', sort_order: 12 },
        { name: 'WH', key: 'wh', sort_order: 13 },
        { name: 'MT', key: 'mt', sort_order: 14 },
        { name: 'QA', key: 'qa', sort_order: 15 },
        { name: 'QC', key: 'qc', sort_order: 16 },
        { name: 'ADM', key: 'adm', sort_order: 17 },
        { name: 'PE', key: 'pe', sort_order: 18 },
        { name: 'PC', key: 'pc', sort_order: 19 },
        { name: 'SPD', key: 'spd', sort_order: 20 },
        { name: 'SE', key: 'se', sort_order: 21 },
        { name: 'User', key: 'user', sort_order: 22 },
    ];
    for (const dept of departments) {
        await pool
            .request()
            .input('name', mssql_1.default.NVarChar, dept.name)
            .input('key', mssql_1.default.NVarChar, dept.key)
            .input('sort_order', mssql_1.default.Int, dept.sort_order).query(`
        INSERT INTO attractive_departments (name, [key], sort_order)
        VALUES (@name, @key, @sort_order)
      `);
    }
    console.log('✅ Departments seeded\n');
    // Seed metrics
    console.log('🔄 Seeding Attractive metrics...');
    const metrics = [
        {
            no: 1,
            measurement: 'Direct',
            unit: 'Hrs/Month',
            main: 'PE',
            main_relate: 'All',
            fy25_target: '3,500 (33%)',
            description: 'Reduce 3,500 Hrs/Month (33%)',
            remark: 'Reduce non-value work for direct labor',
            sub_category_key: 'non_value_reduction',
        },
        {
            no: 2,
            measurement: 'Indirect',
            unit: 'Hrs',
            main: 'INN',
            main_relate: 'All',
            fy25_target: '42,350 (10%)',
            description: '42,350 Hrs.(10%)',
            remark: 'Reduce non-value work for indirect labor',
            sub_category_key: 'non_value_reduction',
        },
        {
            no: 3,
            measurement: '-',
            unit: 'Project',
            main: 'INN',
            main_relate: 'All',
            fy25_target: '70',
            description: '70 Project',
            remark: 'Projects with Universities',
            sub_category_key: 'university_projects',
        },
    ];
    for (const m of metrics) {
        await pool
            .request()
            .input('no', mssql_1.default.Int, m.no)
            .input('measurement', mssql_1.default.NVarChar, m.measurement)
            .input('unit', mssql_1.default.NVarChar, m.unit)
            .input('main', mssql_1.default.NVarChar, m.main)
            .input('main_relate', mssql_1.default.NVarChar, m.main_relate)
            .input('fy25_target', mssql_1.default.NVarChar, m.fy25_target)
            .input('description', mssql_1.default.NVarChar, m.description)
            .input('remark', mssql_1.default.NVarChar, m.remark)
            .input('sub_category_key', mssql_1.default.NVarChar, m.sub_category_key).query(`
        INSERT INTO attractive_metrics (no, measurement, unit, main, main_relate, fy25_target, description_of_target, remark, sub_category_id)
        SELECT @no, @measurement, @unit, @main, @main_relate, @fy25_target, @description, @remark, id FROM attractive_sub_categories WHERE [key] = @sub_category_key
      `);
    }
    console.log('✅ Metrics seeded\n');
    // Get metric IDs
    const metricResult = await pool.request().query(`
    SELECT m.id, m.no, sc.[key] as sub_category_key
    FROM attractive_metrics m
    INNER JOIN attractive_sub_categories sc ON m.sub_category_id = sc.id
  `);
    const metricIds = {};
    for (const row of metricResult.recordset) {
        metricIds[`${row.sub_category_key}_${row.no}`] = row.id;
    }
    // Seed data entries
    console.log('🔄 Seeding Attractive data entries...');
    const dataEntries = [
        // Apr-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Apr',
            year: 2025,
            target: '0.00',
            result: '0.00',
            accu_target: '0.00',
            accu_result: '0.00',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Under summary spec for develop\n1) E-Measurement 24 Line\n2) Auto P-Chart 121 Line\n3) Auto X-R chart 125 Line\n4) 5M1E Phase II 219 Line\n5) PPA New 273 Line',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Apr',
            year: 2025,
            target: '350',
            result: '150',
            accu_target: '350',
            accu_result: '150',
            forecast: null,
            reason: 'Delay form RPA TTFuji PR issue',
            recover_activity: 'Start use dev. Process and add new requirement in 2HY',
            forecast_result_total: 'N/A',
            recovery_month: 'N/A',
            remark: '1) Finished: Lean Guest & Visitor process of GA & User',
        },
        {
            metricKey: 'university_projects_3',
            month: 'Apr',
            year: 2025,
            target: '4',
            result: '4',
            accu_target: '4',
            accu_result: '4',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) Industrial Hygiene and Safety\n2) Camera detection for counting part at Auto packing M/C\n3) Application 5S Shopping Mall\n4) Improvement Recruitment Process by Power Apps & Power Automate',
        },
        // May-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'May',
            year: 2025,
            target: '0.00',
            result: '0.00',
            accu_target: '0.00',
            accu_result: '0.00',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Under development system\n1) E-Measurement 24 Line\n2) Auto P-Chart 121 Line\n3) Auto X-R chart 125 Line\n4) 5M1E Phase II 219 Line\n5) PPA New 273 Line',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'May',
            year: 2025,
            target: '500',
            result: '500',
            accu_target: '850',
            accu_result: '650',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) LEAN SE muda work\n2) E-Facility Request\n3) BP weekly auto report\n4) TTFJ Auto issue PR implementation (completed E/May)',
        },
        {
            metricKey: 'university_projects_3',
            month: 'May',
            year: 2025,
            target: '4',
            result: '4',
            accu_target: '8',
            accu_result: '8',
            forecast: null,
            reason: 'Medical fee\n- Reduce AS Key-in data reduce time of calculation\n900-1200 sheet/month: 10 minute/time = 200Hrs/M\nReduce the number of inquiries from associates regarding remaining medical fees.\nAvg: 10-15minute/case (10 cases/day) = 50Hrs/Month\n(New) Increasing the time allocated for payment confirmation\n- DX Dashboard for support plant tour',
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) INCREASING CAPACITY EFFICIENCY OF FG AREA\n2) Study and Analyze Process OF Packaging Boxes for INCREASING EFFICIENCY\n3) Tool Cost down by re-using Dresser Tools.\n4) Application Element Auto Packing\n5) Low Cost & Flexible robot arm (OVR)',
        },
        // Jun-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Jun',
            year: 2025,
            target: '0.00',
            result: '0.00',
            accu_target: '0.00',
            accu_result: '0.00',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Under development system\n1) E-Measurement 24 Line\n2) Auto P-Chart 121 Line\n3) Auto X-R chart 125 Line\n4) 5M1E Phase II 219 Line\n5) PPA New 273 Line',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Jun',
            year: 2025,
            target: '1000',
            result: '1500',
            accu_target: '1850.00',
            accu_result: '2150.00',
            forecast: '2500.00',
            reason: 'Delay caused\n1) E-Facility Service - addition report dashboard – Go-Live Aug\n2) BP Auto weekly report - Bug from MS system, need confirmation from DIAT/IS (the issue has already been fixed).\n3) SC Kaizen (WH) Shipping 5-Tools - Waiting YOKOTEN from DIAT',
            recover_activity: 'Aug: Auto Report for Cost Planning & Purchasing\nAug: OCR & RPA SWC DocuShare – PD',
            forecast_result_total: null,
            recovery_month: null,
            remark: 'E-Facility\nBP Auto weekly report\nSC Kaizen (WH) Shipping 5-Tools',
        },
        {
            metricKey: 'university_projects_3',
            month: 'Jun',
            year: 2025,
            target: '8',
            result: '8',
            accu_target: '16',
            accu_result: '16',
            forecast: null,
            reason: '1) Student internship evaluation by Power Apps & Power Automate\n2) Internal Transfer associate by Power Apps & Power Automate\n3) Rule & Regulation training online\n4) Level Up oil & chemical management\n5) Reducing Model Change Time at GDP Inspection Line 1\n6) Reduce %variance by reducing tool change time\n7) Design of experiments to find the factors that affect seat oil leak in nozzle body assembly.\n8) Increase production efficiency by reducing loss time of Model change',
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) Student internship evaluation by Power Apps & Power Automate\n2) Internal Transfer associate by Power Apps & Power Automate\n3) Rule & Regulation training online\n4) Level Up oil & chemical management\n5) Reducing Model Change Time at GDP Inspection Line 1\n6) Reduce %variance by reducing tool change time\n7) Design of experiments to find the factors that affect seat oil leak in nozzle body assembly.\n8) Increase production efficiency by reducing loss time of Model change',
        },
        // Jul-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Jul',
            year: 2025,
            target: '0.00',
            result: '0.00',
            accu_target: '0.00',
            accu_result: '0.00',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Under development system\n1) E-Measurement 24 Line\n2) Auto P-Chart 273 Line\n3) Auto X-R chart 125 Line',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Jul',
            year: 2025,
            target: '1500',
            result: '1650.00',
            accu_target: '3350.00',
            accu_result: '3800.00',
            forecast: null,
            reason: '1) Go-Live E-Facility for Facility & Users (GA,PC,SE)\n2) GEN AI & CoPilot for coding\n3) T-REX (E-Travelling)',
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) E-Facility\n2) Waste Water Lab auto report\n3) E-Payment',
        },
        {
            metricKey: 'university_projects_3',
            month: 'Jul',
            year: 2025,
            target: '3',
            result: '3',
            accu_target: '19',
            accu_result: '19',
            forecast: null,
            reason: '1. An improvement of efficiency and accuracy in visual sorting process with LEAN approach\n2. Automated P-Q Chart Based Production Planning System\n3. Production control box washing improvement productivity for achieve in 2025-2026',
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
        // Aug-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Aug',
            year: 2025,
            target: '15.45',
            result: '131.4',
            accu_target: '15.45',
            accu_result: '131.4',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Deploy 1 Project\n-E-Measurement 4 Line (Needle rough, Body)\nResult\n1.Body 35.2/35.2 Hr/Month\n2.Needle Rough 21.4/43 Hr./Month\n3.Pipe line 69.4/0 Hr.Month (Add new)\n4.Connector 5.2/0 Hr.Month (Add new)',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Aug',
            year: 2025,
            target: '2000',
            result: '1740.00',
            accu_target: '5350.00',
            accu_result: '5540.00',
            forecast: null,
            reason: "Delay from:\nEnergy dashboard because can't transfer data daily, need to modify sever connection, need to request DIAT/IS judgement the solution.",
            recover_activity: 'Q-Record smart flow -2500WH in 2HY',
            forecast_result_total: '2500.00',
            recovery_month: "Nov'25",
            remark: 'LEAN SPD muda work\nLEAN SE Muda work - SE (Re-arrange training class by combine with DTAT)\nProductivity Auto report of SPD\nAuto Stationary (Apply from Bidoma of auto tool supply)\nAuto Reception',
        },
        {
            metricKey: 'university_projects_3',
            month: 'Aug',
            year: 2025,
            target: '3',
            result: '3',
            accu_target: '22',
            accu_result: '22',
            forecast: null,
            reason: '1. Promote DENSO Branding as a recruitment. Mentor name: Ms.Darintorn K.\n2. Low cost super Pokayoke Mentor name: Mr.Sarawut & Perrapat\n3. Anzen Jinzai Ikusei Project - Mentor name: Mr.Surasak K & Ms.Wannapa S.',
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
        // Sep-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Sep',
            year: 2025,
            target: '245.35',
            result: '100',
            accu_target: '260.80',
            accu_result: '231.40',
            forecast: null,
            reason: "Delay expansion of E-Measurement 9 items\nReason: Complete application install and training but can't cancel paper and current working style because PD have feedback voice about can't compare data between each line same as current doing by paper board",
            recover_activity: 'Add DX tools to help operator can compare data between each line by create "virtual board data comparison" that can show all data of each line to show in the same dashboard for PD can easily identify different point easily more than compare by current paper board\nRemark: Can recovery target on Nov\'26',
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Deploy addition 2 Project\n-E-Measurement 5 Line (Needle FN, Head 5w)\n- 5M1E Phase II 81 Line (G4 INJ)',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Sep',
            year: 2025,
            target: '4,000.00',
            result: '2044',
            accu_target: '9,350.00',
            accu_result: '7584',
            forecast: null,
            reason: 'WH, E-Heijunka -1.5K/WH\nACC, Improve claim syst. -1.5K/WH\nQuality DX -2.8K/WH\nPI Receive Inspect -2.0K/WH\nPE PCC system – 0.8K/WH\nEnergy Dashboard -0.8K/WH\nTotal: ~10K/WH',
            recover_activity: 'Pile up item in Oct\n1) e-Facility -2.0K/WH\n2) Smart Q-Record -2.5K/WH',
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
        {
            metricKey: 'university_projects_3',
            month: 'Sep',
            year: 2025,
            target: '6',
            result: '6',
            accu_target: '28',
            accu_result: '28',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'DX-Memo payment (Innovation)\nDX-Posted payment (Innovation)\nDX-Waste water auto report (Innovation)\nDX-CO2 calculation Platform (Innovation)\nDX-Qrecord OCR & RPA (Innovation)\nDX-Safety News Yokoten by GEN-AI & RPA (Innovation)',
        },
        // Oct-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Oct',
            year: 2025,
            target: '509.16',
            result: '810.00',
            accu_target: '769.96',
            accu_result: '1,041.40',
            forecast: null,
            reason: "Remark\n• E-measurement in process delay 1 project\n1.GDP Head 5W (2.91 Hr./D): Aug'25\n2.GDP small part (6.12 HR/D): Oct'25\n[PD Request addition function compare chart for meeting 2QA]",
            recover_activity: "Develop new dashboard function (Completed) for PD can easy compare data, Now PD request trial period for evaluate 2week before accept to cancel paper works --> Can deploy in Dec'25",
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Deploy addition 2 Project\n-E-Measurement 4 Line (Head 3W, Plunger GDP, etc)\n- PPA New 81 Line (G4 INJ)',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Oct',
            year: 2025,
            target: '4500',
            result: '3670.00',
            accu_target: '13850.00',
            accu_result: '11,254.00',
            forecast: null,
            reason: 'Delay from:\n- Claim system UAT with user and revising\n- Periodic MT UAT with user delay from PIC mis-understanding the detail of system (need to F2F discussion with HoS)\nUnlink Energy data\n(Change Direction) Focus on Value-added work, make clear PCC library, Tools control\nPile up Q3\n(New) Safety Auto Training process',
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'MP Database\nWH/Shipping auto report\nSMART Q-Record\nACC Auto process (Payment 20%)\nFacility Service Auto report',
        },
        {
            metricKey: 'university_projects_3',
            month: 'Oct',
            year: 2025,
            target: '7',
            result: '7',
            accu_target: '35',
            accu_result: '35',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) LEAN Workshop for KU university\n2) Waste Water Auto cal.\n3) Copilot E-Learning\n4) ACC Auto Invoice record\n5) BP Auto process for AP submission\n6) Co2 auto data record platform\n7) GEN-AI for Safety Data',
        },
        // Nov-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Nov',
            year: 2025,
            target: '338.12',
            result: '346.20',
            accu_target: '1108.08',
            accu_result: '1,108.08',
            forecast: null,
            reason: "• E-measurement in process delay 1 project\n1.GDP small part (5.41 HR/D): Oct'25",
            recover_activity: "Recovery E-Measurement\n1. GDP small part (5.41 HR/D): Dec'25",
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Deploy addition 2 Project\n- 5M1E Phase II 40 Line (G2-3 INJ)\n- PPA New 81 Line (G2-3 INJ)',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Nov',
            year: 2025,
            target: '5000',
            result: '3076',
            accu_target: '18850',
            accu_result: '14330',
            forecast: null,
            reason: 'FY25 Target 42/KHrs\nForecast result End of FY26 = 34.6K/Hrs\nDiff -7.7K/Hrs\nNot achieved:\nDelay from: -1K/Hrs (carry over to Sep FY26)\nCN Dashboard need to transfer data from SCADA into Internal sever (data processing: still manual)\nPCC System: - 2K/Hrs (carry over to FY26)\nFrom expand scope and job purpose review\nSafety Dashboard – 4.7K/Hrs (carry over to Feb 26)\nas changed requirement of RA, MC inspection\n(Review based on QSMR audit)',
            recover_activity: 'Safety Auto Training process\nPAM Auto report',
            forecast_result_total: 'Need to reconfirm with PC,PD,SE',
            recovery_month: 'FY26 Apr\nFY26 Oct',
            remark: null,
        },
        {
            metricKey: 'university_projects_3',
            month: 'Nov',
            year: 2025,
            target: '7',
            result: '7',
            accu_target: '42',
            accu_result: '42',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) Module Borrowing Request & Module Inventory Management of GA\n2) Web application for borrowing and inventory management\n3) Analyze, design and develop web application for GA & CSR\n4) Learning business analyst role in equipment inventory management\n5) Auto Safety training & Certification\n6) Auto Invoice record for ACC (Expense)\n7) Energy Saving promotion platform',
        },
        // Dec-25
        {
            metricKey: 'non_value_reduction_1',
            month: 'Dec',
            year: 2025,
            target: '418.73',
            result: '419.12',
            accu_target: '1526.81',
            accu_result: '1527.20',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Deploy addition Project\n- PPA New 75 Line',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Dec',
            year: 2025,
            target: '5000',
            result: '5941',
            accu_target: '23850',
            accu_result: '17195',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Pile up from Copilot x Increase license (Training and PR)\nWaste Water Dashboard\nPrompt coding for generative media',
        },
        {
            metricKey: 'university_projects_3',
            month: 'Dec',
            year: 2025,
            target: '7',
            result: '7',
            accu_target: '49',
            accu_result: '49.00',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) Auto Budget submit to BP (Automate & Data Query auto summary report)\n2) Attractive Working VDO Presentation (Sanook) for Plant tour\n3) Addition Auto Waste water report\n4) Auto Trainee request & Approval\n5) Study Database structure of Business Planning Expense\n6) E-RFQ request by Power Apps\n7) RPA for Accounting (Reduce manual work)',
        },
        // Jan-26
        {
            metricKey: 'non_value_reduction_1',
            month: 'Jan',
            year: 2026,
            target: '379.54',
            result: '379.70',
            accu_target: '1906.35',
            accu_result: '1906.90',
            forecast: null,
            reason: "Completed\nE-Measurement total 149.7 Hr/M (plan 89.54hr/M) advance+60.16Hr/M\nDelay 1 Project\n- 5M1E Phase II (Pump MC/Assy) can't cancel paper from record not completed (-60Hr/M) will complete FY26/Q2",
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Jan',
            year: 2026,
            target: '5000',
            result: '4632.00',
            accu_target: '28850.00',
            accu_result: '18962',
            forecast: null,
            reason: 'Safety Project delay program connecting & price conclusion with supplier',
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
        {
            metricKey: 'university_projects_3',
            month: 'Jan',
            year: 2026,
            target: '7',
            result: '7',
            accu_target: '56',
            accu_result: '56.00',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: '1) Internal Powershift\n2) Internal MP transfer system - Dept. level\n3) Internal MP transfer system - Company level\n4) Internal MP transfer system - Section level\n5) Leave system for Temporary & Freelance staffs\n6) Recruitment tracking monitor\n7) CIP Fixed Asset system',
        },
        // Feb-26
        {
            metricKey: 'non_value_reduction_1',
            month: 'Feb',
            year: 2026,
            target: '1122.77',
            result: '401.33',
            accu_target: '3029.12',
            accu_result: '2308.23',
            forecast: null,
            reason: "Total 401.33 /1122.77 Hr./month\n1. PPA 360/360 Hr.\n2. Tool change 41/295 Hr. (62 times/week *4 week * 10min/60min = 41.33Hr/month) App complete but still can't canceled paper (Can count only double job load at 5ME app)\n3. P chart 0/467.77 Hr. (Delay from P-chart comment, Change platform from M365-->Web app)",
            recover_activity: '1.Tool change: Action weekly follow up w/ PD for speed up paper cancel\n2. P-Chart: New parallel develop web app to use instead M365 due to app speed response issue',
            forecast_result_total: null,
            recovery_month: "Apr'26 / Aug'26",
            remark: "Deploy addition 1 Project\n-Auto P-Chart 81 Line (G4 INJ)\n- PPA New 36 Line (GDP)\nTool change - Cancel paper Apr'26\nP-Chart - New web app Aug'26",
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Feb',
            year: 2026,
            target: '6500',
            result: '6320.00',
            accu_target: '35350.00',
            accu_result: '25282',
            forecast: null,
            reason: 'Safety DX Project delay from waiting PO approval and workflow analysis\nMT waiting start GO-Live Periodic system in FY26 (New data)',
            recover_activity: '- In FY26 attractive team will changing the scope of project which increase efficiency of SQDC (Cross Dept.) instead of working hour reduction and value-added\n- Auto Oil&Chemical usage report',
            forecast_result_total: null,
            recovery_month: 'Aug',
            remark: null,
        },
        {
            metricKey: 'university_projects_3',
            month: 'Feb',
            year: 2026,
            target: '7',
            result: '7',
            accu_target: '63',
            accu_result: '63',
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
        // Mar-26
        {
            metricKey: 'non_value_reduction_1',
            month: 'Mar',
            year: 2026,
            target: '621.70',
            result: null,
            accu_target: '3650.82',
            accu_result: null,
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: 'Deploy addition 1 Project\n-Auto P-Chart 40 Line (G2-3 INJ)\n-- 5M1E Phase II 23 Line (Rail)\n- PPA New 18 Line (UC)',
        },
        {
            metricKey: 'non_value_reduction_2',
            month: 'Mar',
            year: 2026,
            target: '7000',
            result: null,
            accu_target: '42350.00',
            accu_result: null,
            forecast: null,
            reason: null,
            recover_activity: '- Auto CIP',
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
        {
            metricKey: 'university_projects_3',
            month: 'Mar',
            year: 2026,
            target: '7',
            result: null,
            accu_target: '70',
            accu_result: null,
            forecast: null,
            reason: null,
            recover_activity: null,
            forecast_result_total: null,
            recovery_month: null,
            remark: null,
        },
    ];
    let entryCount = 0;
    for (const entry of dataEntries) {
        const metricId = metricIds[entry.metricKey];
        if (!metricId) {
            console.log(`⚠️ Metric not found for key: ${entry.metricKey}`);
            continue;
        }
        await pool
            .request()
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
            .input('remark', mssql_1.default.NVarChar, entry.remark).query(`
        INSERT INTO attractive_data_entries 
        (metric_id, month, year, target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month, remark)
        VALUES 
        (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result, @forecast, @reason, @recover_activity, @forecast_result_total, @recovery_month, @remark)
      `);
        entryCount++;
    }
    console.log(`✅ ${entryCount} data entries seeded\n`);
    await pool.close();
    console.log('✅ Attractive KPI seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Sub-categories: ${subCategories.length}`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Metrics: ${metrics.length}`);
    console.log(`   - Data entries: ${entryCount}`);
}
seedAttractiveComplete().catch(console.error);
