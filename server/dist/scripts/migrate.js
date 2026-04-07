"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
/**
 * Database Migration Script
 * Creates/updates database schema with only the fields that are actually used
 *
 * Run: npx tsx server/scripts/migrate.ts
 */
async function migrate() {
    console.log('🔄 Starting database migration...\n');
    try {
        const pool = await (0, database_1.getAppStoreDb)();
        console.log('✅ Connected to database\n');
        // ============================================
        // 1. CATEGORIES TABLE
        // ============================================
        console.log('📋 Creating categories table...');
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'categories')
      BEGIN
        CREATE TABLE categories (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(200) NOT NULL,
          icon NVARCHAR(MAX) NULL,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          image_thumbnail NVARCHAR(MAX) NULL,
          image_small NVARCHAR(MAX) NULL,
          image_path NVARCHAR(500) NULL,
          image_metadata NVARCHAR(MAX) NULL
        );
        PRINT '✓ categories table created';
      END
      ELSE
      BEGIN
        PRINT '✓ categories table already exists';
      END
    `);
        // Remove slug column if exists (deprecated)
        await pool.request().query(`
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'categories' AND COLUMN_NAME = 'slug')
      BEGIN
        ALTER TABLE categories DROP COLUMN slug;
        PRINT '✓ Removed deprecated slug column from categories';
      END
    `);
        // ============================================
        // 2. APPLICATIONS TABLE
        // ============================================
        console.log('📱 Creating applications table...');
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'applications')
      BEGIN
        CREATE TABLE applications (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          url NVARCHAR(1000) NOT NULL,
          status NVARCHAR(50) NOT NULL DEFAULT 'pending',
          view_count INT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          category_id INT NULL,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          image_thumbnail NVARCHAR(MAX) NULL,
          image_small NVARCHAR(MAX) NULL,
          image_path NVARCHAR(500) NULL,
          image_metadata NVARCHAR(MAX) NULL,
          CONSTRAINT FK_applications_category FOREIGN KEY (category_id) REFERENCES categories(id)
        );
        PRINT '✓ applications table created';
      END
      ELSE
      BEGIN
        PRINT '✓ applications table already exists';
      END
    `);
        // Remove deprecated columns from applications
        const deprecatedAppColumns = [
            'type',
            'app_type',
            'department',
            'icon_url',
            'icon_thumbnail',
            'icon_thumbnail_size',
            'slug',
        ];
        for (const col of deprecatedAppColumns) {
            await pool.request().query(`
        IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = '${col}')
        BEGIN
          EXEC('ALTER TABLE applications DROP COLUMN ${col}');
          PRINT '✓ Removed deprecated ${col} column from applications';
        END
      `);
        }
        // ============================================
        // 3. USERS TABLE
        // ============================================
        console.log('👤 Creating users table...');
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
      BEGIN
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(100) NOT NULL UNIQUE,
          email NVARCHAR(200) NOT NULL UNIQUE,
          password_hash NVARCHAR(500) NULL,
          full_name NVARCHAR(200) NULL,
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
        // ============================================
        // 4. BANNERS TABLE
        // ============================================
        console.log('🖼️ Creating banners table...');
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'banners')
      BEGIN
        CREATE TABLE banners (
          id INT IDENTITY(1,1) PRIMARY KEY,
          title NVARCHAR(200) NOT NULL,
          link_url NVARCHAR(2000) NULL,
          is_active BIT NOT NULL DEFAULT 1,
          sort_order INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          image_thumbnail NVARCHAR(MAX) NULL,
          image_small NVARCHAR(MAX) NULL,
          image_path NVARCHAR(500) NULL,
          image_metadata NVARCHAR(MAX) NULL
        );
        PRINT '✓ banners table created';
      END
      ELSE
      BEGIN
        PRINT '✓ banners table already exists';
      END
    `);
        // ============================================
        // 5. TRIPS TABLE
        // ============================================
        console.log('🗺️ Creating trips table...');
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'trips')
      BEGIN
        CREATE TABLE trips (
          id INT IDENTITY(1,1) PRIMARY KEY,
          title NVARCHAR(200) NOT NULL,
          link_url NVARCHAR(2000) NULL,
          is_active BIT NOT NULL DEFAULT 1,
          sort_order INT NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME NOT NULL DEFAULT GETDATE(),
          image_thumbnail NVARCHAR(MAX) NULL,
          image_small NVARCHAR(MAX) NULL,
          image_path NVARCHAR(500) NULL,
          image_metadata NVARCHAR(MAX) NULL
        );
        PRINT '✓ trips table created';
      END
      ELSE
      BEGIN
        PRINT '✓ trips table already exists';
      END
    `);
        // ============================================
        // 6. CREATE INDEXES
        // ============================================
        console.log('\n📊 Creating indexes...');
        const indexes = [
            { name: 'idx_applications_status', table: 'applications', column: 'status' },
            { name: 'idx_applications_category', table: 'applications', column: 'category_id' },
            { name: 'idx_applications_is_active', table: 'applications', column: 'is_active' },
            { name: 'idx_categories_is_active', table: 'categories', column: 'is_active' },
            { name: 'idx_banners_is_active', table: 'banners', column: 'is_active' },
            { name: 'idx_trips_is_active', table: 'trips', column: 'is_active' },
            { name: 'idx_users_username', table: 'users', column: 'username' },
            { name: 'idx_users_email', table: 'users', column: 'email' },
        ];
        for (const idx of indexes) {
            await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.name}' AND object_id = OBJECT_ID('${idx.table}'))
        BEGIN
          CREATE INDEX ${idx.name} ON ${idx.table}(${idx.column});
          PRINT '✓ Created index ${idx.name}';
        END
      `);
        }
        // ============================================
        // 7. CREATE DEFAULT ADMIN USER (if not exists)
        // ============================================
        console.log('\n👤 Checking admin user...');
        const adminCheck = await pool.request().query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'admin'
    `);
        if (adminCheck.recordset[0].count === 0) {
            await pool.request().query(`
        INSERT INTO users (username, email, password_hash, full_name, role, is_active)
        VALUES ('admin', 'admin@appstore.local', '', 'Administrator', 'admin', 1)
      `);
            console.log('✓ Created default admin user (username: admin)');
        }
        else {
            console.log('✓ Admin user already exists');
        }
        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(50));
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log('\n📊 Tables created/verified:');
        console.log('   • categories (without slug)');
        console.log('   • applications (without type/department)');
        console.log('   • users');
        console.log('   • banners');
        console.log('   • trips');
        console.log('\n🧹 Removed deprecated fields:');
        console.log('   • slug (from categories)');
        console.log('   • type, app_type, department (from applications)');
        console.log('   • icon_url, icon_thumbnail, icon_thumbnail_size (from applications)');
        console.log('\n');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
// Run migration
migrate()
    .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
})
    .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
});
