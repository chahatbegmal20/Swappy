# 🔐 Google OAuth Setup - Complete Guide

## 📋 What You'll Get

After this setup, users can click **"Continue with Google"** to:
- ✅ Sign up instantly (no password needed)
- ✅ Login with one click
- ✅ Auto-verified email

**Time needed:** 10-15 minutes  
**Cost:** 100% FREE

---

## 🚀 Step-by-Step Instructions

### **Step 1: Create Google Cloud Project** ⏱️ 3 min

#### 1.1 Go to Google Cloud Console
```
🔗 https://console.cloud.google.com/
```
- Sign in with your Google account
- If first time, accept terms

#### 1.2 Create New Project
1. Click the **project dropdown** at the top (says "Select a project")
2. Click **"NEW PROJECT"** button (top right of popup)
3. Fill in:
   - **Project name:** `Atelier` (or `My-App-OAuth`)
   - **Location:** No organization (unless you have one)
4. Click **"CREATE"**
5. Wait 10-20 seconds (you'll see a progress notification)

#### 1.3 Select Your Project
1. Click the project dropdown again
2. Click on your new project name (`Atelier`)
3. The dashboard will reload with your project selected

---

### **Step 2: Enable Google+ API** ⏱️ 1 min

#### 2.1 Navigate to API Library
1. Click **☰ (hamburger menu)** → **"APIs & Services"** → **"Library"**
   - Or use search: Type "API Library" in top search bar

#### 2.2 Enable Google+ API
1. In the library search bar, type: `Google+ API`
2. Click on **"Google+ API"** from the results
3. Click the blue **"ENABLE"** button
4. Wait a few seconds until you see "API enabled"

---

### **Step 3: Configure OAuth Consent Screen** ⏱️ 3 min

#### 3.1 Go to OAuth Consent Screen
1. Left sidebar → **"OAuth consent screen"**

#### 3.2 Choose User Type
- Select **"External"** radio button
  - ℹ️ Choose "Internal" only if you have Google Workspace
- Click **"CREATE"**

#### 3.3 App Information (Page 1)
Fill in the following:

**Required Fields:**
- **App name:** `Atelier`
- **User support email:** Your email (dropdown)
- **Developer contact email:** Your email

**Optional Fields (can skip):**
- App logo
- Application home page: `http://localhost:3000`
- Privacy policy link
- Terms of service link

Click **"SAVE AND CONTINUE"**

#### 3.4 Scopes (Page 2)
- Don't add any scopes
- Click **"SAVE AND CONTINUE"**

#### 3.5 Test Users (Page 3) - **IMPORTANT!**
Your app starts in "Testing" mode, so you need to add test users:

1. Click **"+ ADD USERS"**
2. Enter email addresses you'll use for testing:
   ```
   your.email@gmail.com
   friend@gmail.com  (optional)
   ```
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

#### 3.6 Summary (Page 4)
- Review your settings
- Click **"BACK TO DASHBOARD"**

---

### **Step 4: Create OAuth Credentials** ⏱️ 3 min

#### 4.1 Go to Credentials
1. Left sidebar → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** (blue button at top)
3. Select **"OAuth client ID"**

#### 4.2 Configure the Client
**Application type:**
- Select **"Web application"** from dropdown

**Name:**
- Enter: `Atelier Web Client`

#### 4.3 Authorized JavaScript Origins (Optional)
This is optional but recommended:

1. Click **"+ ADD URI"** under "Authorized JavaScript origins"
2. Enter: `http://localhost:3000`
3. For production, add your domain: `https://yourdomain.com`

#### 4.4 Authorized Redirect URIs (CRITICAL!)
⚠️ **This must be EXACTLY correct or it won't work!**

1. Click **"+ ADD URI"** under "Authorized redirect URIs"
2. Enter EXACTLY this: 
   ```
   http://localhost:3000/api/auth/callback/google
   ```
3. **Double-check for typos!** Common mistakes:
   - ❌ `http://localhost:3000/api/auth/google/callback` (wrong order)
   - ❌ `https://localhost:3000/...` (should be http for local)
   - ❌ `http://localhost:3000/callback/google` (missing /api/auth)
   - ✅ `http://localhost:3000/api/auth/callback/google` (correct!)

4. For production later, add:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

#### 4.5 Create
1. Click **"CREATE"** button
2. A popup appears with your credentials!

---

### **Step 5: Copy Your Credentials** ⏱️ 1 min

You'll see a popup titled "OAuth client created" with:

```
Your Client ID:
123456789012-abc123def456ghi789jkl012.apps.googleusercontent.com

Your Client Secret:
GOCSPX-AbCdEf123456GhIjKl789012
```

#### What to do:
1. **Copy the Client ID** (click the copy icon)
2. **Copy the Client Secret** (click the copy icon)
3. Click **"DOWNLOAD JSON"** (optional - for backup)
4. Click **"OK"**

**⚠️ IMPORTANT:** Keep these credentials SECRET! Never commit to GitHub!

---

### **Step 6: Add to Your Project** ⏱️ 2 min

#### 6.1 Open `.env.local` file
In your project folder:
```
C:\Users\HP\OneDrive\Desktop\DataScience Upskill\.env.local
```

#### 6.2 Update these lines
Find these lines:
```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Replace with your real credentials:
```env
GOOGLE_CLIENT_ID="123456789012-abc123def456ghi789jkl012.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-AbCdEf123456GhIjKl789012"
```

**Important:**
- Keep the quotes `""`
- No spaces before or after the `=`
- No trailing spaces

#### 6.3 Save the file
Press `Ctrl+S` to save

---

### **Step 7: Restart Your Server** ⏱️ 30 sec

#### 7.1 Stop Current Server
In your terminal, press:
```
Ctrl + C
```

#### 7.2 Start Server Again
```powershell
npm run dev
```

Wait for:
```
✓ Ready in 4.3s
```

---

## 🎉 Test It!

### 1. Go to Login Page
```
http://localhost:3000/login
```

### 2. You should see:
✅ **"Continue with Google"** button (with Google logo)

### 3. Click the button
- Google login popup will appear
- Sign in with your email (that you added as test user)
- Grant permissions
- You'll be redirected to dashboard!

---

## 🐛 Troubleshooting

### ❌ "Error 400: redirect_uri_mismatch"

**Cause:** Redirect URI doesn't match

**Fix:**
1. Go back to Google Cloud Console
2. Credentials → Click your OAuth client
3. Check "Authorized redirect URIs"
4. Must be EXACTLY: `http://localhost:3000/api/auth/callback/google`
5. Save and try again

### ❌ "Error 403: access_denied"

**Cause:** Email not added as test user

**Fix:**
1. Google Cloud Console
2. OAuth consent screen
3. Scroll down to "Test users"
4. Add your email
5. Save and try again

### ❌ Google button doesn't appear

**Cause:** Credentials not set properly

**Fix:**
1. Check `.env.local` has real values (not placeholder)
2. Check no extra spaces
3. Restart server: `Ctrl+C` then `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R`

### ❌ "Error 401: invalid_client"

**Cause:** Wrong Client ID or Secret

**Fix:**
1. Go back to Google Cloud Console
2. Credentials → Click your OAuth client
3. Copy credentials again
4. Update `.env.local`
5. Restart server

---

## 🚀 Going to Production

When you deploy to production (e.g., Vercel):

### 1. Add Production Redirect URI
```
https://your-domain.com/api/auth/callback/google
```

### 2. Add to Vercel Environment Variables
In Vercel dashboard:
- Settings → Environment Variables
- Add `GOOGLE_CLIENT_ID`
- Add `GOOGLE_CLIENT_SECRET`
- Deploy again

### 3. Publish OAuth Consent Screen
1. Google Cloud Console
2. OAuth consent screen
3. Click "PUBLISH APP"
4. Submit for verification (if you want public access)

**Testing mode limitations:**
- Only 100 users
- Must be added as test users
- Shows "unverified app" warning

**Published mode:**
- Unlimited users
- No test user restrictions
- Requires verification (takes 1-2 weeks)

---

## 📋 Quick Reference

### Google Cloud Console URLs

```
Main Console:
https://console.cloud.google.com/

APIs & Services:
https://console.cloud.google.com/apis/dashboard

OAuth Consent Screen:
https://console.cloud.google.com/apis/credentials/consent

Credentials:
https://console.cloud.google.com/apis/credentials
```

### Your .env.local should look like:

```env
# Database
DATABASE_URL="your-database-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth ✅ CONFIGURED
GOOGLE_CLIENT_ID="123456789012-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456"

# Rest of config...
```

---

## ✅ Checklist

Before testing, make sure:

- [x] Google Cloud project created
- [x] Google+ API enabled
- [x] OAuth consent screen configured
- [x] Test users added (your email)
- [x] OAuth credentials created
- [x] Redirect URI set to: `http://localhost:3000/api/auth/callback/google`
- [x] Client ID copied to `.env.local`
- [x] Client Secret copied to `.env.local`
- [x] Server restarted
- [x] Browser refreshed

---

## 🎓 How It Works

```
1. User clicks "Continue with Google"
   ↓
2. Redirects to Google login page
   ↓
3. User signs in and grants permissions
   ↓
4. Google redirects back with code:
   http://localhost:3000/api/auth/callback/google?code=ABC123
   ↓
5. NextAuth exchanges code for user info
   ↓
6. Creates or logs in user
   ↓
7. User is logged in! 🎉
```

---

## 🔒 Security Notes

**Keep Secret:**
- ❌ Never commit `.env.local` to GitHub
- ❌ Never share Client Secret publicly
- ✅ Add `.env.local` to `.gitignore` (already done)

**Production:**
- Use environment variables in hosting platform
- Rotate secrets if exposed
- Monitor OAuth usage in Google Console

---

## 💡 Pro Tips

1. **Multiple Environments**
   - Create separate OAuth clients for dev/staging/prod
   - Use different redirect URIs for each

2. **Testing**
   - Add multiple test user emails during development
   - Remove them when publishing

3. **Branding**
   - Add app logo to OAuth consent screen
   - Makes it look more professional
   - Users more likely to trust it

4. **Scopes**
   - Default scopes (email, profile) are enough
   - Only request what you need

---

## 🆘 Still Having Issues?

1. **Check Browser Console** (F12)
   - Look for error messages
   - Shows detailed OAuth errors

2. **Check Server Logs**
   - Terminal where server is running
   - Shows authentication errors

3. **Common Issues**
   - Typo in redirect URI (most common!)
   - Forgot to add test user
   - Server not restarted
   - Old cached credentials

4. **Start Over**
   - Delete OAuth client
   - Create new one
   - Follow guide exactly

---

## 🎉 Success!

Once working, users can:
- ✅ Sign up in 2 clicks
- ✅ Login instantly
- ✅ No password to remember
- ✅ Verified email automatically

**Your app is now more professional and user-friendly!** 🚀

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [OAuth 2.0 Explained](https://www.oauth.com/)

---

**Happy coding! If you get stuck, refer back to this guide!** 🎨✨

