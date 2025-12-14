#!/usr/bin/env node

/**
 * Neon Database Migration Script
 *
 * This script applies database migrations to your Neon database.
 * It reads the migration files and executes them in order.
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env, .env.local, or .env.production
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.production' });

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.VITE_NEON_DATABASE_URL || process.env.VITE_DATABASE_URL;

if (!databaseUrl) {
  console.error(
    '❌ Error: No database URL found. Please set VITE_NEON_DATABASE_URL or DATABASE_URL environment variable.'
  );
  process.exit(1);
}

// Create database connection
const sql = postgres(databaseUrl, {
  ssl: 'require',
  max: 1, // Use single connection for migrations
  idle_timeout: 20,
  connect_timeout: 10,
});

async function applyMigrations() {
  try {
    console.log('🚀 Starting Neon database migrations...');

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'database',
      'neon-complete-migration.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Error: Migration file not found at ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Reading migration file...');
    console.log(`📁 Migration file: ${migrationPath}`);

    // Execute the entire migration file as one transaction
    console.log('⏳ Executing migration...');
    await sql.unsafe(migrationSQL);
    console.log('✅ Migration executed successfully');

    console.log('🎉 All migrations completed successfully!');

    // Verify the tables were created
    console.log('🔍 Verifying table creation...');

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'integration%'
      ORDER BY table_name
    `;

    console.log('📋 Created tables:');
    tables.forEach((table) => {
      console.log(`  ✅ ${table.table_name}`);
    });

    // Check if sample data was inserted
    const integrationCount = await sql`SELECT COUNT(*) as count FROM integrations`;
    console.log(`📊 Sample integrations: ${integrationCount[0].count}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run migrations
applyMigrations().catch(console.error);
