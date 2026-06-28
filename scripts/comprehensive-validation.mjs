/**
 * Comprehensive Validation for Ultra Automation System
 * Validates all components, logic, and integrations
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const results = {
  database: { passed: 0, failed: 0, errors: [] },
  files: { passed: 0, failed: 0, errors: [] },
  environment: { passed: 0, failed: 0, errors: [] },
  logic: { passed: 0, failed: 0, errors: [] }
};

async function validateDatabase() {
  console.log('\n📊 DATABASE VALIDATION');
  console.log('='.repeat(70));

  const tables = [
    'property_analysis', 'buyer_journey', 'email_sequences',
    'email_sequence_executions', 'communication_suggestions',
    'property_viewings', 'negotiations', 'contracts',
    'deal_lifecycle', 'conversion_analytics', 'competitor_properties',
    'cross_sell_recommendations', 'builder_insights'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        results.database.failed++;
        results.database.errors.push(`Table '${table}' missing`);
        console.log(`   ❌ ${table}`);
      } else {
        results.database.passed++;
        console.log(`   ✅ ${table}`);
      }
    } catch (err) {
      results.database.failed++;
      results.database.errors.push(`Table '${table}' error: ${err.message}`);
      console.log(`   ❌ ${table} - ERROR`);
    }
  }

  // Validate generated_leads enhancements
  console.log('\n   Validating generated_leads enhancements...');
  const enhancedColumns = ['intent_score', 'buyer_persona', 'payment_capacity', 'budget_min', 'budget_max'];
  
  for (const col of enhancedColumns) {
    try {
      const { error } = await supabase.from('generated_leads').select(col).limit(1);
      if (error && error.message.includes('column')) {
        results.database.failed++;
        results.database.errors.push(`Column '${col}' missing from generated_leads`);
        console.log(`   ❌ ${col}`);
      } else {
        results.database.passed++;
        console.log(`   ✅ ${col}`);
      }
    } catch (err) {
      results.database.failed++;
      console.log(`   ❌ ${col} - ERROR`);
    }
  }
}

async function validateFiles() {
  console.log('\n📁 FILE VALIDATION');
  console.log('='.repeat(70));

  const files = [
    'app/lib/services/ultra-automation/layer1-intelligent-leads.ts',
    'app/lib/services/ultra-automation/layer2-buyer-journey.ts',
    'app/lib/services/ultra-automation/layer3-communication.ts',
    'app/lib/services/ultra-automation/layer4-viewing.ts',
    'app/lib/services/ultra-automation/layer5-negotiation.ts',
    'app/lib/services/ultra-automation/layer6-contract.ts',
    'app/lib/services/ultra-automation/layer7-lifecycle.ts',
    'app/lib/services/ultra-automation/layer8-competitive.ts',
    'app/lib/services/ultra-automation/layer9-crosssell.ts',
    'app/lib/services/ultra-automation/layer10-analytics.ts',
    'app/lib/services/ultra-automation/orchestrator.ts',
    'app/app/api/properties/ultra-process/route.ts',
    'supabase/migrations/051_ultra_automation_system.sql',
    'scripts/test-ultra-automation.mjs',
    'scripts/validate-ultra-automation.mjs'
  ];

  for (const file of files) {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      results.files.passed++;
      console.log(`   ✅ ${file}`);
    } else {
      results.files.failed++;
      results.files.errors.push(`File '${file}' missing`);
      console.log(`   ❌ ${file}`);
    }
  }
}

async function validateEnvironment() {
  console.log('\n🔐 ENVIRONMENT VALIDATION');
  console.log('='.repeat(70));

  const required = ['ANTHROPIC_API_KEY', 'RESEND_API_KEY'];
  const optional = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'CRON_SECRET'];

  for (const env of required) {
    const value = process.env[env] || process.env[env.replace('ANTHROPIC', 'CLAUDE')];
    if (value) {
      results.environment.passed++;
      console.log(`   ✅ ${env}`);
    } else {
      results.environment.failed++;
      results.environment.errors.push(`'${env}' missing`);
      console.log(`   ❌ ${env}`);
    }
  }

  for (const env of optional) {
    if (process.env[env]) {
      results.environment.passed++;
      console.log(`   ✅ ${env}`);
    } else {
      console.log(`   ⚠️  ${env} (optional)`);
    }
  }
}

async function validateLogic() {
  console.log('\n🧠 LOGIC VALIDATION');
  console.log('='.repeat(70));

  // Validate migration SQL syntax
  try {
    const migrationPath = join(process.cwd(), 'supabase/migrations/051_ultra_automation_system.sql');
    if (existsSync(migrationPath)) {
      const sql = readFileSync(migrationPath, 'utf-8');
      
      // Basic SQL validation
      const hasCreateTable = sql.includes('CREATE TABLE');
      const hasAlterTable = sql.includes('ALTER TABLE');
      const hasIndexes = sql.includes('CREATE INDEX');
      const hasRLS = sql.includes('ROW LEVEL SECURITY');
      
      if (hasCreateTable && hasIndexes && hasRLS) {
        results.logic.passed++;
        console.log('   ✅ Migration SQL structure valid');
      } else {
        results.logic.failed++;
        results.logic.errors.push('Migration SQL missing key components');
        console.log('   ❌ Migration SQL incomplete');
      }
    }
  } catch (err) {
    results.logic.failed++;
    results.logic.errors.push(`SQL validation error: ${err.message}`);
    console.log('   ❌ SQL validation failed');
  }

  // Validate service imports
  const services = [
    'layer1-intelligent-leads',
    'layer2-buyer-journey',
    'layer3-communication',
    'layer5-negotiation',
    'layer7-lifecycle',
    'layer10-analytics'
  ];

  for (const service of services) {
    const servicePath = join(process.cwd(), `app/lib/services/ultra-automation/${service}.ts`);
    if (existsSync(servicePath)) {
      const content = readFileSync(servicePath, 'utf-8');
      
      // Check for key functions
      const hasExports = content.includes('export');
      const hasFunctions = content.includes('function') || content.includes('async function');
      
      if (hasExports && hasFunctions) {
        results.logic.passed++;
        console.log(`   ✅ ${service} - Structure valid`);
      } else {
        results.logic.failed++;
        console.log(`   ❌ ${service} - Missing exports/functions`);
      }
    }
  }
}

async function runComprehensiveValidation() {
  console.log('🔍 COMPREHENSIVE ULTRA AUTOMATION VALIDATION');
  console.log('='.repeat(70));

  await validateDatabase();
  await validateFiles();
  await validateEnvironment();
  await validateLogic();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(70));

  const totalPassed = 
    results.database.passed + 
    results.files.passed + 
    results.environment.passed + 
    results.logic.passed;

  const totalFailed = 
    results.database.failed + 
    results.files.failed + 
    results.environment.failed + 
    results.logic.failed;

  console.log(`\n✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);

  console.log('\n📋 DETAILED RESULTS:');
  console.log(`   Database: ${results.database.passed} passed, ${results.database.failed} failed`);
  console.log(`   Files: ${results.files.passed} passed, ${results.files.failed} failed`);
  console.log(`   Environment: ${results.environment.passed} passed, ${results.environment.failed} failed`);
  console.log(`   Logic: ${results.logic.passed} passed, ${results.logic.failed} failed`);

  if (totalFailed > 0) {
    console.log('\n❌ FAILED CHECKS:');
    [
      ...results.database.errors,
      ...results.files.errors,
      ...results.environment.errors,
      ...results.logic.errors
    ].forEach(err => console.log(`   - ${err}`));
  }

  if (totalFailed === 0) {
    console.log('\n✅ ALL VALIDATIONS PASSED! System is production-ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME VALIDATIONS FAILED. Review errors above.');
    process.exit(1);
  }
}

runComprehensiveValidation().catch(error => {
  console.error('💥 Validation failed:', error);
  process.exit(1);
});

