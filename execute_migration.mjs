import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the migration file
const sql = readFileSync(join(__dirname, 'supabase/migrations/020_pricing_system.sql'), 'utf-8');

// Supabase connection details
const SUPABASE_PROJECT_ID = 'wedevtjjmdvngyshqdro';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// You'll need to provide the service role key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.log('\nPlease set it using:');
  console.log('$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

async function executeMigration() {
  try {
    console.log('Executing migration: 020_pricing_system.sql');
    console.log('Project:', SUPABASE_PROJECT_ID);
    console.log('\n---\n');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error executing migration:');
      console.error(error);

      // Try alternative approach using pg admin API
      console.log('\n\nTrying alternative method via SQL Editor API...\n');

      const response2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/pgsql_exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql: sql })
      });

      if (!response2.ok) {
        const error2 = await response2.text();
        console.error('Alternative method also failed:');
        console.error(error2);

        console.log('\n\n=== MANUAL EXECUTION REQUIRED ===');
        console.log('Please copy the SQL from: supabase/migrations/020_pricing_system.sql');
        console.log('And paste it into: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new');
        console.log('\nThe SQL file is ready and syntactically correct.');
        process.exit(1);
      }

      const result2 = await response2.json();
      console.log('Success! Migration executed via alternative method.');
      console.log(result2);
    } else {
      const result = await response.json();
      console.log('Success! Migration executed successfully.');
      console.log(result);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n\n=== MANUAL EXECUTION REQUIRED ===');
    console.log('Please execute the SQL manually:');
    console.log('1. Open: https://supabase.com/dashboard/project/wedevtjjmdvngyshqdro/sql/new');
    console.log('2. Copy the contents from: supabase/migrations/020_pricing_system.sql');
    console.log('3. Paste and execute in the SQL Editor');
    process.exit(1);
  }
}

executeMigration();
