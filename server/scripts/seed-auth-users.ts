/**
 * Seed Authentication Users Script
 * Creates initial users with bcrypt-hashed passwords for the KPI system
 *
 * Run with: npx ts-node server/scripts/seed-auth-users.ts
 */

import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { getKpiDbConfig } from '../config/app-config';

const kpiConfig: sql.config = {
  server: process.env.KPI_DB_HOST || '',
  database: process.env.KPI_DB_NAME || '',
  user: process.env.KPI_DB_USER || '',
  password: process.env.KPI_DB_PASSWORD || '',
  port: parseInt(process.env.KPI_DB_PORT || '1433'),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

interface User {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role: 'superadmin' | 'admin' | 'manager' | 'hod' | 'hos' | 'user' | 'guest';
  department_id?: string;
  department_name?: string;
}

const users: User[] = [
  {
    username: 'superadmin',
    email: 'superadmin@denso.com',
    full_name: 'Super Administrator',
    password: 'Admin@123',
    role: 'superadmin',
  },
  {
    username: 'admin',
    email: 'admin@denso.com',
    full_name: 'System Administrator',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    username: 'manager.se',
    email: 'manager.se@denso.com',
    full_name: 'SE Manager',
    password: 'Manager@123',
    role: 'manager',
    department_id: 'SE',
    department_name: 'Systems Engineering',
  },
  {
    username: 'manager.ga',
    email: 'manager.ga@denso.com',
    full_name: 'GA Manager',
    password: 'Manager@123',
    role: 'manager',
    department_id: 'GA',
    department_name: 'General Affairs',
  },
  {
    username: 'hod.se',
    email: 'hod.se@denso.com',
    full_name: 'SE Head of Department',
    password: 'Hod@123',
    role: 'hod',
    department_id: 'SE',
    department_name: 'Systems Engineering',
  },
  {
    username: 'hos',
    email: 'hos@denso.com',
    full_name: 'Head of Section',
    password: 'Hos@123',
    role: 'hos',
  },
  {
    username: 'user.se',
    email: 'user.se@denso.com',
    full_name: 'SE User',
    password: 'User@123',
    role: 'user',
    department_id: 'SE',
    department_name: 'Systems Engineering',
  },
];

async function seedUsers() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('Connecting to KPI database...');
    pool = await new sql.ConnectionPool(kpiConfig).connect();
    console.log('Connected successfully');

    console.log('\nSeeding users...');

    for (const user of users) {
      // Hash password
      const password_hash = await bcrypt.hash(user.password, 10);

      // Check if user exists by username or email
      const checkResult = await pool
        .request()
        .input('username', user.username)
        .input('email', user.email)
        .query('SELECT id FROM users WHERE username = @username OR email = @email');

      if (checkResult.recordset.length > 0) {
        // Update existing user
        await pool
          .request()
          .input('username', user.username)
          .input('email', user.email)
          .input('full_name', user.full_name)
          .input('password_hash', password_hash)
          .input('role', user.role)
          .input('department_id', user.department_id || null)
          .input('department_name', user.department_name || null)
          .input('is_active', 1).query(`
            UPDATE users 
            SET email = @email,
                full_name = @full_name,
                password_hash = @password_hash,
                role = @role,
                department_id = @department_id,
                department_name = @department_name,
                is_active = @is_active,
                updated_at = GETDATE()
            WHERE username = @username OR email = @email
          `);
        console.log(`✓ Updated user: ${user.username}`);
      } else {
        // Insert new user
        await pool
          .request()
          .input('username', user.username)
          .input('email', user.email)
          .input('full_name', user.full_name)
          .input('password_hash', password_hash)
          .input('role', user.role)
          .input('department_id', user.department_id || null)
          .input('department_name', user.department_name || null)
          .input('is_active', 1).query(`
            INSERT INTO users (username, email, full_name, password_hash, role, department_id, department_name, is_active)
            VALUES (@username, @email, @full_name, @password_hash, @role, @department_id, @department_name, @is_active)
          `);
        console.log(`✓ Created user: ${user.username}`);
      }
    }

    console.log('\n===========================================');
    console.log('User seeding completed successfully!');
    console.log('===========================================');
    console.log('\nDefault credentials:');
    console.log('-------------------------------------------');
    for (const user of users) {
      console.log(`Username: ${user.username}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log(`Department: ${user.department_name || 'N/A'}`);
      console.log('-------------------------------------------');
    }
    console.log('\n⚠️  IMPORTANT: Change these passwords in production!');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  } finally {
    if (pool) {
      await pool.close();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the seeding
seedUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
