# 🎯 Leads Management Feature - Complete Guide

## 📍 **How to Access the Feature**

### **Access Method:**
1. **Login as a Builder** - Navigate to `tharaga.co.in` and log in with builder credentials
2. **Builder Dashboard** - Once logged in, you'll see the Builder Portal sidebar
3. **Click "Leads"** - In the left sidebar navigation, click on the **"Leads"** menu item
   - It shows a badge with the number of leads (e.g., "12")
   - It's the second item in the navigation menu
4. **Direct URL**: `https://tharaga.co.in/builder/leads`

### **Navigation Structure:**
```
Builder Portal Sidebar:
├── Overview
├── 🎯 Leads (with badge) ← CLICK HERE
│   ├── All Leads (main page with AI scoring)
│   ├── Pipeline (kanban view)
│   └── Analytics (coming soon)
├── Properties
├── Revenue
└── Settings
```

---

## 🎯 **Purpose of the Feature**

### **Primary Purpose:**
This feature helps **real estate builders** intelligently manage, prioritize, and convert leads using **AI-powered scoring** and comprehensive analytics.

### **Key Problems It Solves:**

1. **Lead Prioritization**
   - Automatically scores leads from 0-10 based on multiple factors
   - Categorizes leads: Hot Lead, Warm Lead, Developing Lead, Cold Lead, Low Quality
   - Helps builders focus on high-value leads first

2. **Efficient Lead Management**
   - Filter leads by score, category, budget, location, property type
   - Search across name, email, phone
   - Sort by score, date, activity, or budget
   - Pagination for handling large lead volumes

3. **Behavioral Insights**
   - Track which properties leads are viewing
   - Monitor engagement levels (views, time spent)
   - Identify most active times for contact
   - Device usage patterns

4. **Interaction Tracking**
   - Record all builder interactions with leads
   - Track response times
   - Monitor pending interactions
   - Identify leads that need follow-up

5. **AI Recommendations**
   - Suggests next best action for each lead
   - Recommends optimal contact times
   - Calculates conversion probability
   - Suggests similar properties

---

## ⚡ **Real-Time Usage Scenarios**

### **Scenario 1: Morning Lead Review**
**Time:** 9:00 AM  
**Action:**
1. Open `/builder/leads`
2. Filter by "Hot Lead" category
3. Sort by "Last Activity" (descending)
4. See leads that viewed properties last night
5. Click on a lead → See timeline → Call at optimal time

**Result:** Contact hot leads immediately when they're most likely to convert

---

### **Scenario 2: Finding High-Value Leads**
**Time:** Anytime  
**Action:**
1. Set score filter: 7-10 (Hot & Warm leads)
2. Filter by budget: ₹50L - ₹1Cr
3. Filter by location: "Whitefield"
4. Sort by score (highest first)

**Result:** Find leads matching your premium properties

---

### **Scenario 3: Follow-Up Management**
**Time:** End of day  
**Action:**
1. Filter by "No Response" (leads builder hasn't contacted)
2. Filter by "Has Interactions" = false
3. See leads that need initial contact
4. Click lead → See recommendations → Follow suggested action

**Result:** Ensure no lead falls through the cracks

---

### **Scenario 4: Lead Deep Dive**
**Time:** Before a call  
**Action:**
1. Search for lead by name/email
2. Click on lead card
3. View:
   - Score breakdown (why they scored high/low)
   - Properties they viewed (with engagement scores)
   - Activity timeline (all their actions)
   - Behavior analytics (sessions, time spent, device)
   - AI recommendations (best time to call, next action)

**Result:** Make informed, personalized contact with full context

---

### **Scenario 5: Team Performance**
**Time:** Weekly review  
**Action:**
1. View stats dashboard at top of leads page
2. See:
   - Total leads by category
   - Average score
   - Pending interactions count
   - No-response leads count

**Result:** Track team performance and lead quality metrics

---

## 🚀 **Key Features & Benefits**

### **1. AI-Powered Scoring System**
- **6 Scoring Factors:**
  - Budget Alignment (0-10)
  - Engagement Score (0-10)
  - Property Fit (0-10)
  - Time Investment (0-10)
  - Contact Intent (0-10)
  - Recency Score (0-10)
- **Automatic Categorization:** Hot (9+), Warm (7-8), Developing (5-6), Cold (3-4), Low (<3)

### **2. Advanced Filtering**
- **Score Range:** Slider to filter by AI score
- **Category:** Hot, Warm, Developing, Cold, Low Quality
- **Budget Range:** Min/Max budget filters
- **Location:** Filter by preferred location
- **Property Type:** Filter by property type preference
- **Search:** Search by name, email, or phone
- **Interaction Status:** Has interactions, No response
- **Date Filters:** Created date, Last activity date

### **3. Smart Sorting**
- Sort by: Score, Date Created, Last Activity, Budget
- Ascending/Descending order

### **4. Pagination**
- Configurable page size (default: 20, max: 100)
- Page navigation with prev/next buttons
- Shows "X of Y leads" count

### **5. Lead Details Page**
- **Score Breakdown:** Visual bars showing each scoring factor
- **Behavior Analytics:**
  - Total sessions
  - Property views count
  - Total time spent
  - Average session duration
  - Most active day/hour
  - Device breakdown
- **Viewed Properties:** List with engagement scores
- **Activity Timeline:** Chronological view of all actions
- **Interactions History:** All builder interactions with status
- **AI Recommendations:**
  - Next best action
  - Optimal contact time
  - Conversion probability (%)

### **6. Stats Dashboard**
- Total leads count
- Leads by category (Hot, Warm, Developing, Cold)
- Average score
- Pending interactions
- No-response leads

---

## 💡 **Real-World Benefits**

### **For Builders:**
1. **Save Time:** Focus on high-quality leads first
2. **Increase Conversion:** Contact leads at optimal times
3. **Better Context:** Full lead history before contacting
4. **Track Performance:** Monitor lead quality and team efficiency
5. **Never Miss:** Identify leads that need follow-up

### **For Business:**
1. **Higher ROI:** Prioritize leads likely to convert
2. **Better Customer Experience:** Personalized, timely contact
3. **Data-Driven Decisions:** Analytics-based lead management
4. **Scalability:** Handle hundreds of leads efficiently

---

## 🔄 **Real-Time Data Flow**

### **How Data Updates:**
1. **User Behavior:** Automatically tracked when users browse properties
2. **Lead Scores:** Calculated in real-time based on behavior
3. **Interactions:** Recorded when builder contacts lead
4. **Timeline:** Updates automatically as new activities occur

### **API Endpoints:**
- `GET /api/leads` - List leads with filters, pagination, sorting
- `GET /api/leads/[leadId]` - Get detailed lead information

---

## 📱 **User Interface**

### **Leads Listing Page:**
- **Stats Table:** Overview metrics (pricing-style table)
- **Filters Section:** Collapsible advanced filters
- **Search Bar:** Quick search by name/email/phone
- **View Toggle:** Switch between Grid and Table views
- **Pagination:** Navigate through pages
- **Lead Cards:** Visual cards with score badges, contact info, activity

### **Lead Details Page:**
- **Left Column:** Main content (info, analytics, timeline)
- **Right Column:** AI recommendations and quick actions
- **Color-Coded Scores:** Visual indicators (gold=hot, orange=warm, etc.)

---

## 🎨 **Design Style**
- Matches the **pricing page** style exactly
- Clean, professional table layouts
- Consistent borders and spacing
- Responsive design for mobile/tablet/desktop

---

## ✅ **Accessibility**
- Available to **all builders** (not locked behind Pro tier)
- Works on **trial accounts**
- No additional setup required
- Automatic data collection

---

## 🚦 **Getting Started**

1. **Login** → Go to `tharaga.co.in` and login as builder
2. **Navigate** → Click "Leads" in sidebar (shows badge with count)
3. **Explore** → Use filters to find specific leads
4. **Deep Dive** → Click any lead card to see full details
5. **Take Action** → Follow AI recommendations for best results

---

## 📊 **Example Use Cases**

### **Use Case 1: New Lead Alert**
- Lead submits inquiry → Appears in leads list
- AI scores lead based on behavior → Categorized as "Hot Lead"
- Builder sees notification → Reviews lead details
- AI suggests: "Call immediately - Hot lead!"
- Builder contacts → Records interaction → Lead converts

### **Use Case 2: Follow-Up Reminder**
- Lead viewed 5 properties → High engagement score
- Builder hasn't contacted → Shows in "No Response" filter
- AI recommends: "Send WhatsApp with property recommendations"
- Builder follows suggestion → Lead responds → Moves to pipeline

### **Use Case 3: Lead Qualification**
- Multiple leads in system → Builder filters by score 7+
- Reviews each lead's preferences → Matches with properties
- Contacts qualified leads first → Higher conversion rate
- Tracks interactions → Measures success

---

## 🔐 **Security & Privacy**
- **Row Level Security (RLS):** Builders only see their own leads
- **Authentication Required:** Must be logged in as builder
- **Data Protection:** User preferences and behavior data secured
- **Audit Trail:** All interactions are logged

---

## 📈 **Future Enhancements**
- Real-time notifications for new hot leads
- Email/SMS integration for automated follow-ups
- Lead assignment to team members
- Export leads to CSV/Excel
- Bulk actions (mark as contacted, assign, etc.)
- Advanced analytics dashboard
- Lead scoring history charts

---

**🎉 The feature is LIVE and ready to use! Just navigate to `/builder/leads` after logging in as a builder.**

