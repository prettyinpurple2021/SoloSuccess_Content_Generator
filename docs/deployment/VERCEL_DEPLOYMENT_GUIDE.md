# Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

Your project is ready for Vercel deployment! Here's what we've verified:

- ✅ **Build Process**: `npm run build` completes successfully
- ✅ **Vercel Configuration**: `vercel.json` is properly configured
- ✅ **Environment Variables**: All required variables are set in `.env.local`
- ✅ **Database Migration**: Neon database migration scripts are ready

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:

   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Confirm project settings
   - Deploy!

### Option 2: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import your Git repository** (GitHub/GitLab/Bitbucket)
4. **Configure project settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## 🔧 Environment Variables Setup

In your Vercel project dashboard, add these environment variables:

### Required Variables (set in Vercel dashboard):

```
VITE_STACK_PROJECT_ID=your-stack-project-id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-client-key
STACK_SECRET_SERVER_KEY=your-stack-secret-server-key
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
GEMINI_API_KEY=your-gemini-api-key
INTEGRATION_ENCRYPTION_SECRET=64-char-hex
```

### Optional Providers

```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_API_KEY=your-google-api-key
```

### How to Add Environment Variables:

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables"
4. Add each variable with its value
5. Make sure to set the environment (Production, Preview, Development)

## 🗄️ Database Setup

**Important**: Before your app works fully, you need to run the database migration:

1. **Run the RLS migration** (since you already created some tables):
   - Go to Neon Console: https://console.neon.tech/
   - Run the contents of `database/add-rls-to-existing-tables.sql`

2. **Or run the complete migration** (if you want to start fresh):
   - Run the contents of `database/neon-complete-migration.sql`

## 🔍 Post-Deployment Verification

After deployment, verify these features work:

1. **Authentication**: Sign up/Sign in should work
2. **Database Connection**: Create a post to test database connectivity
3. **AI Features**: Generate content using Gemini AI
4. **Social Integrations**: Test platform connections

## 🚨 Troubleshooting

### Build Fails:

- Check that all environment variables are set
- Verify `package.json` scripts are correct
- Check Vercel build logs for specific errors

### App Doesn't Load:

- Verify environment variables are set correctly
- Check browser console for errors
- Ensure database migration was run

### Database Errors:

- Run the database migration scripts
- Check Neon connection string is correct
- Verify RLS policies are in place

## 📊 Performance Optimization

Your build shows some large chunks. To optimize:

1. **Code Splitting**: Use dynamic imports for large components
2. **Bundle Analysis**: Run `npm run build -- --analyze` to see bundle size
3. **Lazy Loading**: Implement lazy loading for routes

## 🎉 Success!

Once deployed, your app will be available at:

- **Production URL**: `https://your-project-name.vercel.app`
- **Custom Domain**: Add your own domain in Vercel settings

Your SoloSuccess AI Content Planner is now live on Vercel! 🚀
