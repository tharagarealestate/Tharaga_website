# 🚀 Quick Start: Using Twilio Messaging in Tharaga

## 📍 **Where to Find It**

```
Builder Dashboard → Sidebar → "Messaging" → "Send Messages"
```

**Direct URL:** `https://tharaga.co.in/builder/messaging`

---

## 🎯 **5 Most Common Use Cases**

### **1. Follow Up After Property Viewing** ⭐ Most Common
**When:** Lead views a property but doesn't respond
**Action:**
1. Go to Messaging → Send Messages
2. Select **WhatsApp**
3. Enter lead's phone: `9876543210`
4. Send:
   ```
   Hi {{name}}, I saw you viewed {{property_name}} in {{location}}. 
   Would you like to schedule a site visit? I'm available this weekend.
   ```

### **2. Site Visit Reminder** ⏰
**When:** 24 hours before scheduled site visit
**Action:**
1. Use template: "Site Visit Reminder"
2. Fill variables: name, property_name, date, time
3. Send via **SMS** (faster delivery)

### **3. New Property Match** 🏠
**When:** New property matches lead's search criteria
**Action:**
1. Go to Templates → Create Template
2. Name: "New Property Alert"
3. Body:
   ```
   Hi {{name}}, we found a {{property_type}} in {{location}} 
   matching your requirements. Price: ₹{{price}}. 
   Interested? Reply YES for details.
   ```
4. Send to qualified leads

### **4. Deal Closure Confirmation** ✅
**When:** Offer accepted, deal closed
**Action:**
1. Send WhatsApp message:
   ```
   Congratulations {{name}}! Your offer of ₹{{price}} for 
   {{property_name}} has been accepted. Next steps will be 
   shared shortly.
   ```

### **5. Construction Updates** 🏗️
**When:** Regular updates to property buyers
**Action:**
1. Create template: "Construction Update"
2. Send monthly:
   ```
   Hi {{name}}, construction update for {{property_name}}: 
   {{progress}}% complete. Expected completion: {{date}}.
   ```

---

## ⚡ **3-Step Quick Send**

### **Step 1: Choose Type**
- **SMS** = Quick, urgent messages
- **WhatsApp** = Detailed, media-rich messages

### **Step 2: Enter Details**
- Phone: `9876543210` (auto-formats to +91)
- Message: Type or select template

### **Step 3: Send**
- Click "Send Message"
- ✅ Status updates automatically

---

## 📚 **Template Library**

### **Pre-Built Templates Available:**

#### **SMS Templates:**
1. **Property Inquiry Response**
2. **Site Visit Confirmation**
3. **Follow-up After Viewing**
4. **Price Negotiation Update**
5. **Deal Closure Confirmation**

#### **WhatsApp Templates:**
1. **Welcome Message**
2. **Property Details Sharing**
3. **Site Visit Reminder**
4. **Construction Progress Update**
5. **Thank You Message**

### **How to Use Pre-Built Templates:**
1. Go to **Messaging** → **Template Library** tab
2. Browse by category
3. Click **"Use Template"**
4. Fill in variables
5. Send!

---

## 🔄 **Workflow Integration**

### **From Lead Dashboard:**
```
View Lead → Click "Send Message" → 
Select Template → Fill Variables → Send
```

### **From Property Listing:**
```
Property Page → "Share with Lead" → 
Select Lead → Choose Template → Send
```

### **From Site Visit:**
```
Schedule Visit → Auto-send Reminder → 
Follow-up After Visit
```

---

## 📊 **What Gets Tracked**

Every message is automatically logged in:
- ✅ Lead's communication history
- ✅ Message delivery status
- ✅ Response tracking
- ✅ Cost per message
- ✅ Template usage statistics

---

## 💡 **Pro Tips**

1. **Personalize Always**: Use `{{name}}` in every message
2. **Timing Matters**: Send between 10 AM - 8 PM
3. **WhatsApp for Details**: Use for property images, videos
4. **SMS for Urgent**: Use for time-sensitive updates
5. **Template First**: Create templates before sending
6. **Track Results**: Monitor which templates work best

---

## 🎨 **UI Overview**

```
┌─────────────────────────────────────────┐
│  Messaging Dashboard                    │
├─────────────────────────────────────────┤
│  [Send] [Templates] [Library] [History] │
├─────────────────────────────────────────┤
│                                         │
│  Type: [SMS] [WhatsApp]                 │
│                                         │
│  To: [Phone Number Input]              │
│                                         │
│  Message: [Text Area]                   │
│  [Use Template] [Send Message]          │
│                                         │
└─────────────────────────────────────────┘
```

---

## ✅ **Success Metrics**

Track these to measure effectiveness:
- **Delivery Rate**: Should be >95%
- **Read Rate** (WhatsApp): Should be >80%
- **Response Rate**: Track leads who reply
- **Conversion Rate**: Messages → Site Visits → Deals

---

## 🆘 **Need Help?**

1. **Message Not Sending?**
   - Check phone format: `+91XXXXXXXXXX`
   - Verify account balance
   - Check rate limits

2. **Template Not Working?**
   - Verify all variables are filled
   - Check variable names match exactly

3. **Status Not Updating?**
   - Wait 2-3 minutes
   - Check webhook configuration

---

**Ready to start?** Go to `/builder/messaging` and send your first message! 🚀


