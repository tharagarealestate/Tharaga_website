import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailNotification {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export async function sendEmailNotification(notification: EmailNotification) {
  try {
    // Use Resend or your email service
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Email notification error:', error);
    return { success: false, error };
  }
}

export async function sendPlanUpgradeEmail(
  userEmail: string,
  fromPlan: string,
  toPlan: string,
  priceDifference: number
) {
  return sendEmailNotification({
    to: userEmail,
    subject: `Plan Upgraded: Welcome to ${toPlan}!`,
    template: 'plan-upgrade',
    data: {
      fromPlan,
      toPlan,
      priceDifference: priceDifference / 100, // Convert from paise to rupees
      upgradeDate: new Date().toLocaleDateString('en-IN')
    }
  });
}

export async function sendPlanDowngradeEmail(
  userEmail: string,
  fromPlan: string,
  toPlan: string,
  effectiveDate: string
) {
  return sendEmailNotification({
    to: userEmail,
    subject: `Plan Downgrade Scheduled: ${toPlan}`,
    template: 'plan-downgrade',
    data: {
      fromPlan,
      toPlan,
      effectiveDate: new Date(effectiveDate).toLocaleDateString('en-IN')
    }
  });
}

export async function sendSubscriptionCreatedEmail(
  userEmail: string,
  planName: string,
  billingCycle: string,
  amount: number
) {
  return sendEmailNotification({
    to: userEmail,
    subject: `Welcome to Tharaga ${planName}!`,
    template: 'subscription-created',
    data: {
      planName,
      billingCycle,
      amount: amount / 100, // Convert from paise to rupees
      startDate: new Date().toLocaleDateString('en-IN')
    }
  });
}

export async function sendQuotaWarningEmail(
  userEmail: string,
  planName: string,
  currentUsage: number,
  limit: number,
  percentage: number
) {
  return sendEmailNotification({
    to: userEmail,
    subject: `Property Quota Alert: ${percentage}% Used`,
    template: 'quota-warning',
    data: {
      planName,
      currentUsage,
      limit,
      percentage,
      upgradeUrl: '/builder/billing'
    }
  });
}


