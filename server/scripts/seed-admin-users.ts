import sql from 'mssql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.development') });

async function seedAdminUsers() {
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

  console.log('Seeding admin users...\n');

  const pool = await new sql.ConnectionPool(config).connect();

  // Check if Users table exists and get its schema
  const tableCheck = await pool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Users'
  `);

  const existingColumns = tableCheck.recordset.map((r) => r.COLUMN_NAME.toLowerCase());
  console.log('Existing Users columns:', existingColumns.join(', '));

  // If Users table doesn't exist, create it
  if (existingColumns.length === 0) {
    console.log('Creating Users table...');
    await pool.request().query(`
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(200) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        department_id NVARCHAR(50) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        last_login DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
      );
    `);
  } else {
    // Add missing columns to existing table
    console.log('Adding missing columns to Users table...');

    if (!existingColumns.includes('password_hash')) {
      await pool.request().query(`ALTER TABLE Users ADD password_hash NVARCHAR(255) NULL`);
    }
    if (!existingColumns.includes('full_name')) {
      await pool.request().query(`ALTER TABLE Users ADD full_name NVARCHAR(200) NULL`);
    }
    if (!existingColumns.includes('role')) {
      await pool.request().query(`ALTER TABLE Users ADD role NVARCHAR(50) NOT NULL DEFAULT 'user'`);
    }
    if (!existingColumns.includes('department_id')) {
      await pool.request().query(`ALTER TABLE Users ADD department_id NVARCHAR(50) NULL`);
    }
    if (!existingColumns.includes('is_active')) {
      await pool.request().query(`ALTER TABLE Users ADD is_active BIT NOT NULL DEFAULT 1`);
    }
    if (!existingColumns.includes('last_login')) {
      await pool.request().query(`ALTER TABLE Users ADD last_login DATETIME NULL`);
    }
    if (!existingColumns.includes('updated_at')) {
      await pool
        .request()
        .query(`ALTER TABLE Users ADD updated_at DATETIME NOT NULL DEFAULT GETDATE()`);
    }
    console.log('Users table updated');
  }

  // Define users to create
  const users = [
    {
      username: 'Admin',
      email: 'admin@denso.com',
      password: 'Admin@123',
      full_name: 'Administrator',
      role: 'admin',
    },
    {
      username: 'SuperAdmin',
      email: 'superadmin@denso.com',
      password: 'SuperAdmin@123',
      full_name: 'Super Administrator',
      role: 'superadmin',
    },
    {
      username: 'Manager',
      email: 'manager@denso.com',
      password: 'Manager@123',
      full_name: 'KPI Manager',
      role: 'manager',
    },
  ];

  for (const user of users) {
    // Check if user exists
    const checkResult = await pool
      .request()
      .input('username', user.username)
      .query(`SELECT * FROM Users WHERE username = @username`);

    if (checkResult.recordset.length === 0) {
      // Create user
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await pool
        .request()
        .input('username', user.username)
        .input('email', user.email)
        .input('password_hash', hashedPassword)
        .input('full_name', user.full_name)
        .input('role', user.role).query(`
          INSERT INTO Users (username, email, password_hash, full_name, role, is_active)
          VALUES (@username, @email, @password_hash, @full_name, @role, 1)
        `);

      console.log(`Created user: ${user.username} (${user.role})`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}\n`);
    } else {
      // Update existing user with missing fields
      const existing = checkResult.recordset[0];
      if (!existing.password_hash || !existing.role) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await pool
          .request()
          .input('username', user.username)
          .input('password_hash', hashedPassword)
          .input('full_name', user.full_name)
          .input('role', user.role).query(`
            UPDATE Users 
            SET password_hash = @password_hash, full_name = @full_name, role = @role
            WHERE username = @username
          `);
        console.log(`Updated user: ${user.username} with missing fields\n`);
      } else {
        console.log(`User already exists: ${user.username}\n`);
      }
    }
  }

  // Show all users
  const allUsers = await pool.request().query(`
    SELECT username, email, full_name, role, is_active, created_at 
    FROM Users 
    ORDER BY role, username
  `);

  console.log('=== All Users in Database ===');
  console.table(allUsers.recordset);

  await pool.close();
  console.log('\nSeed completed successfully!');
}

seedAdminUsers().catch(console.error);
