#!/usr/bin/env node

/**
 * Update Admin Role Script
 *
 * This script updates the role of a specific user to 'admin' in the Supabase profiles table.
 *
 * Usage: node scripts/update-admin-role.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateAdminRole() {
  const adminEmail = 'tharagarealestate@gmail.com'

  console.log('🔄 Updating admin role...')
  console.log(`   Email: ${adminEmail}`)

  try {
    // Update the profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', adminEmail)
      .select()

    if (error) {
      console.error('❌ Error updating role:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) {
      console.warn('⚠️  No profile found with email:', adminEmail)
      console.log('   The user may need to sign in first to create their profile.')
      process.exit(1)
    }

    console.log('✅ Successfully updated admin role!')
    console.log('   Profile:', data[0])
    console.log('')
    console.log('🎉 Admin access granted to:', adminEmail)

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

updateAdminRole()
