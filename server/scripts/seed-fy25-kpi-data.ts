import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env.development');
dotenv.config({ path: envPath });

console.log('Environment loaded from:', envPath);
console.log('KPI_DB_HOST:', process.env.KPI_DB_HOST);
console.log('KPI_DB_NAME:', process.env.KPI_DB_NAME);
console.log('KPI_DB_USER:', process.env.KPI_DB_USER);
console.log('KPI_DB_PORT:', process.env.KPI_DB_PORT);

/**
 * SEED SCRIPT: FY25 KPI Data
 *
 * This script seeds the database with FY25 KPI categories, subcategories, and measurements
 * based on the provided Excel data structure.
 */

const config = {
  server: process.env.KPI_DB_HOST || '',
  database: process.env.KPI_DB_NAME || '',
  user: process.env.KPI_DB_USER || '',
  password: process.env.KPI_DB_PASSWORD || '',
  port: parseInt(process.env.KPI_DB_PORT || '1433'),
  options: {
    trustServerCertificate: true,
    encrypt: false,
  },
};

// FY25 Data Structure
const FY25_DATA = {
  categories: [
    { id: 1, name: 'Safety', key: 'safety', sort_order: 1, color: '#ef4444' },
    { id: 2, name: 'Quality', key: 'quality', sort_order: 2, color: '#f97316' },
    { id: 3, name: 'Delivery', key: 'delivery', sort_order: 3, color: '#eab308' },
    { id: 4, name: 'Compliance', key: 'compliance', sort_order: 4, color: '#8b5cf6' },
    { id: 5, name: 'HR', key: 'hr', sort_order: 5, color: '#ec4899' },
    { id: 6, name: 'Attractive', key: 'attractive', sort_order: 6, color: '#14b8a6' },
    { id: 7, name: 'Environment', key: 'environment', sort_order: 7, color: '#22c55e' },
    { id: 8, name: 'Cost', key: 'cost', sort_order: 8, color: '#6366f1' },
  ],
  subcategories: [
    // Safety
    { id: 1, category_id: 1, name: 'Worksite', sort_order: 1 },
    { id: 2, category_id: 1, name: 'Traffic', sort_order: 2 },
    // Quality
    { id: 3, category_id: 2, name: 'Claim', sort_order: 1 },
    { id: 4, category_id: 2, name: 'Loss', sort_order: 2 },
    // Delivery
    { id: 5, category_id: 3, name: 'Long BM >3 hr', sort_order: 1 },
    { id: 6, category_id: 3, name: 'Unplanned holiday working', sort_order: 2 },
    { id: 7, category_id: 3, name: 'On plan delivery', sort_order: 3 },
    { id: 8, category_id: 3, name: 'Nearmiss delivery delay > 30 mins', sort_order: 4 },
    { id: 9, category_id: 3, name: 'Premium/Unplanned freight', sort_order: 5 },
    // Compliance
    { id: 10, category_id: 4, name: 'Business compliance', sort_order: 1 },
    { id: 11, category_id: 4, name: 'Information security', sort_order: 2 },
    { id: 12, category_id: 4, name: 'Human compliance', sort_order: 3 },
    { id: 13, category_id: 4, name: 'Asset control', sort_order: 4 },
    { id: 14, category_id: 4, name: 'Compliance survey score', sort_order: 5 },
    { id: 15, category_id: 4, name: 'J-SOX audit score', sort_order: 6 },
    { id: 16, category_id: 4, name: 'Information security audit score', sort_order: 7 },
    // HR
    { id: 17, category_id: 5, name: 'Voice of employee (Bad News First)', sort_order: 1 },
    { id: 18, category_id: 5, name: 'Annual compulsory training', sort_order: 2 },
    { id: 19, category_id: 5, name: 'MSS+e score', sort_order: 3 },
    { id: 20, category_id: 5, name: 'Engagement', sort_order: 4 },
    // Attractive
    { id: 21, category_id: 6, name: 'Non-value work reduction (Direct/Ind)', sort_order: 1 },
    { id: 22, category_id: 6, name: 'Projects with Universities', sort_order: 2 },
    // Environment
    { id: 23, category_id: 7, name: 'Energy', sort_order: 1 },
    { id: 24, category_id: 7, name: 'Water', sort_order: 2 },
    { id: 25, category_id: 7, name: 'Waste', sort_order: 3 },
    // Cost
    { id: 26, category_id: 8, name: 'Sale', sort_order: 1 },
    { id: 27, category_id: 8, name: 'Profit', sort_order: 2 },
    { id: 28, category_id: 8, name: 'BEP', sort_order: 3 },
    { id: 29, category_id: 8, name: 'Fixed cost C/D', sort_order: 4 },
    { id: 30, category_id: 8, name: 'Productivity', sort_order: 5 },
    { id: 31, category_id: 8, name: 'Labour cost', sort_order: 6 },
  ],
  measurements: [
    // Safety - Worksite
    {
      id: 1,
      category_id: 1,
      sub_category_id: 1,
      measurement: '1-Grade accident',
      unit: 'Case',
      main: 'SE',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 2,
      category_id: 1,
      sub_category_id: 1,
      measurement: 'Reoccurrence',
      unit: 'Case',
      main: 'SE',
      main_relate: 'PD,PC',
      description_of_target: '',
    },
    {
      id: 3,
      category_id: 1,
      sub_category_id: 1,
      measurement: 'Nearm',
      unit: 'Case',
      main: 'SE',
      main_relate: 'All',
      description_of_target: 'Reduce 50% from FY24',
    },
    {
      id: 4,
      category_id: 1,
      sub_category_id: 1,
      measurement: '8-High risk audit',
      unit: 'Case',
      main: 'SE',
      main_relate: 'All',
      description_of_target: 'Reduce 50% from FY24',
    },
    // Safety - Traffic
    {
      id: 5,
      category_id: 1,
      sub_category_id: 2,
      measurement: 'Fatal',
      unit: 'Case',
      main: 'GA',
      main_relate: 'ALL',
      description_of_target: '',
    },
    {
      id: 6,
      category_id: 1,
      sub_category_id: 2,

      measurement: 'Injury',
      unit: 'Case',
      main: 'GA',
      main_relate: 'ALL',
      description_of_target: '',
    },
    {
      id: 7,
      category_id: 1,
      sub_category_id: 2,

      measurement: 'Illegal & dangerous driving',
      unit: 'Case',
      main: 'GA',
      main_relate: 'ALL',
      description_of_target: '',
    },
    {
      id: 8,
      category_id: 1,
      sub_category_id: 2,

      measurement: 'Hit',
      unit: 'Case',
      main: 'GA',
      main_relate: 'ALL',
      description_of_target: '',
    },
    {
      id: 9,
      category_id: 1,
      sub_category_id: 2,

      measurement: 'Been-hit & Other',
      unit: 'Case',
      main: 'GA',
      main_relate: 'ALL',
      description_of_target: '',
    },
    // Quality - Claim
    {
      id: 10,
      category_id: 2,
      sub_category_id: 3,

      measurement: 'Critical claim',
      unit: 'Case',
      main: 'QA',
      main_relate: 'PD,PE, QC',
      description_of_target: '',
    },
    {
      id: 11,
      category_id: 2,
      sub_category_id: 3,

      measurement: '0-km claim (Official)',
      unit: 'Case',
      main: 'QA',
      main_relate: 'PD,PE, QC',
      description_of_target: '',
    },
    {
      id: 12,
      category_id: 2,
      sub_category_id: 3,

      measurement: '0-km claim (All DN response)',
      unit: 'Case',
      main: 'QA',
      main_relate: 'PD,PE, QC',
      description_of_target: '',
    },
    {
      id: 13,
      category_id: 2,
      sub_category_id: 3,

      measurement: 'OGC claim',
      unit: 'Case',
      main: 'QA',
      main_relate: 'PD,PE, QC',
      description_of_target: '',
    },
    {
      id: 14,
      category_id: 2,
      sub_category_id: 3,

      measurement: 'Supplier NCR',
      unit: 'Case',
      main: 'QC',
      main_relate: 'PD,PE, QA, PU',
      description_of_target: '',
    },
    {
      id: 15,
      category_id: 2,
      sub_category_id: 3,

      measurement: 'Internal NCR',
      unit: 'Case',
      main: 'QC',
      main_relate: 'PD,PE, QA',
      description_of_target: '',
    },
    // Quality - Loss
    {
      id: 16,
      category_id: 2,
      sub_category_id: 4,

      measurement: 'Cost of spoilage',
      unit: '%',
      main: 'PD',
      main_relate: 'PC,PE,QC',
      description_of_target: '',
    },
    {
      id: 17,
      category_id: 2,
      sub_category_id: 4,

      measurement: 'Quality loss',
      unit: 'MB',
      main: 'AC',
      main_relate: 'PC,PE,QC',
      description_of_target: '',
    },
    // Delivery
    {
      id: 18,
      category_id: 3,
      sub_category_id: 5,

      measurement: 'Priority shipment line >3hr',
      unit: 'Case',
      main: 'MT',
      main_relate: 'PD,PE',
      description_of_target: '<130 Case',
    },
    {
      id: 19,
      category_id: 3,
      sub_category_id: 6,

      measurement: 'OT unplanned recovery from m/c BM',
      unit: 'Day',
      main: 'MT',
      main_relate: 'PE, PC, MT',
      description_of_target: '',
    },
    {
      id: 20,
      category_id: 3,
      sub_category_id: 7,

      measurement: '-',
      unit: '%',
      main: 'WH',
      main_relate: 'PD,PC',
      description_of_target: '',
    },
    {
      id: 21,
      category_id: 3,
      sub_category_id: 8,

      measurement: '-',
      unit: 'Case',
      main: 'WH',
      main_relate: 'PD,PC',
      description_of_target: '',
    },
    {
      id: 22,
      category_id: 3,
      sub_category_id: 9,

      measurement: '-',
      unit: 'MB',
      main: 'PC',
      main_relate: 'PD',
      description_of_target: '7.65/year 0.64/month',
    },
    // Compliance - Business compliance
    {
      id: 23,
      category_id: 4,
      sub_category_id: 10,

      measurement: 'Accident',
      unit: 'Case',
      main: 'AR',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 24,
      category_id: 4,
      sub_category_id: 10,

      measurement: 'Nearmiss',
      unit: 'Case',
      main: 'AR',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 25,
      category_id: 4,
      sub_category_id: 10,

      measurement: 'Incident',
      unit: 'Case',
      main: 'AR',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 26,
      category_id: 4,
      sub_category_id: 10,

      measurement: 'Urgent purchasing',
      unit: 'Case',
      main: 'PU',
      main_relate: 'All',
      description_of_target: '<280',
    },
    {
      id: 27,
      category_id: 4,
      sub_category_id: 10,

      measurement: 'Urgent purchasing clear within3 Month',
      unit: 'Case',
      main: 'PU',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 28,
      category_id: 4,
      sub_category_id: 10,

      measurement: 'Special purchasing',
      unit: 'Case',
      main: 'PU',
      main_relate: 'All',
      description_of_target: '<192',
    },
    // Compliance - Information security
    {
      id: 29,
      category_id: 4,
      sub_category_id: 11,

      measurement: 'Critical/Incident',
      unit: 'Case',
      main: 'GA&CSR',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 30,
      category_id: 4,
      sub_category_id: 11,

      measurement: 'Lead to incident',
      unit: 'Case',
      main: 'GA&CSR',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 31,
      category_id: 4,
      sub_category_id: 11,

      measurement: 'Nearmiss',
      unit: 'Case',
      main: 'GA&CSR',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 32,
      category_id: 4,
      sub_category_id: 11,

      measurement: 'E-mail traing result',
      unit: 'Case',
      main: 'GA&CSR',
      main_relate: 'All',
      description_of_target: '',
    },
    // Compliance - Human compliance
    {
      id: 33,
      category_id: 4,
      sub_category_id: 12,

      measurement: 'Accident',
      unit: 'Case',
      main: 'AR&AS',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 34,
      category_id: 4,
      sub_category_id: 12,

      measurement: 'Nearmiss',
      unit: 'Case',
      main: 'AR&AS',
      main_relate: '',
      description_of_target: '',
    },
    {
      id: 35,
      category_id: 4,
      sub_category_id: 12,

      measurement: 'Incident',
      unit: 'Case',
      main: 'AR&AS',
      main_relate: 'All',
      description_of_target: '',
    },
    // Compliance - Asset control (sample - add more as needed)
    {
      id: 36,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Fixed asset loss',
      unit: 'Case',
      main: 'ACC',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 37,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Idle Fixed Assets',
      unit: 'Case',
      main: 'ACC',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 38,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'CIP (No using date)',
      unit: 'Case',
      main: 'ACC',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 39,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'CIP (Docufment not complete)',
      unit: 'Case',
      main: 'ACC',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 40,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'CIP > 12 Month',
      unit: 'Case',
      main: 'ACC',
      main_relate: 'PD,PE,QA',
      description_of_target: '',
    },
    {
      id: 41,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'CIP >18 Month',
      unit: 'Case',
      main: 'ACC',
      main_relate: 'PD,PE,QA',
      description_of_target: '',
    },
    {
      id: 42,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Un-received Order >12 [expense]',
      unit: 'Case',
      main: 'PU',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 43,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Un-received Order >18 [Investment]',
      unit: 'Case',
      main: 'PU',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 44,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Inventory variance',
      unit: '%',
      main: 'PC/WH',
      main_relate: 'PD,PE,QA,QC',
      description_of_target: '+/-0.5%',
    },
    {
      id: 45,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Spare part inventory',
      unit: '%',
      main: 'MT',
      main_relate: 'PD,PE',
      description_of_target: '',
    },
    {
      id: 46,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Holding part',
      unit: 'Case',
      main: 'WH',
      main_relate: '',
      description_of_target: '',
    },
    {
      id: 47,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Slow moving of FG',
      unit: 'MB',
      main: 'PC',
      main_relate: 'PD,QC',
      description_of_target: '',
    },
    {
      id: 48,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Slow moving of Parts&RM',
      unit: 'MB',
      main: 'PC',
      main_relate: 'PD,QC',
      description_of_target: '',
    },
    {
      id: 49,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Slow moving of Spare Parts',
      unit: 'Case',
      main: 'MT',
      main_relate: 'PD,PE',
      description_of_target: '',
    },
    {
      id: 50,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Dead stock of FG, PART & RM',
      unit: 'MB',
      main: 'PC/WH',
      main_relate: 'PD',
      description_of_target: '',
    },
    {
      id: 51,
      category_id: 4,
      sub_category_id: 13,

      measurement: 'Dead stock of Spare parts',
      unit: 'Case',
      main: 'MT',
      main_relate: 'PD',
      description_of_target: '',
    },
    // Compliance - Other
    {
      id: 52,
      category_id: 4,
      sub_category_id: 14,

      measurement: '-',
      unit: 'Score',
      main: 'AR',
      main_relate: 'All',
      description_of_target: 'All topics score < 1.20 points',
    },
    {
      id: 53,
      category_id: 4,
      sub_category_id: 15,

      measurement: '-',
      unit: 'Score',
      main: 'ACC',
      main_relate: 'All',
      description_of_target: 'Deficiency = 0',
    },
    {
      id: 54,
      category_id: 4,
      sub_category_id: 16,

      measurement: '-',
      unit: 'Score',
      main: 'GA&CSR',
      main_relate: 'All',
      description_of_target: 'Deficiency = 0',
    },
    // HR
    {
      id: 55,
      category_id: 5,
      sub_category_id: 17,

      measurement: '-',
      unit: 'Case',
      main: 'AR',
      main_relate: '',
      description_of_target: '',
    },
    {
      id: 56,
      category_id: 5,
      sub_category_id: 18,

      measurement: 'HR training',
      unit: 'Curriculum/%',
      main: 'HRD',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 57,
      category_id: 5,
      sub_category_id: 18,

      measurement: 'Dept. Training',
      unit: 'Persons/%',
      main: 'HRD',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 58,
      category_id: 5,
      sub_category_id: 18,

      measurement: 'Mgmt. Training',
      unit: '%',
      main: 'HRD',
      main_relate: 'All (exclude Admin)',
      description_of_target: '',
    },
    {
      id: 59,
      category_id: 5,
      sub_category_id: 18,

      measurement: 'Pre boarding promotion',
      unit: 'Case',
      main: 'HRD',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 60,
      category_id: 5,
      sub_category_id: 18,

      measurement: 'Post boarding promotion',
      unit: 'Case',
      main: 'HRD',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 61,
      category_id: 5,
      sub_category_id: 19,

      measurement: '-',
      unit: 'Case',
      main: 'PD',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 62,
      category_id: 5,
      sub_category_id: 20,

      measurement: '-',
      unit: 'Case',
      main: 'AR',
      main_relate: 'All',
      description_of_target: '3.20 points',
    },
    // Attractive
    {
      id: 63,
      category_id: 6,
      sub_category_id: 21,

      measurement: 'Direct',
      unit: 'Case',
      main: 'PE',
      main_relate: 'All',
      description_of_target: 'Direct 33%',
    },
    {
      id: 64,
      category_id: 6,
      sub_category_id: 21,

      measurement: 'Indirect',
      unit: '',
      main: '',
      main_relate: 'All',
      description_of_target: 'Indirect 10%',
    },
    {
      id: 65,
      category_id: 6,
      sub_category_id: 22,

      measurement: '-',
      unit: 'Case',
      main: 'INN',
      main_relate: '',
      description_of_target: '70 Project',
    },
    // Environment - Energy
    {
      id: 66,
      category_id: 7,
      sub_category_id: 23,

      measurement: 'CO2 emission',
      unit: 'ton',
      main: 'MT',
      main_relate: 'All',
      description_of_target: '<40,244',
    },
    {
      id: 67,
      category_id: 7,
      sub_category_id: 23,

      measurement: 'CO2 basic unit',
      unit: 'ton/VAP-MB',
      main: 'MT',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 68,
      category_id: 7,
      sub_category_id: 23,

      measurement: 'Energy saving',
      unit: '%',
      main: 'MT',
      main_relate: 'PD,PE,SE',
      description_of_target: '',
    },
    {
      id: 69,
      category_id: 7,
      sub_category_id: 23,

      measurement: 'Energy saving',
      unit: 'ton',
      main: 'MT',
      main_relate: 'PD,PE,SE',
      description_of_target: '',
    },
    {
      id: 70,
      category_id: 7,
      sub_category_id: 23,

      measurement: 'Energy saving day',
      unit: 'Day',
      main: 'MT',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 71,
      category_id: 7,
      sub_category_id: 23,

      measurement: 'Energy cost (Electricity + Natural gas +N2)',
      unit: 'MB',
      main: 'MT',
      main_relate: 'All',
      description_of_target: '<251.99',
    },
    // Environment - Water
    {
      id: 72,
      category_id: 7,
      sub_category_id: 24,

      measurement: 'Water usage',
      unit: 'm3',
      main: 'MT',
      main_relate: 'All',
      description_of_target: '<292,915',
    },
    {
      id: 73,
      category_id: 7,
      sub_category_id: 24,

      measurement: 'Water reduciton',
      unit: 'm3/VAP-MB',
      main: 'MT',
      main_relate: 'PD,PE,GA,SE',
      description_of_target: '',
    },
    {
      id: 74,
      category_id: 7,
      sub_category_id: 24,

      measurement: 'Water cost (Water treatment + Wastewater)',
      unit: 'MB',
      main: 'MT',
      main_relate: 'All',
      description_of_target: '<8.84',
    },
    // Environment - Waste
    {
      id: 75,
      category_id: 7,
      sub_category_id: 25,

      measurement: 'Waste reduction (Ton/VAP-MB)',
      unit: 'Ton/VAP-MB',
      main: 'SE',
      main_relate: 'PD,PE',
      description_of_target: '-1% FY24 (0.1920 Ton/VAP-)',
    },
    {
      id: 76,
      category_id: 7,
      sub_category_id: 25,

      measurement: 'Waste reduction (Ton)',
      unit: 'Ton',
      main: 'SE',
      main_relate: 'PD,PE',
      description_of_target: '< 3,298 Tons (As sale forcast 17,182.)',
    },
    // Cost
    {
      id: 77,
      category_id: 8,
      sub_category_id: 26,

      measurement: 'Sale',
      unit: 'MB',
      main: 'ACC',
      main_relate: '',
      description_of_target: '',
    },
    {
      id: 78,
      category_id: 8,
      sub_category_id: 27,

      measurement: 'Amount',
      unit: 'MB',
      main: 'ACC',
      main_relate: 'All Expense (KB),Investment (KB) Manpower (Prs)',
      description_of_target: '',
    },
    {
      id: 79,
      category_id: 8,
      sub_category_id: 27,

      measurement: 'Ratio',
      unit: '%',
      main: '',
      main_relate: '',
      description_of_target: '',
    },
    {
      id: 80,
      category_id: 8,
      sub_category_id: 28,

      measurement: '-',
      unit: '%',
      main: 'ACC',
      main_relate: '',
      description_of_target: '',
    },
    {
      id: 81,
      category_id: 8,
      sub_category_id: 29,

      measurement: '-',
      unit: '%',
      main: 'Acc',
      main_relate: '',
      description_of_target: '',
    },
    {
      id: 82,
      category_id: 8,
      sub_category_id: 30,

      measurement: 'Direct (%)',
      unit: '%',
      main: 'ACC',
      main_relate: 'All (IOT, DX, Attractive etc.)',
      description_of_target: '',
    },
    {
      id: 83,
      category_id: 8,
      sub_category_id: 30,

      measurement: 'Direct (Ninku)',
      unit: 'Ninku',
      main: 'ACC',
      main_relate: 'All (IOT, DX, Attractive etc.)',
      description_of_target: '',
    },
    {
      id: 84,
      category_id: 8,
      sub_category_id: 30,

      measurement: 'Indirect (%)',
      unit: '%',
      main: 'ACC',
      main_relate: 'All (IOT, DX, Attractive etc.)',
      description_of_target: '',
    },
    {
      id: 85,
      category_id: 8,
      sub_category_id: 30,

      measurement: 'Indirect (Ninku)',
      unit: 'Ninku',
      main: 'ACC',
      main_relate: 'All (IOT, DX, Attractive etc.)',
      description_of_target: '',
    },
    {
      id: 86,
      category_id: 8,
      sub_category_id: 31,

      measurement: 'Direct',
      unit: 'MB',
      main: 'ACC',
      main_relate: 'All',
      description_of_target: '',
    },
    {
      id: 87,
      category_id: 8,
      sub_category_id: 31,

      measurement: 'Indirect',
      unit: 'MB',
      main: 'ACC',
      main_relate: 'All',
      description_of_target: '',
    },
  ],
};

async function seedFY25Data() {
  let pool: sql.ConnectionPool;
  try {
    console.log('='.repeat(80));
    console.log('SEED: FY25 KPI Data');
    console.log('='.repeat(80));
    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}\n`);

    pool = await new sql.ConnectionPool(config).connect();
    console.log('✓ Connected to database\n');

    const request = pool.request();

    // Add missing columns to kpi_measurements table
    console.log('Checking kpi_measurements table structure...');
    const columnsCheck = await request.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kpi_measurements'
    `);
    const existingColumns = columnsCheck.recordset.map((r: any) => r.COLUMN_NAME.toLowerCase());
    console.log('Existing columns:', existingColumns.join(', '));

    if (!existingColumns.includes('main')) {
      await request.query(`ALTER TABLE kpi_measurements ADD main NVARCHAR(50) NULL`);
      console.log('  ✓ Added column: main');
    }
    if (!existingColumns.includes('main_relate')) {
      await request.query(`ALTER TABLE kpi_measurements ADD main_relate NVARCHAR(255) NULL`);
      console.log('  ✓ Added column: main_relate');
    }
    if (!existingColumns.includes('description_of_target')) {
      await request.query(
        `ALTER TABLE kpi_measurements ADD description_of_target NVARCHAR(MAX) NULL`
      );
      console.log('  ✓ Added column: description_of_target');
    }
    console.log();

    console.log('Step 1: Seeding Categories...');
    for (const cat of FY25_DATA.categories) {
      const req = pool.request();
      await req
        .input('id', sql.Int, cat.id)
        .input('name', sql.NVarChar, cat.name)
        .input('key', sql.NVarChar, cat.key)
        .input('sort_order', sql.Int, cat.sort_order)
        .input('color', sql.NVarChar, cat.color)
        .input('is_active', sql.Bit, true).query(`
          SET IDENTITY_INSERT kpi_categories ON;
          MERGE INTO kpi_categories AS target
          USING (SELECT @id as id, @name as name, @key as [key], @sort_order as sort_order, @color as color, @is_active as is_active) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET name=source.name, [key]=source.[key], sort_order=source.sort_order, color=source.color, is_active=source.is_active, updated_at=GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, name, [key], sort_order, color, is_active, created_at, updated_at)
            VALUES (source.id, source.name, source.[key], source.sort_order, source.color, source.is_active, GETDATE(), GETDATE());
          SET IDENTITY_INSERT kpi_categories OFF;
        `);
      console.log(`  ✓ Category: ${cat.name}`);
    }

    console.log('\nStep 2: Seeding Subcategories...');
    for (const sub of FY25_DATA.subcategories) {
      const req = pool.request();
      await req
        .input('id', sql.Int, sub.id)
        .input('category_id', sql.Int, sub.category_id)
        .input('name', sql.NVarChar, sub.name)
        .input('sort_order', sql.Int, sub.sort_order)
        .input('is_active', sql.Bit, true).query(`
          SET IDENTITY_INSERT kpi_measurement_sub_categories ON;
          MERGE INTO kpi_measurement_sub_categories AS target
          USING (SELECT @id as id, @category_id as category_id, @name as name, @sort_order as sort_order, @is_active as is_active) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET category_id=source.category_id, name=source.name, sort_order=source.sort_order, is_active=source.is_active, updated_at=GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, category_id, name, sort_order, is_active, created_at, updated_at)
            VALUES (source.id, source.category_id, source.name, source.sort_order, source.is_active, GETDATE(), GETDATE());
          SET IDENTITY_INSERT kpi_measurement_sub_categories OFF;
        `);
      console.log(`  ✓ Subcategory: ${sub.name}`);
    }

    console.log('\nStep 3: Seeding Measurements...');
    for (const meas of FY25_DATA.measurements) {
      const req = pool.request();
      // Use main_relate's first department if main is empty
      const mainDept =
        meas.main || (meas.main_relate ? meas.main_relate.split(',')[0].trim() : 'ALL');
      await req
        .input('id', sql.Int, meas.id)
        .input('category_id', sql.Int, meas.category_id)
        .input('sub_category_id', sql.Int, meas.sub_category_id || null)
        .input('measurement', sql.NVarChar, meas.measurement)
        .input('unit', sql.NVarChar, meas.unit || null)
        .input('main', sql.NVarChar, mainDept)
        .input('main_relate', sql.NVarChar, meas.main_relate || null)
        .input('description_of_target', sql.NVarChar(sql.MAX), meas.description_of_target || null)
        .input('is_active', sql.Bit, true).query(`
          SET IDENTITY_INSERT kpi_measurements ON;
          MERGE INTO kpi_measurements AS target
          USING (SELECT @id as id, @category_id as category_id, @sub_category_id as sub_category_id,
                    @measurement as name, @measurement as measurement, @unit as unit, @main as main_department_id, @main as main, @main_relate as main_relate, 
                    @description_of_target as description_of_target, @is_active as is_active) AS source
          ON target.id = source.id
          WHEN MATCHED THEN
            UPDATE SET category_id=source.category_id, sub_category_id=source.sub_category_id,
                    name=source.name, measurement=source.measurement, unit=source.unit, main_department_id=source.main_department_id, main=source.main, main_relate=source.main_relate, 
                    description_of_target=source.description_of_target, is_active=source.is_active, updated_at=GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id, category_id, sub_category_id, name, measurement, unit, main_department_id, main, main_relate, description_of_target, is_active, created_at, updated_at)
            VALUES (source.id, source.category_id, source.sub_category_id, source.name, source.measurement, source.unit, 
                    source.main_department_id, source.main, source.main_relate, source.description_of_target, source.is_active, GETDATE(), GETDATE());
          SET IDENTITY_INSERT kpi_measurements OFF;
        `);
      console.log(`  ✓ Measurement: ${meas.measurement}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✓ FY25 KPI data seeded successfully!');
    console.log('='.repeat(80));
  } catch (error: any) {
    console.error('✗ Seeding failed:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✓ Database connection closed');
    }
  }
}

seedFY25Data().catch(console.error);
