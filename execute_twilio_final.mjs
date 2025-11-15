#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read SQL file
const sqlPath = join(__dirname, 'supabase/migrations/022_twilio_messaging.sql');
const sql = readFileSync(sqlPath, 'utf-8');

// Database URL from .env
const DATABASE_URL = 'postgresql://postgres:@6Tharagarealestate@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres';

console.log('🚀 Executing Twilio Messaging Migration\n');
console.log('📝 Loading migration file...\n');

async function executeMigration() {
  try {
    // Try to import pg
    const { default: pg } = await import('pg');
    const { Client } = pg;

    console.log('🔌 Connecting to Supabase database...');
    
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('⚡ Executing migration SQL...');
    console.log('This may take a few moments...\n');
    
    await client.query(sql);

    console.log('\n✅ ✅ ✅ MIGRATION SUCCESSFUL! ✅ ✅ ✅\n');
    console.log('📊 Successfully created/updated:');
    console.log('   ✓ message_templates table');
    console.log('   ✓ message_campaigns table');
    console.log('   ✓ Updated lead_interactions table');
    console.log('   ✓ RLS policies');
    console.log('   ✓ Indexes');
    console.log('   ✓ Triggers\n');
    console.log('🎉 Twilio messaging system is now ready to use!\n');

    await client.end();
    process.exit(0);

  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('📦 Installing pg package...\n');
      const { execSync } = await import('child_process');
      execSync('npm install pg', { stdio: 'inherit', cwd: __dirname });
      console.log('\n✅ Installed! Retrying...\n');
      await executeMigration();
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('\n❌ Network connection failed:', error.message);
      console.error('\n⚠️  This is likely due to IPv6 network restrictions.');
      console.log('\n📋 Please execute manually via Supabase Dashboard:\n');
      console.log('1. Open: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new');
      console.log('2. Copy SQL from: supabase/migrations/022_twilio_messaging.sql');
      console.log('3. Paste and click "Run"\n');
      process.exit(1);
    } else {
      console.error('\n❌ Migration failed:', error.message);
      if (error.position) {
        const position = parseInt(error.position);
        const snippet = sql.substring(Math.max(0, position - 200), position + 200);
        console.error('\nError at position:', error.position);
        console.error('SQL snippet:', snippet);
      }
      process.exit(1);
    }
  }
}

executeMigration();


