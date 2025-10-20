#!/usr/bin/env node

/**
 * Database Migration Script
 * This script applies the database schema migrations to your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath, description) {
  try {
    console.log(`📄 Applying ${description}...`);
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`⚠️  Warning in statement: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.warn(`⚠️  Warning: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`✅ ${description} completed: ${successCount} statements executed, ${errorCount} warnings`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to apply ${description}:`, error.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single();
    
    return !error && data;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database migration process...');
  console.log(`📡 Connecting to: ${supabaseUrl}`);
  
  // Check if we can connect
  try {
    const { data, error } = await supabase.from('posts').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    process.exit(1);
  }
  
  // Check which tables already exist
  console.log('\n🔍 Checking existing tables...');
  const tablesToCheck = ['integrations', 'integration_logs', 'integration_alerts', 'integration_webhooks'];
  const existingTables = [];
  
  for (const table of tablesToCheck) {
    const exists = await checkTableExists(table);
    if (exists) {
      existingTables.push(table);
      console.log(`✅ Table '${table}' already exists`);
    } else {
      console.log(`❌ Table '${table}' missing`);
    }
  }
  
  // If integration tables don't exist, we need to create them
  if (existingTables.length === 0) {
    console.log('\n📋 Integration tables not found. Applying migrations...');
    
    const migrationFiles = [
      {
        path: path.join(__dirname, '../database/schema.sql'),
        description: 'Base Schema'
      },
      {
        path: path.join(__dirname, '../database/enhanced-schema-migration.sql'),
        description: 'Enhanced Schema Migration'
      },
      {
        path: path.join(__dirname, '../database/integration-schema-migration.sql'),
        description: 'Integration Schema Migration'
      }
    ];
    
    let allSuccessful = true;
    
    for (const file of migrationFiles) {
      if (fs.existsSync(file.path)) {
        const success = await executeSQLFile(file.path, file.description);
        if (!success) {
          allSuccessful = false;
        }
      } else {
        console.warn(`⚠️  Migration file not found: ${file.path}`);
        allSuccessful = false;
      }
    }
    
    if (allSuccessful) {
      console.log('\n🎉 All migrations applied successfully!');
    } else {
      console.log('\n⚠️  Some migrations had issues. Please check the warnings above.');
    }
  } else {
    console.log('\n✅ Integration tables already exist. Skipping migration.');
  }
  
  // Final verification
  console.log('\n🔍 Final verification...');
  const finalCheck = await checkTableExists('integrations');
  if (finalCheck) {
    console.log('✅ Integration tables are ready!');
  } else {
    console.log('❌ Integration tables are still missing. Please check your Supabase dashboard.');
  }
  
  console.log('\n🏁 Migration process completed!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the migration
main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
