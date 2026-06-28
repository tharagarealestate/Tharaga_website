/**
 * Test script to verify header visibility across different pages
 * This script will check if the header is shown/hidden correctly on different routes
 */

const pages = {
  publicPages: [
    { path: '/', name: 'Homepage', shouldShowHeader: true },
    { path: '/about/', name: 'About Page', shouldShowHeader: true },
    { path: '/pricing/', name: 'Pricing Page', shouldShowHeader: true },
    { path: '/properties/123', name: 'Property Details', shouldShowHeader: true },
    { path: '/tools/vastu', name: 'Vastu Tool', shouldShowHeader: true },
    { path: '/tools/roi', name: 'ROI Tool', shouldShowHeader: true },
  ],
  dashboardPages: [
    { path: '/builder', name: 'Builder Dashboard', shouldShowHeader: false },
    { path: '/builder/leads', name: 'Builder Leads', shouldShowHeader: false },
    { path: '/builder/properties', name: 'Builder Properties', shouldShowHeader: false },
    { path: '/my-dashboard', name: 'Buyer Dashboard', shouldShowHeader: false },
    { path: '/admin', name: 'Admin Dashboard', shouldShowHeader: false },
  ]
};

async function testPage(baseUrl, page) {
  try {
    const url = `${baseUrl}${page.path}`;
    console.log(`\nTesting: ${page.name} (${page.path})`);
    console.log(`Expected: Header ${page.shouldShowHeader ? 'VISIBLE' : 'HIDDEN'}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`⚠️  Page returned status: ${response.status}`);
      return { page: page.name, status: 'error', statusCode: response.status };
    }

    const html = await response.text();

    // Check for the static header component
    const hasHeader = html.includes('id="tharaga-static-header"') ||
                     html.includes('class="nav"') ||
                     html.includes('StaticHeaderHTML');

    const result = hasHeader === page.shouldShowHeader;

    if (result) {
      console.log(`✅ PASS - Header is ${hasHeader ? 'visible' : 'hidden'} as expected`);
      return { page: page.name, status: 'pass', hasHeader };
    } else {
      console.log(`❌ FAIL - Header is ${hasHeader ? 'visible' : 'hidden'}, expected ${page.shouldShowHeader ? 'visible' : 'hidden'}`);
      return { page: page.name, status: 'fail', hasHeader, expected: page.shouldShowHeader };
    }
  } catch (error) {
    console.log(`❌ ERROR - ${error.message}`);
    return { page: page.name, status: 'error', error: error.message };
  }
}

async function runTests() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';

  console.log('═══════════════════════════════════════════════════════');
  console.log('  HEADER VISIBILITY TEST');
  console.log('  Testing at:', baseUrl);
  console.log('═══════════════════════════════════════════════════════');

  const results = [];

  console.log('\n📋 PUBLIC PAGES (Header should be VISIBLE):');
  console.log('─────────────────────────────────────────────────────');
  for (const page of pages.publicPages) {
    const result = await testPage(baseUrl, page);
    results.push(result);
  }

  console.log('\n\n📋 DASHBOARD PAGES (Header should be HIDDEN):');
  console.log('─────────────────────────────────────────────────────');
  for (const page of pages.dashboardPages) {
    const result = await testPage(baseUrl, page);
    results.push(result);
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Errors: ${errors}`);
  console.log(`📊 Total:  ${results.length}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.page}: Header is ${r.hasHeader ? 'visible' : 'hidden'}, expected ${r.expected ? 'visible' : 'hidden'}`);
    });
  }

  if (errors > 0) {
    console.log('\n⚠️  ERRORS:');
    results.filter(r => r.status === 'error').forEach(r => {
      console.log(`   - ${r.page}: ${r.error || `Status ${r.statusCode}`}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
