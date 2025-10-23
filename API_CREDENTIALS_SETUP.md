# API Credentials Setup Guide

This document provides instructions for obtaining and configuring API credentials for all integrations in the SoloBoss AI Content Planner.

## 📋 Table of Contents

- [Social Media Platforms](#social-media-platforms)
  - [Twitter/X API](#twitterx-api)
  - [LinkedIn API](#linkedin-api)
  - [Facebook/Instagram API](#facebookinstagram-api)
  - [Reddit API](#reddit-api)
  - [Pinterest API](#pinterest-api)
- [Analytics Platforms](#analytics-platforms)
  - [Google Analytics](#google-analytics)
- [AI Services](#ai-services)
  - [OpenAI](#openai)
  - [Anthropic Claude](#anthropic-claude)
- [Configuration](#configuration)

---

## Social Media Platforms

### Twitter/X API

**Required Credentials:**

- API Key
- API Secret
- Access Token
- Access Token Secret
- Bearer Token

**How to Obtain:**

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app (or use existing)
3. Navigate to your app's "Keys and tokens" tab
4. Generate/copy the following:
   - API Key and Secret (Consumer Keys)
   - Access Token and Secret
   - Bearer Token

**Environment Variables:**

```bash
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

**Required Permissions:**

- Read and write tweets
- Read users
- Access tweet metrics

**API Version:** v2

---

### LinkedIn API

**Required Credentials:**

- Client ID
- Client Secret
- Access Token (obtained via OAuth 2.0)

**How to Obtain:**

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Under "Auth" tab, note your Client ID and Client Secret
4. Add authorized redirect URLs for OAuth
5. Request access to the following products:
   - Share on LinkedIn
   - Sign In with LinkedIn
   - Marketing Developer Platform (for analytics)

**Environment Variables:**

```bash
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

**OAuth Flow:**

- The access token is obtained through OAuth 2.0 flow
- Users will authenticate through the app
- Tokens are stored encrypted in the database

**Required Scopes:**

- `r_liteprofile`
- `r_emailaddress`
- `w_member_social`
- `r_organization_social` (for company pages)

---

### Facebook/Instagram API

**Required Credentials:**

- App ID
- App Secret
- Access Token (obtained via OAuth 2.0)
- Page ID (for posting to pages)

**How to Obtain:**

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app (select "Business" type)
3. Add Facebook Login and Instagram Basic Display products
4. Under "Settings > Basic", copy App ID and App Secret
5. Set up OAuth redirect URLs
6. Request app review for:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`

**Environment Variables:**

```bash
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
```

**Required Permissions:**

- `pages_show_list`
- `pages_manage_posts`
- `pages_read_engagement`
- `instagram_basic`
- `instagram_content_publish`
- `instagram_manage_insights`

**API Version:** v18.0

---

### Reddit API

**Required Credentials:**

- Client ID
- Client Secret
- Username
- Password
- User Agent

**How to Obtain:**

1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Scroll down and click "create app" or "create another app"
3. Select "script" as the app type
4. Fill in the required fields
5. Copy the Client ID (under the app name) and Client Secret

**Environment Variables:**

```bash
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=YourAppName/1.0.0 (by /u/yourusername)
```

**Note:** User Agent format is important - follow the format: `AppName/Version (by /u/username)`

---

### Pinterest API

**Required Credentials:**

- App ID
- App Secret
- Access Token (obtained via OAuth 2.0)

**How to Obtain:**

1. Go to [Pinterest Developers](https://developers.pinterest.com/apps/)
2. Create a new app
3. Copy App ID and App Secret
4. Set up OAuth redirect URLs
5. Request access to:
   - Read public boards
   - Write public boards
   - Read public pins
   - Write public pins

**Environment Variables:**

```bash
PINTEREST_APP_ID=your_app_id_here
PINTEREST_APP_SECRET=your_app_secret_here
```

**Required Scopes:**

- `boards:read`
- `boards:write`
- `pins:read`
- `pins:write`
- `user_accounts:read`

---

## Analytics Platforms

### Google Analytics

**Required Credentials:**

- Client ID
- Client Secret
- View ID
- Refresh Token (obtained via OAuth 2.0)

**How to Obtain:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Analytics Data API
4. Go to "APIs & Services > Credentials"
5. Create OAuth 2.0 Client ID
6. Download the credentials JSON
7. Find your Analytics View ID in Google Analytics Admin

**Environment Variables:**

```bash
GOOGLE_ANALYTICS_CLIENT_ID=your_client_id_here
GOOGLE_ANALYTICS_CLIENT_SECRET=your_client_secret_here
```

**Required APIs:**

- Google Analytics Data API (GA4)
- Google Analytics Reporting API (Universal Analytics)

---

## AI Services

### OpenAI

**Required Credentials:**

- API Key
- Organization ID (optional)

**How to Obtain:**

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to API keys section
4. Click "Create new secret key"
5. Copy the key immediately (it won't be shown again)
6. (Optional) Copy your Organization ID from Settings

**Environment Variables:**

```bash
OPENAI_API_KEY=sk-...your_api_key_here
OPENAI_ORGANIZATION_ID=org-...your_org_id_here
```

**Note:** Keep track of usage limits and billing

---

### Anthropic Claude

**Required Credentials:**

- API Key

**How to Obtain:**

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key immediately

**Environment Variables:**

```bash
ANTHROPIC_API_KEY=sk-ant-...your_api_key_here
```

**Available Models:**

- Claude 3 Opus
- Claude 3 Sonnet
- Claude 3 Haiku

---

## Configuration

### Step 1: Copy Environment Template

```bash
cp .env.local.example .env
```

### Step 2: Add Your Credentials

Edit the `.env` file and replace placeholder values with your actual credentials.

### Step 3: Verify Configuration

The app will automatically validate credentials when you try to connect each integration through the UI.

### Step 4: Security Best Practices

- ✅ Never commit `.env` files to version control
- ✅ Use strong, unique secrets for encryption keys
- ✅ Rotate API keys periodically
- ✅ Monitor API usage and set up billing alerts
- ✅ Use environment-specific credentials (dev/staging/prod)
- ✅ Enable 2FA on all developer accounts
- ✅ Review and audit API permissions regularly

### Integration Encryption

All credentials are encrypted before being stored in the database using AES-256-GCM encryption with the `INTEGRATION_ENCRYPTION_SECRET`.

Generate a secure encryption secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Troubleshooting

### Rate Limiting

Each platform has different rate limits. The app implements automatic rate limiting and retry logic, but be aware of:

- **Twitter**: 300 tweets per 3 hours (user context)
- **LinkedIn**: Varies by endpoint
- **Facebook**: 200 calls per hour per user
- **Instagram**: 200 calls per hour
- **OpenAI**: Depends on your plan (TPM/RPM limits)

### Common Issues

**401 Unauthorized:**

- Check that API keys are correctly copied
- Verify OAuth tokens haven't expired
- Ensure required permissions/scopes are granted

**403 Forbidden:**

- App may need approval from the platform
- Ensure all required permissions are requested
- Check if the app is in development/sandbox mode

**429 Too Many Requests:**

- You've hit the rate limit
- The app will automatically retry after the limit resets

### Support

For platform-specific issues, refer to:

- [Twitter API Docs](https://developer.twitter.com/en/docs)
- [LinkedIn API Docs](https://docs.microsoft.com/en-us/linkedin/)
- [Facebook API Docs](https://developers.facebook.com/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)

---

## Next Steps

After setting up your credentials:

1. Start the app: `npm run dev`
2. Navigate to Integration Manager
3. Click "Connect" on each platform you've configured
4. Follow the OAuth flow for platforms that require it
5. Test the connection to verify credentials

The app will guide you through any additional setup steps specific to each integration.
