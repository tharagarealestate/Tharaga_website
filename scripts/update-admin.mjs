import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

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
      console.log('Creating admin profile...')

      // Try to create the profile
      const { data: newData, error: createError } = await supabase
        .from('profiles')
        .insert({ email: 'tharagarealestate@gmail.com', role: 'admin' })
        .select()

      if (createError) {
        console.error('❌ Error creating profile:', createError.message)
        process.exit(1)
      }

      console.log('✅ Admin profile created successfully!')
      console.log(JSON.stringify(newData, null, 2))
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
