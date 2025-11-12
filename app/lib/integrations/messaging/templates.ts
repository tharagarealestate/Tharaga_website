// =============================================
// MESSAGE TEMPLATES FOR SMS/WHATSAPP
// =============================================
export interface MessageTemplate {
  name: string;
  type: 'sms' | 'whatsapp';
  category: string;
  body: string;
  variables: string[];
  characterCount?: number;
}

// =============================================
// SMS TEMPLATES
// =============================================
export const SMS_TEMPLATES: MessageTemplate[] = [
  {
    name: 'Welcome SMS',
    type: 'sms',
    category: 'welcome',
    body: `Hi {{name}}! 👋

Thank you for your interest in {{property_title}}. We're here to help you find your dream home.

View property: {{property_url}}

Questions? Reply to this message or call {{builder_phone}}.

- Tharaga Team`,
    variables: ['name', 'property_title', 'property_url', 'builder_phone'],
    characterCount: 160,
  },
  {
    name: 'Site Visit Confirmation',
    type: 'sms',
    category: 'appointment',
    body: `Hi {{name}},

Your site visit is confirmed! 🏡

📅 Date: {{date}}

🕐 Time: {{time}}

📍 Location: {{address}}

Builder Contact: {{builder_name}}

📞 {{builder_phone}}

See you there!

- Tharaga`,
    variables: ['name', 'date', 'time', 'address', 'builder_name', 'builder_phone'],
    characterCount: 160,
  },
  {
    name: 'Price Update Alert',
    type: 'sms',
    category: 'property_update',
    body: `Hi {{name}},

Great news! 🎉

{{property_title}} price reduced:

Was: ₹{{old_price}}

Now: ₹{{new_price}}

Save ₹{{savings}}!

Book site visit: {{booking_url}}

Limited time offer.

- Tharaga`,
    variables: ['name', 'property_title', 'old_price', 'new_price', 'savings', 'booking_url'],
    characterCount: 160,
  },
  {
    name: 'Follow Up Reminder',
    type: 'sms',
    category: 'follow_up',
    body: `Hi {{name}},

Still interested in {{property_title}}?

We noticed you viewed it {{days_ago}} days ago. The property is still available!

New photos added 📸

Virtual tour available 🎥

View updates: {{property_url}}

Questions? Reply or call {{builder_phone}}.

- {{builder_name}}`,
    variables: ['name', 'property_title', 'days_ago', 'property_url', 'builder_phone', 'builder_name'],
    characterCount: 160,
  },
  {
    name: 'Payment Reminder',
    type: 'sms',
    category: 'reminder',
    body: `Hi {{name}},

Reminder: Payment due for {{property_title}}

Amount: ₹{{amount}}

Due Date: {{due_date}}

Pay now: {{payment_url}}

Need help? Call {{builder_phone}}

- {{builder_name}}`,
    variables: ['name', 'property_title', 'amount', 'due_date', 'payment_url', 'builder_phone', 'builder_name'],
    characterCount: 160,
  },
  {
    name: 'Hot Lead Notification (Builder)',
    type: 'sms',
    category: 'internal',
    body: `🔥 NEW HOT LEAD!

Name: {{lead_name}}

Phone: {{lead_phone}}

Score: {{score}}/10

Property Interest: {{property_title}}

Budget: ₹{{budget}}

View lead: {{lead_url}}

Respond within 5 minutes for best conversion!`,
    variables: ['lead_name', 'lead_phone', 'score', 'property_title', 'budget', 'lead_url'],
    characterCount: 160,
  },
];

// =============================================
// WHATSAPP TEMPLATES
// =============================================
export const WHATSAPP_TEMPLATES: MessageTemplate[] = [
  {
    name: 'Welcome WhatsApp',
    type: 'whatsapp',
    category: 'welcome',
    body: `👋 Hi {{name}}!

Welcome to *Tharaga* - India's Zero Commission Real Estate Platform! 🏡

Thank you for showing interest in:

*{{property_title}}*

📍 {{location}}

💰 ₹{{price}}

*What makes us different?*

✅ Direct builder connection

✅ Zero broker fees

✅ AI-verified properties

✅ Instant site visit booking

*Next Steps:*

1️⃣ View complete details: {{property_url}}

2️⃣ Schedule site visit

3️⃣ Get personalized recommendations

*Questions?*

Reply to this message or call:

📞 {{builder_phone}}

Happy house hunting! 🎉

*Team Tharaga*`,
    variables: ['name', 'property_title', 'location', 'price', 'property_url', 'builder_phone'],
  },
  {
    name: 'Property Recommendation',
    type: 'whatsapp',
    category: 'recommendation',
    body: `Hi {{name}}! 🏡

Based on your preferences, we found the *perfect match* for you:

*{{property_title}}*

📍 {{location}}

💰 ₹{{price}}

🛏️ {{bedrooms}} BHK | {{area}} sq.ft

*Why you'll love it:*

{{features}}

*Special Offer:*

{{offer_details}}

*High Interest Alert:* 🔥

{{interest_count}} people viewed this today

View full details & photos:

{{property_url}}

Want to schedule a site visit?

Reply "YES" or call {{builder_phone}}

- *{{builder_name}}*`,
    variables: ['name', 'property_title', 'location', 'price', 'bedrooms', 'area', 'features', 'offer_details', 'interest_count', 'property_url', 'builder_phone', 'builder_name'],
  },
  {
    name: 'Site Visit Reminder',
    type: 'whatsapp',
    category: 'appointment',
    body: `Hi {{name}}! 📅

*Site Visit Reminder*

Your visit to *{{property_title}}* is tomorrow!

*Details:*

📅 Date: {{date}}

🕐 Time: {{time}}

📍 Address: {{full_address}}

*Google Maps:*

{{maps_url}}

*Meeting Point:*

{{builder_name}} will meet you at the entrance

*Contact (in case you're running late):*

📞 {{builder_phone}}

*What to bring:*

✓ ID proof

✓ Comfortable shoes

✓ Questions list

*Can't make it?*

Reply to reschedule or call us.

See you tomorrow! 🏡

- *Team Tharaga*`,
    variables: ['name', 'property_title', 'date', 'time', 'full_address', 'maps_url', 'builder_name', 'builder_phone'],
  },
  {
    name: 'Document Upload Request',
    type: 'whatsapp',
    category: 'document',
    body: `Hi {{name}},

To proceed with your booking for:

*{{property_title}}*

Please upload the following documents:

*Required Documents:* 📄

1️⃣ Aadhar Card (both sides)

2️⃣ PAN Card

3️⃣ Address Proof

4️⃣ Income Proof (salary slip/ITR)

5️⃣ Bank Statement (last 6 months)

*Upload here:*

{{upload_url}}

*Questions about documents?*

Call {{builder_phone}}

*Tip:* Clear, colored scans process faster! 📸

*Security:* 🔒

Your documents are encrypted and secure.

Upload deadline: {{deadline}}

- *{{builder_name}}*`,
    variables: ['name', 'property_title', 'upload_url', 'builder_phone', 'deadline', 'builder_name'],
  },
  {
    name: 'Payment Success',
    type: 'whatsapp',
    category: 'transaction',
    body: `🎉 Payment Received!

Hi {{name}},

Thank you for your payment!

*Transaction Details:*

💰 Amount: ₹{{amount}}

📝 Property: {{property_title}}

📅 Date: {{date}}

🔖 Transaction ID: {{transaction_id}}

*Payment Breakdown:*

{{payment_breakdown}}

*Next Steps:*

{{next_steps}}

*Download Receipt:*

{{receipt_url}}

*Need help?*

📞 {{builder_phone}}

✉️ {{builder_email}}

Congratulations on your journey to homeownership! 🏡

- *{{builder_name}}*`,
    variables: ['name', 'amount', 'property_title', 'date', 'transaction_id', 'payment_breakdown', 'next_steps', 'receipt_url', 'builder_phone', 'builder_email', 'builder_name'],
  },
  {
    name: 'Monthly Newsletter',
    type: 'whatsapp',
    category: 'newsletter',
    body: `Hi {{name}}! 📰

*Your Monthly Property Digest*

*🔥 Hot Properties This Month:*

*1. {{property_1_title}}*

₹{{property_1_price}} | {{property_1_location}}

{{property_1_url}}

*2. {{property_2_title}}*

₹{{property_2_price}} | {{property_2_location}}

{{property_2_url}}

*3. {{property_3_title}}*

₹{{property_3_price}} | {{property_3_location}}

{{property_3_url}}

*📊 Market Insights:*

{{market_insights}}

*💡 Expert Tips:*

{{expert_tips}}

*🎁 Special Offer:*

{{special_offer}}

View all new listings:

{{all_properties_url}}

*Update preferences:*

{{preferences_url}}

- *Team Tharaga*`,
    variables: ['name', 'property_1_title', 'property_1_price', 'property_1_location', 'property_1_url', 'property_2_title', 'property_2_price', 'property_2_location', 'property_2_url', 'property_3_title', 'property_3_price', 'property_3_location', 'property_3_url', 'market_insights', 'expert_tips', 'special_offer', 'all_properties_url', 'preferences_url'],
  },
];

// Helper function to get template by name
export function getTemplate(name: string, type: 'sms' | 'whatsapp'): MessageTemplate | undefined {
  const templates = type === 'sms' ? SMS_TEMPLATES : WHATSAPP_TEMPLATES;
  return templates.find(t => t.name === name);
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: string, type: 'sms' | 'whatsapp'): MessageTemplate[] {
  const templates = type === 'sms' ? SMS_TEMPLATES : WHATSAPP_TEMPLATES;
  return templates.filter(t => t.category === category);
}

// Helper function to get all categories
export function getCategories(type: 'sms' | 'whatsapp'): string[] {
  const templates = type === 'sms' ? SMS_TEMPLATES : WHATSAPP_TEMPLATES;
  const categories = new Set(templates.map(t => t.category));
  return Array.from(categories);
}

// Helper function to estimate SMS segments
export function estimateSMSSegments(message: string): number {
  const length = message.length;
  
  // Single segment
  if (length <= 160) return 1;
  
  // Multi-segment (153 characters per segment due to header)
  return Math.ceil(length / 153);
}

// Helper function to validate message
export function validateMessage(message: string, type: 'sms' | 'whatsapp'): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (type === 'sms') {
    // SMS validation
    if (message.length > 1600) {
      errors.push('SMS message exceeds maximum length of 1600 characters');
    }
    if (message.length > 160) {
      const segments = estimateSMSSegments(message);
      warnings.push(`Message will be split into ${segments} SMS segments`);
    }
    // Check for Unicode characters
    if (/[^\x00-\x7F]/.test(message)) {
      warnings.push('Message contains Unicode characters. Character limit reduced to 70 per segment.');
    }
  } else {
    // WhatsApp validation
    if (message.length > 4096) {
      errors.push('WhatsApp message exceeds maximum length of 4096 characters');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper function to extract variables from template
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}

// Helper function to replace variables in template
export function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

