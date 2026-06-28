/**
 * End-to-End Test Script for RERA Verification System
 * 
 * Tests:
 * 1. API endpoint /api/rera/verify
 * 2. Partner API service
 * 3. Verification engine
 * 4. Database integration
 */

import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: any) {
  testResults.push({ name, passed, error, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (error) console.log(`   Error: ${error}`);
  if (details) console.log(`   Details:`, JSON.stringify(details, null, 2));
}

async function testVerificationAPI() {
  console.log('\n=== Testing /api/rera/verify ===');
  
  try {
    // Test 1: Valid RERA number format
    const testReraNumber = 'TN/01/Building/12345/2024';
    const response = await fetch(`${API_BASE_URL}/api/rera/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reraNumber: testReraNumber,
        state: 'Tamil Nadu',
        type: 'builder',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      logTest('POST /api/rera/verify - Valid Request', true, undefined, {
        verified: data.verified,
        method: data.verificationMethod,
        confidence: data.confidence,
      });
    } else {
      logTest('POST /api/rera/verify - Valid Request', false, data.error || 'Request failed');
    }

    // Test 2: Invalid RERA number
    const invalidResponse = await fetch(`${API_BASE_URL}/api/rera/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reraNumber: 'INVALID',
        state: 'Tamil Nadu',
      }),
    });

    const invalidData = await invalidResponse.json();
    logTest('POST /api/rera/verify - Invalid Format', !invalidResponse.ok, undefined, {
      error: invalidData.error,
    });

    // Test 3: GET endpoint
    const getResponse = await fetch(`${API_BASE_URL}/api/rera/verify?reraNumber=${testReraNumber}&state=Tamil%20Nadu`);
    const getData = await getResponse.json();
    logTest('GET /api/rera/verify', getResponse.ok, undefined, {
      verified: getData.verified,
    });

  } catch (error) {
    logTest('POST /api/rera/verify - Network Error', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testPartnerAPIService() {
  console.log('\n=== Testing Partner API Service ===');
  
  try {
    const { reraPartnerAPIService } = await import('../lib/rera/partner-api-service');
    
    // Test verification
    const result = await reraPartnerAPIService.verify({
      rera_number: 'TN/01/Building/12345/2024',
      state: 'Tamil Nadu',
      type: 'builder',
    });

    logTest('Partner API - verify()', true, undefined, {
      found: result.found,
      source: result.source,
      cached: result.cached,
    });

    // Test stats
    const stats = await reraPartnerAPIService.getStats();
    logTest('Partner API - getStats()', true, undefined, stats);

  } catch (error) {
    logTest('Partner API Service', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testVerificationEngine() {
  console.log('\n=== Testing Verification Engine ===');
  
  try {
    const { reraVerificationEngine } = await import('../lib/rera/verification-engine');
    
    const result = await reraVerificationEngine.verify({
      reraNumber: 'TN/01/Building/12345/2024',
      state: 'Tamil Nadu',
      type: 'builder',
    });

    logTest('Verification Engine - verify()', result.success, result.error, {
      verified: result.verified,
      method: result.verificationMethod,
      confidence: result.confidence,
      source: result.source,
    });

  } catch (error) {
    logTest('Verification Engine', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logTest('Database Connection', false, 'Supabase credentials not configured');
    return;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Test query
    const { data, error } = await supabase
      .from('rera_registrations')
      .select('id')
      .limit(1);

    if (error) {
      logTest('Database Connection', false, error.message);
    } else {
      logTest('Database Connection', true, undefined, {
        tableExists: true,
        sampleCount: data?.length || 0,
      });
    }

    // Test if tables exist
    const tables = ['rera_registrations', 'rera_verification_logs', 'rera_alerts', 'rera_state_configs'];
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      logTest(`Table: ${table}`, !tableError, tableError?.message);
    }

  } catch (error) {
    logTest('Database Connection', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testMonitoringService() {
  console.log('\n=== Testing Monitoring Service ===');
  
  try {
    const { RERAMonitoringService } = await import('../lib/rera/monitoring-service');
    const monitoringService = new RERAMonitoringService();
    
    // Test check expiring registrations
    const expiring = await monitoringService.checkExpiringRegistrations();
    logTest('Monitoring - checkExpiringRegistrations()', true, undefined, {
      count: expiring.length,
    });

    // Test statistics
    const stats = await monitoringService.getStatistics();
    logTest('Monitoring - getStatistics()', true, undefined, stats);

  } catch (error) {
    logTest('Monitoring Service', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function runAllTests() {
  console.log('🚀 Starting RERA System End-to-End Tests\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL ? 'Configured' : 'Not configured'}\n`);

  await testDatabaseConnection();
  await testPartnerAPIService();
  await testVerificationEngine();
  await testVerificationAPI();
  await testMonitoringService();

  // Summary
  console.log('\n=== Test Summary ===');
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  const total = testResults.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\nFailed Tests:');
    testResults
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error || 'Unknown error'}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests, testResults };

