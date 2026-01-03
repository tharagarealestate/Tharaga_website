# PostgreSQL Upgrade Guide

## Overview
This document provides instructions for upgrading your Supabase PostgreSQL database to apply security patches.

## Current Status

- **Current Version**: supabase-postgres-17.4.1.074
- **Status**: Security patches available
- **Priority**: High (security patches)

## Upgrade Process

### Option 1: Automatic Upgrade (Recommended)

Supabase handles automatic upgrades for managed databases:

1. **Check Upgrade Availability**:
   - Go to Supabase Dashboard → Project Settings → Database
   - Check for available upgrades

2. **Schedule Upgrade**:
   - Supabase will notify you of available upgrades
   - You can schedule the upgrade during a maintenance window
   - Upgrades are typically non-destructive but should be tested

3. **Monitor Upgrade**:
   - Monitor the upgrade process in the dashboard
   - Check application logs after upgrade
   - Verify all functionality works correctly

### Option 2: Manual Upgrade (If Available)

If manual upgrade is required:

1. **Backup Database**:
   ```sql
   -- Create a backup before upgrading
   -- Use Supabase Dashboard → Database → Backups
   ```

2. **Review Breaking Changes**:
   - Check PostgreSQL release notes for breaking changes
   - Review Supabase upgrade documentation
   - Test in development environment first

3. **Execute Upgrade**:
   - Follow Supabase upgrade instructions
   - Monitor for errors
   - Verify all extensions are compatible

## Pre-Upgrade Checklist

- [ ] Review current PostgreSQL version
- [ ] Check for available upgrades
- [ ] Backup database
- [ ] Test upgrade in development/staging
- [ ] Review extension compatibility
- [ ] Check for deprecated features
- [ ] Review application compatibility
- [ ] Schedule maintenance window
- [ ] Notify team/users of maintenance

## Post-Upgrade Verification

After upgrade, verify:

1. **Database Connectivity**:
   ```sql
   SELECT version();
   ```

2. **Extension Status**:
   ```sql
   SELECT * FROM pg_extension;
   ```

3. **Application Functionality**:
   - Test all critical features
   - Check API endpoints
   - Verify authentication works
   - Test database queries

4. **Performance**:
   - Monitor query performance
   - Check for slow queries
   - Review connection pool status

## Extension Compatibility

Verify these extensions are compatible with new version:
- ✅ `vector` (pgvector)
- ✅ `pg_trgm` (trigram)
- ✅ `unaccent` (text search)
- ✅ `postgis` (spatial)

## Rollback Plan

If issues occur:

1. **Immediate Rollback**:
   - Contact Supabase support if automatic rollback is needed
   - Restore from backup if necessary

2. **Data Recovery**:
   - Use point-in-time recovery if available
   - Restore from backup

## Important Notes

- **Downtime**: Upgrades may cause brief downtime
- **Breaking Changes**: Review PostgreSQL release notes
- **Testing**: Always test in development first
- **Backup**: Always backup before upgrading
- **Support**: Contact Supabase support for assistance

## References

- [Supabase Upgrade Guide](https://supabase.com/docs/guides/platform/upgrading)
- [PostgreSQL Release Notes](https://www.postgresql.org/docs/current/release.html)
- [Supabase Status Page](https://status.supabase.com/)

## Support

If you encounter issues:
1. Check Supabase Status page
2. Review Supabase documentation
3. Contact Supabase support
4. Check PostgreSQL community resources









