# Google login broken — what to do

## Most likely causes (confirmed architecture)

1. **OAuth `state` was in process memory** — Google starts on ECS task A; callback hits task B → `Invalid or expired OAuth state`.
2. **Unstable `JWT_SECRET`** — if each task boots with a different secret, login “succeeds” then `/auth/me` fails with invalid token.
3. **`redirect_uri_mismatch`** — Google Console URI must equal exactly:  
   `{BACKEND_URL}/api/v1/auth/social/google/callback`

Live check (working authorize): API health is up; Google is `configured: true`; redirect_uri is the ECS URL.

## Immediate ops (do this on ECS now)

1. Set a **single stable** `JWT_SECRET` (≥32 random characters) shared by all tasks. Do **not** leave it blank or use the local `.env` default.
2. Confirm Google Cloud → Credentials → Authorized redirect URIs includes **exactly**:
   ```text
   https://sw-857cfb968b6e4039886ba148ed4c4b15.ecs.ap-southeast-2.on.aws/api/v1/auth/social/google/callback
   ```
3. Optional quick mitigation: set ECS **desired count = 1** until the Mongo state fix is deployed.
4. Redeploy the API image that includes the Mongo `oauth_states` fix (this branch).

## Code fix on `security/auth-hardening`

- OAuth `state` stored in MongoDB (`oauth_states`) so any task can complete the callback.
- `redirect_uri` always from canonical `BACKEND_URL` (not Host headers).

## After deploy — smoke test

1. Open an **incognito** window → https://www.swappystudio.com/auth/login  
2. Continue with Google  
3. Should land on `/dashboard` without an error page  
4. If it fails, note the **exact** URL and error text (`redirect_uri_mismatch`, `Invalid or expired OAuth state`, etc.)
