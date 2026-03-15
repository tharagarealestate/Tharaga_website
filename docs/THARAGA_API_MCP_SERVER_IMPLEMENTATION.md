# Tharaga API MCP Server - Implementation Guide

## Overview

This document provides the complete implementation of a custom MCP server that exposes all Tharaga website APIs to Claude AI.

---

## Directory Structure

```
E:\Tharaga_website\
└── mcp-servers/
    └── tharaga-api/
        ├── package.json
        ├── index.js
        └── README.md
```

---

## Step-by-Step Implementation

### Step 1: Create Directory Structure

```powershell
cd E:\Tharaga_website
mkdir -p mcp-servers\tharaga-api
cd mcp-servers\tharaga-api
```

### Step 2: Initialize npm Project

```powershell
npm init -y
```

### Step 3: Install Dependencies

```powershell
npm install @modelcontextprotocol/sdk
```

### Step 4: Create package.json

```json
{
  "name": "tharaga-api-mcp",
  "version": "1.0.0",
  "description": "MCP server for Tharaga Real Estate APIs",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "keywords": ["mcp", "tharaga", "real-estate", "api"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  }
}
```

### Step 5: Create index.js

```javascript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration
const NETLIFY_BASE_URL = process.env.NETLIFY_SITE_URL || "https://tharaga.co.in";
const FUNCTIONS_PATH = "/.netlify/functions";

// API endpoint definitions
const API_ENDPOINTS = {
  // Property APIs
  propertiesList: {
    name: "properties_list",
    description: "Get all active property listings with filtering options",
    endpoint: "/properties-list",
    method: "GET"
  },

  // Lead APIs
  leadCreate: {
    name: "lead_create",
    description: "Create a new lead/inquiry for a property",
    endpoint: "/lead-create",
    method: "POST",
    schema: {
      type: "object",
      properties: {
        property_id: { type: "string", description: "Property ID" },
        name: { type: "string", description: "Lead name" },
        email: { type: "string", description: "Lead email" },
        phone: { type: "string", description: "Lead phone number" },
        message: { type: "string", description: "Lead message" }
      },
      required: ["name"]
    }
  },

  // Admin APIs
  adminBuildersList: {
    name: "admin_builders_list",
    description: "Get list of all builders (admin only)",
    endpoint: "/admin-builders-list",
    method: "GET"
  },

  adminLeadsList: {
    name: "admin_leads_list",
    description: "Get list of all leads (admin only)",
    endpoint: "/admin-leads-list",
    method: "GET"
  },

  adminPropertiesList: {
    name: "admin_properties_list",
    description: "Get list of all properties with admin details",
    endpoint: "/admin-properties-list",
    method: "GET"
  },

  adminMetrics: {
    name: "admin_metrics",
    description: "Get admin dashboard metrics",
    endpoint: "/admin-metrics",
    method: "GET"
  },

  adminStats: {
    name: "admin_stats",
    description: "Get admin statistics",
    endpoint: "/admin-stats",
    method: "GET"
  },

  adminVerifyBuilder: {
    name: "admin_verify_builder",
    description: "Verify a builder account (admin only)",
    endpoint: "/admin-verify-builder",
    method: "POST",
    schema: {
      type: "object",
      properties: {
        builder_id: { type: "string", description: "Builder ID to verify" },
        verified: { type: "boolean", description: "Verification status" }
      },
      required: ["builder_id", "verified"]
    }
  },

  adminVerifyProperty: {
    name: "admin_verify_property",
    description: "Verify a property listing (admin only)",
    endpoint: "/admin-verify-property",
    method: "POST",
    schema: {
      type: "object",
      properties: {
        property_id: { type: "string", description: "Property ID to verify" },
        verified: { type: "boolean", description: "Verification status" }
      },
      required: ["property_id", "verified"]
    }
  },

  // User Management APIs
  userRoles: {
    name: "user_roles",
    description: "Get user roles",
    endpoint: "/user-roles",
    method: "GET"
  },

  userAddRole: {
    name: "user_add_role",
    description: "Add a role to a user",
    endpoint: "/user-add-role",
    method: "POST",
    schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User ID" },
        role: { type: "string", description: "Role to add (buyer, builder, admin)" }
      },
      required: ["user_id", "role"]
    }
  },

  userSwitchRole: {
    name: "user_switch_role",
    description: "Switch user's active role",
    endpoint: "/user-switch-role",
    method: "POST",
    schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "User ID" },
        role: { type: "string", description: "Role to switch to" }
      },
      required: ["user_id", "role"]
    }
  },

  // Recommendations
  recommendations: {
    name: "recommendations",
    description: "Get property recommendations for a user",
    endpoint: "/recommendations",
    method: "GET"
  },

  // Authentication
  authCheckEmail: {
    name: "auth_check_email",
    description: "Check if email exists in the system",
    endpoint: "/authCheckEmail",
    method: "POST",
    schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email to check" }
      },
      required: ["email"]
    }
  }
};

// Helper function to make API requests
async function callAPI(endpoint, method = "GET", body = null) {
  const url = `${NETLIFY_BASE_URL}${FUNCTIONS_PATH}${endpoint}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Create MCP server
const server = new Server(
  {
    name: "tharaga-api",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = Object.values(API_ENDPOINTS).map((endpoint) => ({
    name: endpoint.name,
    description: endpoint.description,
    inputSchema: endpoint.schema || {
      type: "object",
      properties: {},
    },
  }));

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments || {};

  // Find the matching endpoint
  const endpoint = Object.values(API_ENDPOINTS).find(
    (e) => e.name === toolName
  );

  if (!endpoint) {
    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${toolName}`,
        },
      ],
    };
  }

  // Make the API call
  const result = await callAPI(
    endpoint.endpoint,
    endpoint.method,
    Object.keys(args).length > 0 ? args : null
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tharaga API MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

### Step 6: Create README.md

```markdown
# Tharaga API MCP Server

MCP server that exposes Tharaga Real Estate website APIs to Claude AI.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

Add to Claude Desktop config (\`%APPDATA%\\Claude\\claude_desktop_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "tharaga-api": {
      "command": "node",
      "args": ["E:\\\\Tharaga_website\\\\mcp-servers\\\\tharaga-api\\\\index.js"],
      "env": {
        "NETLIFY_SITE_URL": "https://tharaga.co.in"
      }
    }
  }
}
\`\`\`

## Available Tools

- \`properties_list\` - Get all active property listings
- \`lead_create\` - Create a new lead/inquiry
- \`admin_builders_list\` - Get all builders (admin)
- \`admin_leads_list\` - Get all leads (admin)
- \`admin_properties_list\` - Get all properties (admin)
- \`admin_metrics\` - Get admin metrics
- \`admin_stats\` - Get admin statistics
- \`admin_verify_builder\` - Verify a builder
- \`admin_verify_property\` - Verify a property
- \`user_roles\` - Get user roles
- \`user_add_role\` - Add role to user
- \`user_switch_role\` - Switch user role
- \`recommendations\` - Get property recommendations
- \`auth_check_email\` - Check if email exists

## Example Usage in Claude

\`\`\`
"Use tharaga-api to get all property listings"
"Create a new lead with name 'John Doe', email 'john@example.com', phone '1234567890'"
"Get admin metrics"
\`\`\`
\`\`\`

---

## Testing

### Test the server

```powershell
cd E:\Tharaga_website\mcp-servers\tharaga-api
$env:NETLIFY_SITE_URL="https://tharaga.co.in"
node index.js
```

The server should start and show:
```
Tharaga API MCP server running on stdio
```

---

## Integration with Claude Desktop

### Add to Configuration

Edit `%APPDATA%\Claude\claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "tharaga-api": {
      "command": "node",
      "args": ["E:\\Tharaga_website\\mcp-servers\\tharaga-api\\index.js"],
      "env": {
        "NETLIFY_SITE_URL": "https://tharaga.co.in"
      }
    }
  }
}
```

### Restart Claude Desktop

1. Close Claude Desktop completely
2. Reopen Claude Desktop
3. Wait for full startup

### Test in Claude

Try these commands:

```
"List all available tools from tharaga-api"
"Use tharaga-api to get property listings"
"Create a test lead using tharaga-api"
```

---

## API Endpoints Reference

### Public APIs

| Tool Name | Endpoint | Method | Description |
|-----------|----------|--------|-------------|
| properties_list | /properties-list | GET | Get active properties |
| lead_create | /lead-create | POST | Create new lead |
| recommendations | /recommendations | GET | Get recommendations |
| auth_check_email | /authCheckEmail | POST | Check email exists |

### Admin APIs

| Tool Name | Endpoint | Method | Description |
|-----------|----------|--------|-------------|
| admin_builders_list | /admin-builders-list | GET | List all builders |
| admin_leads_list | /admin-leads-list | GET | List all leads |
| admin_properties_list | /admin-properties-list | GET | List all properties |
| admin_metrics | /admin-metrics | GET | Get metrics |
| admin_stats | /admin-stats | GET | Get statistics |
| admin_verify_builder | /admin-verify-builder | POST | Verify builder |
| admin_verify_property | /admin-verify-property | POST | Verify property |

### User Management APIs

| Tool Name | Endpoint | Method | Description |
|-----------|----------|--------|-------------|
| user_roles | /user-roles | GET | Get user roles |
| user_add_role | /user-add-role | POST | Add role to user |
| user_switch_role | /user-switch-role | POST | Switch user role |

---

## Troubleshooting

### Server Not Starting

1. Check Node.js is installed: `node --version`
2. Check dependencies are installed: `npm install`
3. Verify path in config is correct

### API Calls Failing

1. Check site URL is correct: `https://tharaga.co.in`
2. Verify network connectivity
3. Check API endpoints are deployed on Netlify

### MCP Server Not Visible in Claude

1. Verify config file syntax (use jsonlint.com)
2. Restart Claude Desktop completely
3. Check server path exists
4. Check Task Manager - Claude should be fully closed before restart

---

## Security Notes

1. This server exposes public APIs - admin APIs require proper authentication
2. Do not commit API keys or sensitive credentials
3. Use environment variables for sensitive configuration
4. Rate limiting is handled by Netlify Functions

---

## Future Enhancements

- [ ] Add authentication support for admin APIs
- [ ] Add caching for frequently accessed data
- [ ] Add more detailed error handling
- [ ] Add request logging
- [ ] Add support for query parameters and filters
- [ ] Add webhook support for real-time updates

---

**Created**: 2026-01-18
**Version**: 1.0.0
**Purpose**: Custom MCP server for Tharaga Real Estate APIs
