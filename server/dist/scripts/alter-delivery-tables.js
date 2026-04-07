"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function alterDeliveryTables() {
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
    console.log('🔄 Altering Delivery KPI tables to use NVARCHAR...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Alter delivery_data_entries columns
    console.log('Altering delivery_data_entries...');
    await pool.request().query(`ALTER TABLE delivery_data_entries ALTER COLUMN target NVARCHAR(50) NULL`);
    await pool.request().query(`ALTER TABLE delivery_data_entries ALTER COLUMN result NVARCHAR(50) NULL`);
    await pool.request().query(`ALTER TABLE delivery_data_entries ALTER COLUMN accu_target NVARCHAR(50) NULL`);
    await pool.request().query(`ALTER TABLE delivery_data_entries ALTER COLUMN accu_result NVARCHAR(50) NULL`);
    await pool.request().query(`ALTER TABLE delivery_data_entries ALTER COLUMN forecast NVARCHAR(50) NULL`);
    console.log('✅ delivery_data_entries altered\n');
    // Alter delivery_product_entries columns
    console.log('Altering delivery_product_entries...');
    await pool.request().query(`ALTER TABLE delivery_product_entries ALTER COLUMN target NVARCHAR(50) NULL`);
    await pool.request().query(`ALTER TABLE delivery_product_entries ALTER COLUMN result NVARCHAR(50) NULL`);
    console.log('✅ delivery_product_entries altered\n');
    await pool.close();
    console.log('✅ Tables altered successfully!');
}
alterDeliveryTables().catch(console.error);
