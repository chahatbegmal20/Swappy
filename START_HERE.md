# 🚀 Quick Start - Get Running in 5 Minutes

## ✅ Step 1: Dependencies Installed
Your dependencies are already installed! ✓

## 🔧 Step 2: Configure Environment

Edit your `.env.local` file (it's been created) with these minimal settings:

```env
# IMPORTANT: Update these values!

# Database (choose ONE option):

# Option A: Use Supabase (Recommended - Free & Easy)
# 1. Go to supabase.com and sign up
# 2. Create a new project
# 3. Get connection string from Settings → Database
DATABASE_URL="your-supabase-connection-string-here"

# Option B: Local PostgreSQL (if you have it installed)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/swappy"

# NextAuth Secret (REQUIRED)
# Generate with: openssl rand -base64 32
# Or use: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="REPLACE-THIS-RUN-THE-COMMAND-ABOVE"

# Google OAuth (Optional - leave blank for now)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Cloudflare R2 (Optional - leave blank for now)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""

# App URLs (These are fine)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Swappy"
```

## 🎯 Step 3: Generate NextAuth Secret

Run this in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and paste it as your `NEXTAUTH_SECRET` in `.env.local`

## 🗄️ Step 4: Set Up Database

### Easy Option: Supabase (5 minutes)

1. Go to https://supabase.com
2. Click "Start your project" (sign up free)
3. Create new project:
   - Name: `swappy-db`
   - Database Password: (create a strong one, save it!)
   - Region: Choose closest to you
4. Wait 2 minutes for project to be ready
5. Go to Settings → Database → Connection String → URI
6. Copy the connection string
7. Paste it in `.env.local` as `DATABASE_URL`
   - Replace `[YOUR-PASSWORD]` with your actual password!

### Alternative: Skip Database (See Landing Page Only)

If you want to skip database setup for now and just see the landing page:

1. Comment out database-related code (I can help with this)
2. You'll be able to see the homepage with 3D animation
3. But signup/login won't work without a database

## 🚀 Step 5: Initialize Database

Once you have `DATABASE_URL` set:

```powershell
# Push database schema
npm run db:push

# Seed with initial data
npm run db:seed
```

This creates categories, tags, and an admin user:
- Email: `admin@swappy.com`
- Password: `password123`

## ▶️ Step 6: Run the App!

```powershell
npm run dev
```

Then open: http://localhost:3000

## 🎉 What You'll See

- **Landing Page**: Beautiful 3D animated hero
- **Explore Page**: http://localhost:3000/explore (will be empty at first)
- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check your DATABASE_URL is correct
- Make sure Supabase project is running
- Verify password has no special characters that need escaping

### "Invalid NEXTAUTH_SECRET"
- Make sure you generated and pasted the secret
- No spaces or quotes around it

### "Module not found" errors
- Run: `npm install --legacy-peer-deps`
- Then try `npm run dev` again

### 3D scene doesn't show
- This is fine! Try in a different browser
- Chrome/Edge work best
- Make sure hardware acceleration is enabled

## 🎯 Next Steps After It's Running

1. **Test Login**: Use admin@swappy.com / password123
2. **Explore Code**: Look at `src/app/page.tsx` for landing page
3. **Read Docs**: Check out QUICK_START.md for full guide
4. **Customize**: Change colors in `tailwind.config.ts`

## 💡 Quick Commands Reference

```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm run db:studio    # Open database viewer
npm run db:push      # Update database schema
npm run db:seed      # Add initial data
```

## 🆘 Still Stuck?

1. Check the terminal for specific error messages
2. Read SETUP_GUIDE.md for detailed instructions
3. Make sure all environment variables are set
4. Try: `rm -rf .next` then `npm run dev`

---

**You're almost there! Just set up the database and you're good to go! 🚀**

