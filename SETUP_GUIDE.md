# 🚀 Swappy Setup Guide

Complete step-by-step guide to get Swappy running locally and deploy to production.

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Storage Setup (Cloudflare R2)](#storage-setup-cloudflare-r2)
4. [OAuth Setup (Google)](#oauth-setup-google)
5. [Running the App](#running-the-app)
6. [Production Deployment](#production-deployment)

---

## Local Development Setup

### 1. System Requirements

Make sure you have installed:
- **Node.js 18+**: [Download](https://nodejs.org/)
- **npm or yarn**: Comes with Node.js
- **Git**: [Download](https://git-scm.com/)

Verify installations:
```bash
node --version  # Should be 18 or higher
npm --version   # Should be 9 or higher
git --version
```

### 2. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd swappy

# Install dependencies
npm install

# This will take 2-3 minutes
```

### 3. Environment Variables

Create `.env.local` file in the project root:

```bash
# Copy the example file
cp env.example.txt .env.local
```

Now edit `.env.local` - we'll fill in the values step by step below.

---

## Database Setup (Supabase)

### Option A: Use Supabase (Recommended for Production)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Name: `swappy-db`
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to your users
   - Click "Create new project" (takes ~2 minutes)

3. **Get Connection String**
   - Click "Settings" (gear icon)
   - Click "Database"
   - Scroll to "Connection string"
   - Select "URI" tab
   - Copy the connection string (looks like `postgresql://postgres:[YOUR-PASSWORD]@...`)
   - Replace `[YOUR-PASSWORD]` with your actual password

4. **Update .env.local**
   ```env
   DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
   ```

### Option B: Local PostgreSQL (For Development)

1. **Install PostgreSQL**
   - macOS: `brew install postgresql@15`
   - Windows: [Download installer](https://www.postgresql.org/download/windows/)
   - Linux: `sudo apt install postgresql-15`

2. **Start PostgreSQL**
   ```bash
   # macOS
   brew services start postgresql@15
   
   # Linux
   sudo systemctl start postgresql
   ```

3. **Create Database**
   ```bash
   psql postgres
   CREATE DATABASE swappy;
   \q
   ```

4. **Update .env.local**
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/swappy"
   ```

---

## Storage Setup (Cloudflare R2)

Cloudflare R2 is S3-compatible but with **zero egress fees** (AWS charges for downloads).

### 1. Create Cloudflare Account

- Go to [cloudflare.com](https://cloudflare.com)
- Sign up (free)
- Verify email

### 2. Create R2 Bucket

1. In Cloudflare dashboard, click "R2" in the sidebar
2. Click "Create bucket"
3. Name: `swappy-uploads`
4. Location: Automatic
5. Click "Create bucket"

### 3. Generate API Tokens

1. In R2 page, click "Manage R2 API Tokens"
2. Click "Create API Token"
3. Token name: `swappy-app`
4. Permissions: "Object Read & Write"
5. Click "Create API Token"
6. **SAVE THESE** (you can't see them again):
   - Access Key ID
   - Secret Access Key

### 4. Get Account ID

1. In Cloudflare dashboard, click "R2"
2. On the right side, copy your "Account ID"

### 5. Setup Public Access

1. Go to your bucket → Settings
2. Under "Public Access", click "Allow Access"
3. Copy the "Public bucket URL" (e.g., `https://pub-xxx.r2.dev`)

### 6. Update .env.local

```env
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="swappy-uploads"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
```

---

## OAuth Setup (Google)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "Swappy"
3. Wait for project creation

### 2. Enable Google+ API

1. In the sidebar, go to "APIs & Services" → "Library"
2. Search "Google+ API"
3. Click it and click "Enable"

### 3. Create OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have Google Workspace)
3. Click "Create"
4. Fill in:
   - App name: `Swappy`
   - User support email: Your email
   - Developer contact: Your email
5. Click "Save and Continue"
6. Click "Save and Continue" (skip scopes)
7. Add test users (your email) if in testing mode
8. Click "Save and Continue"

### 4. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: `Swappy Web`
5. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (Add production URL later)
6. Click "Create"
7. **SAVE THESE**:
   - Client ID
   - Client Secret

### 5. Update .env.local

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## Running the App

### 1. Generate NextAuth Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and add to `.env.local`:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
```

### 2. Set App URLs

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Swappy"
```

### 3. Push Database Schema

```bash
# Push Prisma schema to database
npm run db:push

# Or create a migration
npm run db:migrate
```

### 4. Seed Database

```bash
npm run db:seed
```

This creates:
- 4 categories (Artwork, Fashion, Tattoos, Body Art)
- 20 common tags
- Admin user (email: `admin@swappy.com`, password: `password123`)

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Test the App

1. **Landing Page**: Should show 3D animated hero
2. **Sign Up**: Create a new account
3. **Login**: Try logging in
4. **Google OAuth**: Click "Continue with Google"
5. **Admin Login**: Use `admin@swappy.com` / `password123`

---

## Production Deployment

### 1. Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Click "Import"

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add ALL variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain:
     ```
     NEXTAUTH_URL="https://your-domain.vercel.app"
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes

### 2. Update OAuth Callback

1. Go back to Google Cloud Console
2. OAuth credentials → Edit
3. Add production redirect URI:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   ```
4. Save

### 3. Run Production Migrations

```bash
# Connect to production database
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
DATABASE_URL="your-production-db-url" npm run db:seed
```

### 4. Test Production

1. Visit your domain
2. Test signup/login
3. Test Google OAuth
4. Test image upload
5. Test post creation

### 5. Post-Deployment Checklist

- [ ] Change admin password
- [ ] Set up custom domain
- [ ] Configure SSL (automatic with Vercel)
- [ ] Set up monitoring (Sentry)
- [ ] Configure analytics
- [ ] Set up backups
- [ ] Test mobile responsiveness
- [ ] Run Lighthouse audit

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db push

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### R2 Upload Failing

- Check API tokens are correct
- Verify bucket has public access enabled
- Check CORS settings in R2 bucket

### OAuth Not Working

- Verify redirect URI exactly matches
- Check client ID and secret
- Ensure OAuth consent screen is configured
- Check if app is in "Testing" mode (add test users)

### 3D Scene Not Loading

- Check browser console for errors
- Verify Three.js dependencies installed
- Try disabling browser extensions
- Check GPU acceleration is enabled

### Build Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

---

## Need Help?

- Check the [README.md](README.md) for full documentation
- Open an issue on GitHub
- Email: support@swappy.com

---

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created
- [ ] Database setup (Supabase or local)
- [ ] R2 storage configured
- [ ] Google OAuth configured
- [ ] NextAuth secret generated
- [ ] Database migrated (`npm run db:push`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] App accessible at `localhost:3000`

**Estimated setup time**: 30-45 minutes

---

**You're all set! 🎉 Start building your creative platform!**

