"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function checkTables() {
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
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    const result = await pool.request().query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME`);
    console.log('\n=== Tables in database ===');
    result.recordset.forEach((row) => console.log(`- ${row.TABLE_NAME}`));
    // Check if users table exists
    const usersCheck = await pool.request().query(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users'`);
    if (usersCheck.recordset[0].count === 0) {
        console.log('\n❌ users table does NOT exist - need to create it');
    }
    else {
        console.log('\n✅ users table exists');
        const usersData = await pool.request().query('SELECT id, username, email, role, is_active FROM users');
        console.log('\nUsers in table:');
        console.table(usersData.recordset);
    }
    await pool.close();
}
checkTables().catch(console.error);
