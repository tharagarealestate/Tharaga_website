# 📱 Twilio Messaging Feature - Complete Usage Guide for Tharaga Website

## 🎯 Overview

The Twilio messaging system allows builders and real estate professionals on Tharaga to send **SMS and WhatsApp messages** directly to leads, prospects, and clients. This feature integrates seamlessly with your existing lead management system.

---

## 🚀 **How to Access the Feature**

### **Step 1: Navigate to Messaging Dashboard**
1. Log in to your **Builder Dashboard**
2. In the sidebar, click on **"Messaging"**
3. You'll see two options:
   - **Send Messages** - Quick message sending
   - **Communications** - Message history and templates

### **Step 2: Access URL**
Direct URL: `https://tharaga.co.in/builder/messaging`

---

## 💡 **Use Cases in Tharaga Real Estate Platform**

### **1. Lead Follow-up & Engagement**
- **Scenario**: A lead views a property listing but hasn't responded
- **Action**: Send a personalized WhatsApp message:
  ```
  Hi {{name}}, I noticed you viewed {{property_name}} in {{location}}. 
  Would you like to schedule a site visit? I'm available this weekend.
  ```
- **Benefit**: Higher engagement rate than email, instant delivery

### **2. Site Visit Reminders**
- **Scenario**: Site visit scheduled for tomorrow
- **Action**: Send SMS reminder 24 hours before:
  ```
  Reminder: Your site visit for {{property_name}} is tomorrow at {{time}}. 
  Location: {{address}}. See you there!
  ```
- **Benefit**: Reduces no-shows, improves customer experience

### **3. Property Updates & New Listings**
- **Scenario**: New property matches a lead's criteria
- **Action**: Send WhatsApp with property details:
  ```
  Hi {{name}}, we have a new {{property_type}} in {{location}} that matches 
  your requirements. Price: ₹{{price}}. Would you like more details?
  ```
- **Benefit**: Proactive lead nurturing, faster response times

### **4. Negotiation & Deal Closure**
- **Scenario**: Price negotiation in progress
- **Action**: Send SMS for urgent updates:
  ```
  {{name}}, the builder has agreed to your offer of ₹{{price}} for 
  {{property_name}}. Please confirm by {{deadline}}.
  ```
- **Benefit**: Real-time communication, faster deal closure

### **5. Post-Purchase Follow-up**
- **Scenario**: After deal closure, maintain relationship
- **Action**: Send periodic updates:
  ```
  Hi {{name}}, construction progress update for {{property_name}}: 
  {{progress}}% complete. Expected completion: {{date}}.
  ```
- **Benefit**: Customer retention, referral opportunities

### **6. Bulk Campaigns**
- **Scenario**: Launch new project, notify all interested leads
- **Action**: Send bulk WhatsApp messages to qualified leads
- **Benefit**: Efficient marketing, higher reach

---

## 📋 **Step-by-Step Usage Guide**

### **A. Sending a Single Message**

#### **Method 1: Quick Send (Direct Message)**
1. Go to **Messaging** → **Send Messages** tab
2. Select message type:
   - **SMS** - For quick updates, reminders
   - **WhatsApp** - For detailed messages, media sharing
3. Enter recipient phone number (e.g., `9876543210` or `+919876543210`)
4. Type your message
5. Click **"Send Message"**
6. ✅ Message sent! Status will update automatically (sent → delivered → read)

#### **Method 2: Using Templates**
1. Go to **Messaging** → **Templates** tab
2. Click **"Use Template"** on any template
3. Fill in variables (e.g., `{{name}}`, `{{property_name}}`)
4. Enter recipient phone number
5. Click **"Send"**

---

### **B. Creating Message Templates**

#### **Why Use Templates?**
- Save time on repetitive messages
- Maintain consistent communication style
- Personalize messages with variables
- Track template usage statistics

#### **How to Create:**
1. Go to **Messaging** → **Templates** tab
2. Click **"Create Template"**
3. Fill in:
   - **Name**: e.g., "Site Visit Reminder"
   - **Type**: SMS or WhatsApp
   - **Body**: Your message with variables
     ```
     Hi {{name}}, your site visit for {{property_name}} 
     is scheduled for {{date}} at {{time}}.
     ```
4. **Variables**: Automatically detected (e.g., `name`, `property_name`, `date`, `time`)
5. Click **"Save Template"**

#### **Template Variables Available:**
- `{{name}}` - Lead's name
- `{{property_name}}` - Property name
- `{{property_type}}` - Apartment, Villa, etc.
- `{{location}}` - Property location
- `{{price}}` - Property price
- `{{address}}` - Full address
- `{{date}}` - Any date
- `{{time}}` - Time
- `{{builder_name}}` - Your builder name
- `{{phone}}` - Contact number
- `{{email}}` - Email address

---

### **C. Sending Bulk Messages**

#### **When to Use:**
- New project launch announcements
- Seasonal promotions
- Newsletter updates
- Event invitations

#### **How to Send:**
1. Go to **Messaging** → **Send Messages** tab
2. Select **"Bulk Send"** option
3. Choose:
   - **Template** (recommended) or **Direct Message**
   - **Recipients**: Select from your leads list
4. For templates, fill in variables for each recipient
5. Click **"Send Bulk Messages"**
6. ⏱️ Messages send automatically with rate limiting (10 SMS/min, 60 WhatsApp/hour)

---

### **D. Managing Templates**

#### **View All Templates:**
- Go to **Messaging** → **Templates** tab
- See all your templates with:
  - Usage count
  - Last used date
  - Active/Inactive status

#### **Edit Template:**
1. Click **"Edit"** on any template
2. Modify name, body, or variables
3. Click **"Save"**

#### **Delete Template:**
1. Click **"Delete"** on any template
2. Confirm deletion

#### **Deactivate Template:**
- Toggle **"Active"** status to disable without deleting

---

### **E. Viewing Message History**

#### **Access History:**
1. Go to **Messaging** → **Communications** tab
2. View:
   - All sent messages
   - Delivery status (sent, delivered, failed, read)
   - Timestamps
   - Message content
   - Cost per message

#### **Filter Options:**
- By date range
- By message type (SMS/WhatsApp)
- By status (sent, delivered, failed)
- By recipient

---

## 🔗 **Integration with Existing Tharaga Features**

### **1. Lead Management Integration**
- **Automatic Tracking**: Every message sent is automatically logged in `lead_interactions` table
- **Status Updates**: Message delivery status updates in real-time
- **Lead Scoring**: Message engagement can be used for lead scoring
- **CRM Integration**: All messages appear in lead's communication history

### **2. Property Listings**
- Send property details directly from property pages
- Share property images via WhatsApp
- Send virtual tour links
- Schedule site visits from property listings

### **3. Site Visit Management**
- Send automated reminders before site visits
- Confirm site visit appointments
- Send directions and parking information
- Follow-up after site visits

### **4. Deal Pipeline**
- Update leads on negotiation status
- Send offer confirmations
- Notify about deal closure
- Request document submissions

---

## 📊 **Best Practices for Tharaga**

### **1. Message Timing**
- **Best Times**: 10 AM - 8 PM (IST)
- **Avoid**: Early morning (before 9 AM) and late night (after 9 PM)
- **Weekends**: WhatsApp works well, SMS for urgent matters

### **2. Message Personalization**
✅ **DO:**
- Use lead's name
- Reference specific property they viewed
- Include relevant details (price, location, features)
- Keep messages concise and clear

❌ **DON'T:**
- Send generic messages
- Use all caps
- Send too frequently (max 2-3 per week per lead)
- Include sensitive information without consent

### **3. Choosing SMS vs WhatsApp**

**Use SMS for:**
- Quick confirmations
- Time-sensitive updates
- Reminders
- OTPs and verification codes

**Use WhatsApp for:**
- Detailed property information
- Sharing images/videos
- Longer conversations
- Relationship building
- Media-rich content

### **4. Template Best Practices**
- Create templates for common scenarios:
  - Site visit confirmation
  - Property inquiry response
  - Follow-up after viewing
  - Deal closure confirmation
  - Construction updates
- Keep templates under 160 characters for SMS
- Use variables for personalization
- Test templates before bulk sending

### **5. Rate Limiting Awareness**
- **SMS**: 10 messages per minute per number
- **WhatsApp**: 60 messages per hour per number
- System automatically handles rate limiting
- Bulk messages are queued and sent gradually

---

## 💰 **Cost Management**

### **Checking Account Balance**
1. Go to **Messaging** → **Send Messages** tab
2. Click **"Check Balance"** button
3. View your Twilio account balance

### **Cost Optimization Tips**
- Use WhatsApp for longer messages (more cost-effective)
- Batch messages during off-peak hours
- Use templates to reduce errors and retries
- Monitor failed messages and fix issues promptly

---

## 🎨 **UI Features**

### **Dashboard Design**
- **Glassmorphism Theme**: Matches your pricing feature design
- **Gold/Emerald Accents**: Consistent with Tharaga branding
- **Tabbed Interface**: Easy navigation between features
- **Real-time Status**: See message delivery status instantly

### **Key UI Elements**
- **Message Type Toggle**: Switch between SMS and WhatsApp
- **Template Library**: Visual template cards with usage stats
- **Quick Actions**: Send, Edit, Delete buttons
- **Status Indicators**: Color-coded delivery status
- **Search & Filter**: Find messages and templates quickly

---

## 🔒 **Security & Privacy**

### **Data Protection**
- All messages are encrypted in transit
- Phone numbers are stored securely
- RLS (Row Level Security) ensures users only see their own messages
- No message content stored after delivery (metadata only)

### **Compliance**
- Follow DND (Do Not Disturb) regulations
- Respect opt-out requests
- Maintain message logs for compliance
- Secure API endpoints with authentication

---

## 📈 **Analytics & Reporting**

### **Track Performance**
- **Template Usage**: See which templates are most effective
- **Delivery Rates**: Monitor successful vs failed messages
- **Response Times**: Track when leads respond
- **Cost Analysis**: Monitor messaging costs per campaign

### **Metrics Available**
- Total messages sent
- Delivery success rate
- Read receipts (WhatsApp)
- Cost per message
- Template performance
- Lead engagement rates

---

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Message Not Sending**
- ✅ Check phone number format (should be +91XXXXXXXXXX)
- ✅ Verify Twilio account balance
- ✅ Check rate limits (wait if exceeded)
- ✅ Ensure recipient number is valid

#### **2. Message Status Stuck on "Sent"**
- ✅ Wait a few minutes (delivery can take time)
- ✅ Check recipient's phone is active
- ✅ Verify webhook is configured correctly

#### **3. Template Variables Not Replacing**
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Ensure all variables are provided when sending
- ✅ Verify template syntax: `{{variable_name}}`

#### **4. Bulk Messages Failing**
- ✅ Check rate limits (system queues automatically)
- ✅ Verify all recipient numbers are valid
- ✅ Ensure template has all required variables
- ✅ Check account balance for bulk sends

---

## 🎯 **Quick Reference**

### **Keyboard Shortcuts**
- `Ctrl + Enter` - Send message
- `Ctrl + S` - Save template
- `Ctrl + F` - Search templates/messages

### **API Endpoints** (For Developers)
- `POST /api/messaging/send` - Send single message
- `POST /api/messaging/bulk` - Send bulk messages
- `GET /api/messaging/templates` - List templates
- `POST /api/messaging/templates` - Create template
- `GET /api/messaging/balance` - Check balance

---

## 📞 **Support & Resources**

### **Documentation**
- Migration file: `supabase/migrations/022_twilio_messaging.sql`
- Client code: `app/lib/integrations/messaging/twilioClient.ts`
- API routes: `app/app/api/messaging/`

### **Configuration**
- Environment variables in `.env.local`
- Webhook URL: `https://tharaga.co.in/api/messaging/webhook`
- Twilio Console: Configure webhooks for status updates

---

## ✅ **Getting Started Checklist**

- [ ] Verify Twilio credentials in `.env.local`
- [ ] Database migration executed (✅ Already done)
- [ ] Configure Twilio webhook in Twilio Console
- [ ] Create your first template
- [ ] Send a test message to your own number
- [ ] Verify message delivery and status updates
- [ ] Create templates for common scenarios
- [ ] Integrate with your lead management workflow

---

## 🎉 **You're All Set!**

The Twilio messaging feature is now fully integrated into your Tharaga website. Start sending personalized messages to your leads and watch your engagement rates improve!

**Next Steps:**
1. Create 3-5 essential templates
2. Send your first message to a lead
3. Monitor delivery rates and engagement
4. Scale up based on what works best

---

**Questions?** Check the codebase or refer to the Twilio documentation for advanced features.


