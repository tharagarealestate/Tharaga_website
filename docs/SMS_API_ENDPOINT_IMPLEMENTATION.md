# SMS API Endpoint Implementation

## Overview
This document describes the dedicated SMS and WhatsApp API endpoints that have been implemented for the Twilio messaging system. These endpoints provide a focused interface for sending SMS and WhatsApp messages with template support.

## ✅ Implementation Status
- ✅ SMS API Endpoint (`/api/messaging/sms`)
- ✅ WhatsApp API Endpoint (`/api/messaging/whatsapp`)
- ✅ Template Support
- ✅ Input Validation
- ✅ Error Handling
- ✅ GET Endpoints for Message History

## 📁 Files Created

### New Files
- `app/app/api/messaging/sms/route.ts` - Dedicated SMS endpoint
- `app/app/api/messaging/whatsapp/route.ts` - Dedicated WhatsApp endpoint

## 🚀 API Endpoints

### POST /api/messaging/sms

Send SMS messages with optional template support.

#### Request Body
```typescript
{
  to: string;                    // Required: Phone number
  message?: string;              // Optional: Direct message body
  template_id?: string;          // Optional: Template UUID
  variables?: Record<string, any>; // Optional: Template variables
  lead_id?: string;              // Optional: Lead UUID
}
```

#### Response (Success)
```typescript
{
  success: true,
  message_id: string,
  status: string,
  cost?: string
}
```

#### Response (Error)
```typescript
{
  error: string,
  success: false,
  details?: ValidationError[]
}
```

#### Example Usage

**Direct Message:**
```bash
curl -X POST https://tharaga.co.in/api/messaging/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "message": "Hello! This is a test SMS."
  }'
```

**Template Message:**
```bash
curl -X POST https://tharaga.co.in/api/messaging/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919876543210",
    "template_id": "123e4567-e89b-12d3-a456-426614174000",
    "variables": {
      "name": "John Doe",
      "property_title": "Luxury Apartment"
    }
  }'
```

### GET /api/messaging/sms

Retrieve SMS message history or specific message details.

#### Query Parameters
- `phone` (optional): Phone number to get history for
- `message_id` (optional): Specific message ID to retrieve
- `limit` (optional): Number of messages to return (default: 50)

#### Example Usage

**Get Message History:**
```bash
curl "https://tharaga.co.in/api/messaging/sms?phone=+919876543210&limit=20"
```

**Get Specific Message:**
```bash
curl "https://tharaga.co.in/api/messaging/sms?message_id=SM1234567890abcdef"
```

### POST /api/messaging/whatsapp

Send WhatsApp messages with optional template support.

#### Request Body
```typescript
{
  to: string;                    // Required: Phone number
  message?: string;              // Optional: Direct message body
  template_id?: string;          // Optional: Template UUID
  variables?: Record<string, any>; // Optional: Template variables
  mediaUrl?: string[];           // Optional: Media URLs
  lead_id?: string;              // Optional: Lead UUID
}
```

#### Response (Success)
```typescript
{
  success: true,
  message_id: string,
  status: string,
  cost?: string
}
```

### GET /api/messaging/whatsapp

Retrieve WhatsApp message history or specific message details.

Same query parameters as SMS endpoint.

## 🔒 Security Features

1. **Authentication Required**: All endpoints require authenticated user
2. **Input Validation**: Zod schema validation for all inputs
3. **Error Handling**: Comprehensive error handling with proper status codes
4. **Rate Limiting**: Built into Twilio client (10 SMS/min, 60 WhatsApp/hour)

## ✅ Validation Rules

### SMS Endpoint
- `to`: Minimum 10 characters
- `message`: 1-1600 characters (if provided)
- `template_id`: Valid UUID format (if provided)
- Either `message` or `template_id` must be provided

### WhatsApp Endpoint
- `to`: Minimum 10 characters
- `message`: 1-4096 characters (if provided)
- `template_id`: Valid UUID format (if provided)
- `mediaUrl`: Array of valid URLs (if provided)
- Either `message` or `template_id` must be provided

## 📊 Response Status Codes

- `200` - Success
- `400` - Bad Request (validation error, missing required fields)
- `401` - Unauthorized (not authenticated)
- `404` - Not Found (message not found for GET requests)
- `500` - Internal Server Error

## 🔄 Integration with Existing System

The new endpoints work alongside the existing `/api/messaging/send` endpoint:

- `/api/messaging/send` - General endpoint (supports both SMS and WhatsApp via `type` parameter)
- `/api/messaging/sms` - Dedicated SMS endpoint
- `/api/messaging/whatsapp` - Dedicated WhatsApp endpoint

All endpoints use the same underlying Twilio client and provide consistent functionality.

## 🧪 Testing

### Test Cases

1. **Send Direct SMS**
   - [ ] Valid phone number and message
   - [ ] Invalid phone number format
   - [ ] Message too long (>1600 chars)
   - [ ] Missing required fields

2. **Send SMS with Template**
   - [ ] Valid template_id and variables
   - [ ] Invalid template_id
   - [ ] Missing variables
   - [ ] Template not found

3. **Get Message History**
   - [ ] Valid phone number
   - [ ] Invalid phone number
   - [ ] Limit parameter

4. **Get Message Details**
   - [ ] Valid message_id
   - [ ] Invalid message_id
   - [ ] Message not found

5. **Authentication**
   - [ ] Authenticated request
   - [ ] Unauthenticated request
   - [ ] Invalid token

## 📝 Error Messages

### Common Errors

- `"Unauthorized"` - User not authenticated
- `"Invalid request body"` - Malformed JSON
- `"Validation failed"` - Input validation error
- `"Either message or template_id is required"` - Missing required field
- `"Invalid phone number format"` - Phone number validation failed
- `"Rate limit exceeded"` - Too many messages sent
- `"Template not found or inactive"` - Template doesn't exist
- `"Failed to send SMS"` - Twilio API error

## 🔧 Usage in Frontend

### Example: Send SMS

```typescript
const sendSMS = async (phone: string, message: string) => {
  const response = await fetch('/api/messaging/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      message: message,
    }),
  });
  
  const data = await response.json();
  if (data.success) {
    console.log('SMS sent:', data.message_id);
  } else {
    console.error('Error:', data.error);
  }
};
```

### Example: Send SMS with Template

```typescript
const sendSMSTemplate = async (phone: string, templateId: string, variables: Record<string, string>) => {
  const response = await fetch('/api/messaging/sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phone,
      template_id: templateId,
      variables: variables,
    }),
  });
  
  return await response.json();
};
```

### Example: Get Message History

```typescript
const getSMSHistory = async (phone: string, limit: number = 50) => {
  const response = await fetch(`/api/messaging/sms?phone=${encodeURIComponent(phone)}&limit=${limit}`);
  const data = await response.json();
  return data.messages;
};
```

## 🎯 Best Practices

1. **Always validate phone numbers** before sending
2. **Use templates** for consistent messaging
3. **Handle errors gracefully** with user-friendly messages
4. **Respect rate limits** - implement retry logic with backoff
5. **Log all messages** for audit purposes
6. **Monitor costs** - track message costs via response

## 🐛 Troubleshooting

### Issue: "Twilio credentials not configured"
**Solution**: Check `.env.local` file has all required Twilio variables

### Issue: "Rate limit exceeded"
**Solution**: Wait for rate limit window to expire or implement queue system

### Issue: "Template not found"
**Solution**: Verify template exists and is active in database

### Issue: "Invalid phone number format"
**Solution**: Ensure phone number is in E.164 format (+[country code][number])

## ✅ Validation Checklist

- [x] SMS endpoint created with POST and GET methods
- [x] WhatsApp endpoint created with POST and GET methods
- [x] Input validation with Zod schemas
- [x] Authentication checks
- [x] Error handling
- [x] Template support
- [x] Message history support
- [x] Consistent response format
- [x] No linting errors
- [x] TypeScript types defined

## 🎉 Implementation Complete!

The dedicated SMS and WhatsApp API endpoints are fully implemented and ready for production use. They provide a focused, type-safe interface for messaging operations with comprehensive error handling and validation.

