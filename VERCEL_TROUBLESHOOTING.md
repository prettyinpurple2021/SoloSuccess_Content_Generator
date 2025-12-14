# Vercel Deployment Troubleshooting Guide

## 🚨 Issue: Only Background Showing, No Content

This is a common issue with React apps on Vercel. Here's how to fix it:

## 🔍 Step 1: Check Browser Console

**Open your deployed app and check the browser console:**

1. **Right-click** on your deployed page
2. **Select "Inspect"** or press `F12`
3. **Go to "Console" tab**
4. **Look for any red error messages**

### Common Errors to Look For

- ❌ **Environment Variables Missing**: `VITE_STACK_PROJECT_ID is undefined`
- ❌ **Authentication Errors**: Stack Auth initialization failures
- ❌ **Network Errors**: Failed API calls
- ❌ **JavaScript Errors**: Component rendering failures

## 🔧 Step 2: Verify Environment Variables in Vercel

**Your environment variables might not be set correctly:**

1. **Go to Vercel Dashboard**: <https://vercel.com/dashboard>
2. **Select your project**
3. **Go to "Settings" → "Environment Variables"**
4. **Verify these variables are set**:

```bash
VITE_STACK_PROJECT_ID=your_stack_project_id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_stack_publishable_client_key
STACK_SECRET_SERVER_KEY=your_stack_secret_server_key
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
GEMINI_API_KEY=your_gemini_api_key
INTEGRATION_ENCRYPTION_SECRET=64_char_hex_secret
OPENAI_API_KEY=your_openai_api_key (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key (optional)
GOOGLE_CLIENT_ID=your_google_client_id (optional)
GOOGLE_API_KEY=your_google_api_key (optional)
```

### Important Notes

- ✅ **Make sure all variables are set for "Production" environment**
- ✅ **Variables starting with `VITE_` are required for client-side**
- ✅ **Variables without `VITE_` are server-side only**

## 🔄 Step 3: Redeploy After Adding Environment Variables

**After adding environment variables:**

1. **Go to "Deployments" tab** in Vercel
2. **Click "Redeploy"** on the latest deployment
3. **Or push a new commit** to trigger a new deployment

## 🗄️ Step 4: Check Database Migration

**Your database might not be properly set up:**

1. **Go to Neon Console**: <https://console.neon.tech/>
2. **Run the RLS migration**:
   - Copy contents of `database/add-rls-to-existing-tables.sql`
   - Paste in SQL Editor
   - Click "Run"

## 🐛 Step 5: Debug with Enhanced Logging

**I've added enhanced debugging to your app. After redeploying:**

1. **Open browser console** on your deployed app
2. **Look for these debug messages**:

   ```text
   Environment check: { VITE_STACK_PROJECT_ID: "Present", ... }
   Full environment: { ... }
   Stack config check: { projectId: "...", ... }
   ```

3. **If you see "Missing" for any required variables**, that's your issue!

## 🚀 Step 6: Quick Fix Commands

**If you're using Vercel CLI:**

```bash
# Redeploy with environment variables
vercel --prod

# Or set environment variables via CLI
vercel env add VITE_STACK_PROJECT_ID
# Enter: d36a87a3-7f57-44a0-9c1b-9c5c07c93677
# Select: Production, Preview, Development

# Repeat for all variables, then redeploy
vercel --prod
```

## 🔍 Step 7: Test Locally vs Production

**Compare local vs production:**

1. **Run locally**: `npm run dev`
2. **Check if it works locally**
3. **If local works but production doesn't** → Environment variables issue
4. **If both fail** → Code issue

## 📱 Step 8: Check Network Tab

**Look for failed requests:**

1. **Open DevTools** → "Network" tab
2. **Reload the page**
3. **Look for red/failed requests**
4. **Check if API calls are failing**

## 🆘 Step 9: Common Solutions

### Solution 1: Missing Environment Variables

```bash
# Add all variables in Vercel dashboard
# Then redeploy
```

### Solution 2: Authentication Issues

- Check Stack Auth configuration
- Verify project ID and keys are correct
- Ensure database migration is complete

### Solution 3: Build Issues

- Check Vercel build logs
- Look for TypeScript errors
- Verify all dependencies are installed

### Solution 4: Routing Issues

- Check if `vercel.json` is correct
- Verify all routes are properly configured

## 🎯 Most Likely Cause

**Based on your symptoms (background shows, no content), the most likely cause is:**

1. **Missing environment variables** in Vercel (90% chance)
2. **Authentication initialization failure** (8% chance)
3. **Database connection issues** (2% chance)

## ✅ Next Steps

1. **Check browser console** for errors
2. **Verify environment variables** in Vercel dashboard
3. **Redeploy** after adding variables
4. **Run database migration** if not done
5. **Check console logs** for debug information

## 📞 Need Help?

If you're still stuck, share:

1. **Browser console errors** (screenshot)
2. **Vercel build logs** (from dashboard)
3. **Environment variables status** (which ones are missing)

The enhanced debugging I added will help identify the exact issue!
