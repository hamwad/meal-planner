# Supabase Setup Guide

Simple guide to set up cloud sync for your meal planner.

## Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose:
   - **Name**: meal-planner
   - **Database Password**: (save this somewhere)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create new project"
5. Wait 2-3 minutes for setup

## Step 2: Set Up Database (2 minutes)

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase-schema.sql` from this project
4. Copy the entire file contents
5. Paste into SQL Editor
6. Click **Run**
7. You should see: "Success. No rows returned"

## Step 3: Enable Anonymous Auth (1 minute)

1. In Supabase dashboard, click **Authentication** (left sidebar)
2. Click **Providers** tab
3. Scroll down to **Anonymous sign-ins**
4. Toggle it **ON**
5. Click **Save**

## Step 4: Get Your Credentials (2 minutes)

1. In Supabase dashboard, click **Settings** (gear icon, left sidebar)
2. Click **API**
3. You'll see two important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
4. Keep this page open

## Step 5: Configure Your App (1 minute)

1. In your project root, create a `.env` file:
   ```bash
   touch .env
   ```

2. Add your credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your_key_here
   ```

3. Replace with your actual values from Step 4

4. **Important**: The `.env` file is already in `.gitignore` and won't be committed

## Step 6: Test It! (1 minute)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser

3. You should see a "Family Setup" dialog

4. Click "Create New Family"

5. You should get a 6-character code (e.g., "ABC123")

6. **It works!** ✅

## Step 7: Test Multi-Device Sync

1. Copy your family code

2. Open the app in another browser (or incognito window)

3. Click "Join Family" tab

4. Enter your family code

5. Click "Join Family"

6. Add a meal on one device

7. Within 10 seconds, it should appear on the other device

8. **Syncing works!** ✅

## Troubleshooting

### "Failed to create family"

**Check:**
- Is anonymous auth enabled? (Step 3)
- Are your `.env` credentials correct? (Step 5)
- Did you restart the dev server after creating `.env`?

**Fix:**
1. Verify anonymous auth is ON in Supabase
2. Check `.env` file has correct values
3. Restart dev server: Stop (Ctrl+C) and run `npm run dev`
4. Clear browser cache (F12 → Application → Clear site data)
5. Try again

### "Family code not found"

**Check:**
- Is the code exactly 6 characters (3 letters + 3 numbers)?
- Did you type it correctly (codes are case-sensitive)?

**Fix:**
1. Double-check the code
2. Try copy-pasting instead of typing
3. Make sure both devices are using the same Supabase project

### Meals not syncing

**Check:**
- Are both devices in the same family?
- Is the sync indicator green in the header?
- Wait up to 10 seconds (that's the sync interval)

**Fix:**
1. Check the browser console (F12) for errors
2. Verify both devices show the same family code
3. Try refreshing both browsers

## Database Management

### View Your Data

1. Go to Supabase dashboard
2. Click **Table Editor** (left sidebar)
3. Select a table to view:
   - `families` - All family groups
   - `family_members` - User memberships
   - `meals` - All meals
   - `calendar_meals` - Calendar entries

### Run Queries

1. Click **SQL Editor**
2. Try these queries:

```sql
-- See all families
SELECT * FROM families;

-- Count meals per family
SELECT f.code, COUNT(m.id) as meal_count
FROM families f
LEFT JOIN meals m ON f.id = m.family_id
GROUP BY f.id, f.code;

-- See recent calendar entries
SELECT cm.date, m.name, f.code
FROM calendar_meals cm
JOIN meals m ON cm.meal_id = m.meal_id AND cm.family_id = m.family_id
JOIN families f ON cm.family_id = f.id
ORDER BY cm.date DESC
LIMIT 10;
```

## Cost (Free Forever!)

Your Supabase free tier includes:
- **Database**: 500MB storage
- **Bandwidth**: 2GB per month
- **Users**: 50,000 monthly active

**Typical family usage:**
- Database: ~1-5MB
- Bandwidth: ~5-10MB/month
- Users: 2-6 per family

**You'll stay free forever!** ✅

## Security Note

**No Row Level Security (RLS):**
- For simplicity, RLS is disabled
- Any authenticated user can access any data
- This is fine for personal/family use
- Family isolation is handled by the app, not the database

If you only share your app with trusted family members, this is perfectly safe.

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- Check browser console (F12) for error messages
- Make sure anonymous auth is enabled
- Verify `.env` file has correct credentials

## Summary

✅ Create Supabase project
✅ Run `supabase-schema.sql`
✅ Enable anonymous auth
✅ Add credentials to `.env`
✅ Restart dev server
✅ Test family creation and joining

That's it! Your meal planner now has cloud sync! 🎉
