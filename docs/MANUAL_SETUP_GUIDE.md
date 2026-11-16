# Swappy — Manual Setup Checklist

Things **you** need to do (console accounts, secrets, browser OAuth consent) that cannot be finished by the local agent alone. The API + web app are already runnable with MongoDB Atlas and mock file uploads.

Use this after `npm run start` from the repo root (frontend `http://localhost:3000`, API `http://127.0.0.1:8000`).

---

## 1. MongoDB Atlas

Already used via `DATABASE_URL` in `.env`.

- [ ] Confirm the cluster is running and your IP is allowed under **Network Access** (or `0.0.0.0/0` for local-only testing)
- [ ] Confirm the DB user password in `.env` is current (special characters must be URL-encoded)
- [ ] Optional: open Atlas → Browse Collections → verify `users`, `projects`, `content_scores`, etc. appear after you sign up

---

## 2. Google OAuth (Continue with Google)

Google is the only social provider currently configured with real credentials in `.env`.

### Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**
2. Open (or create) an **OAuth 2.0 Client ID** of type **Web application**
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
4. Under **Authorized redirect URIs**, add **exactly**:
   - `http://127.0.0.1:8000/api/v1/auth/social/google/callback`
5. Copy Client ID + Client Secret into `.env`:
   ```env
   GOOGLE_CLIENT_ID=....apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-...
   ```
6. Restart the API after changing `.env`
7. Configure the **OAuth consent screen** (External/Testing):
   - Add yourself as a **Test user** while the app is in Testing mode
   - Publishing to Production is required before arbitrary Google accounts can sign in

### Manual browser test

1. Open `http://localhost:3000/auth/register` → **Social / Phone** → **Continue with Google**
2. Allow popups for `localhost`
3. Complete Google consent → you should land on Dashboard
4. Logout → Login → Social → Google again (same account should reunite)

If redirect fails with `redirect_uri_mismatch`, the URI in Google Console does not match `BACKEND_URL` (must be `http://127.0.0.1:8000/...`, not `localhost`, matching current `.env`).

---

## 3. Instagram / Meta OAuth

Buttons show **SETUP NEEDED** until real credentials are set.

1. Create an app at [Meta for Developers](https://developers.facebook.com/)
2. Add **Instagram** product / Instagram Login (Business) as required by Meta’s current flow
3. Set the redirect URI to:
   - `http://127.0.0.1:8000/api/v1/auth/social/instagram/callback`
4. Put values in `.env` (no `your-*` placeholders):
   ```env
   INSTAGRAM_CLIENT_ID=...
   INSTAGRAM_CLIENT_SECRET=...
   ```
5. Restart the API and confirm `/api/v1/auth/social/providers` shows `"instagram": { "configured": true }`
6. Meta apps often require Business verification / test users — complete that in the Meta dashboard

---

## 4. Twitter / X OAuth

1. Create a project/app at [X Developer Portal](https://developer.x.com/)
2. Enable **OAuth 2.0** with PKCE
3. Callback URL:
   - `http://127.0.0.1:8000/api/v1/auth/social/twitter/callback`
4. Set in `.env`:
   ```env
   TWITTER_CLIENT_ID=...
   TWITTER_CLIENT_SECRET=...
   ```
5. Restart and verify providers endpoint shows Twitter as configured

---

## 5. Phone OTP (production SMS)

Locally, OTP is returned in the UI as **Dev mode OTP** and logged in the API console — no SMS is sent.

To send real SMS you must:

- [ ] Choose a provider (Twilio, MSG91, SNS, etc.)
- [ ] Add provider credentials to `.env`
- [ ] Wire that provider into `apps/api/routers/auth.py` (`phone_send_otp`) so `dev_otp` is not returned in production
- [ ] Set `APP_ENV=production` and stop exposing OTPs in API responses

---

## 6. Docker / MinIO / Redis (optional)

Docker is **not** installed (or not on PATH) on this machine. The app still works:

| Service | Without Docker |
|--------|----------------|
| Uploads | Mock endpoint → `local_uploads/` |
| Redis / Celery | Not required for signup, projects, sync scoring |
| MinIO | Not required for local mock uploads |

If you want real S3-style storage + workers:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Restore / add a `docker-compose.yml` for Postgres/Redis/MinIO if you use the infra docs
3. Start MinIO and set `S3_*` in `.env` to match
4. Create the bucket named in `S3_BUCKET`
5. Optionally run: `celery -A apps.worker.tasks worker --loglevel=info`

---

## 7. Secrets & production hygiene

- [ ] Rotate `JWT_SECRET` before any public deploy
- [ ] Do not commit `.env` (keep using `.env.example` as the template)
- [ ] Restrict MongoDB Network Access to your IPs
- [ ] Rotate Google / Instagram / Twitter secrets if they were ever shared
- [ ] Set `FRONTEND_URL` / `BACKEND_URL` to your real HTTPS domains and update OAuth redirect URIs to match

---

## 8. Recommended new-user walkthrough (you in the browser)

Do this once Google redirect URI is correct:

1. **Landing** → Get Started  
2. **Register with email** → Dashboard  
3. Create a project → Upload a small image/video/audio → Metadata → Analyze  
4. Open **Trends**, **Settings** (save profile), **Logout**  
5. **Login with email** again  
6. Logout → **Social / Phone** → Phone OTP (use shown Dev OTP) → Logout → Phone again  
7. **Continue with Google** (after console setup) → Logout → Google again  
8. Optional: after Google, add an email + password via Settings / `POST /api/v1/auth/set-password` so email login also works  

---

## Quick verification commands

```bash
# Health
curl http://127.0.0.1:8000/health

# Which social providers are ready
curl http://127.0.0.1:8000/api/v1/auth/social/providers
```

Expected when only Google is set up:

```json
{
  "google": { "configured": true, "...": "..." },
  "instagram": { "configured": false },
  "twitter": { "configured": false }
}
```
