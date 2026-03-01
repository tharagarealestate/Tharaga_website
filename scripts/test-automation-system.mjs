/**
 * Test Script for Automated Lead Generation System
 * Tests the complete flow: Upload → Process → Generate Leads → Send Email
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Test configuration
const TEST_CONFIG = {
  builderId: process.env.TEST_BUILDER_ID || null, // Set this to test with specific builder
  propertyName: 'Test Luxury Villa',
  location: 'Chennai',
  city: 'Chennai',
  locality: 'Adyar',
  propertyType: 'Villa',
  priceInr: 8500000,
  description: 'Beautiful 3BHK villa with modern amenities',
  tier: 'professional' // starter, professional, enterprise
};

async function testCompleteFlow() {
  console.log('🧪 Testing Automated Lead Generation System\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Get or create test builder
    console.log('\n📋 Step 1: Setting up test builder...');
    let builderId = TEST_CONFIG.builderId;

    if (!builderId) {
      // Create a test builder subscription
      const { data: users } = await supabase.auth.admin.listUsers();
      if (users && users.users.length > 0) {
        builderId = users.users[0].id;
        console.log(`   Using existing user: ${builderId}`);
      } else {
        console.error('   ❌ No users found. Please create a user first.');
        return;
      }
    }

    // Ensure subscription exists
    const { data: subscription } = await supabase
      .from('builder_subscriptions')
      .select('*')
      .eq('builder_id', builderId)
      .single();

    if (!subscription) {
      console.log('   Creating test subscription...');
      await supabase
        .from('builder_subscriptions')
        .insert([{
          builder_id: builderId,
          tier: TEST_CONFIG.tier,
          leads_per_property: TEST_CONFIG.tier === 'starter' ? 50 : TEST_CONFIG.tier === 'professional' ? 200 : 500,
          sms_enabled: TEST_CONFIG.tier !== 'starter',
          ai_features_enabled: true
        }]);
      console.log('   ✅ Subscription created');
    } else {
      console.log(`   ✅ Subscription exists: ${subscription.tier}`);
    }

    // Step 2: Upload property
    console.log('\n📤 Step 2: Uploading test property...');
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert([{
        builder_id: builderId,
        property_name: TEST_CONFIG.propertyName,
        title: TEST_CONFIG.propertyName,
        city: TEST_CONFIG.city,
        locality: TEST_CONFIG.locality,
        property_type: TEST_CONFIG.propertyType,
        price_inr: TEST_CONFIG.priceInr,
        description: TEST_CONFIG.description,
        processing_status: 'pending',
        listing_status: 'draft'
      }])
      .select()
      .single();

    if (propertyError || !property) {
      throw new Error(`Failed to create property: ${propertyError?.message}`);
    }

    console.log(`   ✅ Property created: ${property.id}`);
    console.log(`   Property: ${property.property_name}`);

    // Step 3: Trigger processing
    console.log('\n⚙️  Step 3: Triggering property processing...');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const processResponse = await fetch(`${API_URL}/api/properties/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`
      },
      body: JSON.stringify({
        propertyId: property.id,
        builderId: builderId
      })
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      throw new Error(`Processing failed: ${errorText}`);
    }

    const processResult = await processResponse.json();
    console.log('   ✅ Processing completed');
    console.log(`   Leads generated: ${processResult.leadsGenerated}`);
    console.log(`   Email sent: ${processResult.emailSent ? '✅' : '❌'}`);
    console.log(`   SMS sent: ${processResult.smsSent ? '✅' : '❌'}`);

    // Step 4: Verify leads
    console.log('\n🔍 Step 4: Verifying generated leads...');
    const { data: leads, error: leadsError } = await supabase
      .from('generated_leads')
      .select('*')
      .eq('property_id', property.id)
      .order('lead_quality_score', { ascending: false });

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    console.log(`   ✅ Found ${leads?.length || 0} leads`);
    
    if (leads && leads.length > 0) {
      const highQuality = leads.filter(l => l.lead_quality_score >= 80).length;
      const mediumQuality = leads.filter(l => l.lead_quality_score >= 50 && l.lead_quality_score < 80).length;
      const lowQuality = leads.filter(l => l.lead_quality_score < 50).length;

      console.log(`   High quality (80+): ${highQuality}`);
      console.log(`   Medium quality (50-79): ${mediumQuality}`);
      console.log(`   Low quality (<50): ${lowQuality}`);

      // Show top 3 leads
      console.log('\n   Top 3 Leads:');
      leads.slice(0, 3).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.lead_buyer_name} - ${lead.lead_buyer_email} - Score: ${lead.lead_quality_score}/100`);
      });
    }

    // Step 5: Check email logs
    console.log('\n📧 Step 5: Checking email delivery logs...');
    const { data: emailLogs } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('property_id', property.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (emailLogs && emailLogs.length > 0) {
      const log = emailLogs[0];
      console.log(`   ✅ Email logged: ${log.status}`);
      console.log(`   Recipient: ${log.recipient_email}`);
      console.log(`   Subject: ${log.subject}`);
      if (log.provider_message_id) {
        console.log(`   Message ID: ${log.provider_message_id}`);
      }
    } else {
      console.log('   ⚠️  No email logs found');
    }

    // Step 6: Check SMS logs (if enabled)
    if (subscription?.sms_enabled) {
      console.log('\n📱 Step 6: Checking SMS delivery logs...');
      const { data: smsLogs } = await supabase
        .from('sms_delivery_logs')
        .select('*')
        .eq('property_id', property.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (smsLogs && smsLogs.length > 0) {
        const log = smsLogs[0];
        console.log(`   ✅ SMS logged: ${log.status}`);
        if (log.provider_message_id) {
          console.log(`   Message ID: ${log.provider_message_id}`);
        }
      } else {
        console.log('   ⚠️  No SMS logs found');
      }
    }

    // Step 7: Check processing job
    console.log('\n📊 Step 7: Checking processing job status...');
    const { data: jobs } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('property_id', property.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (jobs && jobs.length > 0) {
      const job = jobs[0];
      console.log(`   ✅ Job status: ${job.status}`);
      console.log(`   Job type: ${job.job_type}`);
      if (job.duration_ms) {
        console.log(`   Duration: ${job.duration_ms}ms`);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  Property ID: ${property.id}`);
    console.log(`  Leads Generated: ${leads?.length || 0}`);
    console.log(`  Email Sent: ${processResult.emailSent ? 'Yes' : 'No'}`);
    console.log(`  SMS Sent: ${processResult.smsSent ? 'Yes' : 'No'}`);
    console.log(`  Processing Status: ${processResult.success ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run tests
testCompleteFlow()
  .then(() => {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });

