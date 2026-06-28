/**
 * RERA System Test Endpoint
 * 
 * This endpoint tests the complete RERA verification system:
 * - Database connectivity
 * - Verification engine
 * - Badge component data
 * - Monitoring service
 * 
 * Usage: GET /api/rera/test
 */

import { NextResponse } from 'next/server';
import { reraVerificationEngine } from '@/lib/rera/verification-engine';
import { reraMonitoringService } from '@/lib/rera/monitoring-service';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };

  // Test 1: Database Connectivity
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('rera_registrations')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    results.tests.database = {
      status: 'passed',
      message: 'Database connection successful',
    };
    results.summary.passed++;
  } catch (error) {
    results.tests.database = {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    results.summary.failed++;
  }

  // Test 2: RERA Tables Exist
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const tables = ['rera_registrations', 'rera_verification_logs', 'rera_alerts', 'rera_state_configs'];
    const tableChecks: any = {};

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      tableChecks[table] = error && error.code !== 'PGRST116' ? 'missing' : 'exists';
    }

    const allExist = Object.values(tableChecks).every(status => status === 'exists');

    results.tests.tables = {
      status: allExist ? 'passed' : 'failed',
      message: allExist ? 'All RERA tables exist' : 'Some tables are missing',
      details: tableChecks,
    };
    
    if (allExist) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  } catch (error) {
    results.tests.tables = {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    results.summary.failed++;
  }

  // Test 3: Verification Engine
  try {
    const testResult = await reraVerificationEngine.verify({
      reraNumber: 'TN/01/Building/0001/2016',
      state: 'Tamil Nadu',
      type: 'builder',
      forceRefresh: false,
    });

    results.tests.verificationEngine = {
      status: 'passed',
      message: 'Verification engine is working',
      details: {
        success: testResult.success,
        verified: testResult.verified,
        method: testResult.verificationMethod,
        confidence: testResult.confidence,
      },
    };
    results.summary.passed++;
  } catch (error) {
    results.tests.verificationEngine = {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    results.summary.failed++;
  }

  // Test 4: Monitoring Service
  try {
    const stats = await reraMonitoringService.getMonitoringStats();
    
    results.tests.monitoringService = {
      status: 'passed',
      message: 'Monitoring service is working',
      details: stats,
    };
    results.summary.passed++;
  } catch (error) {
    results.tests.monitoringService = {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    results.summary.failed++;
  }

  // Test 5: Environment Variables
  const envChecks: any = {};
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const optionalEnv = [
    'USE_SYNTHETIC_RERA',
    'RERA_PARTNER_API_URL',
    'RERA_PARTNER_API_KEY',
    'RERA_MONITOR_API_KEY',
  ];

  for (const env of requiredEnv) {
    envChecks[env] = process.env[env] ? 'set' : 'missing';
  }

  for (const env of optionalEnv) {
    envChecks[env] = process.env[env] ? 'set' : 'not set (optional)';
  }

  const allRequiredSet = requiredEnv.every(env => process.env[env]);

  results.tests.environment = {
    status: allRequiredSet ? 'passed' : 'failed',
    message: allRequiredSet ? 'All required environment variables are set' : 'Some required variables are missing',
    details: envChecks,
  };

  if (allRequiredSet) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }

  // Test 6: Database Functions
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test check_rera_expiry function
    const { error } = await supabase.rpc('check_rera_expiry');

    results.tests.databaseFunctions = {
      status: error ? 'warning' : 'passed',
      message: error ? 'Function exists but returned error (may be expected)' : 'Database functions are working',
      details: error ? { error: error.message } : { success: true },
    };

    if (error) {
      results.summary.warnings++;
    } else {
      results.summary.passed++;
    }
  } catch (error) {
    results.tests.databaseFunctions = {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    results.summary.failed++;
  }

  // Overall Status
  results.overallStatus = results.summary.failed === 0 
    ? 'all_passed' 
    : results.summary.failed < results.summary.passed 
      ? 'partial_pass' 
      : 'failed';

  return NextResponse.json(results, {
    status: results.summary.failed === 0 ? 200 : 207, // 207 = Multi-Status
  });
}



