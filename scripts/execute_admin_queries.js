import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeQueries() {
  console.log('\n========================================');
  console.log('STEP 1: Find user with email tharagarealestate@gmail.com');
  console.log('========================================\n');

  const { data: users, error: usersError } = await supabase
    .from('auth.users')
    .select('id, email, created_at')
    .eq('email', 'tharagarealestate@gmail.com');

  if (usersError) {
    // Try using RPC or direct query instead
    const { data: userQuery, error: queryError } = await supabase.rpc('exec_sql', {
      query: "SELECT id, email, created_at FROM auth.users WHERE email = 'tharagarealestate@gmail.com'"
    });

    if (queryError) {
      console.error('Error querying users:', queryError);
      console.log('\nAttempting alternative query method...\n');

      // Use the auth admin API
      const { data: { users: adminUsers }, error: adminError } = await supabase.auth.admin.listUsers();

      if (adminError) {
        console.error('Error with admin API:', adminError);
        return;
      }

      const targetUser = adminUsers.find(u => u.email === 'tharagarealestate@gmail.com');
      if (targetUser) {
        console.log('User found:');
        console.log(JSON.stringify({
          id: targetUser.id,
          email: targetUser.email,
          created_at: targetUser.created_at
        }, null, 2));

        await checkAndAddRole(targetUser.id);
      } else {
        console.log('User not found!');
      }
      return;
    }
    console.log('User found:', userQuery);
  } else {
    console.log('Users:', JSON.stringify(users, null, 2));
    if (users && users.length > 0) {
      await checkAndAddRole(users[0].id);
    }
  }
}

async function checkAndAddRole(userId) {
  console.log('\n========================================');
  console.log('STEP 2: Check existing roles for this user');
  console.log('========================================\n');

  const { data: existingRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);

  if (rolesError) {
    console.error('Error querying user_roles:', rolesError);
  } else {
    console.log('Existing roles:', JSON.stringify(existingRoles, null, 2));
  }

  console.log('\n========================================');
  console.log('STEP 3: Add admin role to user');
  console.log('========================================\n');

  const { data: insertedRole, error: insertError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role: 'admin',
      is_primary: false,
      verified: true
    }, {
      onConflict: 'user_id,role',
      ignoreDuplicates: true
    })
    .select();

  if (insertError) {
    console.error('Error adding admin role:', insertError);
  } else {
    console.log('Admin role added/updated:', JSON.stringify(insertedRole, null, 2));
  }

  console.log('\n========================================');
  console.log('STEP 4: Verify the admin role was added');
  console.log('========================================\n');

  const { data: verifiedRoles, error: verifyError } = await supabase
    .from('user_roles')
    .select('role, is_primary, verified, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (verifyError) {
    console.error('Error verifying roles:', verifyError);
  } else {
    console.log('Final user roles:');
    console.log(JSON.stringify(verifiedRoles, null, 2));

    const hasAdmin = verifiedRoles.some(r => r.role === 'admin');
    console.log('\n✓ Admin role present:', hasAdmin);
  }
}

executeQueries().catch(console.error);
