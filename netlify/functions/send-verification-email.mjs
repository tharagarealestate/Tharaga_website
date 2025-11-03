/**
 * Send Email Notification - Phase 5
 * POST /api/send-verification-email
 * Body: { email, status: 'verified'|'rejected', company_name, rejection_reason? }
 */

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, status, company_name, rejection_reason } = JSON.parse(event.body || '{}');

    if (!email || !status || !company_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
    // For now, we'll log the email content

    let subject, message;

    if (status === 'verified') {
      subject = `✅ Your Builder Account has been Verified - Tharaga`;
      message = `
Dear ${company_name} Team,

Great news! Your builder account on Tharaga has been verified and approved.

You now have full access to:
- Post new property listings
- Manage your projects
- View inquiries from potential buyers
- Access advanced builder features

Get started: https://tharaga.co.in/builder

Thank you for joining Tharaga!

Best regards,
The Tharaga Team
      `;
    } else if (status === 'rejected') {
      subject = `❌ Builder Verification Update - Tharaga`;
      message = `
Dear ${company_name} Team,

Unfortunately, we were unable to verify your builder account at this time.

Reason: ${rejection_reason || 'Information provided did not meet our verification requirements.'}

If you believe this is a mistake or would like to resubmit with updated information, please contact us at support@tharaga.co.in.

Best regards,
The Tharaga Team
      `;
    }

    console.log('=== EMAIL NOTIFICATION ===');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('=========================');

    // In production, send actual email here
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: 'noreply@tharaga.co.in',
      subject: subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    });
    */

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email notification queued (currently logged to console)',
      }),
    };
  } catch (error) {
    console.error('Send email error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
