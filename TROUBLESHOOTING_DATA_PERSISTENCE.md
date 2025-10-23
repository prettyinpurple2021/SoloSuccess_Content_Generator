# 🔧 Data Persistence Troubleshooting Guide

## **Quick Fix Steps**

### 1. **Check Browser Console**
Open your browser's developer tools (F12) and look for any error messages. The updated code now includes detailed logging.

### 2. **Verify Database Schema**
Run this in your Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'brand_voices', 'audience_profiles', 'campaigns');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'posts';
```

### 3. **Test Authentication**
Run this in your browser console:

```javascript
// Test authentication
import { auth } from './services/supabaseService';
auth.getUser().then(user => console.log('User:', user));
```

### 4. **Test Database Connection**
Run this in your browser console:

```javascript
// Test database connection
import { db } from './services/supabaseService';
db.getPosts().then(posts => console.log('Posts:', posts));
```

## **Common Issues & Solutions**

### **Issue: "User not authenticated" error**
**Solution:**
1. The app now automatically signs in anonymously
2. Check if anonymous authentication is enabled in your Supabase project
3. Go to Authentication > Settings > Enable anonymous sign-ins

### **Issue: "Permission denied" error**
**Solution:**
1. RLS policies might not be applied correctly
2. Run the database schema fix script
3. Check if the user_id matches in the database

### **Issue: "Table doesn't exist" error**
**Solution:**
1. Apply the complete database schema
2. Run the `fix-database-setup.js` script
3. Or manually run the SQL in your Supabase SQL Editor

### **Issue: Data saves but doesn't appear**
**Solution:**
1. Check if the user_id is being set correctly
2. Verify RLS policies allow the user to see their own data
3. Clear browser cache and refresh

## **Step-by-Step Fix Process**

### **Step 1: Apply Database Schema**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database/complete-migration.sql`
4. Run the script

### **Step 2: Enable Anonymous Authentication**
1. Go to Authentication > Settings
2. Enable "Allow anonymous sign-ins"
3. Save the settings

### **Step 3: Test the Fix**
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Look for the console messages:
   - ✅ User authenticated: [user-id]
   - ✅ Post saved successfully
4. Try creating a new post

### **Step 4: Verify Data Persistence**
1. Create a post
2. Refresh the page
3. Check if the post appears in the list
4. Check the database directly in Supabase

## **Debug Commands**

### **Check User Authentication**
```javascript
// In browser console
import { auth } from './services/supabaseService';
auth.getUser().then(user => {
  console.log('Current user:', user);
  if (user) {
    console.log('User ID:', user.id);
  } else {
    console.log('No user authenticated');
  }
});
```

### **Test Database Operations**
```javascript
// In browser console
import { db } from './services/supabaseService';

// Test getting posts
db.getPosts().then(posts => {
  console.log('All posts:', posts);
}).catch(err => {
  console.error('Error getting posts:', err);
});

// Test saving a post
const testPost = {
  topic: 'Test Topic',
  idea: 'Test Idea',
  content: 'Test Content',
  status: 'draft'
};

db.addPost(testPost).then(post => {
  console.log('Post saved:', post);
}).catch(err => {
  console.error('Error saving post:', err);
});
```

### **Check Database Tables**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) as post_count FROM posts;
SELECT COUNT(*) as user_count FROM auth.users;
SELECT user_id, COUNT(*) as post_count FROM posts GROUP BY user_id;
```

## **Environment Variables Check**

Make sure these are set in your `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## **Supabase Project Settings**

1. **Authentication Settings:**
   - Enable anonymous sign-ins
   - Set session timeout to 24 hours
   - Enable email confirmations (optional)

2. **Database Settings:**
   - Enable Row Level Security (RLS)
   - Apply the complete schema
   - Check RLS policies

3. **API Settings:**
   - Enable realtime for all tables
   - Set appropriate rate limits

## **Still Having Issues?**

If you're still experiencing problems:

1. **Check the browser console** for detailed error messages
2. **Verify your Supabase project** is active and accessible
3. **Test with a fresh browser session** (incognito mode)
4. **Check your internet connection** and Supabase status
5. **Try the debug script** in `debug-data-persistence.js`

## **Success Indicators**

You'll know the fix is working when you see:

1. ✅ Console messages showing successful authentication
2. ✅ Posts saving without errors
3. ✅ Data persisting after page refresh
4. ✅ No "permission denied" errors
5. ✅ User ID being set correctly in database

## **Need More Help?**

If you're still having issues, please share:
1. The exact error messages from the browser console
2. Your Supabase project URL (without the key)
3. Which step of the troubleshooting process you're stuck on
