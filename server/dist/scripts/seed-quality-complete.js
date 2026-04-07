"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const database_1 = require("../config/database");
/**
 * Seed script for Quality KPIs - Complete FY25 Data (Apr-25 to Mar-26)
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
async function seedQualityComplete() {
    console.log('Starting Quality KPI Complete Seeding...\n');
    try {
        const pool = await (0, database_1.getKpiDb)();
        // ============================================
        // 1. QUALITY SUB-CATEGORIES
        // ============================================
        console.log('Seeding Quality Sub-Categories...');
        const qualitySubCategories = [
            { name_en: 'Claim', name_th: 'Claim', key: 'claim', sort_order: 1 },
            { name_en: 'Loss', name_th: 'Loss', key: 'loss', sort_order: 2 }
        ];
        for (const subCat of qualitySubCategories) {
            await pool.request()
                .input('name_en', mssql_1.default.NVarChar, subCat.name_en)
                .input('name_th', mssql_1.default.NVarChar, subCat.name_th)
                .input('key', mssql_1.default.NVarChar, subCat.key)
                .input('sort_order', mssql_1.default.Int, subCat.sort_order)
                .query(`
          IF NOT EXISTS (SELECT 1 FROM quality_sub_categories WHERE [key] = @key)
          BEGIN
            INSERT INTO quality_sub_categories (name_en, name_th, [key], sort_order)
            VALUES (@name_en, @name_th, @key, @sort_order)
          END
        `);
        }
        console.log('✅ Quality Sub-Categories seeded\n');
        // ============================================
        // 2. QUALITY METRICS
        // ============================================
        console.log('Seeding Quality Metrics...');
        const qualityMetrics = [
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
            { no: '9', measurement: 'Cost of spoilage', unit: 'MB', main: 'PD', main_relate: 'PC,PE,QC', fy25_target: '163', sub_category_key: 'loss' },
            { no: '10', measurement: 'Quality loss', unit: 'MB', main: 'AC', main_relate: 'PC,PE,QC', fy25_target: '232', sub_category_key: 'loss' }
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
                    .input('sub_category_id', mssql_1.default.Int, subCatResult.recordset[0].id)
                    .query(`
            IF NOT EXISTS (SELECT 1 FROM quality_metrics WHERE no = @no AND sub_category_id = @sub_category_id)
            BEGIN
              INSERT INTO quality_metrics (no, measurement, unit, main, main_relate, fy25_target, sub_category_id)
              VALUES (@no, @measurement, @unit, @main, @main_relate, @fy25_target, @sub_category_id)
            END
          `);
            }
        }
        console.log('✅ Quality Metrics seeded\n');
        // ============================================
        // 3. QUALITY DATA ENTRIES - FY25 (Apr-25 to Mar-26)
        // ============================================
        console.log('Seeding Quality Data Entries (FY25: Apr-25 to Mar-26)...');
        // Complete Quality data from user
        const qualityDataEntries = [
            // Apr-25
            { no: '1', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '2', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '3', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '4', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '5', month: 'Apr-25', target: '1', result: '1', accu_target: '1', accu_result: '1', forecast: '', reason: '"HP3-Pipe Fuel : Contaminated inside, rust  (DMHU)\nRoot cause & C/M are during investigate."', recover_activity: '"N/A \nThis problem is sorting before shipment"', forecast_result_total: '"0"', recovery_month: "Apr'25" },
            { no: '6', month: 'Apr-25', target: '1', result: '1', accu_target: '1', accu_result: '1', forecast: '', reason: '1.Pipe has contaminate inside ID. (DMHU claim)', recover_activity: '"N/A \nThis problem is sorting before shipment"', forecast_result_total: '"0"', recovery_month: "Apr'25" },
            { no: '7', month: 'Apr-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '8', month: 'Apr-25', target: '0.60%', result: '0.52%', accu_target: '0.60%', accu_result: '0.52%', forecast: '', reason: '', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '9', month: 'Apr-25', target: '13.0', result: '11.3', accu_target: '13.0', accu_result: '11.3', forecast: '', reason: '', recover_activity: ' - ', forecast_result_total: '-', recovery_month: '-' },
            { no: '10', month: 'Apr-25', target: '11.5', result: '6.0', accu_target: '11.5', accu_result: '6.0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            // May-25
            { no: '1', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '2', month: 'May-25', target: '0', result: '1', accu_target: '0', accu_result: '1', forecast: '-', reason: '"HP5E Fuel leak, Mitsubishi (Ukraine market) Case #2\nStatus: Waiting part return to SDM"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '3', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '4', month: 'May-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '5', month: 'May-25', target: '0', result: '0', accu_target: '1', accu_result: '1', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '6', month: 'May-25', target: '0', result: '1', accu_target: '1', accu_result: '2', forecast: '0', reason: '"1.Case F/F Part has void\nCause : Found change point is new die and stop used\nC/M : On going\nKADAI :\n1.Repair the mold by adding a 0.05 mm air vent.\n2.Hold finished goods (FG): 7,600 pcs and single parts: 9,873 pcs."', recover_activity: '"N/A \nStop use new die (Cav5/6) may cause of air vent abnormal affect burn mark and viod inside (welding area)"', forecast_result_total: '"0"', recovery_month: '-' },
            { no: '7', month: 'May-25', target: '1', result: '0', accu_target: '1', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '8', month: 'May-25', target: '0.59%', result: '0.50%', accu_target: '0.59%', accu_result: '0.51%', forecast: '', reason: '"(Acc. AP vs Result ▲0.08%) \nCost of spoilage  P/J On plan"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '9', month: 'May-25', target: '15.9', result: '13.6', accu_target: '28.9', accu_result: '24.9', forecast: '', reason: '"Acc. AP vs Result Save ▲4.67MB\nMay\'25 (AP vs Result save ▲2.28MB)\nOverall actual sale amount up 120% form AP sale amount"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '10', month: 'May-25', target: '11.5', result: '7.3', accu_target: '23.0', accu_result: '13.2', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            // Jun-25
            { no: '1', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '2', month: 'Jun-25', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '-', reason: '"HP5E Fuel leak, Mitsubishi  (Japan market)  Case #3, #6\nStatus: Waiting part return to SDM\n\nHP5E Fuel leak, Mitsubishi  (Japan market)  Case #4, #5\nCause : Cylinder crack\nC/M :\n1.Use bore scope with video record function\n2.Expand ID of material  Φ6.38=>Φ6.38＋α\n3.Add 100% current of processing torque detection (in machine)\n4.Add flow sensor for each coolant nozzle 100％\n5.Not only check but change to record coolant flow rate 1/shift\n6.check hardness  (check burn) 1/shift"', recover_activity: 'On processing investigate with customer', forecast_result_total: '-', recovery_month: '-' },
            { no: '3', month: 'Jun-25', target: '2', result: '0', accu_target: '2', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '4', month: 'Jun-25', target: '2', result: '0', accu_target: '2', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '5', month: 'Jun-25', target: '0', result: '2', accu_target: '1', accu_result: '3', forecast: '0', reason: '"1. UC Pipe Step in ID\nCause : New operator insert part incomplete position.\nC/M :\n1.Re-training opretor for correct working operation and concern point.\n2.Install sensor for detect position of part when put in jig.\n\n2. UC Body abnormal black mark on OD\nCause : Accumulate oil stain in rail of Hole/Seat Grinding because no rail cleaning interval.\nC/M : Add cleanning interval 1/W (Temporay) and monitor for set permanent interval."', recover_activity: '"Nippo\'s problem increased, the emergency situation will announce and set up for KPI and activity from Jul\'25\n"', forecast_result_total: '"""0"""\n\n(after start action for Nippo)', recovery_month: '-' },
            { no: '6', month: 'Jun-25', target: '0', result: '1', accu_target: '1', accu_result: '3', forecast: '0', reason: '"1. UC Pipe Step in ID (same issue of OGC problem)\nCause : New operator insert part incomplete position.\nC/M :\n1.Re-training opretor for correct working operation and concern point.\n2.Install sensor for detect position of part when put in jig."', recover_activity: '­', forecast_result_total: '­', recovery_month: '-' },
            { no: '7', month: 'Jun-25', target: '0', result: '0', accu_target: '1', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '8', month: 'Jun-25', target: '0.55%', result: '0.51%', accu_target: '0.58%', accu_result: '0.51%', forecast: '0.54%', reason: '"(Acc. AP vs Result ▲0.07%) \nCost of spoilage  P/J On plan"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '9', month: 'Jun-25', target: '15.0', result: '14.2', accu_target: '45', accu_result: '39', forecast: '13.79', reason: '"Acc. AP vs Result Save ▲5.47MB\nJun\'25 (Target vs Result save ▲0.8MB)\nHousing cutting, scrap part \'\'insurance claim\'\' from problem part drop during transfer to process sorting Cap (+399.6 KB) but The expenses in case are related to insurance."', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '10', month: 'Jun-25', target: '5.1', result: '8.0', accu_target: '28', accu_result: '21', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            // Jul-25
            { no: '1', month: 'Jul-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '2', month: 'Jul-25', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '3', month: 'Jul-25', target: '0', result: '1', accu_target: '2', accu_result: '1', forecast: '0', reason: '"G4.5Si Engine vibration [F/M SUJ2]\nCause : Cutting chip from solenoid stopper\nC/M : Addition air blow for remove cutting chip remain"', recover_activity: 'During action for improvement.', forecast_result_total: '"0"', recovery_month: '-' },
            { no: '4', month: 'Jul-25', target: '0', result: '1', accu_target: '2', accu_result: '1', forecast: '0', reason: 'Same as 0km claim (Official)', recover_activity: 'During action for improvement.', forecast_result_total: '"0"', recovery_month: '-' },
            { no: '5', month: 'Jul-25', target: '1', result: '0', accu_target: '2', accu_result: '3', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '6', month: 'Jul-25', target: '1', result: '0', accu_target: '2', accu_result: '3', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '7', month: 'Jul-25', target: '0', result: '0', accu_target: '1', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '8', month: 'Jul-25', target: '0.55%', result: '0.50%', accu_target: '0.57%', accu_result: '0.51%', forecast: '0.50%', reason: '"(Acc. AP vs Result ▲0.06%) \nCost of spoilage  P/J On plan"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '9', month: 'Jul-25', target: '14.6', result: '13.1', accu_target: '54', accu_result: '52', forecast: '13.11', reason: '"Acc. AP vs Result Save ▲2.29MB\nJul\'25 (Target vs Result save ▲1.5MB)"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '10', month: 'Jul-25', target: '5.2', result: '9.1', accu_target: '33', accu_result: '30', forecast: '', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            // Aug-25
            { no: '1', month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '2', month: 'Aug-25', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: '"HP5E Fuel leak, Mitsubishi (Brazil market) #9\nStatus: Waiting part return to SDM"', recover_activity: 'Furikaeri find out actual root cause', forecast_result_total: 'No reoccurrence', recovery_month: "Dec'25" },
            { no: '3', month: 'Aug-25', target: '1', result: '1', accu_target: '3', accu_result: '2', forecast: '0', reason: '"G4.5Si for STM Engine rough idle NG [F/M DSUS70DH]\nCause: Cutting chip from Orifice , flow out from washing cannot remove, visual check cannot detect\nC/M : Improve visual check ability, pin shape change"', recover_activity: 'Ibutsu elimination activity', forecast_result_total: 'Reduce 50%', recovery_month: "Nov'25" },
            { no: '4', month: 'Aug-25', target: '2', result: '2', accu_target: '4', accu_result: '3', forecast: '0', reason: '"1.HP5S for TIEI Black cap missing\nCause: Risk point from handling for repacking process\nC/M : Visual check cap in paper box \n2.G4.5Si for STM Engine rough idle NG [F/M DSUS70DH]\nCause: Cutting chip from Orifice , flow out from washing cannot remove, visual check cannot detect\nC/M : Improve visual check ability, pin shape change"', recover_activity: 'Ibutsu elimination activity', forecast_result_total: 'Reduce 50%', recovery_month: "Nov'25" },
            { no: '5', month: 'Aug-25', target: '0', result: '1', accu_target: '2', accu_result: '4', forecast: '0', reason: '"UC Pipe Outer Diameter NG\nCause: Unclear root cause\nC/M: Add check go no go gate to protection flow out"', recover_activity: 'Nippo\'s problem increased, the emergency situation will announce and set up for KPI and activity from Jul\'25', forecast_result_total: '"""0"""\n(after start action for Nippo)', recovery_month: '-' },
            { no: '6', month: 'Aug-25', target: '0', result: '3', accu_target: '2', accu_result: '6', forecast: '0', reason: '"1.Screen tear\nCause : Mold repair improper effect to sharp curve occured \nC/M : 1.Mention mold repair method & inspection mold std.\n2.Revise appearance inspection method\n2.Pipe OD. deformation & has dent (Same as OGCs claim.) ==> This case high risk also from DNHA.\nCause : Simulation test risk process at SAMCO, result not same as claim part, and\nTemporary : Supplier 100% apperance check \n3.Inlet pipe discoloration and peel off \nCasue : Hight voltage from part setting (clearance part &Jig)  effect to Cr coating ability.\nTemporary : Supplier 100% apperance check "', recover_activity: 'NIPPO : Emergency improvement activity', forecast_result_total: '', recovery_month: '' },
            { no: '7', month: 'Aug-25', target: '1', result: '0', accu_target: '2', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '8', month: 'Aug-25', target: '0.55%', result: '0.63%', accu_target: '0.57%', accu_result: '0.532%', forecast: '0.56%', reason: '"(Acc. AP vs Result ▲0.04%) \nCost of spoilage  P/J On plan"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '9', month: 'Aug-25', target: '14.0', result: '15.3', accu_target: '68', accu_result: '67', forecast: '15.43', reason: '"Company  Acc. AP vs Result Save ▲1.05MB\nMonthly (AP vs Result Over +1.24MB)\nGDP  (Target  1.9MB / Act. 3.9MB/ Over +2.0MB) Postpone Aug\'25 to Sep\'25 (+0.8MB) Expense Acc. Save -5.68MB\nIrregular NG INS ,P/L NG Target 0.07% /Act.0.44% / Diff +0.37% /NG 763pcs / Re-Occure form Mat\'l DNTH L.602  Runout CPK <1.33  C/M : PI separate M/C L.602 Control lot to PD double grinding process relief seat (Result P/L Act.0.07%) / Start Aug\'25 to Current Sep\'25 ( Root cause analysis  on process DNTH & SQA) \nC/M : Q-Loss company progressive monthly\n\nINJ G4/G4.5 (Over+0.15MB) [One-time] Expense Acc. save -14.8MB\n -INJ G4.5 I-Art Problem : 0-Km Claim engine rough idle NG from STM \nCause : F/M in orifice hole DSUS70DH\nTemporary action : Re-screening F/G form W/H 22,092 pcs /GI NG 40 pcs (NG all point)\nC/M : Q-Loss company progressive monthly"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '10', month: 'Aug-25', target: '5.3', result: '9.7', accu_target: '39', accu_result: '69', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            // Sep-25
            { no: '1', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '2', month: 'Sep-25', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '3', month: 'Sep-25', target: '0', result: '0', accu_target: '3', accu_result: '2', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '4', month: 'Sep-25', target: '1', result: '0', accu_target: '5', accu_result: '3', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '5', month: 'Sep-25', target: '1', result: '2', accu_target: '3', accu_result: '6', forecast: '0', reason: '"1. DMNS - UC Pipe leak at air tightness check in Assy line\nCause: Found blow hole and disassembly check not found contamination, So During investigate by simulation test for finding which condition can take blow hole (Target : E/Oct)\nC/M: To be discussed after investigation\n2. DMHU - Pipe Dimension or bending error [Supplier]\nCause: Under investigation (Wait NG part return, estimate to receive parts by this week)\nC/M: To be discussed after investigation."', recover_activity: '"(1)\nN/A\n\n(2)\nN/A"', forecast_result_total: '"(1)\n""0""\n\n(2)\n""0"""', recovery_month: '"(1)\n-\n\n(2)\n-"' },
            { no: '6', month: 'Sep-25', target: '1', result: '1', accu_target: '3', accu_result: '7', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '7', month: 'Sep-25', target: '0', result: '0', accu_target: '2', accu_result: '0', forecast: '0', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '8', month: 'Sep-25', target: '0.55%', result: '0.56%', accu_target: '0.56%', accu_result: '0.53%', forecast: '', reason: '"Acc. AP/Result ▲0.03%\nMonthly Over +0.01%"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '9', month: 'Sep-25', target: '15.6', result: '15.9', accu_target: '84', accu_result: '83', forecast: '', reason: '"Monthly (AP vs Result Over +0.32MB)\n1) GDP NG Month Sep\'25 (+1.01MB)\n - NG INS ,P/L  (+0.82MB) No Plan irregular NG\nThe issue has continued since Aug\'25, Problem: The defect reoccurred due to material from DNTH, specifically from machine L.602 /Root Cause: The bearing in the block insert was broken.\n - NG Blow hole (+0.19MB) Plan 0.23%/ Act. 0.17% Cause : Material model SUBARU Lot seat upper small <27.660 (STD 27.640-27.680)\n\n2) UC Machine (+1.05MB) No Plan irregular NG\n - Line Pipe Pase4 over target 1.0% result 1.5% ID & OD Cutting NG\n - Line Pipe Scrap part hold Air leak can\'t re-check NG up 0% to 0.25%\n - Line Body  2QA jude. Scrap data Angle seat NG 1.4%\n - Line NDF 2QA jude. Scrap data  DSR Seat Roundness NG 1.1%"', recover_activity: '"1) GDP NG INS ,P/L (Total +3.2MB/ Sep\'25-Aug\'25)\n 1.1) Corrective Action NG P/L : DNTH has implemented a corrective action by changing to a new bearing for the block insert and introducing a new lot control process for SDM. As a result, the new lot shows a defect rate of 0.02%, which is well within the standard limit of < 0.07%, and consistent with the current performance.\n 1.2) Permanace Action P/L NG : DNTH has issued a change in the PCR process design. The new approach separates the tool for rough operations at OP600T8 and adds a new tool at OP700T8. This aims to improve the quality of items by reducing taper run-out at 80°. /SOP : Line 1, 2, 3, and 4 (Starting Dec\'25)\n 1.3) Corrective Action NG Blow hole seat upper : FUKAJU supplier increase cutting 7-10 µm and changing lot control to SDM current NG Act. 0.12% / Plan 0.23%\n\n2) UC Machine (Forecast over +0.3MB/Month)\n 1. Line Pipe (Pase4) / Problem : cutting NG       \n          1.Control tool life Tool Reamer PE investigation with DNJP ,Re process window Tooling (SOP Jan\'26)\n          2.Add Air blow clean tool clear kiriko stuck tool (SOP Dec\'25)\n 2. Line Pipe Problem : Blow hole NG from MC over judgement 0.25% -->0% Action :\n          1.Level up master leak same claim part set master MC auto judgement & detection (SOP Nov\'25)\n          2.Add dripping process : bouble leak support re-check Air leak NG /Process out line (SOP Dec\'25)\n          3.Temp. Control Seal tool life 50% from Seal wearing reduce Jig leak NG (SOP Aug\'25)\n 3. Line Body, Problem : Seat F/N 3 axis data roundness & angle shape NG / Action : \n          1.Improve grinding amount by change Dresser new type same MC 2 Axis \n          2.Change condition grinding by project reborn activity PE project (SOP Jun\'26) \n 4. Line NDF, Problem : DSR Seat Roundness NG  / Action : \n          1.Investigation Needle OD roundness NG after process supplier S&P with SQA,PE,PD Team (Nov\'25)\n         "', forecast_result_total: 'N/A', recovery_month: "Dec'25" },
            { no: '10', month: 'Sep-25', target: '4.8', result: '6.0', accu_target: '43', accu_result: '75', forecast: '', reason: '-', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            // Oct-25
            { no: '1', month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '2', month: 'Oct-25', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '3', month: 'Oct-25', target: '0', result: '0', accu_target: '3', accu_result: '2', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '4', month: 'Oct-25', target: '0', result: '1', accu_target: '5', accu_result: '4', forecast: '0', reason: '"MEC G3S Engine vibration [Fe]\nCause: F/M Fe occur from solenoid stator\nDuring investigate to consider ultrasonic washing\nImmediantly action : (SDM Inspection line) Add screening 1 cycle at running process on 6-Nov-25"', recover_activity: 'Ibutsu elimination activity & Daily corporate meeting for this issue between SDM/SKD', forecast_result_total: '"0"', recovery_month: "Nov'25" },
            { no: '5', month: 'Oct-25', target: '0', result: '1', accu_target: '3', accu_result: '7', forecast: '0', reason: '"DN Service dealer: G3 orifice Incorrect Orifice P/N supply to customer\nCause: PC mistake input information in production plan & no process can detect this problem (no item check)\nC/M: 1. PC change from manual to auto input (link with master list)\n           2. PD add item check correctness of Part no. on KANBAN & Marking on actual product\n"', recover_activity: 'N/A', forecast_result_total: '"0"', recovery_month: "Nov'25" },
            { no: '6', month: 'Oct-25', target: '0', result: '0', accu_target: '3', accu_result: '7', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '7', month: 'Oct-25', target: '1', result: '0', accu_target: '3', accu_result: '0', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '8', month: 'Oct-25', target: '0.54%', result: '0.56%', accu_target: '0.56%', accu_result: '0.54%', forecast: '', reason: '"Acc. AP/Result ▲0.02%\nMonthly Over +0.02%"', recover_activity: '-', forecast_result_total: '-', recovery_month: '-' },
            { no: '9', month: 'Oct-25', target: '14.0', result: '14.5', accu_target: '98', accu_result: '98', forecast: '', reason: '"Overall Monthly over 0.45MB (Result  vs AP): Mainly from gasoline product \n1)Found Quality issue of GDP form Daily 2QA [New items : Ikkodemo Rank A]\n    1.1)Found bubble leak and melt at C/D welding area abnormal (Model MAZDA)\n          Root cause: Protection lens of laser head has foggy (1st time) effect welding abnormal\n          C/M: Scope lot sorting 100% and QA Judge scrap abnormal high risk 473 pcs(+0.98MB) and Review,   \n          Revise PM items with FTA for early detection before found problem with MTN and PE"', recover_activity: '"1) Overall benchmark with JP for worst 5 items of each product. To Finding and Copy idea to countermeasure NG in SDM and SKD..(GM up & JP expat)\n2) Cooperlation NG reduction with PE3 & Supplier: Ex.: GDP product in case seat upper blow hole of model Honda and Subaru (Wrost 2nd). To clearing control spec with FUKUJU now trail test estimate result can saveing about 0.3MB/M. Waiting QA notice..(PE3)."', forecast_result_total: '0.3MB/M', recovery_month: "Dec'25" },
            { no: '10', month: 'Oct-25', target: '4.5', result: '6.3', accu_target: '48', accu_result: '81', forecast: '', reason: '"G2&G3 Target 0.098  MB Result 1.35 MB Over Plan  1.24 MB\nGDP Target 0 MB result 0.52 MB Over plan 0.52 MB\nHP5E Target 0 MB    Result 0.44 MB  Over plan  0.44 MB\nG4 Target 1.78 MB result 2.17 MB Over plan 0.39 MB"', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            // Nov-25
            { no: '1', month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '2', month: 'Nov-25', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '3', month: 'Nov-25', target: '1', result: '0', accu_target: '4', accu_result: '2', forecast: '', reason: '"TMT INJ G4.5Si Engine vibration [F/M Zn]\nCause: Estimate occur from edge of chute roller and attached to part during handling (lift over)\nC/M:\n1) Revise operation manual to emphasize operator about pallet pick up sequence to prevent F/M drop into part\n2) Emphasize operator and revise operation manual to avoid operator touching on overflow at inspection process"', recover_activity: 'N/A', forecast_result_total: '"0"', recovery_month: "Dec'25" },
            { no: '4', month: 'Nov-25', target: '1', result: '2', accu_target: '6', accu_result: '6', forecast: '', reason: '"1. TMT INJ G4.5Si Engine vibration [F/M Zn]\nSame as 0-km claim (official)\n2. STM INJ G4.5Si  Overflow cap stuck inside connector\nCause: Under investigation root cause\nC/M:\n1) Flip plug connector down before visual check to protect overflow cap stuck in plug connector.\n2) Under consider furthermore improvement Pokayoke."', recover_activity: 'N/A', forecast_result_total: '"0"', recovery_month: "Dec'25" },
            { no: '5', month: 'Nov-25', target: '1', result: '2', accu_target: '4', accu_result: '9', forecast: '', reason: '"1. DMHU SCV Air leak failure\nCause: Blowhole on part but Air leak and Visual check cannot detect\nC/M: (1) Air leak : Improve leak m/c accuracy by re-calibrate with mass cylinder & adjust upper limit\n           (2) Visual check : Improve method from Magnify to HD camery\n2. DMNS found UC Nozzle body wrong model\nCause: Underinvestigate (Possible risk from wrong full fill nozzle plate) \nC/M:\n1.Improve interlock linkage nozzle plate packaging before full fill plate\n2.Installation camera detection nozzle body before shipout"', recover_activity: '"Case 1\nN/A\n\nCase 2\nN/A"', forecast_result_total: '"Case 1\nNo recurrence\nCase 2\n""0"""', recovery_month: '"Case 1\nDec\'25\n\nCase 2\nJun\'26"' },
            { no: '6', month: 'Nov-25', target: '1', result: '2', accu_target: '4', accu_result: '9', forecast: '0', reason: '1.Internal NCR : Plate Orifice angle of diameter 0.5 NG.', recover_activity: 'KSTH : Supply Chain Quality Improvement Activity.', forecast_result_total: '', recovery_month: '' },
            { no: '7', month: 'Nov-25', target: '0', result: '0', accu_target: '3', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '8', month: 'Nov-25', target: '0.57%', result: '0.49%', accu_target: '0.56%', accu_result: '0.53%', forecast: '', reason: '"Overall Monthly Save ▲0.08%\nAcc. AP/ Result ▲0.03%\nForecast Acc.  Save ▲0.028% (Apr\'25 -Mar\'26)"', recover_activity: 'Result  Acc. AP&RP+Forecast Result 4M Save ▲0.028% (Apr\'25 -Mar\'26)', forecast_result_total: 'Forecast 4Month ▲0.028% (Dec\'25-Mar\'26)', recovery_month: '' },
            { no: '9', month: 'Nov-25', target: '15.6', result: '13.3', accu_target: '113.7', accu_result: '111', forecast: '', reason: '"Overall Monthly Save ▲2.21MB\nAcc. AP/ Result ▲1.49MB\nForecast Acc.  Save ▲3.9MB (Apr\'25 -Mar\'26)"', recover_activity: '"1) Original Plan/Result, Pile up plan/result Acc. AP&RP +Forecast 4M Save ▲3.9MB (Apr\'25 -Mar\'26)\n2) Overall benchmark with JP for worst  5 items of each product.\n -Product INJ G4 benchmark 5 Item /Product INJ G2G3 benchmark 15 Item\n -Other product Pump,UC,GDP not matching item NG with DNJP"', forecast_result_total: 'Forecast 4Month ▲1.69MB (Dec\'25-Mar\'26)', recovery_month: '' },
            { no: '10', month: 'Nov-25', target: '4.5', result: '6.3', accu_target: '52', accu_result: '87', forecast: '', reason: '"G4 Target 0.82 MB  Result 2.66 MB  Over plan  1.84 MB\nG2&G3 Target 0.098  MB Result 1.74 MB Over Plan  1.65 MB\nHP5E Target 0 MB result 0.46 MB Over plan 0.46 MB"', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            // Dec-25
            { no: '1', month: 'Dec-25', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '2', month: 'Dec-25', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '3', month: 'Dec-25', target: '0', result: '0', accu_target: '4', accu_result: '2', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '4', month: 'Dec-25', target: '1', result: '0', accu_target: '7', accu_result: '6', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '5', month: 'Dec-25', target: '1', result: '2', accu_target: '5', accu_result: '11', forecast: '0', reason: '"1. DMHU found Rail Chip and burr in M10\nCause : During investigation by  BPE & supplier (Siam NDK)\n2. DNHA found UC Body air leak NG\nCause : During investigation"', recover_activity: '"Case 1\n1. Change inspection method from naked eye to magnify 5X\nCase 2\nDuring investigation"', forecast_result_total: '"Case 1\n""0""\n\nCase 2\n""0"""', recovery_month: '"Case 1\nDec\'25\n\nCase 2\nDec\'25"' },
            { no: '6', month: 'Dec-25', target: '1', result: '2', accu_target: '5', accu_result: '11', forecast: '0.00', reason: '"1. DMHU found Rail Chip and burr in M10\nCause : During investigation by  BPE & supplier (Siam NDK)\nC/M : Visual check : Change inspection method from naked eye to magnify 5X\n\n2. SDM found lower body crack surface OD.\nCause : During investigation with DIAT MED, DNJP. Potential risk process is forging, under simulation CAE and actual simulation test by 23 Jan\'26\nC/M : Temporary action : 100% crack check through process."', recover_activity: '"1.Change inspection method (nake eye to magnify 5X)\n2.100% inspection crack (through process)"', forecast_result_total: '"Case 1\n""0""\n\nCase 2\n""0"""', recovery_month: '"Case 1\nJan\'26\n\nCase 2\nJan\'26"' },
            { no: '7', month: 'Dec-25', target: '1', result: '0', accu_target: '4', accu_result: '0', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '8', month: 'Dec-25', target: '0.57%', result: '0.45%', accu_target: '0.56%', accu_result: '0.53%', forecast: '', reason: '"Monthly Save ▲0.11%\nAcc. AP/ Result ▲0.04%\nCost of spoilage P/J on plan"', recover_activity: '-', forecast_result_total: 'Forecast Acc.  Save ▲0.034% (Apr\'25 -Mar\'26)', recovery_month: '' },
            { no: '9', month: 'Dec-25', target: '13.5', result: '11.7', accu_target: '127.2', accu_result: '123.0', forecast: '', reason: '"Monthly Save ▲1.72MB\nAcc. AP/ Result ▲4.36MB"', recover_activity: '-', forecast_result_total: 'Forecast Acc.  Save ▲5.9MB (Apr\'25 -Mar\'26)', recovery_month: '' },
            { no: '10', month: 'Dec-25', target: '4.5', result: '7.5', accu_target: '57', accu_result: '95', forecast: '', reason: '"HP5E : Target  0.46 Result 2.12 Diff. 2.12 MB\nProblem: Pre-hole NG (1.58 MB)/Leakage(Cylinder crack) 0.53 MB\nG4 : Target  0.82 Result 2.34 Diff. 1.52 MB\nProblem: Remain Kiriko in Orifice hole(DSUS70DH in blind hole) 1.14 MB /Problem : Orifice out hole not circle 0.58 MB\nSOL : Target  0 Result 0.56 Diff. 0.56 MB\nMaterial Kake/Su 0.38 MB/Material NG Coercive force high 0.18 MB"', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            // Jan-26
            { no: '1', month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '2', month: 'Jan-26', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '0', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '3', month: 'Jan-26', target: '0', result: '1', accu_target: '4', accu_result: '3', forecast: '0', reason: '"1. STM G4.5Si Engine vibration [F/M SUS304]\nCause : F/M SUS304, clip (SUS304) worn out when insert to magazine and then drop to shim spacer part.\nC/M : Process improvement and enhance Ibutsu elimination activity to achieve zero F/M flow out to customer witnin FY26 (customer expectation)."', recover_activity: '"0 km claim main from INJ  F/M issue and 80% reoccurence.\nF/M issues : Focusing remains on preventing outflow and applying possible C/M rather than eliminate actual F/M sources.\nDuring analysis FY25 Kadai and set quality improvement plan for FY26."', forecast_result_total: '"Not achieve target.\nForecast   total = 5 cases\n(FY25 SDM target = 4 cases)"', recovery_month: 'Within FY26' },
            { no: '4', month: 'Jan-26', target: '1', result: '3', accu_target: '8', accu_result: '9', forecast: '0', reason: '"1. Same as above.\n2. Mazda GD-P3SH Leak NG at cold tester\nCause : Delivery OD NG (Has step) due to position of work and GW is slip\nC/M : Revise STD of verify OD delivery all sliding area & Create  master to confirm GW setting\n3. TIEI HP5S Engine cannot start (F/M Al)"', recover_activity: 'Same above.', forecast_result_total: '"Not achieve target.\nForecast   total = 11 cases\n(FY25 SDM target = 9 cases)\n"', recovery_month: 'Within FY26' },
            { no: '5', month: 'Jan-26', target: '0', result: '5', accu_target: '5', accu_result: '16', forecast: '0', reason: '"1. DMHU found HP3 Pipe discoloration\nCause : Unclear (but this lot is before supplier improve part dry process)\nC/M:     Supplier improve part dry process\n2. DMHU found G4S Terminal S/A vacuum packaging error\nCause : No STD to confirm packaging condition after vacuum\nC/M:     Fix position of vacuum nozzle & vacuum pressure + Add STD check PKG appearance\n3. DNHA found UC Air leak NG (UC Nozzle body no welding)\nCause : Under investigation.\n4. DMHU found G4 Solenoid resistance lower spec\nCause : Over current supply (found coil & resin burn), under confirm FTA (DENSO & Customer process)\n5. DMHU found G4S Plate control thickness lower\nCause : Abnormal handling mistake (Grinding stone runout over spec)\nC/M:     Request DMHU to support sorting suspected lot\n           (Already change point check of tool runout confirmation in Oct\'25) "', recover_activity: '"Main problem from Biz. Partner pass -through process and inhouse process.\nFor Biz. Partner, did not improvement for part through quality assurance at Biz. partner.\nFor inhouse process:  Main from leak problem, lack of effective C/M.\n\nDuring analysis FY25 Kadai and set quality improvement plan for FY26."', forecast_result_total: '"Not achieve target.\nForecast   total =  17 cases\n(FY25 target = 6 cases)\n"', recovery_month: 'Within FY26' },
            { no: '6', month: 'Jan-26', target: '0', result: '3', accu_target: '5', accu_result: '14', forecast: '0', reason: '"1. DMHU found HP3 Pipe discoloration\nCause: Unclear (but this lot is before supplier improve part dry process)\n2.Plate Orifice depth 0.905 over spec\nCause: Loosen retainer to lock part and jig.\nFlow out : Machine alarm, irregular management.\n3.Plate Orifice angle 78 lower spec.\nCause: Reduce air cut impact to center drill miss alignment.\n"', recover_activity: '"For OGC part under considering with Top management.\nKSTH : Emergency activity kick off begin of Feb\'26\n1. DMHU found HP3 Pipe discoloration\nC/M: Supplier improve part dry process\n2.Plate Orifice depth 0.905 over spec\nC/M : Daily check jig & retainer condition.\n3.Plate Orifice angle 78 lower spec.\nC/M : Additon ball end mill and drill to control angle positioning."', forecast_result_total: '"Not achieve target.\nForecast    total =  15 cases\n(FY25 target = 6 cases)"', recovery_month: 'Cannot recovery' },
            { no: '7', month: 'Jan-26', target: '0', result: '1', accu_target: '4', accu_result: '1', forecast: '0', reason: '"1. INJ G4 Missing Bar Filter at Inlet hole\nLacking point: ​NG management.​\n  NG Part was mixed & return mistake process"', recover_activity: 'Review outline operation and emphasize associate to operate follow the rule.', forecast_result_total: '"Forecast  total =  2 cases\n(FY25 target = 5 cases)"', recovery_month: '-' },
            { no: '8', month: 'Jan-26', target: '0.57%', result: '0.52%', accu_target: '0.56%', accu_result: '0.52%', forecast: '', reason: '"Monthly Save ▲0.05%    Acc. AP/ Result ▲0.04%\n\nCost of spoilage P/J on plan\n\nRemain KADAI : \nGDP [Plan 1.4MB/Act. 2.79MB/Diff+1.29MB] problem P/L NG 797pcs  [Plan 0.24%/Act 0.93%/Diff +0.69%] over +1.15MB from \n1) Occure material DNTH cutting 601 run-out NG forecast end of Mar\'26 (Forecast Feb\'26-Mar\'26 Over +2.6MB) \n2) Occure in SDM process Relief seat grd. CPK 1.33 improvement M/C & Jig accuracy"', recover_activity: '"GDP problem P/L NG situation action plan (Material & Machine)\n1.(PE3/BPE) DNTH combine process cutting PCR issue start cutting line 602 (1st lot control to SDM Mar\'26) and extend cutting line 601,603,604 Plan end of Mar\'26 (On process)\n\n2.PE2&PD Process capability M/C Relief seat grinding CPK >1.33 (On process)\n\n3.PE2&PD next plan reamain KADAI condition grinding (On process)\n     -Improve condition grinding machine run-out of material variation (On process)\n     -Improve accuracy of jig support work process relief seat gr. (On process)"', forecast_result_total: 'Forecast Acc.  Save ▲0.032% (Apr\'25 -Mar\'26)', recovery_month: '' },
            { no: '9', month: 'Jan-26', target: '16.2', result: '14.9', accu_target: '143.4', accu_result: '137.8', forecast: '', reason: '"Monthly Save ▲1.36MB\nAcc. AP/ Result ▲5.57MB"', recover_activity: '-', forecast_result_total: 'Forecast Acc.  Save ▲8.3MB (Apr\'25 -Mar\'26)', recovery_month: '' },
            { no: '10', month: 'Jan-26', target: '4.8', result: '8.4', accu_target: '61', accu_result: '103', forecast: '', reason: '"Problem close increasing from last month = 9 items.\nNew issue in Jan\'26 = 9 items., no loss cost.\nRemaining issue cannot action until root cause C/M.\nKadai : Almost unique problem of SDM/SKD \nApproach : Expands engineering ability for improvement by re-process & design"', recover_activity: '"Priority  and set action  plan for overall quality loss (Q-loss & COS) in company in FY26. And strengthen ability of plan and actual control.\n(As explained in quality pillar)"', forecast_result_total: '"Not achieve target.\nForecast   = 178.5 MB"', recovery_month: 'Within FY26' },
            // Feb-26
            { no: '1', month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '0', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '2', month: 'Feb-26', target: '0', result: '0', accu_target: '0', accu_result: '1', forecast: '', reason: '', recover_activity: '', forecast_result_total: '', recovery_month: '' },
            { no: '3', month: 'Feb-26', target: '0', result: '1', accu_target: '4', accu_result: '4', forecast: '', reason: '"1. STM HP5S Engine cannot start (F/M Glue)\nCause: Glue from jig ball air leak test at cylinder grinding process\n"', recover_activity: '"C/M: \n1) Change new jig design for prevent glue split.				[Eff. Date : 10 Feb', 26:  }
        ], n2, Add, split, glue, removal, procedure;
        for (ball; jig.[Eff.Date]; )
            : 4;
        Feb;
        '26]\n\nOverall : Improve initial response and upstream Kaizen in FY26."', forecast_result_total;
        '"Achieve target.\nForecast total = 4 cases\n(FY25 SDM target = 4 cases)"', recovery_month;
        'Within FY26';
    }
    finally { }
    {
        no: '4', month;
        'Feb-26', target;
        '1', result;
        '1', accu_target;
        '9', accu_result;
        '10', forecast;
        '', reason;
        '"1. STM HP5S Engine cannot start (F/M Glue)\nCause: Glue from jig ball air leak test at cylinder grinding process\n"', recover_activity;
        'Same above.', forecast_result_total;
        '"Not achieve target.\nForecast total = 11 cases\n(FY25 SDM target = 9 cases)"', recovery_month;
        'Within FY26';
    }
    {
        no: '5', month;
        'Feb-26', target;
        '0', result;
        '1', accu_target;
        '5', accu_result;
        '17', forecast;
        '', reason;
        '"1. DMHU Plug rail Coating peeling\nCause: Under invesitgate with supplier & DIAT\n"', recover_activity;
        '"C/M: (Temporary) 200% inspection part at supplier before delivery\n\nOverall : Improve initial response and upstream Kaizen in FY26."', forecast_result_total;
        '"Not achieve target.\nForecast total =  17 cases\n(FY25 target = 6 cases)\n"', recovery_month;
        'Within FY26';
    }
    {
        no: '6', month;
        'Feb-26', target;
        '0', result;
        '2', accu_target;
        '5', accu_result;
        '16', forecast;
        '', reason;
        '"1. DMHU Plug rail Coating peeling\nCause: Under invesitgate with supplier & DIAT\n2. G3S Inlet connector missing ball\nCause: Under investigation\n"', recover_activity;
        '"C/M: (Temporary) 200% inspection part at supplier before delivery\n\nC/M: (Temporary) 100% Pin gauge check Go-NoGo at STC before delivery to SDM."', forecast_result_total;
        '"Not achieve target.\nForcast total = 16 cases\n(FY25 target = 6 cases)"', recovery_month;
        'Within FY26';
    }
    {
        no: '7', month;
        'Feb-26', target;
        '1', result;
        '2', accu_target;
        '5', accu_result;
        '3', forecast;
        '', reason;
        '"1. Rail Cap pipe fuel return Broken\nCause: Under invesitgation\n2. G3S Inlet connector missing ball\nCause: Under investigation\n"', recover_activity;
        '"C/M: Under invesitgation\n\nC/M: (Temporary) 100% Pin gauge check Go-NoGo at STC before delivery to SDM."', forecast_result_total;
        '"Forecast total =  3 cases\n(FY25 target = 5 cases)"', recovery_month;
        '-';
    }
    {
        no: '8', month;
        'Feb-26', target;
        '0.58%', result;
        '0.60%', accu_target;
        '0.56%', accu_result;
        '0.53%', forecast;
        '0.59%', reason;
        '"Monthly Over +0.02%    Acc. AP/ Result ▲0.03%\nCost of spoilage P/J on plan\nRemain KADAI : GDP [Plan 3.35MB/Act. 4.59MB/Diff+1.24MB]\nProblem P/L NG 1,146pcs [Plan 0.24%/Act 0.73%/Diff +0.49%]\n1) Occure material DNTH cutting 601 run-out NG forecast end of Mar\'26 (Forecast Mar\'26 Over +1.2MB) \n2) Occure in SDM process Relief seat grd. CPK 1.33 improvement M/C & Jig accuracy"', recover_activity;
        '"GDP problem P/L NG situation action plan (Material & Machine)\n1.(PE3/BPE) DNTH combine process cutting PCR issue start cutting line 602 (1st lot control to SDM Mar\'26) and extend cutting line 601,603,604 Plan end of Mar\'26 (On process)\n\n2.PE2&PD Process capability M/C Relief seat grinding CPK >1.33 (On process)\n\n3.PE2&PD next plan reamain KADAI condition grinding (Completed)\n     -PD temporary action re-grinding process relief seat lapping 2 time and control depth seat surface & PE Change new type dresser"', forecast_result_total;
        'Forecast Acc.  Save ▲0.030% (Apr\'25 -Mar\'26)', recovery_month;
        '';
    }
    {
        no: '9', month;
        'Feb-26', target;
        '16.2', result;
        '16.8', accu_target;
        '159.6', accu_result;
        '154.6', forecast;
        '14.5', reason;
        '"Monthly Over +0.6MB\nAcc. AP/ Result ▲4.99MB"', recover_activity;
        '-', forecast_result_total;
        'Forecast Acc.  Save ▲8.6MB (Apr\'25 -Mar\'26)', recovery_month;
        '';
    }
    {
        no: '10', month;
        'Feb-26', target;
        '4.5', result;
        '14.69', accu_target;
        '66', accu_result;
        '118', forecast;
        '', reason;
        '"Problem close increasing from last month = 16 items.\nNew issue in Feb\'26 = 15 items.\nRemaining issue cannot action until root cause C/M.\nKadai : Almost unique problem of SDM/SKD \nApproach : Expands engineering ability for improvement by re-process & design"', recover_activity;
        '"Priority  and set action  plan for overall quality loss (Q-loss & COS) in company in FY26. And strengthen ability of plan and actual control.\n(As explained in quality pillar)"', forecast_result_total;
        '"Not achieve target.\nForecast   = 178.5 MB"', recovery_month;
        'Within FY26';
    }
    // Mar-26
    {
        no: '1', month;
        'Mar-26', target;
        '0', result;
        '', accu_target;
        '0', accu_result;
        '0', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '2', month;
        'Mar-26', target;
        '0', result;
        '', accu_target;
        '0', accu_result;
        '1', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '3', month;
        'Mar-26', target;
        '0', result;
        '', accu_target;
        '4', accu_result;
        '4', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '4', month;
        'Mar-26', target;
        '0', result;
        '', accu_target;
        '9', accu_result;
        '10', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '5', month;
        'Mar-26', target;
        '1', result;
        '', accu_target;
        '6', accu_result;
        '17', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '6', month;
        'Mar-26', target;
        '1', result;
        '', accu_target;
        '6', accu_result;
        '16', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '7', month;
        'Mar-26', target;
        '0', result;
        '', accu_target;
        '5', accu_result;
        '3', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '8', month;
        'Mar-26', target;
        '0.54%', result;
        '', accu_target;
        '0.56%', accu_result;
        '', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '9', month;
        'Mar-26', target;
        '13.3', result;
        '', accu_target;
        '163', accu_result;
        '', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    {
        no: '10', month;
        'Mar-26', target;
        '4.5', result;
        '', accu_target;
        '70', accu_result;
        '118', forecast;
        '', reason;
        '', recover_activity;
        '', forecast_result_total;
        '', recovery_month;
        '';
    }
    ;
    for (const entry of qualityDataEntries) {
        const metricResult = await pool.request()
            .input('no', mssql_1.default.NVarChar, entry.no)
            .query(`SELECT id FROM quality_metrics WHERE no = @no`);
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
                .input('forecast', mssql_1.default.NVarChar, entry.forecast || null)
                .input('reason', mssql_1.default.NVarChar, entry.reason || null)
                .input('recover_activity', mssql_1.default.NVarChar, entry.recover_activity || null)
                .input('forecast_result_total', mssql_1.default.NVarChar, entry.forecast_result_total || null)
                .input('recovery_month', mssql_1.default.NVarChar, entry.recovery_month || null)
                .query(`
            IF NOT EXISTS (SELECT 1 FROM quality_data_entries WHERE metric_id = @metric_id AND month = @month AND year = @year)
            BEGIN
              INSERT INTO quality_data_entries (metric_id, month, year, target, result, accu_target, accu_result, forecast, reason, recover_activity, forecast_result_total, recovery_month)
              VALUES (@metric_id, @month, @year, @target, @result, @accu_target, @accu_result, @forecast, @reason, @recover_activity, @forecast_result_total, @recovery_month)
            END
          `);
        }
    }
    console.log('✅ Quality Data Entries seeded (12 months: Apr-25 to Mar-26)\n');
    // ============================================
    // SUMMARY
    // ============================================
    console.log('========================================');
    console.log('🎉 Quality KPI Complete Seeding Finished!');
    console.log('========================================');
    console.log('\nData Summary:');
    console.log('  - Sub-Categories: 2 (Claim, Loss)');
    console.log('  - Metrics: 10 (7 Claim + 3 Loss)');
    console.log('  - Data Entries: 120 (10 metrics × 12 months)');
    console.log('  - FY25 Period: Apr-25 to Mar-26');
    console.log('\nNote: FY25 = April 2025 to March 2026');
}
try { }
catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
}
// Run seeding
seedQualityComplete()
    .then(() => {
    console.log('\n✅ Seeding script finished');
    process.exit(0);
})
    .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
});
