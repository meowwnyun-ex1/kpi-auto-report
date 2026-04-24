import bcrypt from 'bcryptjs';
import { getKpiDb } from '../config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.development' });

/**
 * Create a specific admin user
 */
async function createUser() {
  try {
    console.log('Creating user Super@Admin...');

    const db = await getKpiDb();

    // Check if user already exists
    const checkResult = await db
      .request()
      .input('username', 'Super@Admin')
      .query(`SELECT id FROM users WHERE username = @username`);

    if (checkResult.recordset.length > 0) {
      console.log('User Super@Admin already exists. Updating password...');

      // Update existing user password
      const hashedPassword = await bcrypt.hash('i@NN636195', 10);

      await db
        .request()
        .input('username', 'Super@Admin')
        .input('password_hash', hashedPassword)
        .input('full_name', 'Super Administrator')
        .input('role', 'superadmin')
        .input('email', 'superadmin@denso.com').query(`
          UPDATE users 
          SET password_hash = @password_hash, 
              full_name = @full_name, 
              role = @role,
              email = @email,
              is_active = 1
          WHERE username = @username
        `);

      console.log('User updated successfully!');
    } else {
      console.log('Creating new user Super@Admin...');

      // Create new user
      const hashedPassword = await bcrypt.hash('i@NN636195', 10);

      await db
        .request()
        .input('username', 'Super@Admin')
        .input('email', 'superadmin@denso.com')
        .input('password_hash', hashedPassword)
        .input('full_name', 'Super Administrator')
        .input('role', 'superadmin').query(`
          INSERT INTO users (username, email, password_hash, full_name, role, is_active)
          VALUES (@username, @email, @password_hash, @full_name, @role, 1)
        `);

      console.log('User created successfully!');
    }

    // Verify user was created/updated
    const verifyResult = await db
      .request()
      .input('username', 'Super@Admin')
      .query(
        `SELECT username, email, full_name, role, is_active FROM users WHERE username = @username`
      );

    console.log('\n=== User Details ===');
    console.table(verifyResult.recordset);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createUser();
