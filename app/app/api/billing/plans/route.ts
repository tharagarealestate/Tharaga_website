import { NextResponse } from 'next/server';
import { THARAGA_PRO_PLAN } from '@/lib/pricing-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    plan: {
      id: THARAGA_PRO_PLAN.id,
      name: THARAGA_PRO_PLAN.name,
      description: THARAGA_PRO_PLAN.description,
      pricing: {
        monthly: {
          amount: THARAGA_PRO_PLAN.pricing.monthly.amount,
          display: THARAGA_PRO_PLAN.pricing.monthly.display,
          perMonth: THARAGA_PRO_PLAN.pricing.monthly.perMonth,
        },
        yearly: {
          amount: THARAGA_PRO_PLAN.pricing.yearly.amount,
          display: THARAGA_PRO_PLAN.pricing.yearly.display,
          perMonth: THARAGA_PRO_PLAN.pricing.yearly.perMonth,
          savings: THARAGA_PRO_PLAN.pricing.yearly.savings,
          totalYearly: THARAGA_PRO_PLAN.pricing.yearly.totalYearly,
        },
      },
      features: {
        properties_limit: THARAGA_PRO_PLAN.features.properties.limit,
        leads_limit: THARAGA_PRO_PLAN.features.leads.limit,
        email_quota: -1, // unlimited
        storage_gb: THARAGA_PRO_PLAN.features.storage.limit,
        team_members_limit: THARAGA_PRO_PLAN.features.teamMembers.limit,
        analytics: THARAGA_PRO_PLAN.features.analytics.level,
        crm_integration: THARAGA_PRO_PLAN.features.crm.enabled,
        whatsapp_integration: THARAGA_PRO_PLAN.features.whatsappAutomation.enabled,
        custom_branding: THARAGA_PRO_PLAN.features.whiteLabel.enabled,
        priority_support: THARAGA_PRO_PLAN.features.prioritySupport.enabled,
        api_access: THARAGA_PRO_PLAN.features.apiAccess.enabled,
        dedicated_account_manager: THARAGA_PRO_PLAN.features.dedicatedManager.enabled,
        white_label: THARAGA_PRO_PLAN.features.whiteLabel.enabled,
        custom_integrations: THARAGA_PRO_PLAN.features.customIntegrations.enabled,
      },
      features_list: THARAGA_PRO_PLAN.featuresList,
    },
  });
}






