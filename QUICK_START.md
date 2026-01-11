# ⚡ Atelier - Quick Start Guide

Get Atelier running in **30 minutes**.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- A code editor (VS Code recommended)

## 🚀 Setup Steps

### 1. Clone & Install (2 minutes)

```bash
# Navigate to your project directory
cd "C:\Users\HP\OneDrive\Desktop\DataScience Upskill"

# Install dependencies
npm install

# This will take 2-3 minutes
```

### 2. Set Up Database (5 minutes)

**Option A: Supabase (Recommended)**

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Copy the connection string from Settings → Database
4. Keep it handy for step 4

**Option B: Local PostgreSQL**

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15
psql postgres -c "CREATE DATABASE atelier;"

# Windows - Download from postgresql.org and install
# Then create database using pgAdmin or command line
```

### 3. Set Up Storage (5 minutes)

**Cloudflare R2 Setup**

1. Go to [cloudflare.com](https://cloudflare.com) and sign up (free)
2. Click "R2" in the sidebar
3. Click "Create bucket" → Name it "atelier-uploads"
4. Go to "Manage R2 API Tokens" → "Create API Token"
5. Name: "atelier-app", Permission: "Object Read & Write"
6. Save the Access Key ID and Secret Access Key
7. Go back to R2 main page, copy your Account ID
8. In your bucket settings, enable Public Access and copy the public URL

### 4. Set Up OAuth (5 minutes)

**Google OAuth Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Atelier"
3. Go to "APIs & Services" → "OAuth consent screen"
4. Choose "External", fill in app name and your email
5. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
6. Type: "Web application"
7. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Save the Client ID and Client Secret

### 5. Configure Environment (5 minutes)

Create `.env.local` file in the project root:

```bash
# Copy the example
cp env.example.txt .env.local
```

Edit `.env.local` and fill in:

```env
# Database (from Supabase or local)
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-your-generated-secret-here"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"

# Cloudflare R2 (from Cloudflare dashboard)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="atelier-uploads"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Atelier"
```

**Generate NextAuth Secret:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 6. Initialize Database (3 minutes)

```bash
# Push database schema
npm run db:push

# Seed initial data (categories, tags, admin user)
npm run db:seed
```

This creates:
- 4 categories (Artwork, Fashion, Tattoos, Body Art)
- 20 common tags
- Admin user: `admin@atelier.com` / `password123`

### 7. Start the App (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ Verify Installation

1. **Landing Page**: Should see animated 3D hero
2. **Sign Up**: Click "Get Started", create account
3. **Login**: Sign in with your new account
4. **Google OAuth**: Try "Continue with Google"
5. **Admin Access**: Login with `admin@atelier.com` / `password123`

## 🎉 You're Done!

Your platform is running. Now you can:

- Create posts (once upload page is built)
- Browse the explore feed: http://localhost:3000/explore
- Customize the branding and colors
- Add more features

## 📚 Next Steps

1. **Read the docs**:
   - [README.md](README.md) - Full documentation
   - [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
   - [API_REFERENCE.md](API_REFERENCE.md) - API docs

2. **Customize**:
   - Change colors in `tailwind.config.ts`
   - Update app name in `.env.local`
   - Modify landing page in `src/app/page.tsx`

3. **Build features**:
   - Create upload page
   - Build dashboard
   - Add user profiles
   - Implement search

4. **Deploy**:
   - Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
   - Push to GitHub
   - Deploy on Vercel

## 🐛 Troubleshooting

### Dependencies won't install
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database connection fails
- Check your DATABASE_URL is correct
- Verify database is running (local) or accessible (Supabase)
- Try: `npx prisma studio` to test connection

### 3D scene doesn't load
- Check browser console for errors
- Make sure you're on a modern browser (Chrome, Firefox, Safari)
- GPU acceleration should be enabled

### OAuth not working
- Verify redirect URI exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check client ID and secret are correct
- Make sure OAuth consent screen is configured

### Build errors
```bash
rm -rf .next
npm run build
```

## 💡 Development Tips

### View Database
```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

### Reset Database
```bash
npx prisma migrate reset
npm run db:seed
```

### Check Logs
- Browser console (F12)
- Terminal where `npm run dev` is running
- Prisma Studio for database

### Code Navigation
- `src/app/` - Pages and routes
- `src/components/` - React components
- `src/lib/` - Utilities and config
- `prisma/schema.prisma` - Database schema

## 🎨 Customization

### Change Colors
Edit `tailwind.config.ts`:
```typescript
'atelier': {
  'fuchsia': '#FF006E',  // Change to your primary color
  'cyan': '#00F5FF',     // Change to your accent
  // ...
}
```

### Update Branding
1. Change `NEXT_PUBLIC_APP_NAME` in `.env.local`
2. Update logo in `src/app/page.tsx`
3. Replace favicon in `public/`

### Modify 3D Scene
Edit `src/components/three/Hero3D.tsx`:
- Change colors
- Adjust animation speed
- Replace with your 3D model

## 🆘 Need Help?

1. Check the documentation files
2. Look at the code comments
3. Search GitHub issues
4. Open a new issue with details

## 📊 Project Structure

```
Your current directory/
├── src/               ← Your app code
├── prisma/           ← Database
├── public/           ← Static files
├── Documentation/    ← Guides (this file!)
├── .env.local        ← Your secrets (create this!)
└── package.json      ← Dependencies
```

## 🔒 Security Reminder

- **Never commit `.env.local`** to Git
- Change the default admin password immediately
- Use strong passwords for all accounts
- Keep dependencies updated

## 🚀 Ready to Build?

You now have a fully functional creative platform!

**What you can do next:**
- [ ] Create your first post (manually via Prisma Studio)
- [ ] Customize the landing page
- [ ] Build the upload interface
- [ ] Add your branding
- [ ] Deploy to production

---

## 📞 Support

- **Documentation**: Check the other .md files
- **Issues**: GitHub Issues
- **Email**: support@atelier.com

---

**Happy building! 🎨**

*Estimated setup time: 20-30 minutes*

