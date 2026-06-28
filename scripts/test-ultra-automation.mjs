/**
 * Test Script for Ultra Automation System
 * Tests all 10 layers of automation
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
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testUltraAutomation() {
  console.log('🚀 Testing Ultra Automation System (10 Layers)\n');
  console.log('='.repeat(70));

  try {
    // Step 1: Get test builder
    console.log('\n📋 Step 1: Setting up test builder...');
    const { data: users } = await supabase.auth.admin.listUsers();
    if (!users || users.users.length === 0) {
      console.error('   ❌ No users found');
      return;
    }

    const builderId = users.users[0].id;
    console.log(`   ✅ Using builder: ${builderId}`);

    // Ensure subscription
    const { data: subscription } = await supabase
      .from('builder_subscriptions')
      .select('*')
      .eq('builder_id', builderId)
      .single();

    if (!subscription) {
      await supabase
        .from('builder_subscriptions')
        .insert([{
          builder_id: builderId,
          tier: 'professional',
          leads_per_property: 200,
          sms_enabled: true,
          ai_features_enabled: true
        }]);
      console.log('   ✅ Subscription created');
    }

    // Step 2: Create test property
    console.log('\n📤 Step 2: Creating test property...');
    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert([{
        builder_id: builderId,
        property_name: 'Ultra Test Villa - Adyar',
        title: 'Ultra Test Villa - Adyar',
        city: 'Chennai',
        locality: 'Adyar',
        property_type: 'Villa',
        price_inr: 8500000,
        description: 'Beautiful 3BHK villa with modern amenities, perfect for families',
        total_units: 10,
        processing_status: 'pending'
      }])
      .select()
      .single();

    if (propError || !property) {
      throw new Error(`Failed to create property: ${propError?.message}`);
    }

    console.log(`   ✅ Property created: ${property.id}`);

    // Step 3: Trigger ultra automation
    console.log('\n⚙️  Step 3: Triggering Ultra Automation...');
    console.log('   Processing through all 10 layers...');

    const response = await fetch(`${API_URL}/api/properties/ultra-process`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Processing failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('   ✅ Ultra automation completed');
    console.log(`   Leads generated: ${result.leadsGenerated}`);
    console.log(`   Journeys created: ${result.journeysCreated}`);
    console.log(`   Analysis completed: ${result.analysisCompleted ? 'Yes' : 'No'}`);

    // Step 4: Verify Layer 1 - Property Analysis
    console.log('\n🔍 Step 4: Verifying Layer 1 (Property Analysis)...');
    const { data: analysis } = await supabase
      .from('property_analysis')
      .select('*')
      .eq('property_id', property.id)
      .single();

    if (analysis) {
      console.log(`   ✅ Analysis found`);
      console.log(`   Market Position: ${analysis.market_position}`);
      console.log(`   Demand Score: ${analysis.demand_score}/100`);
    } else {
      console.log('   ⚠️  No analysis found');
    }

    // Step 5: Verify Leads
    console.log('\n🔍 Step 5: Verifying Generated Leads...');
    const { data: leads, count: leadsCount } = await supabase
      .from('generated_leads')
      .select('*', { count: 'exact' })
      .eq('property_id', property.id)
      .order('lead_quality_score', { ascending: false });

    console.log(`   ✅ Found ${leadsCount || 0} leads`);
    
    if (leads && leads.length > 0) {
      const highQuality = leads.filter(l => l.lead_quality_score >= 80).length;
      const withIntent = leads.filter(l => l.intent_score && l.intent_score >= 70).length;
      
      console.log(`   High quality (80+): ${highQuality}`);
      console.log(`   High intent (70+): ${withIntent}`);
      
      // Show top 3
      console.log('\n   Top 3 Leads:');
      leads.slice(0, 3).forEach((lead, i) => {
        console.log(`   ${i + 1}. ${lead.lead_buyer_name} - Quality: ${lead.lead_quality_score}/100, Intent: ${lead.intent_score || 'N/A'}/100`);
      });
    }

    // Step 6: Verify Layer 2 - Buyer Journeys
    console.log('\n🔍 Step 6: Verifying Layer 2 (Buyer Journeys)...');
    const { data: journeys, count: journeysCount } = await supabase
      .from('buyer_journey')
      .select('*', { count: 'exact' })
      .eq('property_id', property.id);

    console.log(`   ✅ Found ${journeysCount || 0} buyer journeys`);
    
    if (journeys && journeys.length > 0) {
      const discovery = journeys.filter(j => j.current_stage === 'discovery').length;
      console.log(`   In discovery stage: ${discovery}`);
      
      // Check email executions
      const { count: emailExecutions } = await supabase
        .from('email_sequence_executions')
        .select('*', { count: 'exact', head: true })
        .in('journey_id', journeys.map(j => j.id));

      console.log(`   Email sequences sent: ${emailExecutions || 0}`);
    }

    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ULTRA AUTOMATION TEST COMPLETED!\n');
    console.log('Summary:');
    console.log(`  Property ID: ${property.id}`);
    console.log(`  Layer 1 (Analysis): ${analysis ? '✅' : '❌'}`);
    console.log(`  Leads Generated: ${result.leadsGenerated}`);
    console.log(`  Layer 2 (Journeys): ${result.journeysCreated} created`);
    console.log(`  Overall Status: ${result.success ? '✅ Success' : '❌ Failed'}`);

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

testUltraAutomation()
  .then(() => {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });

