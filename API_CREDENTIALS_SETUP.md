# User Integration Setup Guide

This guide helps **users of the app** set up their own social media and blog integrations. Each user connects their own personal accounts through OAuth flows in the app.

> **Note for App Owners**: You only need to provide AI API keys (Gemini, OpenAI, etc.) for content generation. Users handle their own social media account connections.

---

## 📋 Table of Contents

- [How Integrations Work](#how-integrations-work)
- [Social Media Platforms](#social-media-platforms)
  - [Twitter/X](#twitterx)
  - [LinkedIn](#linkedin)
  - [Facebook/Instagram](#facebookinstagram)
  - [Reddit](#reddit)
  - [Pinterest](#pinterest)
- [Blog Platforms](#blog-platforms)
  - [Blogger](#blogger)
- [Analytics Platforms](#analytics-platforms)
  - [Google Analytics](#google-analytics)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)

---

## How Integrations Work

1. **You create your account** in the SoloBoss AI Content Planner
2. **Navigate to Integration Manager** in the app
3. **Click "Connect"** on the platform you want to use
4. **Authenticate with OAuth** - you'll be redirected to the platform to sign in
5. **Grant permissions** - the app requests the minimum permissions needed
6. **Your credentials are encrypted** and stored securely (only you can access them)
7. **Start posting** - you can now create and schedule content to your connected accounts

### Security Features

- ✅ All credentials are encrypted using AES-256-GCM encryption
- ✅ Credentials are stored per-user in the database
- ✅ Each user can only access their own integrations
- ✅ OAuth tokens are automatically refreshed when needed
- ✅ You can disconnect integrations at any time

---

## Social Media Platforms

### Twitter/X

**How to Connect:**

1. Go to the Integration Manager in the app
2. Click "Connect" next to Twitter/X
3. You'll be redirected to Twitter to authorize the app
4. Sign in with your Twitter account
5. Grant the requested permissions
6. You'll be redirected back to the app

**Required Permissions:**
- Read and write tweets
- Read user profile
- Access tweet metrics

**Platform Limits:**
- Character limit: 280 characters
- Rate limit: 300 tweets per 3 hours (per account)
- Media: Up to 4 images per tweet

**Troubleshooting:**
- If you get an error, make sure you're signed in to the correct Twitter account
- Ensure your Twitter account has developer access enabled (if required)
- Check that the app has the necessary permissions

---

### LinkedIn

**How to Connect:**

1. Go to the Integration Manager in the app
2. Click "Connect" next to LinkedIn
3. You'll be redirected to LinkedIn to authorize the app
4. Sign in with your LinkedIn account
5. Grant the requested permissions (Share on LinkedIn, etc.)
6. You'll be redirected back to the app

**Required Permissions:**
- Share on LinkedIn
- Read basic profile
- Read email address

**For Company Pages:**
- You need admin access to the company page
- The app will list your available pages after connection

**Platform Limits:**
- Character limit: 1,300 characters for posts
- Rate limits vary by endpoint
- Media: Images and videos supported

---

### Facebook/Instagram

**How to Connect:**

1. Go to the Integration Manager in the app
2. Click "Connect" next to Facebook or Instagram
3. You'll be redirected to Facebook to authorize the app
4. Sign in with your Facebook account
5. Grant permissions for:
   - Managing posts on your pages
   - Publishing to Instagram (if connecting Instagram)
6. Select which pages/accounts you want to connect
7. You'll be redirected back to the app

**Required Permissions:**
- `pages_manage_posts` - Post to your Facebook pages
- `pages_read_engagement` - Read engagement metrics
- `instagram_basic` - Access Instagram profile
- `instagram_content_publish` - Publish to Instagram

**Platform Limits:**
- Facebook: 63,206 characters per post
- Instagram: 2,200 characters per caption
- Rate limits: 200 API calls per hour per user

**Note:** Instagram requires a Facebook Business account connected to your Instagram Business or Creator account.

---

### Reddit

**How to Connect:**

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Create a new app (select "script" type)
3. Note your Client ID and Client Secret
4. In the Integration Manager, click "Connect" next to Reddit
5. Enter your Client ID, Client Secret, and User Agent
6. The app will handle OAuth authentication

**Required Information:**
- Client ID (from Reddit app settings)
- Client Secret (from Reddit app settings)
- User Agent (format: `YourAppName/1.0.0 (by /u/yourusername)`)

**Platform Limits:**
- Character limit: 40,000 characters per post
- Rate limits: 60 requests per minute
- Subreddit-specific rules may apply

---

### Pinterest

**How to Connect:**

1. Go to the Integration Manager in the app
2. Click "Connect" next to Pinterest
3. You'll be redirected to Pinterest to authorize the app
4. Sign in with your Pinterest account
5. Grant permissions to read and write pins
6. You'll be redirected back to the app

**Required Permissions:**
- `boards:read` - Read your boards
- `boards:write` - Create and update boards
- `pins:read` - Read your pins
- `pins:write` - Create and update pins
- `user_accounts:read` - Read your account info

**Platform Limits:**
- Character limit: 500 characters per pin description
- Media: Images required for pins
- Rate limits vary by endpoint

---

## Blog Platforms

### Blogger

**How to Connect:**

1. Go to the Integration Manager in the app
2. Click "Connect" next to Blogger
3. You'll be redirected to Google to authorize the app
4. Sign in with your Google account (the one connected to Blogger)
5. Grant permissions to manage your Blogger blogs
6. Select which blog you want to connect
7. You'll be redirected back to the app

**Required Permissions:**
- Access to Blogger API
- Read and write blog posts

**Platform Limits:**
- No specific character limits
- Media: Images and videos supported
- HTML formatting supported in posts

---

## Analytics Platforms

### Google Analytics

**How to Connect:**

1. Go to the Integration Manager in the app
2. Click "Connect" next to Google Analytics
3. You'll be redirected to Google to authorize the app
4. Sign in with your Google account (the one with Analytics access)
5. Grant permissions to read Analytics data
6. Select which Analytics property you want to connect
7. You'll be redirected back to the app

**Required Permissions:**
- Read Google Analytics data
- Access to Analytics reporting API

**Note:** You need a Google Analytics 4 (GA4) property to use this integration.

---

## Security & Privacy

### How Your Credentials Are Protected

1. **Encryption**: All credentials are encrypted before storage using AES-256-GCM
2. **User Isolation**: Each user's credentials are stored separately - you can only access your own
3. **OAuth Tokens**: Access tokens are refreshed automatically when they expire
4. **Secure Storage**: Credentials are stored in a secure database with row-level security
5. **No Sharing**: Your credentials are never shared with other users or the app owner

### What the App Can Do

- ✅ Post content to your connected accounts
- ✅ Read engagement metrics (if you grant permission)
- ✅ Schedule posts for future publication
- ✅ Adapt content format for each platform

### What the App Cannot Do

- ❌ Access your account without your permission
- ❌ Share your credentials with anyone
- ❌ Post to accounts you haven't connected
- ❌ Modify your account settings
- ❌ Delete your account or content

### Revoking Access

You can disconnect any integration at any time:
1. Go to Integration Manager
2. Find the integration you want to disconnect
3. Click "Disconnect"
4. Your credentials will be deleted from the system

You can also revoke access directly from the platform (e.g., in your Twitter or Facebook app settings).

---

## Troubleshooting

### Connection Issues

**"Authorization failed"**
- Make sure you're signed in to the correct account
- Check that you granted all requested permissions
- Try disconnecting and reconnecting the integration

**"Invalid credentials"**
- Your OAuth token may have expired
- Try disconnecting and reconnecting the integration
- Check that your account still has the necessary permissions

**"Rate limit exceeded"**
- You've hit the platform's rate limit
- Wait for the rate limit window to reset
- Consider reducing the frequency of automated posts

### Platform-Specific Issues

**Twitter:**
- Ensure your account has developer access if required
- Check that 2FA is not blocking API access
- Verify your account is not suspended

**LinkedIn:**
- Make sure you're connecting a personal profile (company pages require additional setup)
- Verify your LinkedIn app has the necessary permissions approved

**Facebook/Instagram:**
- Ensure your Instagram account is a Business or Creator account
- Verify it's connected to a Facebook Business account
- Check that your Facebook app has been approved for the required permissions

**Reddit:**
- Make sure your User Agent string follows the correct format
- Verify your Reddit app is set up as a "script" type
- Check that you're using the correct Client ID and Secret

### Getting Help

If you continue to experience issues:
1. Check the platform's API documentation
2. Verify your account status on the platform
3. Try disconnecting and reconnecting the integration
4. Contact support through the app's help system

---

## Next Steps

After setting up your integrations:

1. **Test the connection** - Try creating a test post to verify everything works
2. **Configure posting preferences** - Set up default scheduling and formatting options
3. **Create your first content** - Use the AI content generator to create posts
4. **Schedule posts** - Set up a content calendar with scheduled posts
5. **Monitor performance** - Check analytics to see how your content performs

---

## App Owner Requirements

**For the app owner/administrator**, you only need to configure:

1. **AI API Keys** (for content generation):
   - Gemini API Key (required)
   - OpenAI API Key (optional)
   - Anthropic API Key (optional)

2. **Database Configuration**:
   - Neon PostgreSQL connection string
   - Integration encryption secret

3. **Authentication**:
   - Stack Auth project credentials

**You do NOT need:**
- Social media API credentials (users provide their own)
- Platform-specific OAuth apps (users authenticate directly)
- Analytics API keys (users connect their own analytics)

See the main README.md and .env.example file for setup instructions.

---

**Ready to connect your accounts and start creating amazing content!** 🚀