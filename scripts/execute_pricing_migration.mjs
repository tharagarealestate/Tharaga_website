import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the migration file
const sql = readFileSync(join(__dirname, 'supabase/migrations/020_pricing_system.sql'), 'utf-8');

// Database connection string for Supabase
// Format: postgresql://postgres:[YOUR-PASSWORD]@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres
const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  console.log('\nPlease set it using:');
  console.log('$env:DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.wedevtjjmdvngyshqdro.supabase.co:5432/postgres"');
  console.log('\nYou can find your database password in Supabase Dashboard > Project Settings > Database');
  process.exit(1);
}

// Use pg library
import pg from 'pg';
const { Client } = pg;

async function executeMigration() {
  const client = new Client({
    connectionString: DB_URL,
  });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected successfully!\n');

    console.log('Executing migration: 020_pricing_system.sql');
    console.log('This may take a few moments...\n');

    // Execute the migration
    const result = await client.query(sql);

    console.log('✅ Migration executed successfully!');
    console.log('\nTables created:');
    console.log('  1. pricing_plans');
    console.log('  2. user_subscriptions');
    console.log('  3. commission_rates');
    console.log('  4. commission_transactions');
    console.log('  5. lawyer_verification_pricing');
    console.log('  6. lawyer_consultation_pricing');
    console.log('  7. affiliate_commission_rates');
    console.log('  8. payment_history');
    console.log('  9. invoices');
    console.log('\nIndexes, triggers, and RLS policies have been created.');
    console.log('Seed data has been inserted.');

  } catch (error) {
    console.error('❌ Error executing migration:');
    console.error('Error message:', error.message);

    if (error.position) {
      const position = parseInt(error.position);
      const snippet = sql.substring(Math.max(0, position - 100), position + 100);
      console.error('\nError near position', error.position);
      console.error('SQL snippet:', snippet);
    }

    if (error.code) {
      console.error('Error code:', error.code);
    }

    console.log('\n\n=== TROUBLESHOOTING ===');
    console.log('If the error persists, you can:');
    console.log('1. Execute the SQL manually in Supabase SQL Editor');
    console.log('2. URL: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new');
    console.log('3. Copy from: supabase/migrations/020_pricing_system.sql');

    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check if pg is installed
try {
  executeMigration();
} catch (error) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('Error: pg module not found');
    console.log('\nPlease install it first:');
    console.log('npm install pg');
    process.exit(1);
  }
  throw error;
}
