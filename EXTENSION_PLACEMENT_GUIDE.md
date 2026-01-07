# Extension Placement Guide

## Overview
This document explains the extension placement recommendation and how to move extensions to a dedicated schema if desired.

## Current Status

**Extensions in Public Schema**:
- `vector` (pgvector extension)
- `pg_trgm` (trigram extension)
- `unaccent` (text search extension)
- `postgis` (spatial extension)

**Security Status**: ✅ **SECURE** (CREATE privilege revoked from PUBLIC)

## Why This Recommendation Exists

Extensions in the `public` schema is a best-practice recommendation, not a security vulnerability. With `CREATE` privilege revoked from `PUBLIC` on the public schema (which we've done), the security risk is minimal.

## Should You Move Extensions?

### Reasons to Move:
- **Best Practice**: Keeps public schema clean
- **Organization**: Better schema organization
- **Future-Proofing**: Aligns with PostgreSQL best practices

### Reasons Not to Move:
- **Complexity**: Requires careful migration
- **Risk**: Potential for breaking changes
- **Low Priority**: Security risk is already mitigated
- **Testing Required**: Extensive testing needed

## Migration Process (If Desired)

### Step 1: Create Extensions Schema

```sql
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO public;
```

### Step 2: Move Each Extension

**⚠️ WARNING**: This process requires careful execution and testing.

```sql
-- Move vector extension
ALTER EXTENSION vector SET SCHEMA extensions;

-- Move pg_trgm extension
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Move unaccent extension
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- Move postgis extension (most complex)
ALTER EXTENSION postgis SET SCHEMA extensions;
```

### Step 3: Update Search Path

Update your application's search_path to include the extensions schema:

```sql
-- For specific functions
ALTER FUNCTION your_function() SET search_path = public, extensions, pg_temp;

-- Or update default search_path (be careful!)
ALTER DATABASE your_database SET search_path = public, extensions;
```

### Step 4: Update References

Update any code that references extension functions:
- Update function calls to use schema-qualified names
- Update application code
- Update migration files

### Step 5: Test Thoroughly

- Test all vector operations
- Test all text search operations
- Test all spatial operations
- Test all application functionality

## Recommended Approach

**For Production**: Keep extensions in public schema for now
- Security is already addressed (CREATE revoked)
- Lower risk
- No breaking changes

**For New Projects**: Consider using extensions schema from the start

## Verification

Check current extension placement:

```sql
SELECT * FROM public.check_extension_placement();
```

## References

- [PostgreSQL Extension Documentation](https://www.postgresql.org/docs/current/extend-extensions.html)
- [Supabase Extension Guide](https://supabase.com/docs/guides/database/extensions)

## Conclusion

Extension placement is a **best-practice recommendation**, not a security requirement. With `CREATE` privilege revoked from `PUBLIC`, the security risk is minimal. Moving extensions is optional and can be done in the future if desired.





















