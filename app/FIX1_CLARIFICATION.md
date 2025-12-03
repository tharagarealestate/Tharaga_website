# FIX 1: API Endpoints - Complete Clarification

## ✅ Buyer Role IS Fully Implemented

### Clarification

The buyer role **IS fully implemented and working** in all three endpoints. The summary was misleading by only mentioning `builder_data`, but both roles are fully supported.

## Detailed Implementation

### 1. GET /api/user/roles
**Status**: ✅ Supports both buyer and builder roles

- Returns all roles (buyer, builder, or both) with `is_primary` flag
- Checks `has_buyer_profile` and `has_builder_profile` separately
- Returns `builder_verified` status for builder role

**Response Format**:
```json
{
  "roles": ["buyer", "builder"],  // Can be either or both
  "primary_role": "buyer",         // The active role
  "builder_verified": false,
  "has_builder_profile": true,
  "has_buyer_profile": true
}
```

### 2. POST /api/user/add-role
**Status**: ✅ Fully supports both buyer and builder roles

**Request Format**:
```json
{
  "role": "buyer" | "builder",     // Both are valid
  "is_primary": boolean,            // Optional, defaults to false
  "builder_data": {                // Only used when role is "builder"
    "company_name": "...",
    "gstin": "...",
    "rera_number": "..."
  }
}
```

**Buyer Role Handling** (Lines 130-145):
- ✅ Validates buyer role (line 18)
- ✅ Creates entry in `user_roles` table with `role: 'buyer'`
- ✅ **Automatically creates `buyer_profiles` entry** if it doesn't exist
- ✅ Sets up buyer profile with empty preferences and saved_properties array
- ✅ Updates `profiles` table role field if `is_primary: true`

**Builder Role Handling** (Lines 93-128):
- ✅ Validates builder role
- ✅ Creates entry in `user_roles` table with `role: 'builder'`
- ✅ Creates `builder_profiles` entry with company details
- ✅ Sets verification_status to 'pending'
- ✅ Updates `profiles` table role field if `is_primary: true`

**Key Difference**:
- **Buyer**: Simple profile creation (no additional data needed)
- **Builder**: Requires `builder_data` (company_name, GSTIN, RERA) for profile creation

### 3. POST /api/user/switch-role
**Status**: ✅ Fully supports both buyer and builder roles

**Request Format**:
```json
{
  "role": "buyer" | "builder"  // Both are valid
}
```

**Functionality**:
- ✅ Validates both buyer and builder roles (line 19)
- ✅ Verifies user has the target role in `user_roles` table
- ✅ Sets target role to `is_primary: true`
- ✅ Sets all other roles to `is_primary: false`
- ✅ Updates `profiles` table role field for backward compatibility
- ✅ Works identically for both buyer and builder roles

## Why Summary Was Misleading

The summary mentioned:
> "accepts { role, is_primary, builder_data } and creates builder profiles"

This made it seem like only builder role was handled, but actually:
- ✅ **Both roles are accepted** (`'buyer' | 'builder'`)
- ✅ **Both roles create their respective profiles**:
  - Buyer → creates `buyer_profiles` entry
  - Builder → creates `builder_profiles` entry
- ✅ **`builder_data` is optional** and only used when `role === 'builder'`
- ✅ **Buyer role doesn't need additional data** (simpler flow)

## Complete Flow Examples

### Adding Buyer Role:
```javascript
POST /api/user/add-role
{
  "role": "buyer",
  "is_primary": true
}

// Result:
// 1. Creates entry in user_roles table (role: 'buyer', is_primary: true)
// 2. Creates entry in buyer_profiles table (preferences: {}, saved_properties: [])
// 3. Updates profiles table (role: 'buyer')
```

### Adding Builder Role:
```javascript
POST /api/user/add-role
{
  "role": "builder",
  "is_primary": true,
  "builder_data": {
    "company_name": "ABC Constructions",
    "gstin": "29AABCU9603R1ZM",
    "rera_number": "PRM/KA/RERA/..."
  }
}

// Result:
// 1. Creates entry in user_roles table (role: 'builder', is_primary: true)
// 2. Creates entry in builder_profiles table (with company details, verification_status: 'pending')
// 3. Updates profiles table (role: 'builder')
```

### Switching to Buyer Role:
```javascript
POST /api/user/switch-role
{
  "role": "buyer"
}

// Result:
// 1. Sets buyer role to is_primary: true
// 2. Sets builder role to is_primary: false
// 3. Updates profiles table (role: 'buyer')
```

## ✅ Confirmation

**Both buyer and builder roles are fully implemented and working in all three endpoints.**

The buyer role:
- ✅ Is validated in all endpoints
- ✅ Creates buyer_profiles entry automatically
- ✅ Can be set as primary role
- ✅ Can be switched to/from
- ✅ Works identically to builder role (except no additional data needed)

---

**Status**: ✅ Both roles fully implemented
**Issue**: Summary was misleading, not the implementation

