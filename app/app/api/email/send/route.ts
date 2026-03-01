import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!resend) {
      console.error('Resend API key not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const { to, subject, template, data } = await request.json();

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'To and subject are required' },
        { status: 400 }
      );
    }

    // Email templates
    const templates: Record<string, (data: any) => string> = {
      'plan-upgrade': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Plan Upgraded Successfully!</h2>
          <p>Your plan has been upgraded from <strong>${d.fromPlan}</strong> to <strong>${d.toPlan}</strong>.</p>
          <p><strong>Upgrade Date:</strong> ${d.upgradeDate}</p>
          ${d.priceDifference > 0 ? `<p><strong>Additional Cost:</strong> ₹${d.priceDifference}/month</p>` : ''}
          <p>You now have access to all features in your new plan. Start listing more properties!</p>
          <a href="https://tharaga.co.in/builder/billing" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #D4AF37; color: #000; text-decoration: none; border-radius: 8px;">View Billing Dashboard</a>
        </div>
      `,
      'plan-downgrade': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Plan Downgrade Scheduled</h2>
          <p>Your plan will be downgraded from <strong>${d.fromPlan}</strong> to <strong>${d.toPlan}</strong>.</p>
          <p><strong>Effective Date:</strong> ${d.effectiveDate}</p>
          <p>Your current plan will remain active until ${d.effectiveDate}. After that, you'll be moved to ${d.toPlan}.</p>
          <p>You can cancel this downgrade anytime before ${d.effectiveDate}.</p>
          <a href="https://tharaga.co.in/builder/billing" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #1e40af; color: #fff; text-decoration: none; border-radius: 8px;">Manage Subscription</a>
        </div>
      `,
      'subscription-created': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Welcome to Tharaga ${d.planName}!</h2>
          <p>Your subscription has been activated successfully.</p>
          <p><strong>Plan:</strong> ${d.planName}</p>
          <p><strong>Billing Cycle:</strong> ${d.billingCycle}</p>
          <p><strong>Amount:</strong> ₹${d.amount}/${d.billingCycle === 'monthly' ? 'month' : 'year'}</p>
          <p><strong>Start Date:</strong> ${d.startDate}</p>
          <p>You can now start listing your properties and managing your business on Tharaga!</p>
          <a href="https://tharaga.co.in/builder" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #D4AF37; color: #000; text-decoration: none; border-radius: 8px;">Go to Dashboard</a>
        </div>
      `,
      'quota-warning': (d) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Property Quota Alert</h2>
          <p>You're using <strong>${d.percentage}%</strong> of your property quota on the <strong>${d.planName}</strong> plan.</p>
          <p><strong>Current Usage:</strong> ${d.currentUsage} of ${d.limit} properties</p>
          ${d.percentage >= 100 ? '<p style="color: #ef4444;"><strong>⚠️ You have reached your limit!</strong> Upgrade now to add more properties.</p>' : '<p>Consider upgrading your plan to avoid hitting the limit.</p>'}
          <a href="https://tharaga.co.in/builder/billing" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #D4AF37; color: #000; text-decoration: none; border-radius: 8px;">Upgrade Plan</a>
        </div>
      `
    };

    const html = templates[template] ? templates[template](data) : `
      <div style="font-family: Arial, sans-serif;">
        <h2>${subject}</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;

    const result = await resend.emails.send({
      from: 'Tharaga <noreply@tharaga.co.in>',
      to: [to],
      subject,
      html
    });

    return NextResponse.json({
      success: true,
      messageId: result.id
    });

  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

