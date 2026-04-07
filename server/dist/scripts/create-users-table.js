"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importDefault(require("mssql"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.development') });
async function createUsersTable() {
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
    console.log('🔄 Creating users table...\n');
    const pool = await new mssql_1.default.ConnectionPool(config).connect();
    // Create users table
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
    BEGIN
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(200) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        is_active BIT NOT NULL DEFAULT 1,
        last_login DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
      PRINT '✓ users table created';
    END
    ELSE
    BEGIN
      PRINT '✓ users table already exists';
    END
  `);
    // Check if admin user exists
    const adminCheck = await pool.request()
        .input('username', 'Admin')
        .query('SELECT id FROM users WHERE username = @username');
    if (adminCheck.recordset.length === 0) {
        // Create default admin user
        const hashedPassword = await bcryptjs_1.default.hash('i@NN636195', 10);
        await pool.request()
            .input('username', 'Admin')
            .input('email', 'inn.Developer.a2s@ap.denso.com')
            .input('password_hash', hashedPassword)
            .input('full_name', 'Administrator')
            .input('role', 'admin')
            .query(`
        INSERT INTO users (username, email, password_hash, full_name, role, is_active)
        VALUES (@username, @email, @password_hash, @full_name, @role, 1)
      `);
        console.log('✅ Default admin user created');
        console.log('   Username: Admin');
        console.log('   Password: i@NN636195');
    }
    else {
        console.log('✓ Admin user already exists');
    }
    // Show all users
    const users = await pool.request().query('SELECT id, username, email, role, is_active FROM users');
    console.log('\n=== Users in database ===');
    console.table(users.recordset);
    await pool.close();
    console.log('\n✅ Migration completed successfully!');
}
createUsersTable().catch(console.error);
