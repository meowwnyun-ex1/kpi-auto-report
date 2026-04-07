"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
// Helper to get FY year from month string
function getFyYear(month) {
    const monthNum = parseInt(month.split('-')[0].replace(/[A-Za-z]/g, '')) || 1;
    const year = parseInt('20' + month.split('-')[1]);
    // FY starts from April, so Apr-Dec belongs to that year, Jan-Mar belongs to next FY
    const monthAbbrev = month.split('-')[0];
    const isAfterMar = ['Jan', 'Feb', 'Mar'].includes(monthAbbrev);
    return isAfterMar ? year + 1 : year;
}
async function seedDeliveryComplete() {
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
    console.log('🔄 Seeding Delivery KPI complete data...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await pool.request().query(`DELETE FROM delivery_product_entries`);
    await pool.request().query(`DELETE FROM delivery_data_entries`);
    await pool.request().query(`DELETE FROM delivery_products`);
    await pool.request().query(`DELETE FROM delivery_metrics`);
    await pool.request().query(`DELETE FROM delivery_sub_categories`);
    console.log('✅ Existing data cleared\n');
    // Seed sub-categories
    console.log('🔄 Seeding delivery sub-categories...');
    const subCategories = [
        { name_en: 'Long BM >3 hr', key: 'long_bm', sort_order: 1 },
        { name_en: 'Unplanned holiday working', key: 'unplanned_holiday', sort_order: 2 },
        { name_en: 'On plan delivery', key: 'on_plan_delivery', sort_order: 3 },
        { name_en: 'Nearmiss delivery delay > 30 mins', key: 'nearmiss_delay', sort_order: 4 },
        { name_en: 'Premium/Unplanned freight', key: 'premium_freight', sort_order: 5 },
    ];
    for (const cat of subCategories) {
        await pool.request()
            .input('name_en', mssql_1.default.NVarChar, cat.name_en)
            .input('key', mssql_1.default.NVarChar, cat.key)
            .input('sort_order', mssql_1.default.Int, cat.sort_order)
            .query(`
        INSERT INTO delivery_sub_categories (name_en, [key], sort_order)
        VALUES (@name_en, @key, @sort_order)
      `);
    }
    console.log('✅ Sub-categories seeded\n');
    // Seed metrics
    console.log('🔄 Seeding delivery metrics...');
    const metrics = [
        { no: 1, measurement: 'Priority shipment line > 3hr', unit: 'Case', main: 'MT', main_relate: 'PD,PE', fy25_target: '322', sub_category_key: 'long_bm' },
        { no: 2, measurement: 'OT unplanned recovery from m/c BM', unit: 'Day', main: 'MT', main_relate: 'PE, PC, MT', fy25_target: '0', sub_category_key: 'unplanned_holiday' },
        { no: 3, measurement: 'On plan delivery', unit: '%', main: 'WH', main_relate: 'PD,PC', fy25_target: '100%', sub_category_key: 'on_plan_delivery' },
        { no: 4, measurement: 'Nearmiss delivery delay > 30 mins', unit: 'Case', main: 'WH', main_relate: 'PD,PC', fy25_target: '0', sub_category_key: 'nearmiss_delay' },
        { no: 5, measurement: 'Premium/Unplanned freight', unit: 'MB', main: 'PC', main_relate: 'PD', fy25_target: '7.7', sub_category_key: 'premium_freight' },
    ];
    for (const m of metrics) {
        await pool.request()
            .input('no', mssql_1.default.Int, m.no)
            .input('measurement', mssql_1.default.NVarChar, m.measurement)
            .input('unit', mssql_1.default.NVarChar, m.unit)
            .input('main', mssql_1.default.NVarChar, m.main)
            .input('main_relate', mssql_1.default.NVarChar, m.main_relate)
            .input('fy25_target', mssql_1.default.NVarChar, m.fy25_target)
            .input('sub_category_key', mssql_1.default.NVarChar, m.sub_category_key)
            .query(`
        INSERT INTO delivery_metrics (no, measurement, unit, main, main_relate, fy25_target, sub_category_id)
        SELECT @no, @measurement, @unit, @main, @main_relate, @fy25_target, id FROM delivery_sub_categories WHERE [key] = @sub_category_key
      `);
    }
    console.log('✅ Metrics seeded\n');
    // Seed products
    console.log('🔄 Seeding delivery products...');
    const products = [
        { name: 'Pump/M', key: 'pump_m', sort_order: 1 },
        { name: 'Pump/A', key: 'pump_a', sort_order: 2 },
        { name: 'INJ/M', key: 'inj_m', sort_order: 3 },
        { name: 'INJ/A', key: 'inj_a', sort_order: 4 },
        { name: 'Valve', key: 'valve', sort_order: 5 },
        { name: 'SOL', key: 'sol', sort_order: 6 },
        { name: 'UC/M', key: 'uc_m', sort_order: 7 },
        { name: 'UC/A', key: 'uc_a', sort_order: 8 },
        { name: 'GDP', key: 'gdp', sort_order: 9 },
        { name: 'SIFS/DF', key: 'sifs_df', sort_order: 10 },
    ];
    for (const p of products) {
        await pool.request()
            .input('name', mssql_1.default.NVarChar, p.name)
            .input('key', mssql_1.default.NVarChar, p.key)
            .input('sort_order', mssql_1.default.Int, p.sort_order)
            .query(`
        INSERT INTO delivery_products (name, [key], sort_order)
        VALUES (@name, @key, @sort_order)
      `);
    }
    console.log('✅ Products seeded\n');
    // Seed main data entries
    console.log('🔄 Seeding delivery data entries...');
    const dataEntries = [
        // Apr-25
        { no: 1, month: 'Apr-25', target: '27', result: '10', accu_target: '27', accu_result: '10', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Apr-25', target: '4', result: '1', accu_target: '4', accu_result: '1', forecast: '', reason: '"UC Phase #4 SOP\n- 1st time Hans Robot (Lack of failure evaluation)\n- Misalignment from index table setting and coupling poor spec (Lack of machine acceptance criteria)"', recover_activity: '"Proceeding UC Phase #4\n%OR level up activity,\ndaily progress and find out \nroot cause countermeasure"', forecast_result_total: 'N/A', recovery_month: 'N/A' },
        { no: 3, month: 'Apr-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '1.00', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Apr-25', target: '0.6', result: '0.5', accu_target: '0.6', accu_result: '0.5', forecast: '', reason: '"HP5S Quality issue Fuel Leakage at Cover Bearing.\nPart no.\n-SM299000-00719D (900 pcs.)\n-SM299000-00819D (100 pcs.)\n-SM299000-00229D (360 pcs.)"', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // May-25
        { no: 1, month: 'May-25', target: '27', result: '15', accu_target: '54', accu_result: '25', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'May-25', target: '4', result: '4', accu_target: '8', accu_result: '5', forecast: '', reason: '"UC assy - Auto load mc Gripper alignment & centering caused there are not standard check item and master are not covered all model/station\nCR - Auto frettage mc spare part 0 stock\nSolenoid - PWP mc Cylinder clamp leak, 1st time occurred, there is not interval change standard and difficult to inspection"', recover_activity: '"UC assy - Change BM→PM by　making master and creating standard PM item then transferring skill to Genba\nCR - Improve lifetime extension with DAISHIN & Lisk up high risk of spare part to prevent\nSolenoid - CBM implement by air flow sensor"', forecast_result_total: 'N/A', recovery_month: 'N/A' },
        { no: 3, month: 'May-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'May-25', target: '0.6', result: '0.0', accu_target: '1.3', accu_result: '0.5', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Jun-25
        { no: 1, month: 'Jun-25', target: '27', result: '19', accu_target: '81', accu_result: '44', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Jun-25', target: '4', result: '2', accu_target: '12', accu_result: '7', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Jun-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Jun-25', target: '0', result: '0.00', accu_target: '0', accu_result: '0.00', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Jun-25', target: '0.6', result: '0.4', accu_target: '1.9', accu_result: '0.9', forecast: '', reason: '"1. UC M/C : PE Sample test \n2. UC Pipe Assy : Quality issued ID 6.0 NG small\n3. GDP : Delay shipment to DNEU due to vessel delays effect customer low inventory "', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Jul-25
        { no: 1, month: 'Jul-25', target: '27', result: '8', accu_target: '108', accu_result: '52', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Jul-25', target: '4', result: '2', accu_target: '16', accu_result: '9', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Jul-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Jul-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0.00', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Jul-25', target: '0.6', result: '0.6', accu_target: '2.6', accu_result: '1.5', forecast: '', reason: '"1. DF product : Quality issued Pump leak\n2. TH-Cambodia cross border situation "', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Aug-25
        { no: 1, month: 'Aug-25', target: '27', result: '18', accu_target: '135', accu_result: '70', forecast: '7.00', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Aug-25', target: '3', result: '3', accu_target: '19', accu_result: '12', forecast: '1.00', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Aug-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Aug-25', target: '0.6', result: '0.5', accu_target: '3.2', accu_result: '2.0', forecast: '', reason: '"1. TH-Cambodia cross border situation \n2. UC Needle S/Avalve : Quality issued Seat leak NG.\n3. Start UC Phase 4 MC G.05 delay approve from PD (G.05 move to 2 Axis support DMAT)"', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Sep-25
        { no: 1, month: 'Sep-25', target: '27', result: '13', accu_target: '162', accu_result: '83', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Sep-25', target: '3', result: '3', accu_target: '22', accu_result: '15', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Sep-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Sep-25', target: '0.6', result: '0.2', accu_target: '3.8', accu_result: '2.2', forecast: '', reason: 'TH-Cambodia cross border situation', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Oct-25
        { no: 1, month: 'Oct-25', target: '27', result: '11', accu_target: '189', accu_result: '94', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Oct-25', target: '2', result: '2', accu_target: '24', accu_result: '17', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Oct-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Oct-25', target: '0.6', result: '0.1', accu_target: '4.5', accu_result: '2.2', forecast: '', reason: '"1. TH-Cambodia cross border situation \n2. UC Needle S/Avalve : Quality issued Seat leak NG."', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Nov-25
        { no: 1, month: 'Nov-25', target: '27', result: '8', accu_target: '216', accu_result: '102', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Nov-25', target: '2', result: '2', accu_target: '26', accu_result: '19', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Nov-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100%', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0.00', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Nov-25', target: '0.6', result: '0.1', accu_target: '5.1', accu_result: '2.3', forecast: '', reason: '"1. TH-Cambodia cross border situation\n2. Element : Project new machine spin welding M/C 2 delay from Sep to Oct\'25 "', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Dec-25
        { no: 1, month: 'Dec-25', target: '27', result: '4', accu_target: '243', accu_result: '106', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Dec-25', target: '1', result: '-', accu_target: '27', accu_result: '19', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Dec-25', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Dec-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Dec-25', target: '0.6', result: '0.2', accu_target: '5.7', accu_result: '2.5', forecast: '', reason: '"1. TH-Cambodia cross border situation\n2. Element : Project new machine spin welding M/C 2 delay from Sep to Oct\'25 \n3. SCV : Quality issue Air leak NG"', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Jan-26
        { no: 1, month: 'Jan-26', target: '27', result: '9', accu_target: '270', accu_result: '115', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Jan-26', target: '1', result: '1', accu_target: '28', accu_result: '20', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Jan-26', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Jan-26', target: '0.6', result: '0.05', accu_target: '6.4', accu_result: '2.5', forecast: '', reason: 'TH-Cambodia cross border situation', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Feb-26
        { no: 1, month: 'Feb-26', target: '26', result: '15', accu_target: '296', accu_result: '130', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Feb-26', target: '-', result: '6', accu_target: '28', accu_result: '26', forecast: '', reason: '"GDP Assy line 2 (2.5 Day) Cover damper & seat upper laser welding mc - Ball screw of work work press ⇒ Loss time diagnosis due to trial & error ⇒ Create FTA Quality+BM\nUC pipe (0.5 Day) Air leak test mc - Air leakage in inspection system ⇒ Loss time diagnosis due to alarm message is not related with pheomenon ⇒ Create FTA Quality+BM\nPCV (2.5 Day) Intake valve OD GR ⇒ Quality/Process problem\nDF Plastic (1.0 Day) ⇒ Raw Material NG from TAKAHATA\nDF ADC (0.5 Day) New High pressure leak test mc ⇒  Process/Machine design problem (After SOP 1 month)"', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Feb-26', target: '100%', result: '100%', accu_target: '100%', accu_result: '100%', forecast: '100.00%', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Feb-26', target: '0.6', result: '0.05', accu_target: '7.0', accu_result: '2.6', forecast: '', reason: 'TH-Cambodia cross border situation', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        // Mar-26
        { no: 1, month: 'Mar-26', target: '26', result: '', accu_target: '322', accu_result: '', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 2, month: 'Mar-26', target: '-', result: '', accu_target: '28', accu_result: '', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 3, month: 'Mar-26', target: '100%', result: '', accu_target: '100%', accu_result: '', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 4, month: 'Mar-26', target: '0', result: '', accu_target: '0', accu_result: '', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
        { no: 5, month: 'Mar-26', target: '0.6', result: '0.05', accu_target: '7.7', accu_result: '', forecast: '', reason: 'TH-Cambodia cross border situation', recover_activity: '', forecast_result_total: '', recovery_month: '' },
    ];
    for (const entry of dataEntries) {
        const year = getFyYear(entry.month);
        await pool.request()
            .input('no', mssql_1.default.Int, entry.no)
            .input('month', mssql_1.default.NVarChar, entry.month)
            .input('year', mssql_1.default.Int, year)
            .input('target', mssql_1.default.NVarChar, entry.target)
            .input('result', mssql_1.default.NVarChar, entry.result || null)
            .input('accu_target', mssql_1.default.NVarChar, entry.accu_target)
            .input('accu_result', mssql_1.default.NVarChar, entry.accu_result || null)
            .input('forecast', mssql_1.default.NVarChar, entry.forecast || null)
            .input('reason', mssql_1.default.NVarChar, entry.reason || null)
            .input('recover_activity', mssql_1.default.NVarChar, entry.recover_activity || null)
            .input('forecast_result_total', mssql_1.default.NVarChar, entry.forecast_result_total || null)
            .input('recovery_month', mssql_1.default.NVarChar, entry.recovery_month || null)
            .query(`
        INSERT INTO delivery_data_entries (metric_id, month, year, target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month)
        SELECT m.id, @month, @year, @target, @result, @accu_target, @accu_result, @forecast, @reason, @recover_activity, @forecast_result_total, @recovery_month
        FROM delivery_metrics m WHERE m.no = @no
      `);
    }
    console.log('✅ Data entries seeded\n');
    // Seed product entries (Delivery by Product)
    console.log('🔄 Seeding delivery product entries...');
    const productEntries = [
        // Apr-25
        { metric_no: 1, month: 'Apr-25', products: { pump_m: null, pump_a: '0', inj_m: null, inj_a: '5', valve: '0', sol: '1', uc_m: '2', uc_a: '0', gdp: '1', sifs_df: '1' } },
        { metric_no: 2, month: 'Apr-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '1', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 3, month: 'Apr-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Apr-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Apr-25', products: { pump_m: '0.00', pump_a: '0.52', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        // May-25
        { metric_no: 1, month: 'May-25', products: { pump_m: null, pump_a: '1', inj_m: null, inj_a: '4', valve: '3', sol: '1', uc_m: '2', uc_a: '3', gdp: '1', sifs_df: '0' } },
        { metric_no: 2, month: 'May-25', products: { pump_m: '0', pump_a: '1', inj_m: '0', inj_a: '0', valve: '0', sol: '1', uc_m: '0', uc_a: '1', gdp: '0', sifs_df: '1' } },
        { metric_no: 3, month: 'May-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'May-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'May-25', products: { pump_m: '0.00', pump_a: '0.00', inj_m: '0.00', inj_a: '0.00', valve: '0.00', sol: '0.00', uc_m: '0.00', uc_a: '0.00', gdp: '0.00', sifs_df: '0.00' } },
        // Jun-25
        { metric_no: 1, month: 'Jun-25', products: { pump_m: null, pump_a: '2', inj_m: null, inj_a: '1', valve: '1', sol: '5', uc_m: '4', uc_a: '2', gdp: '4', sifs_df: '0' } },
        { metric_no: 2, month: 'Jun-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '1', uc_a: '0', gdp: '0', sifs_df: '1' } },
        { metric_no: 3, month: 'Jun-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Jun-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Jun-25', products: { pump_m: '0.00', pump_a: '0.00', inj_m: '0.00', inj_a: '0.00', valve: '0.00', sol: '0.00', uc_m: '0.18', uc_a: '0.00', gdp: '0.25', sifs_df: '0.00' } },
        // Jul-25
        { metric_no: 1, month: 'Jul-25', products: { pump_m: null, pump_a: '0', inj_m: null, inj_a: '0', valve: '0', sol: '3', uc_m: '2', uc_a: '2', gdp: '1', sifs_df: '0' } },
        { metric_no: 2, month: 'Jul-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '1', uc_a: '1', gdp: '0', sifs_df: '0' } },
        { metric_no: 3, month: 'Jul-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Jul-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Jul-25', products: { pump_m: '0.00', pump_a: '0.00', inj_m: '0.00', inj_a: '0.00', valve: '0.00', sol: '0.00', uc_m: '0.00', uc_a: '0.00', gdp: '0.00', sifs_df: '0.63' } },
        // Aug-25
        { metric_no: 1, month: 'Aug-25', products: { pump_m: null, pump_a: '0', inj_m: null, inj_a: '0', valve: '1', sol: '5', uc_m: '8', uc_a: '1', gdp: '3', sifs_df: '0' } },
        { metric_no: 2, month: 'Aug-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '1', uc_m: '1', uc_a: '1', gdp: '0', sifs_df: '0' } },
        { metric_no: 3, month: 'Aug-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Aug-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Aug-25', products: { pump_m: '0.00', pump_a: '0.00', inj_m: '0.00', inj_a: '0.00', valve: '0.00', sol: '0.00', uc_m: '0.14', uc_a: '0.00', gdp: '0.00', sifs_df: '0.37' } },
        // Sep-25
        { metric_no: 1, month: 'Sep-25', products: { pump_m: null, pump_a: '0', inj_m: null, inj_a: '1', valve: '1', sol: '3', uc_m: '6', uc_a: '0', gdp: '2', sifs_df: '0' } },
        { metric_no: 2, month: 'Sep-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '1', sol: '0', uc_m: '1', uc_a: '0', gdp: '1', sifs_df: '0' } },
        { metric_no: 3, month: 'Sep-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Sep-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Sep-25', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: '0.16' } },
        // Oct-25
        { metric_no: 1, month: 'Oct-25', products: { pump_m: null, pump_a: '0', inj_m: null, inj_a: '1', valve: '3', sol: '5', uc_m: '0', uc_a: '0', gdp: '1', sifs_df: '1' } },
        { metric_no: 2, month: 'Oct-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '1', sifs_df: '1' } },
        { metric_no: 3, month: 'Oct-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Oct-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Oct-25', products: { pump_m: null, pump_a: '-', inj_m: null, inj_a: null, valve: null, sol: '0.02', uc_m: null, uc_a: null, gdp: null, sifs_df: '0.07' } },
        // Nov-25
        { metric_no: 1, month: 'Nov-25', products: { pump_m: null, pump_a: '2', inj_m: null, inj_a: '3', valve: '0', sol: '0', uc_m: '3', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 2, month: 'Nov-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '1', uc_m: '0', uc_a: '0', gdp: '1', sifs_df: '0' } },
        { metric_no: 3, month: 'Nov-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Nov-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Nov-25', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: '0.06' } },
        // Dec-25
        { metric_no: 1, month: 'Dec-25', products: { pump_m: null, pump_a: '2', inj_m: null, inj_a: '0', valve: '0', sol: '1', uc_m: '1', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 2, month: 'Dec-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 3, month: 'Dec-25', products: { pump_m: '100%', pump_a: '100%', inj_m: '100%', inj_a: '100%', valve: '100%', sol: '100%', uc_m: '100%', uc_a: '100%', gdp: '100%', sifs_df: '100%' } },
        { metric_no: 4, month: 'Dec-25', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 5, month: 'Dec-25', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: '0.1900' } },
        // Jan-26
        { metric_no: 1, month: 'Jan-26', products: { pump_m: null, pump_a: '0', inj_m: null, inj_a: '0', valve: '0', sol: '4', uc_m: '3', uc_a: '1', gdp: '0', sifs_df: '1' } },
        { metric_no: 2, month: 'Jan-26', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '1', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0' } },
        { metric_no: 3, month: 'Jan-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 4, month: 'Jan-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 5, month: 'Jan-26', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0.05' } },
        // Feb-26
        { metric_no: 1, month: 'Feb-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 2, month: 'Feb-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 3, month: 'Feb-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 4, month: 'Feb-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 5, month: 'Feb-26', products: { pump_m: '0', pump_a: '0', inj_m: '0', inj_a: '0', valve: '0', sol: '0', uc_m: '0', uc_a: '0', gdp: '0', sifs_df: '0.05' } },
        // Mar-26
        { metric_no: 1, month: 'Mar-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 2, month: 'Mar-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 3, month: 'Mar-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 4, month: 'Mar-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
        { metric_no: 5, month: 'Mar-26', products: { pump_m: null, pump_a: null, inj_m: null, inj_a: null, valve: null, sol: null, uc_m: null, uc_a: null, gdp: null, sifs_df: null } },
    ];
    const productKeys = ['pump_m', 'pump_a', 'inj_m', 'inj_a', 'valve', 'sol', 'uc_m', 'uc_a', 'gdp', 'sifs_df'];
    for (const entry of productEntries) {
        const year = getFyYear(entry.month);
        for (const productKey of productKeys) {
            const value = entry.products[productKey];
            if (value !== null && value !== undefined && value !== '') {
                await pool.request()
                    .input('metric_no', mssql_1.default.Int, entry.metric_no)
                    .input('month', mssql_1.default.NVarChar, entry.month)
                    .input('year', mssql_1.default.Int, year)
                    .input('product_key', mssql_1.default.NVarChar, productKey)
                    .input('result', mssql_1.default.NVarChar, String(value))
                    .query(`
            INSERT INTO delivery_product_entries (metric_id, product_id, month, year, result)
            SELECT m.id, p.id, @month, @year, @result
            FROM delivery_metrics m, delivery_products p
            WHERE m.no = @metric_no AND p.[key] = @product_key
          `);
            }
        }
    }
    console.log('✅ Product entries seeded\n');
    // Show summary
    const summary = await pool.request().query(`
    SELECT 
      (SELECT COUNT(*) FROM delivery_sub_categories) as sub_categories,
      (SELECT COUNT(*) FROM delivery_metrics) as metrics,
      (SELECT COUNT(*) FROM delivery_data_entries) as data_entries,
      (SELECT COUNT(*) FROM delivery_products) as products,
      (SELECT COUNT(*) FROM delivery_product_entries) as product_entries
  `);
    console.log('=== Seed Summary ===');
    console.log(`Sub-categories: ${summary.recordset[0].sub_categories}`);
    console.log(`Metrics: ${summary.recordset[0].metrics}`);
    console.log(`Data entries: ${summary.recordset[0].data_entries}`);
    console.log(`Products: ${summary.recordset[0].products}`);
    console.log(`Product entries: ${summary.recordset[0].product_entries}`);
    await pool.close();
    console.log('\n✅ Delivery KPI complete seed finished successfully!');
}
seedDeliveryComplete().catch(console.error);
