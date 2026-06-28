import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
function loadEnv() {
  try {
    const envPath = join(__dirname, '../app/.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    const env = {}

    envContent.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        env[key.trim()] = value.trim()
      }
    })

    return env
  } catch (err) {
    console.error('⚠️  Could not load .env.local:', err.message)
    return {}
  }
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('Available env vars:', Object.keys(env).filter(k => k.includes('SUPABASE')))
  process.exit(1)
}

console.log('🔗 Connecting to Supabase:', url)

const supabase = createClient(url, key, {
  auth: { persistSession: false }
})

async function updateAdmin() {
  try {
    console.log('🔄 Updating admin profile for tharagarealestate@gmail.com...')

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', 'tharagarealestate@gmail.com')
      .select()

    if (error) {
      console.error('❌ Error:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) {
      console.warn('⚠️  No profile found with email: tharagarealestate@gmail.com')
      console.log('📝 Please ensure the user has logged in at least once to create their profile')
      process.exit(1)
    } else {
      console.log('✅ Admin profile updated successfully!')
      console.log(JSON.stringify(data, null, 2))
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    process.exit(1)
  }
}

updateAdmin()
