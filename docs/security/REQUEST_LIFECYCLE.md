# Request lifecycle — Continue with Google → protected project

## Steps

1. **Browser** — User clicks Continue with Google on `/auth/login`  
   (`apps/web/src/components/social-auth.tsx`)

2. **Navigate** — Same-tab GET  
   `{BACKEND_URL}/api/v1/auth/social/google/authorize`

3. **API authorize** — Generates `state`, stores in process memory, redirects to Google with  
   `redirect_uri = {BACKEND_URL}/api/v1/auth/social/google/callback`  
   (**canonical** — ignores `Host` / `X-Forwarded-*`)

4. **Google consent** — User authenticates; Google redirects to API callback with `code` + `state`

5. **API callback** — Validates state TTL, exchanges code, loads profile, finds/creates `User` + `SocialAccount`, mints JWT

6. **Redirect to Next** —  
   `{FRONTEND_URL}/auth/callback?token=<JWT>&provider=google`  
   ⚠️ **Phase 2 target:** remove query JWT (see migration plan)

7. **Callback page** — Reads token, `localStorage.setItem("swappy_token")`, `GET /api/v1/auth/me`, push `/dashboard`

8. **Protected project** — e.g. `GET /api/v1/projects/{id}` with `Authorization: Bearer …`  
   `get_current_user` → `_get_owned_project` (`project.user_id == user.id`)

## Failure modes to watch

| Step | Failure | User sees |
|------|---------|-----------|
| 3 | Wrong `BACKEND_URL` vs Google console | Google `redirect_uri_mismatch` |
| 3–5 | Multi-instance without shared state store | Invalid/expired OAuth state |
| 6–7 | Token in URL copied/leaked | Account takeover until JWT expires |
| 8 | Missing/expired Bearer | 401 |

## Trust decisions at each hop

- Google proves identity to API (code + client secret).  
- API proves session to browser via JWT (currently bearer-in-JS).  
- API proves project access via Mongo `user_id` match (not via Next).
