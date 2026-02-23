// =============================================
// VALIDATE AUTOMATION SYSTEM
// Comprehensive validation script
// =============================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Validating Automation System');
console.log('================================\n');

let errors = [];
let warnings = [];
let success = [];

// 1. Check migration file exists
console.log('1️⃣ Checking migration file...');
try {
  const migrationPath = join(__dirname, 'supabase', 'migrations', '025_automation_system.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  // Check for required tables
  const hasAutomations = migrationSQL.includes('CREATE TABLE') && migrationSQL.includes('automations');
  const hasExecutions = migrationSQL.includes('automation_executions');
  const hasQueue = migrationSQL.includes('automation_queue');
  
  if (hasAutomations && hasExecutions && hasQueue) {
    success.push('Migration file contains all required tables');
    console.log('   ✅ Migration file valid');
  } else {
    errors.push('Migration file missing required tables');
    console.log('   ❌ Migration file invalid');
  }
} catch (error) {
  errors.push(`Migration file not found: ${error.message}`);
  console.log('   ❌ Migration file not found');
}
console.log('');

// 2. Check API routes exist
console.log('2️⃣ Checking API routes...');
const apiRoutes = [
  'app/app/api/automations/route.ts',
  'app/app/api/automations/[id]/route.ts',
  'app/app/api/automations/[id]/execute/route.ts'
];

apiRoutes.forEach(route => {
  try {
    const routePath = join(__dirname, route);
    const routeContent = readFileSync(routePath, 'utf-8');
    
    if (route.includes('[id]')) {
      if (routeContent.includes('GET') && routeContent.includes('PATCH') && routeContent.includes('DELETE')) {
        success.push(`API route ${route} has all methods`);
        console.log(`   ✅ ${route} - Complete`);
      } else {
        warnings.push(`API route ${route} may be missing methods`);
        console.log(`   ⚠️  ${route} - Incomplete`);
      }
    } else {
      if (routeContent.includes('GET') && routeContent.includes('POST')) {
        success.push(`API route ${route} has GET and POST`);
        console.log(`   ✅ ${route} - Complete`);
      } else {
        warnings.push(`API route ${route} may be missing methods`);
        console.log(`   ⚠️  ${route} - Incomplete`);
      }
    }
  } catch (error) {
    errors.push(`API route ${route} not found: ${error.message}`);
    console.log(`   ❌ ${route} - Not found`);
  }
});
console.log('');

// 3. Check queue system
console.log('3️⃣ Checking queue system...');
try {
  const queuePath = join(__dirname, 'app', 'lib', 'automation', 'queue', 'automationQueue.ts');
  const queueContent = readFileSync(queuePath, 'utf-8');
  
  const requiredMethods = [
    'queueAutomation',
    'getPendingJobs',
    'markProcessing',
    'markCompleted',
    'markFailed'
  ];
  
  const missingMethods = requiredMethods.filter(method => !queueContent.includes(method));
  
  if (missingMethods.length === 0) {
    success.push('Queue system has all required methods');
    console.log('   ✅ Queue system complete');
  } else {
    errors.push(`Queue system missing methods: ${missingMethods.join(', ')}`);
    console.log(`   ❌ Queue system missing: ${missingMethods.join(', ')}`);
  }
} catch (error) {
  errors.push(`Queue system not found: ${error.message}`);
  console.log('   ❌ Queue system not found');
}
console.log('');

// 4. Check components
console.log('4️⃣ Checking UI components...');
const components = [
  'app/components/automation/FieldSelector.tsx',
  'app/components/automation/OperatorSelector.tsx',
  'app/components/automation/ValueInput.tsx',
  'app/components/automation/TemplateSelector.tsx',
  'app/components/automation/ConditionTester.tsx',
  'app/components/automation/ConditionBuilder.tsx',
  'app/components/automation/ConditionGroup.tsx',
  'app/components/automation/ConditionRow.tsx'
];

components.forEach(component => {
  try {
    const componentPath = join(__dirname, component);
    readFileSync(componentPath, 'utf-8');
    success.push(`Component ${component} exists`);
    console.log(`   ✅ ${component.split('/').pop()}`);
  } catch (error) {
    errors.push(`Component ${component} not found`);
    console.log(`   ❌ ${component.split('/').pop()} - Not found`);
  }
});
console.log('');

// 5. Check for builder_id usage
console.log('5️⃣ Checking builder_id usage...');
try {
  const apiPath = join(__dirname, 'app', 'app', 'api', 'automations');
  const { readdirSync, readFileSync: readFile } = await import('fs');
  const files = readdirSync(apiPath, { recursive: true });
  
  let builderIdCount = 0;
  let organizationIdCount = 0;
  
  files.forEach(file => {
    if (file.endsWith('.ts')) {
      const content = readFileSync(join(apiPath, file), 'utf-8');
      if (content.includes('builder_id')) builderIdCount++;
      if (content.includes('organization_id')) organizationIdCount++;
    }
  });
  
  if (builderIdCount > 0 && organizationIdCount === 0) {
    success.push('All API routes use builder_id (correct)');
    console.log('   ✅ Using builder_id correctly');
  } else if (organizationIdCount > 0) {
    warnings.push('Some routes still use organization_id');
    console.log('   ⚠️  Found organization_id usage');
  }
} catch (error) {
  warnings.push(`Could not check builder_id usage: ${error.message}`);
  console.log('   ⚠️  Could not verify');
}
console.log('');

// Summary
console.log('\n📊 Validation Summary');
console.log('====================\n');
console.log(`✅ Success: ${success.length} checks passed`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}\n`);

if (success.length > 0) {
  console.log('✅ Successful Checks:');
  success.slice(0, 5).forEach(msg => console.log(`   • ${msg}`));
  if (success.length > 5) console.log(`   ... and ${success.length - 5} more`);
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(msg => console.log(`   • ${msg}`));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(msg => console.log(`   • ${msg}`));
  console.log('');
  process.exit(1);
} else {
  console.log('✅ ✅ ✅ ALL VALIDATIONS PASSED! ✅ ✅ ✅\n');
  console.log('Next Steps:');
  console.log('1. Execute migration: See MIGRATION_EXECUTION_GUIDE.md');
  console.log('2. Test API routes: node test_automation_api.mjs');
  console.log('3. Start your development server and test the UI\n');
  process.exit(0);
}

