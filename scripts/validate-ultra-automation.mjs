/**
 * Validation Script for Ultra Automation System
 * Validates all components before deployment
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const validationResults = {
  passed: [],
  failed: [],
  warnings: []
};

async function validateDatabaseSchema() {
  console.log('\n📊 Validating Database Schema...');
  
  const requiredTables = [
    'property_analysis',
    'buyer_journey',
    'email_sequences',
    'email_sequence_executions',
    'communication_suggestions',
    'property_viewings',
    'negotiations',
    'contracts',
    'deal_lifecycle',
    'conversion_analytics'
  ];

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        validationResults.failed.push(`Table '${table}' does not exist`);
        console.log(`   ❌ ${table} - NOT FOUND`);
      } else {
        validationResults.passed.push(`Table '${table}' exists`);
        console.log(`   ✅ ${table} - EXISTS`);
      }
    } catch (error) {
      validationResults.failed.push(`Table '${table}' check failed: ${error.message}`);
      console.log(`   ❌ ${table} - ERROR: ${error.message}`);
    }
  }
}

async function validateGeneratedLeadsColumns() {
  console.log('\n📋 Validating Generated Leads Enhancements...');
  
  const requiredColumns = [
    'intent_score',
    'buyer_persona',
    'payment_capacity',
    'budget_min',
    'budget_max'
  ];

  try {
    const { data, error } = await supabase
      .from('generated_leads')
      .select('*')
      .limit(1);

    if (error) {
      validationResults.failed.push('Cannot query generated_leads table');
      return;
    }

    // Check if columns exist by checking if we can select them
    for (const column of requiredColumns) {
      try {
        const { error: colError } = await supabase
          .from('generated_leads')
          .select(column)
          .limit(1);

        if (colError) {
          validationResults.failed.push(`Column '${column}' missing from generated_leads`);
          console.log(`   ❌ ${column} - MISSING`);
        } else {
          validationResults.passed.push(`Column '${column}' exists`);
          console.log(`   ✅ ${column} - EXISTS`);
        }
      } catch (err) {
        validationResults.failed.push(`Column '${column}' check failed`);
        console.log(`   ❌ ${column} - ERROR`);
      }
    }
  } catch (error) {
    validationResults.failed.push(`Generated leads validation failed: ${error.message}`);
  }
}

async function validateFiles() {
  console.log('\n📁 Validating Service Files...');
  
  const requiredFiles = [
    'app/lib/services/ultra-automation/layer1-intelligent-leads.ts',
    'app/lib/services/ultra-automation/layer2-buyer-journey.ts',
    'app/lib/services/ultra-automation/layer5-negotiation.ts',
    'app/lib/services/ultra-automation/layer7-lifecycle.ts',
    'app/lib/services/ultra-automation/layer10-analytics.ts',
    'app/lib/services/ultra-automation/orchestrator.ts',
    'app/app/api/properties/ultra-process/route.ts',
    'supabase/migrations/051_ultra_automation_system.sql'
  ];

  const fs = await import('fs');
  const path = await import('path');

  for (const file of requiredFiles) {
    try {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        validationResults.passed.push(`File '${file}' exists`);
        console.log(`   ✅ ${file}`);
      } else {
        validationResults.failed.push(`File '${file}' missing`);
        console.log(`   ❌ ${file} - NOT FOUND`);
      }
    } catch (error) {
      validationResults.failed.push(`File '${file}' check failed`);
      console.log(`   ❌ ${file} - ERROR`);
    }
  }
}

async function validateEnvironmentVariables() {
  console.log('\n🔐 Validating Environment Variables...');
  
  const required = [
    'ANTHROPIC_API_KEY',
    'RESEND_API_KEY'
  ];

  const optional = [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'CRON_SECRET'
  ];

  for (const env of required) {
    if (process.env[env] || process.env[env.replace('ANTHROPIC', 'CLAUDE')]) {
      validationResults.passed.push(`Environment variable '${env}' is set`);
      console.log(`   ✅ ${env}`);
    } else {
      validationResults.failed.push(`Environment variable '${env}' is missing`);
      console.log(`   ❌ ${env} - MISSING`);
    }
  }

  for (const env of optional) {
    if (process.env[env]) {
      validationResults.passed.push(`Environment variable '${env}' is set`);
      console.log(`   ✅ ${env}`);
    } else {
      validationResults.warnings.push(`Environment variable '${env}' is not set (optional)`);
      console.log(`   ⚠️  ${env} - NOT SET (optional)`);
    }
  }
}

async function runValidation() {
  console.log('🔍 ULTRA AUTOMATION SYSTEM VALIDATION');
  console.log('='.repeat(70));

  await validateFiles();
  await validateEnvironmentVariables();
  await validateDatabaseSchema();
  await validateGeneratedLeadsColumns();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${validationResults.passed.length}`);
  console.log(`❌ Failed: ${validationResults.failed.length}`);
  console.log(`⚠️  Warnings: ${validationResults.warnings.length}`);

  if (validationResults.failed.length > 0) {
    console.log('\n❌ FAILED CHECKS:');
    validationResults.failed.forEach(fail => console.log(`   - ${fail}`));
  }

  if (validationResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    validationResults.warnings.forEach(warn => console.log(`   - ${warn}`));
  }

  if (validationResults.failed.length === 0) {
    console.log('\n✅ ALL VALIDATIONS PASSED! System is ready for deployment.');
    process.exit(0);
  } else {
    console.log('\n❌ VALIDATION FAILED! Please fix the issues above.');
    process.exit(1);
  }
}

runValidation().catch(error => {
  console.error('💥 Validation script failed:', error);
  process.exit(1);
});

