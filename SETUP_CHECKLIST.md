# Setup Checklist

## ✅ Completed
- [x] Dependencies installed
- [x] Environment variables configured
- [x] Tailwind CSS configured

## 🔧 Still Need To Do

### 1. Supabase Database Setup
- [ ] Go to your Supabase project dashboard
- [ ] Navigate to **SQL Editor**
- [ ] Copy and paste the contents of `database/schema.sql`
- [ ] Click **Run** to create the database tables

### 2. Enable Anonymous Authentication
- [ ] In Supabase dashboard, go to **Authentication** > **Settings**
- [ ] Scroll to **Auth Providers** section
- [ ] Toggle **Anonymous sign-ins** to **ON**
- [ ] Click **Save**

### 3. Test the Application
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Verify anonymous login works
- [ ] Test creating a blog post

## 🚨 Common Issues

### "Anonymous sign-in disabled"
- Make sure you enabled anonymous auth in Supabase (step 2 above)

### "Table 'posts' doesn't exist"
- Make sure you ran the database schema (step 1 above)

### Styling issues
- Should be fixed now with Tailwind CSS configuration

## 📝 Environment Variables Needed

```env
# Required
GEMINI_API_KEY=your_gemini_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional (for Blogger publishing)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_API_KEY=your_google_api_key
```