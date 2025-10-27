# Neon Database Migration Guide

## Steps to Fix the Database Errors:

### If you haven't run any migration yet:

1. **Open Neon Console**: https://console.neon.tech/
2. **Select your project**: Your Neon project
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Copy and paste the contents of `database/neon-complete-migration.sql`**
6. **Click "Run"**

### If you already ran the initial migration (some tables exist):

1. **Open Neon Console**: https://console.neon.tech/
2. **Select your project**: Your Neon project
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Copy and paste the contents of `database/add-rls-to-existing-tables.sql`**
6. **Click "Run"**

This will add Row-Level Security policies and missing columns to your existing tables.

## Key Changes from Supabase Version:

- **User IDs**: Changed from `UUID REFERENCES auth.users(id)` to `TEXT NOT NULL` (since Neon doesn't have built-in auth)
- **Row Level Security**: Added RLS policies using `current_user` instead of `auth.uid()`
- **Realtime**: Removed Supabase realtime publications (Neon doesn't have built-in realtime)
- **Added Missing Tables**:
  - `hashtag_performance` (for socialPlatformService.ts)
  - `webhook_deliveries` (for webhookService.ts)
- **Added Missing Fields**:
  - `personality_traits`, `communication_style`, `brand_values` in `brand_voices`
  - `demographics`, `behavior_patterns`, `content_preferences` in `audience_profiles`

## After Migration:

- Refresh your app
- Database-related errors should be gone
- Integration features will work
- Social platform services will work
- Webhook services will work

The migration is safe to run multiple times and preserves existing data.

## What This Fixes:

- ✅ All `services/socialPlatformService.ts` database errors
- ✅ All `services/webhookService.ts` database errors
- ✅ All `services/neonService.ts` database errors
- ✅ All `services/databaseService.ts` database errors
- ✅ Missing table errors across all services
- ✅ TypeScript errors related to missing database schema
