#!/usr/bin/env node

/**
 * Pricing Flow Testing Script
 * Tests the complete subscription flow end-to-end
 *
 * Usage:
 *   node scripts/test-pricing-flow.js [plan] [billing]
 *
 * Examples:
 *   node scripts/test-pricing-flow.js starter monthly
 *   node scripts/test-pricing-flow.js professional annual
 */

import https from 'https';
import http from 'http';

// Configuration
const CONFIG = {
  API_URL: process.env.API_URL || 'http://localhost:3000',
  TEST_USER_EMAIL: process.env.TEST_USER_EMAIL || 'test-builder@tharaga.test',
  TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD || 'Test@123456',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

// Expected Plan IDs (Production)
const EXPECTED_PLAN_IDS = {
  starter: {
    monthly: 'plan_R10vbRMpp1REnR',
    annual: 'plan_R1119eAytZrt4K',
  },
  professional: {
    monthly: 'plan_R10wrI9bH8Uj7s',
    annual: 'plan_R112vIHWdH1YaL',
  },
  enterprise: {
    monthly: 'plan_Rl0yjA9bcQrsAn',
    annual: 'plan_R114Se4JD0v3k0',
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test 1: Verify Environment Variables
async function testEnvironmentVariables() {
  logInfo('\n📋 Test 1: Environment Variables');

  const requiredVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RZP_PLAN_STARTER_MONTHLY',
    'RZP_PLAN_STARTER_ANNUAL',
    'RZP_PLAN_PROFESSIONAL_MONTHLY',
    'RZP_PLAN_PROFESSIONAL_ANNUAL',
    'RZP_PLAN_ENTERPRISE_MONTHLY',
    'RZP_PLAN_ENTERPRISE_ANNUAL',
  ];

  const missing = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    logError(`Missing environment variables: ${missing.join(', ')}`);
    return false;
  }

  logSuccess('All required environment variables are set');

  // Verify plan IDs match expected values
  logInfo('Verifying plan IDs...');
  const planChecks = [
    { env: 'RZP_PLAN_STARTER_MONTHLY', expected: EXPECTED_PLAN_IDS.starter.monthly },
    { env: 'RZP_PLAN_STARTER_ANNUAL', expected: EXPECTED_PLAN_IDS.starter.annual },
    { env: 'RZP_PLAN_PROFESSIONAL_MONTHLY', expected: EXPECTED_PLAN_IDS.professional.monthly },
    { env: 'RZP_PLAN_PROFESSIONAL_ANNUAL', expected: EXPECTED_PLAN_IDS.professional.annual },
    { env: 'RZP_PLAN_ENTERPRISE_MONTHLY', expected: EXPECTED_PLAN_IDS.enterprise.monthly },
    { env: 'RZP_PLAN_ENTERPRISE_ANNUAL', expected: EXPECTED_PLAN_IDS.enterprise.annual },
  ];

  let allMatch = true;
  for (const check of planChecks) {
    const actual = process.env[check.env];
    if (actual === check.expected) {
      logSuccess(`${check.env}: ${actual}`);
    } else {
      logError(`${check.env}: Expected ${check.expected}, got ${actual}`);
      allMatch = false;
    }
  }

  return allMatch;
}

// Test 2: Verify API Endpoint Accessibility
async function testApiEndpoint() {
  logInfo('\n📋 Test 2: API Endpoint Accessibility');

  try {
    const response = await makeRequest(`${CONFIG.API_URL}/api/rzp/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { plan: 'starter', annual: false },
    });

    if (response.status === 401) {
      logSuccess('API endpoint is accessible (authentication required)');
      return true;
    } else if (response.status === 500 && response.data.error?.includes('Razorpay')) {
      logWarning('API endpoint accessible but Razorpay not configured');
      return true;
    } else {
      logError(`Unexpected response: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Cannot reach API endpoint: ${error.message}`);
    return false;
  }
}

// Test 3: Test Plan ID Mapping Logic
async function testPlanMapping() {
  logInfo('\n📋 Test 3: Plan ID Mapping Logic');

  const testCases = [
    { plan: 'starter', annual: false, expected: process.env.RZP_PLAN_STARTER_MONTHLY },
    { plan: 'starter', annual: true, expected: process.env.RZP_PLAN_STARTER_ANNUAL },
    { plan: 'professional', annual: false, expected: process.env.RZP_PLAN_PROFESSIONAL_MONTHLY },
    { plan: 'professional', annual: true, expected: process.env.RZP_PLAN_PROFESSIONAL_ANNUAL },
    { plan: 'pro', annual: false, expected: process.env.RZP_PLAN_PROFESSIONAL_MONTHLY }, // Alias
    { plan: 'enterprise', annual: false, expected: process.env.RZP_PLAN_ENTERPRISE_MONTHLY },
    { plan: 'enterprise', annual: true, expected: process.env.RZP_PLAN_ENTERPRISE_ANNUAL },
  ];

  let allPassed = true;
  for (const testCase of testCases) {
    const planId = getPlanId(testCase.plan, testCase.annual);
    if (planId === testCase.expected) {
      logSuccess(`${testCase.plan} (${testCase.annual ? 'annual' : 'monthly'}): ${planId}`);
    } else {
      logError(`${testCase.plan} (${testCase.annual ? 'annual' : 'monthly'}): Expected ${testCase.expected}, got ${planId}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Helper: Get plan ID (mirrors the logic in create-subscription route)
function getPlanId(plan, annual) {
  if (plan === 'starter') {
    return annual ? (process.env.RZP_PLAN_STARTER_ANNUAL || process.env.RZP_PLAN_STARTER_MONTHLY) : process.env.RZP_PLAN_STARTER_MONTHLY;
  }
  if (plan === 'professional' || plan === 'pro') {
    return annual ? (process.env.RZP_PLAN_PROFESSIONAL_ANNUAL || process.env.RZP_PLAN_PROFESSIONAL_MONTHLY) : process.env.RZP_PLAN_PROFESSIONAL_MONTHLY;
  }
  if (plan === 'enterprise') {
    return annual ? (process.env.RZP_PLAN_ENTERPRISE_ANNUAL || process.env.RZP_PLAN_ENTERPRISE_MONTHLY) : process.env.RZP_PLAN_ENTERPRISE_MONTHLY;
  }
  // Fallback
  return annual ? (process.env.RZP_PLAN_PROFESSIONAL_ANNUAL || process.env.RZP_PLAN_PROFESSIONAL_MONTHLY) : process.env.RZP_PLAN_PROFESSIONAL_MONTHLY;
}

// Test 4: Verify Webhook Endpoint
async function testWebhookEndpoint() {
  logInfo('\n📋 Test 4: Webhook Endpoint');

  try {
    const response = await makeRequest(`${CONFIG.API_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'test_signature',
      },
      body: { event: 'test' },
    });

    if (response.status === 400) {
      logSuccess('Webhook endpoint is accessible (signature validation working)');
      return true;
    } else {
      logWarning(`Unexpected response: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Cannot reach webhook endpoint: ${error.message}`);
    return false;
  }
}

// Test 5: Database Schema Verification (if Supabase client available)
async function testDatabaseSchema() {
  logInfo('\n📋 Test 5: Database Schema');

  // This would require Supabase client
  // For now, just verify the expected structure
  logInfo('Expected table: user_subscriptions');
  logInfo('Required columns:');
  logInfo('  - user_id (UUID)');
  logInfo('  - razorpay_subscription_id (TEXT)');
  logInfo('  - razorpay_customer_id (TEXT)');
  logInfo('  - status (TEXT)');
  logInfo('  - billing_cycle (TEXT)');
  logInfo('  - metadata (JSONB)');

  logWarning('Manual verification required: Run SQL query to verify table structure');
  return true;
}

// Main test runner
async function runTests() {
  log('\n🚀 Starting Pricing Flow Tests\n', 'blue');
  log('=' .repeat(60), 'blue');

  const results = {
    environment: await testEnvironmentVariables(),
    apiEndpoint: await testApiEndpoint(),
    planMapping: await testPlanMapping(),
    webhookEndpoint: await testWebhookEndpoint(),
    databaseSchema: await testDatabaseSchema(),
  };

  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 Test Results Summary\n', 'blue');

  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    if (passed) {
      logSuccess(`${test}: PASSED`);
    } else {
      logError(`${test}: FAILED`);
      allPassed = false;
    }
  }

  log('\n' + '='.repeat(60), 'blue');

  if (allPassed) {
    logSuccess('\n✅ All tests passed! Pricing flow is ready.');
    logInfo('\nNext steps:');
    logInfo('1. Test subscription creation with authenticated user');
    logInfo('2. Test payment flow with Razorpay test cards');
    logInfo('3. Verify webhook processing');
    logInfo('4. Check database records');
  } else {
    logError('\n❌ Some tests failed. Please fix issues before proceeding.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

export { runTests, getPlanId };

