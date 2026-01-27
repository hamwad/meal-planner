# Next Steps: Getting Your Meal Planner Live

## Quick Start (10 minutes)

Follow these steps to get family-shared meal planning working:

### 1. Create Supabase Account (2 min)
- Go to [supabase.com](https://supabase.com)
- Sign up for free account
- Create a new project
- Wait for initialization

### 2. Set Up Database (2 min)
- Open **SQL Editor** in Supabase
- Copy all of `supabase-schema.sql`
- Paste and run
- Should see: "Success"

### 3. Enable Anonymous Auth (1 min)
- Go to **Authentication** → **Providers**
- Find "Anonymous sign-ins"
- Toggle **ON** and **Save**

### 4. Get Credentials (1 min)
- Go to **Settings** → **API**
- Copy:
  - Project URL
  - anon public key

### 5. Configure App (2 min)
Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_key
```

### 6. Start App (1 min)
```bash
npm run dev
```

### 7. Test It! (1 min)
- Open app
- Create family → Get code
- Open in another browser
- Join with code
- Add meal → Should sync!

## Deploy to Production

### Option 1: Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
Add environment variables in Vercel dashboard.

### Option 2: Netlify
```bash
npm run build
# Deploy dist folder
```
Add environment variables in Netlify dashboard.

## What You Have Now

✅ Cloud storage for meals and calendar
✅ Family code sharing
✅ Multi-device sync (10-second interval)
✅ Offline support
✅ Visual sync status
✅ Free forever (for typical family use)

## Security

- ✅ `.env` in `.gitignore` - credentials are safe
- ✅ Anonymous auth - no passwords to manage
- ⚠️ No RLS - family isolation handled by app
- ⚠️ Only share family codes with trusted family members

## Cost

**Completely FREE:**
- Supabase free tier
- Vercel/Netlify free tier
- Your usage: ~5MB/month
- Well under all limits

## Need Help?

See `SUPABASE_SETUP.md` for detailed setup guide.

## Enjoy! 🍽️

You now have a fully functional, cloud-synced, family-shared meal planning app!
