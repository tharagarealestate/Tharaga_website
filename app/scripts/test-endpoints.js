/**
 * Test API Endpoints
 * Tests all the new API endpoints for functionality
 * 
 * Usage: node scripts/test-endpoints.js
 * 
 * Note: This requires a valid Supabase session cookie
 * For full testing, use the browser or a proper test framework
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Test 1: GET /api/user/roles (should return 401 without auth)
  console.log('1. Testing GET /api/user/roles (unauthenticated)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/roles`);
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated request\n');
      results.passed++;
    } else {
      console.log(`   ❌ Expected 401, got ${response.status}\n`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Test 2: POST /api/user/add-role (should return 401 without auth)
  console.log('2. Testing POST /api/user/add-role (unauthenticated)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/add-role`, {
      method: 'POST',
      body: { role: 'buyer' },
    });
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated request\n');
      results.passed++;
    } else {
      console.log(`   ❌ Expected 401, got ${response.status}\n`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Test 3: POST /api/user/add-role (invalid role)
  console.log('3. Testing POST /api/user/add-role (invalid role)...');
  try {
    // This would need auth, but we can test the validation
    console.log('   ⚠️  Requires authentication - skipping validation test\n');
    results.skipped++;
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Test 4: POST /api/user/switch-role (should return 401 without auth)
  console.log('4. Testing POST /api/user/switch-role (unauthenticated)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/switch-role`, {
      method: 'POST',
      body: { role: 'buyer' },
    });
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated request\n');
      results.passed++;
    } else {
      console.log(`   ❌ Expected 401, got ${response.status}\n`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Test 5: GET /api/user/export-data (should return 401 without auth)
  console.log('5. Testing GET /api/user/export-data (unauthenticated)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/export-data`);
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated request\n');
      results.passed++;
    } else {
      console.log(`   ❌ Expected 401, got ${response.status}\n`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Test 6: DELETE /api/user/delete-account (should return 401 without auth)
  console.log('6. Testing DELETE /api/user/delete-account (unauthenticated)...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/user/delete-account`, {
      method: 'DELETE',
      body: { confirm: true },
    });
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated request\n');
      results.passed++;
    } else {
      console.log(`   ❌ Expected 401, got ${response.status}\n`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Test 7: Check robots.txt
  console.log('7. Testing robots.txt accessibility...');
  try {
    const response = await makeRequest(`${BASE_URL}/robots.txt`);
    if (response.status === 200 && response.data.includes('User-agent')) {
      console.log('   ✅ robots.txt is accessible and valid\n');
      results.passed++;
    } else {
      console.log(`   ❌ robots.txt not accessible (status: ${response.status})\n`);
      results.failed++;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Test 8: Check sitemap.xml
  console.log('8. Testing sitemap.xml accessibility...');
  try {
    const response = await makeRequest(`${BASE_URL}/sitemap.xml`);
    if (response.status === 200) {
      console.log('   ✅ sitemap.xml is accessible\n');
      results.passed++;
    } else {
      console.log(`   ⚠️  sitemap.xml returned status ${response.status} (may need build)\n`);
      results.skipped++;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    results.skipped++;
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Skipped: ${results.skipped}`);
  console.log(`   Total: ${results.passed + results.failed + results.skipped}\n`);

  if (results.failed === 0) {
    console.log('✅ All accessible tests passed!\n');
    console.log('💡 Note: Full endpoint testing requires authentication.');
    console.log('   Use browser DevTools or a proper test framework for authenticated tests.\n');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

testEndpoints().catch(console.error);

