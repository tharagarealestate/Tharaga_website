# N8N Email Marketing Automation Setup Guide

Complete implementation guide for setting up all 10 email marketing automation workflows in n8n, integrated with Tharaga's existing email infrastructure.

## Overview

This system provides comprehensive email marketing automation including:
- Instant lead notifications
- AI-powered nurture sequences
- Scheduled email processing
- Webhook event handling
- Quota warnings
- Viewing reminders
- Delivery monitoring
- Re-engagement campaigns
- Weekly performance digests
- Error recovery & retry

## Prerequisites

1. **n8n Instance**: Self-hosted or n8n Cloud account
2. **API Access**: All endpoints require authentication
3. **Environment Variables**: Configured in n8n credentials
4. **Database**: Supabase migrations applied (055_email_marketing_automation.sql)

## Environment Variables

Configure these in n8n credentials:

```bash
# Tharaga API
THARAGA_API_URL=https://tharaga.co.in
THARAGA_API_KEY=your-api-key-here
CRON_SECRET=your-secure-cron-secret

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tharaga.co.in

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx

# Anthropic (for AI content)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

## Workflow 1: New Lead Instant Notification

**Trigger**: Supabase Database Trigger (INSERT on `leads` table)

**Endpoint**: `POST /api/automation/email/new-lead-notification`

**n8n Configuration**:

1. **Supabase Trigger Node**
   - Event: `INSERT`
   - Table: `leads`
   - Filter: `status = 'new'`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `{{ $env.THARAGA_API_URL }}/api/automation/email/new-lead-notification`
   - Authentication: Header Auth
   - Header Name: `Authorization`
   - Header Value: `Bearer {{ $env.THARAGA_API_KEY }}`
   - Body:
     ```json
     {
       "leadId": "{{ $json.id }}",
       "builderId": "{{ $json.builder_id }}",
       "propertyId": "{{ $json.property_id }}"
     }
     ```

**What it does**:
- Validates lead data
- Checks builder subscription status
- Verifies email quota
- Fetches tier-appropriate email template
- Sends personalized notification email
- Updates builder email quota
- Logs delivery to database

## Workflow 2: AI-Powered Lead Nurture Sequence

**Trigger**: Supabase Database Trigger (UPDATE on `leads` table when status changes to 'qualified')

**Endpoint**: `POST /api/automation/email/ai-nurture-sequence`

**n8n Configuration**:

1. **Supabase Trigger Node**
   - Event: `UPDATE`
   - Table: `leads`
   - Filter: `status = 'qualified' AND old.status != 'qualified'`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `{{ $env.THARAGA_API_URL }}/api/automation/email/ai-nurture-sequence`
   - Authentication: Header Auth
   - Body:
     ```json
     {
       "leadId": "{{ $json.id }}"
     }
     ```

**What it does**:
- Analyzes lead behavior and engagement
- Determines buyer stage (awareness/consideration/decision)
- Generates 3 personalized emails using Claude AI
- Schedules emails for Day 0, Day 3, and Day 7
- Stores sequences in `email_sequence_queue` table

## Workflow 3: Scheduled Email Sequence Processor

**Trigger**: Cron Schedule (Every 5 minutes)

**Endpoint**: `POST /api/automation/email/process-sequence-queue`

**n8n Configuration**:

1. **Cron Node**
   - Cron Expression: `*/5 * * * *`
   - Timezone: `Asia/Kolkata`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `{{ $env.THARAGA_API_URL }}/api/automation/email/process-sequence-queue`
   - Authentication: Header Auth
   - Header: `Authorization: Bearer {{ $env.CRON_SECRET }}`

**What it does**:
- Fetches due emails from `email_sequence_queue`
- Validates lead and builder status
- Checks email quota
- Personalizes content with dynamic variables
- Adds tracking pixels and click tracking
- Sends via Resend API
- Updates sequence status and logs delivery

## Workflow 4: Resend Webhook Event Processor

**Trigger**: Webhook (POST from Resend)

**Endpoint**: `POST /api/webhooks/resend`

**n8n Configuration**:

1. **Webhook Node**
   - Method: `POST`
   - Path: `/webhook/resend`
   - Response Mode: `Response Node`

2. **HTTP Request Node** (Forward to Tharaga)
   - Method: `POST`
   - URL: `{{ $env.THARAGA_API_URL }}/api/webhooks/resend`
   - Body: `{{ $json }}`
   - Headers: Pass through all headers from Resend

**What it does**:
- Verifies webhook signature (Svix)
- Processes events: sent, delivered, opened, clicked, bounced, complained
- Updates `email_delivery_logs` status
- Tracks lead interactions
- Updates lead engagement scores
- Pauses sequences on bounces
- Unsubscribes on spam complaints

**Resend Webhook Setup**:
1. Go to Resend Dashboard → Webhooks
2. Add webhook: `https://your-n8n-instance.com/webhook/resend`
3. Subscribe to all events
4. Copy webhook secret to `RESEND_WEBHOOK_SECRET`

## Workflow 5: Builder Quota Warning System

**Trigger**: Cron Schedule (Daily at 9:00 AM IST)

**Endpoint**: `POST /api/automation/email/quota-warning`

**n8n Configuration**:

1. **Cron Node**
   - Cron Expression: `0 9 * * *`
   - Timezone: `Asia/Kolkata`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `{{ $env.THARAGA_API_URL }}/api/automation/email/quota-warning`
   - Authentication: Header Auth
   - Header: `Authorization: Bearer {{ $env.CRON_SECRET }}`

**What it does**:
- Finds builders at 80%+ quota usage
- Categorizes warning level (warning/severe/critical)
- Fetches tier-appropriate warning template
- Sends personalized warning email
- Creates alert in `builder_alerts` table
- Updates `quota_warning_sent_at` timestamp

## Workflow 6: Property Viewing Reminder Automation

**Trigger**: Supabase Database Trigger (INSERT on `property_viewings` table)

**Endpoint**: Create viewing reminders

**n8n Configuration**:

1. **Supabase Trigger Node**
   - Event: `INSERT`
   - Table: `property_viewings`
   - Filter: `status = 'scheduled'`

2. **Code Node** (Calculate Reminder Schedule)
   ```javascript
   const viewing = $input.item.json;
   const scheduledTime = new Date(viewing.scheduled_at);
   
   const reminders = [
     {
       type: '24h_before',
       sendAt: new Date(scheduledTime - 24 * 60 * 60 * 1000),
       template: 'viewing_reminder_24h'
     },
     {
       type: '2h_before',
       sendAt: new Date(scheduledTime - 2 * 60 * 60 * 1000),
       template: 'viewing_reminder_2h'
     },
     {
       type: '30min_before',
       sendAt: new Date(scheduledTime - 30 * 60 * 1000),
       template: 'viewing_reminder_30min'
     }
   ];
   
   return reminders.map(r => ({
     ...viewing,
     reminderType: r.type,
     sendAt: r.sendAt.toISOString(),
     templateType: r.template
   }));
   ```

3. **Supabase Node** (Insert Reminders)
   - Operation: `Insert`
   - Table: `scheduled_reminders`
   - Fields: Map from Code Node output

**Separate Reminder Processor** (Cron every 5 minutes):

1. **Cron Node**: `*/5 * * * *`
2. **Supabase Node**: Query due reminders
3. **HTTP Request Node**: Send email via Resend
4. **Supabase Node**: Update reminder status

## Workflow 7: Email Delivery Monitoring & Alerting

**Trigger**: Cron Schedule (Every 10 minutes)

**n8n Configuration**:

1. **Cron Node**: `*/10 * * * *`
2. **Supabase Node**: Query email metrics (last hour)
3. **Code Node**: Detect anomalies
4. **IF Node**: Check severity
5. **Slack/Email Node**: Send alerts for critical issues

**Metrics Tracked**:
- Bounce rate (>5% warning, >10% critical)
- Failure rate (>10% warning, >20% critical)
- Stuck emails (>5 warning, >10 critical)
- Delivery time (>5 min warning, >10 min critical)

## Workflow 8: Re-engagement Campaign for Inactive Leads

**Trigger**: Cron Schedule (Daily at 10:00 AM IST)

**n8n Configuration**:

1. **Cron Node**: `0 10 * * *`
2. **Supabase Node**: Query dormant leads (7-60 days inactive)
3. **HTTP Request Node**: Call AI content generation
4. **Code Node**: Add dynamic incentives
5. **Code Node**: A/B test variant assignment
6. **HTTP Request Node**: Send via Resend
7. **Supabase Node**: Log campaign send

**Lead Temperature**:
- Cooling: 7-13 days inactive
- Warm: 14-29 days inactive
- Cold: 30+ days inactive

## Workflow 9: Builder Performance Digest (Weekly Report)

**Trigger**: Cron Schedule (Every Monday at 9:00 AM IST)

**Endpoint**: `POST /api/automation/email/weekly-digest`

**n8n Configuration**:

1. **Cron Node**
   - Cron Expression: `0 9 * * 1`
   - Timezone: `Asia/Kolkata`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `{{ $env.THARAGA_API_URL }}/api/automation/email/weekly-digest`
   - Authentication: Header Auth
   - Header: `Authorization: Bearer {{ $env.CRON_SECRET }}`

**What it does**:
- Calculates weekly email metrics per builder
- Generates HTML performance report
- Includes open rates, click rates, conversions
- Sends personalized digest email
- Logs delivery to database

## Workflow 10: Error Recovery & Retry Queue Processor

**Trigger**: Cron Schedule (Every 15 minutes)

**Endpoint**: `POST /api/automation/email/retry-queue`

**n8n Configuration**:

1. **Cron Node**
   - Cron Expression: `*/15 * * * *`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `{{ $env.THARAGA_API_URL }}/api/automation/email/retry-queue`
   - Authentication: Header Auth
   - Header: `Authorization: Bearer {{ $env.CRON_SECRET }}`

**What it does**:
- Fetches failed emails ready for retry
- Applies exponential backoff (5 min, 15 min, 60 min)
- Analyzes failure reason
- Applies modifications (reduce size, reword, delay)
- Retries send via Resend
- Updates retry status
- Marks permanent failures after 3 attempts

## Database Tables

All workflows use these tables (created by migration 055):

- `email_sequence_queue` - Scheduled email sequences
- `scheduled_reminders` - Viewing reminders
- `campaign_emails` - Campaign tracking
- `email_analytics` - Aggregated metrics
- `email_health_metrics` - Health monitoring
- `builder_alerts` - Builder notifications
- `property_viewings` - Viewing schedules
- `email_delivery_logs` - Enhanced with tracking fields

## Testing Workflows

### Test New Lead Notification:
```bash
curl -X POST https://tharaga.co.in/api/automation/email/new-lead-notification \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "lead-uuid",
    "builderId": "builder-uuid",
    "propertyId": "property-uuid"
  }'
```

### Test Sequence Processor:
```bash
curl -X POST https://tharaga.co.in/api/automation/email/process-sequence-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring & Alerts

1. **n8n Execution Logs**: Monitor workflow executions
2. **Supabase Logs**: Check database operations
3. **Resend Dashboard**: Monitor email delivery
4. **Application Logs**: Check API endpoint logs

## Troubleshooting

### Emails Not Sending
- Check Resend API key is valid
- Verify sender domain is verified in Resend
- Check email quota limits
- Review builder subscription status

### Webhooks Not Working
- Verify webhook secret matches
- Check webhook URL is accessible
- Review signature verification logs
- Ensure HTTPS is enabled

### Sequences Not Processing
- Verify cron jobs are running
- Check `email_sequence_queue` for scheduled emails
- Review sequence status in database
- Check for paused sequences

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Resend domain verified
- [ ] Webhook endpoints configured
- [ ] Cron schedules set correctly
- [ ] Error handlers implemented
- [ ] Monitoring alerts configured
- [ ] Rate limiting enabled
- [ ] Quota limits configured
- [ ] Email templates reviewed
- [ ] Unsubscribe mechanisms tested
- [ ] GDPR compliance verified

## Support

For issues or questions:
- Email: tech@tharaga.co.in
- Documentation: https://tharaga.co.in/help
- API Docs: https://tharaga.co.in/api/docs

---

**Last Updated**: January 2025
**Version**: 1.0.0








































