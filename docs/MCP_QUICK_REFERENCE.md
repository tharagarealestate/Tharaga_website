# MCP Quick Reference Card

**Last Updated**: 2026-01-18

---

## 🎯 6 MCP Servers Connected

| Server | Purpose | Status |
|--------|---------|--------|
| 🗄️ **Supabase** | Database operations | ✅ Active |
| 🤖 **OpenAI** | GPT-4o AI | ✅ Active |
| 📁 **Filesystem** | File operations | ✅ Active |
| 🚀 **Netlify** | Deployments | ✅ Active |
| 🧠 **Advanced Reasoning** | MCTS/Beam/R1/Hybrid | ✅ Active |
| 🔍 **Perplexity** | Web research | ✅ Active |

---

## 💬 Common Commands

### Database (Supabase)
```
"List all tables"
"Show schema for leads table"
"Execute: SELECT * FROM properties WHERE city = 'Chennai'"
"Create migration to add status field"
"Check security advisors"
```

### Deployment (Netlify)
```
"Deploy to Netlify"
"Check deployment status"
"Show deployment logs"
"List all my sites"
```

### Files (Filesystem)
```
"Read package.json"
"Search for 'supabase' in src"
"List all TypeScript files"
"Show directory structure"
```

### Research (Perplexity)
```
"Research Next.js 15 features"
"Find Supabase authentication docs"
"Search for solutions to [error]"
"What are best practices for [topic]"
```

### Reasoning (Advanced)
```
"Use MCTS to optimize this algorithm"
"Use beam search to compare authentication methods"
"Use R1 to analyze this architecture"
"Use hybrid to design this system"
```

---

## 🌐 27 Tharaga API Endpoints

### Public
- `properties-list` - Get active listings
- `lead-create` - Create lead/inquiry
- `recommendations` - Get recommendations
- `authCheckEmail` - Check email exists

### Admin
- `admin-builders-list` - List builders
- `admin-leads-list` - List leads
- `admin-properties-list` - List properties
- `admin-metrics` - Get metrics
- `admin-stats` - Get statistics
- `admin-verify-builder` - Verify builder
- `admin-verify-property` - Verify property

### User Management
- `user-roles` - Get roles
- `user-add-role` - Add role
- `user-switch-role` - Switch role

### Payments
- `razorpayCreateSubscription` - Razorpay
- `stripeCheckout` - Stripe
- (+ webhooks)

**Base URL**: `https://tharaga.co.in/.netlify/functions/`

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `MCP_ANALYSIS_SUMMARY.md` | Complete analysis overview |
| `HOW_TO_USE_MCP_SERVERS.md` | Usage guide & examples |
| `CLAUDE_AI_MCP_SETUP_GUIDE.md` | Claude Desktop setup |
| `THARAGA_API_MCP_SERVER_IMPLEMENTATION.md` | Custom API server |
| `MCP_TROUBLESHOOTING.md` | Fix common issues |
| `MCP_QUICK_REFERENCE.md` | This card |

---

## 🔑 Config Files

**Cursor**: `C:\Users\DELL\.cursor\mcp.json` ✅
**Claude Desktop**: `%APPDATA%\Claude\claude_desktop_config.json` 🔧

---

## 🚀 Quick Start

### In Cursor (Working Now!)
Just ask naturally:
```
"Use Supabase to list tables"
"Deploy to Netlify"
"Research React best practices"
```

### In Claude Desktop (Optional)
1. Install Claude Desktop
2. Create config file
3. Add API keys
4. Restart
5. Use same commands as Cursor

---

## 🔧 Troubleshooting

### Not Working?
1. Restart Cursor/Claude Desktop completely
2. Check config file syntax
3. Verify paths exist
4. Check API keys are valid

### Need Help?
- See: `MCP_TROUBLESHOOTING.md`
- See: `HOW_TO_USE_MCP_SERVERS.md`

---

## 💡 Pro Tips

### Combine MCPs for Power
```
"Use Perplexity to research caching strategies,
then use MCTS reasoning to design implementation,
then use Supabase to create tables,
then deploy with Netlify"
```

### Chain Commands
```
"First research, then analyze, then implement, then deploy"
```

### Be Specific
❌ "Check database"
✅ "Use Supabase to show schema for leads table"

---

**Config Location (Cursor)**: `C:\Users\DELL\.cursor\mcp.json`
**Config Location (Claude)**: `%APPDATA%\Claude\claude_desktop_config.json`
**Project Path**: `E:\Tharaga_website`
