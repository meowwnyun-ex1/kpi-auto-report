"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
/**
 * Seed script for Safety KPIs - Complete FY25 Data (Apr-25 to Mar-26)
 * FY = Fiscal Year (April 1 - March 31)
 */
// Helper function to get FY year from month string
function getFyYear(monthStr) {
    const month = monthStr.split('-')[0];
    const yearSuffix = parseInt(monthStr.split('-')[1]);
    // FY25: Apr-25 (2025) to Mar-26 (2026)
    // Apr-Dec belongs to the calendar year shown
    // Jan-Mar belongs to the next calendar year for FY
    if (['Jan', 'Feb', 'Mar'].includes(month)) {
        return 2000 + yearSuffix; // e.g., Jan-26 = 2026
    }
    return 2000 + yearSuffix; // e.g., Apr-25 = 2025
}
async function seedSafetyComplete() {
    console.log('Starting Safety KPI Complete Seeding...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. SAFETY SUB-CATEGORIES
        // ============================================
        console.log('Seeding Safety Sub-Categories...');
        const safetySubCategories = [
            { name_en: 'worksite', name_th: 'worksite', key: 'worksite', sort_order: 1 },
            { name_en: 'Traffic', name_th: 'Traffic', key: 'traffic', sort_order: 2 }
        ];
        for (const subCat of safetySubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('name_th', mssql_1.default.NVarChar, subCat.name_th)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM safety_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO safety_sub_categories (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ Safety Sub-Categories seeded\n');
        // ============================================
        // 2. SAFETY METRICS
        // ============================================
        console.log('Seeding Safety Metrics...');
        const safetyMetrics = [
            // Worksite
            { no: '1', measurement: '1-Grade accident', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '0', sub_category_key: 'worksite' },
            { no: '2', measurement: 'Reoccurrence', unit: 'Case', main: 'SE', main_relate: 'PD,PC', fy25_target: '0', sub_category_key: 'worksite' },
            { no: '3', measurement: 'Near miss', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '4', sub_category_key: 'worksite' },
            { no: '4', measurement: '8-High risk audit (New)', unit: 'Case', main: 'SE', main_relate: 'All', fy25_target: '4', sub_category_key: 'worksite' },
            // Traffic
            { no: '5', measurement: 'Fatal', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '6', measurement: 'Injury', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '7', measurement: 'Illegal & dangerous driving', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '8', measurement: 'Hit', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '0', sub_category_key: 'traffic' },
            { no: '9', measurement: 'Hit something', unit: 'Case', main: 'GA', main_relate: 'ALL', fy25_target: '≤3 case', sub_category_key: 'traffic' }
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
                    .input('sub_category_id', mssql_1.default.Int, subCatResult.recordset[0].id)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM safety_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO safety_metrics (no, measurement, unit, main, main_relate, fy25_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @sub_category_id)
            END
          `);
            }
        }
        console.log('✅ Safety Metrics seeded\n');
        // ============================================
        // 3. SAFETY DATA ENTRIES - FY25 (Apr-25 to Mar-26)
        // ============================================
        console.log('Seeding Safety Data Entries (FY25: Apr-25 to Mar-26)...');
        // Complete Safety data from user
        const safetyDataEntries = [
            // Apr-25
            { no: '1', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '3', month: 'Apr-25', target: '4', result: '0', accu_target: '0', accu_result: '0' },
            { no: '4', month: 'Apr-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '7', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '8', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            // May-25
            { no: '1', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'May-25', target: '0', result: '1', accu_target: '0', accu_result: '1', reason: '"Case: Smoke at Laser welding (UC Machining/Pipe) on 23.5.25\nWeakness of controlling risk point to cover inside laser machine"', recover_activity: 'Level up of Machine system (Design, Inspection & Maintain) company fundamentals in proactively risks management by collaborate with all concern', forecast_result_total: '1', recovery_month: 'Jul.25' },
            { no: '3', month: 'May-25', target: '4', result: '0', accu_target: '0', accu_result: '0' },
            { no: '4', month: 'May-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '7', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '8', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'May-25', target: '0', result: '1', accu_target: '1', accu_result: '1' },
            // Jun-25
            { no: '1', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '3', month: 'Jun-25', target: '4', result: '1', accu_target: '1', accu_result: '0' },
            { no: '4', month: 'Jun-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '7', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '8', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Jun-25', target: '0', result: '0', accu_target: '1', accu_result: '1' },
            // Jul-25
            { no: '1', month: 'Jul-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Jul-25', target: '0', result: '1', accu_target: '0', accu_result: '2', reason: '"Case: Non-Milk run hit roof\'s car parking (WH) on 14.7.25\n -Man: Lack of awareness.\n -Condition: RA not cover.\n -System: Not verification system after Implemented."', recover_activity: 'Review Inside Traffic Safety System (Man, System, Condition) by collaborate with all concerns.', forecast_result_total: '3', recovery_month: 'Mar.26' },
            { no: '3', month: 'Jul-25', target: '4', result: '0', accu_target: '1', accu_result: '0' },
            { no: '4', month: 'Jul-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Jul-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'Jul-25', target: '0', result: '1', accu_target: '0', accu_result: '1', reason: '"Case:  Associates ride motorcycle crash with the car\'s mirror and subsequently sliding into another parked motorcycle.\nInjury: Broken lip 5 lip and treatment at hospital 8 D.\nCause:\n -Man: Unsafe action riding in left lane and not reduce speed at intersection.\n -Condition: Low lighting at night time.\n"', recover_activity: '" - Create awareness : 1.Dept. who have accident sharing accident case by them self and join in Traffic safety activity\n2. Working team sharing this case with KYT\n\n - Building knowlegge :\n1. GA Center traning defensive driving standard \n2. Police coaching & training\n3. Promoting how to safe drive at intersection"', forecast_result_total: '1', recovery_month: 'Sep.25' },
            { no: '7', month: 'Jul-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '8', month: 'Jul-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Jul-25', target: '0', result: '0', accu_target: '1', accu_result: '1' },
            // Aug-25
            { no: '1', month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Aug-25', target: '0', result: '1', accu_target: '0', accu_result: '3', reason: '"Case: Fire & Smoke  at GDP Plunger Honing Machine on 7.8.25\n -Condition: Wire deterioration  & overload inside.\n -System: Lack of system to maintain & verify."', recover_activity: '" 1) Re-inspection wiring in machine & improvement. \n 2) Improvement  the system prevent recurrence by\n - Method keeping and connect Wire \n - Spec equipment comply with machine condition."', forecast_result_total: '3', recovery_month: 'Mar.26' },
            { no: '3', month: 'Aug-25', target: '4', result: '0', accu_target: '1', accu_result: '1' },
            { no: '4', month: 'Aug-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '7', month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '8', month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Aug-25', target: '0', result: '0', accu_target: '1', accu_result: '1' },
            // Sep-25
            { no: '1', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '3' },
            { no: '3', month: 'Sep-25', target: '4', result: '1', accu_target: '2', accu_result: '1', reason: '"Case : Smell burn & Smoke at Dust Collector (UC Machining/Needle rough) on 7.9.25\nWeakness of controlling risk point (spatter) inside dust collector"', recover_activity: '" -Method : Control interval cleaning tray of dust collector.\n-Machine : Control talc feeding & Improve autometic talc feeding.\n-Man : Level up owner machine to recognize risk of dust collector & emergency response."', forecast_result_total: '0', recovery_month: 'Dec.25' },
            { no: '4', month: 'Sep-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '7', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '8', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Sep-25', target: '0', result: '0', accu_target: '1', accu_result: '1' },
            // Oct-25
            { no: '1', month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '2', month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '3' },
            { no: '3', month: 'Oct-25', target: '4', result: '0', accu_target: '2', accu_result: '1' },
            { no: '4', month: 'Oct-25', target: '4', result: '5', accu_target: '4', accu_result: '5', reason: 'Knowleadge & RA not cover', recover_activity: 'Level up of HRD system (Man) by Safety Dojo Learning and reflect to SHE  patrol & S-SEM activity collaborate with all concern', forecast_result_total: '0', recovery_month: '22 Nov.25' },
            { no: '5', month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '7', month: 'Oct-25', target: '0', result: '1', accu_target: '0', accu_result: '1', reason: 'Company driver U-Turn car in prohibited U-turn area and sudden cut lane. ', recover_activity: '"Punishment : Warning letter\nAwareness : \n1. Comittment don\'t brake a rule in traffic rule\n2. Training traffic safety sign & test\nMornitoring :\n1. QR code evaluate driver behavior\n2. Benchmarking CCTV monitor driver behavior"', forecast_result_total: '2', recovery_month: 'Nov. 2025' },
            { no: '8', month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Oct-25', target: '0', result: '0', accu_target: '1', accu_result: '1' },
            // Nov-25
            { no: '1', month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '3' },
            { no: '3', month: 'Nov-25', target: '4', result: '0', accu_target: '2', accu_result: '3', reason: '"1.Case : Door of cabinet hit eyebrow\'s associate at HPS Pump/Hosing on 10.11.25\nWeakness of awareness\n2. Case : Smoke from Transformer at Injector MC/Orifice Gr. (MTN) on 27.11.25\nWeakness of controlling risk point of PM transformer."', recover_activity: '" -Man : Level up awareness to recognize risk by safety dojo. \n-Method : Review item to inspection Transfomer.\n-Machine : Review & Setting criteria for changing.\n"', forecast_result_total: '2', recovery_month: 'Mar.26' },
            { no: '4', month: 'Nov-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Nov-25', target: '0', result: '1', accu_target: '0', accu_result: '1', reason: 'Associates drink and ride motorcycle and not wearing helmet', recover_activity: '"Awareness : \n1. Special measure for drink group\n2. Building culture friend warning friend\n3. Management promote drink don\'t drive and wearing safety dress and helmet\n4. Remind traffic safety punishment\nMornitoring :\n1. Control travel of alcohol party\n"', forecast_result_total: '1', recovery_month: 'Dec.2025' },
            { no: '6', month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '7', month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '8', month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Nov-25', target: '0', result: '1', accu_target: '2', accu_result: '2', reason: 'Associates ridded motorcycle into the hole and lost control at nearly motorway  ', recover_activity: '"Awareness : \n1. Remind defensive driving\nKnowledge : \n1. Giving information about risk area around the company"', forecast_result_total: '2', recovery_month: 'Dec.2025' },
            // Dec-25
            { no: '1', month: 'Dec-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Dec-25', target: '0', result: '0', accu_target: '1', accu_result: '3' },
            { no: '3', month: 'Dec-25', target: '4', result: '1', accu_target: '3', accu_result: '3' },
            { no: '4', month: 'Dec-25', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Dec-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '6', month: 'Dec-25', target: '0', result: '1', accu_target: '0', accu_result: '2', reason: 'Associate rided motorcycle crash to Truck at Panutnikrom area', recover_activity: '"Awareness : \n1. Watching VDO Impact from accident\n2. KYT by themself about prevention accident \nKnowledge : \n1. Specialist traning course-Mitsui Sumitomo\n2. Giving information Boost up by Mgnt."', forecast_result_total: '2', recovery_month: 'Feb.26' },
            { no: '7', month: 'Dec-25', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '8', month: 'Dec-25', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Dec-25', target: '1', result: '0', accu_target: '2', accu_result: '2' },
            // Jan-26
            { no: '1', month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '3', reason: '"1.HRD is not sufficient in deep finding risk (Knowledge & Awareness).\n2.Activities are not effective in identifying hidden risks."', recover_activity: '"1.Level up Awareness & Knowledge" For find out hidden risk\n2.Improve activity to high performance of hidden risk"', forecast_result_total: '4', recovery_month: 'Mar.26' },
            { no: '3', month: 'Jan-26', target: '4', result: '0', accu_target: '3', accu_result: '3' },
            { no: '4', month: 'Jan-26', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '6', month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '2' },
            { no: '7', month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '1' },
            { no: '8', month: 'Jan-26', target: '0', result: '1', accu_target: '0', accu_result: '1', reason: ' Motorcycle overlap in right side it blind spot and Company driver not comfirmation again', recover_activity: '"1. Hazard perception training\n2. Real voice feedback from Expat & Associates\n3. GPS Monitoring "', forecast_result_total: '1', recovery_month: 'Feb.26' },
            { no: '9', month: 'Jan-26', target: '1', result: '0', accu_target: '3', accu_result: '2' },
            // Feb-26
            { no: '1', month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '2', month: 'Feb-26', target: '0', result: '1', accu_target: '0', accu_result: '4', reason: '"1.Man : Authorized person Not follow regulation\n2.System : Not have regulation to specific the Type of truck in each operation."', recover_activity: '"1.Level up Awareness & review role & response of authorized person (Owner activity, Owner area & Security guard) \n2.Establish the regulation (Type of truck – Operation – Area) by centralized control and reduce fragmented control"', forecast_result_total: '4', recovery_month: 'Mar.26' },
            { no: '3', month: 'Feb-26', target: '4', result: '0', accu_target: '3', accu_result: '3' },
            { no: '4', month: 'Feb-26', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '6', month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '7', month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '8', month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '0' },
            { no: '9', month: 'Feb-26', target: '0', result: '0', accu_target: '3', accu_result: '2' },
            // Mar-26
            { no: '1', month: 'Mar-26', target: '0', result: '', accu_target: '0', accu_result: '' },
            { no: '2', month: 'Mar-26', target: '0', result: '', accu_target: '0', accu_result: '4' },
            { no: '3', month: 'Mar-26', target: '4', result: '1', accu_target: '4', accu_result: '3' },
            { no: '4', month: 'Mar-26', target: '-', result: '-', accu_target: '-', accu_result: '-' },
            { no: '5', month: 'Mar-26', target: '0', result: '', accu_target: '0', accu_result: '1' },
            { no: '6', month: 'Mar-26', target: '0', result: '', accu_target: '0', accu_result: '2' },
            { no: '7', month: 'Mar-26', target: '0', result: '', accu_target: '0', accu_result: '2' },
            { no: '8', month: 'Mar-26', target: '0', result: '', accu_target: '0', accu_result: '1' },
            { no: '9', month: 'Mar-26', target: '≤3 case', result: '0', accu_target: '3', accu_result: '2' }
        ];
        for (const entry of safetyDataEntries) {
            const metricResult = await pool.request()
                .input('no', mssql_1.default.NVarChar, entry.no)
                .query(`SELECT id FROM safety_metrics WHERE no = @no`);
            if (metricResult.recordset.length > 0) {
                const year = getFyYear(entry.month);
                await pool.request()
                    .input('metric_id', mssql_1.default.Int, metricResult.recordset[0].id)
                    .input('month', mssql_1.default.NVarChar, entry.month)
                    .input('year', mssql_1.default.Int, year)
                    .input('target', mssql_1.default.NVarChar, entry.target)
                    .input('result', mssql_1.default.NVarChar, entry.result || null)
                    .input('accu_target', mssql_1.default.NVarChar, entry.accu_target)
                    .input('accu_result', mssql_1.default.NVarChar, entry.accu_result || null)
                    .input('reason', mssql_1.default.NVarChar, entry.reason || null)
                    .input('recover_activity', mssql_1.default.NVarChar, entry.recover_activity || null)
                    .input('forecast_result_total', mssql_1.default.NVarChar, entry.forecast_result_total || null)
                    .input('recovery_month', mssql_1.default.NVarChar, entry.recovery_month || null)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM safety_data_entries WHERE metric_id = @metric_id AND month = @month AND year = @year)
            BEGIN
              INSERT INTO safety_data_entries (metric_id, month, year, target, result, accu_target, accu_result, reason, recover_activity, forecast_result_total, recovery_month)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result, @reason, @recover_activity, @forecast_result_total, @recovery_month)
            END
          `);
            }
        }
        console.log('✅ Safety Data Entries seeded (12 months: Apr-25 to Mar-26)\n');
        // ============================================
        // SUMMARY
        // ============================================
        console.log('========================================');
        console.log('🎉 Safety KPI Complete Seeding Finished!');
        console.log('========================================');
        console.log('\nData Summary:');
        console.log('  - Sub-Categories: 2 (worksite, Traffic)');
        console.log('  - Metrics: 9 (4 worksite + 5 Traffic)');
        console.log('  - Data Entries: 108 (9 metrics × 12 months)');
        console.log('  - FY25 Period: Apr-25 to Mar-26');
        console.log('\nNote: FY25 = April 2025 to March 2026');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}
// Run seeding
seedSafetyComplete()
    .then(() => {
    console.log('\n✅ Seeding script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
});
