<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1_lnC0YVBmIwVAwmV4dxoqudZJHSQ9StD

## Run Locally

**Prerequisites:** Node.js, Supabase account

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup Supabase:**
   - Create a free account at [supabase.com](https://supabase.com)
   - Create a new project
   - Go to Settings > API to get your project URL and anon key
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL Editor

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Set your `GEMINI_API_KEY` (get from [Google AI Studio](https://aistudio.google.com))
   - Set your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Optionally set Google API keys for Blogger integration

4. **Run the app:**
   ```bash
   npm run dev
   ```

### Environment Variables

Required:
- `GEMINI_API_KEY` - Google Gemini AI API key
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Optional (for Blogger publishing):
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_API_KEY` - Google API key
