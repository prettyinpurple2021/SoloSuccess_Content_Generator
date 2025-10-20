# Quick Database Migration Fix

## Steps to Fix the 400 Errors:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: uwqavioyiqwjkvazlsrl
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Copy and paste the contents of `database/complete-migration.sql`**
6. **Click "Run"**

This will create all the missing integration tables and fix the 400 errors.

## After Migration:
- Refresh your app
- 400 errors should be gone
- Integration features will work

The migration is safe to run multiple times and preserves existing data.
