# Plan — eliminate URL JWTs and localStorage (Mongo sessions)

**Status:** Design only — implement after ADR-001/002 approval  
**Preferred model:** Option C — opaque server-side sessions in **MongoDB** + HttpOnly cookie  
**Prerequisite:** Same-origin API façade (Vercel → ECS) so cookies are first-party — see `ARCHITECTURE_DECISIONS.md`  
**Do not:** use URL fragments as permanent bearer delivery; **do not** add Redis only because `REDIS_URL` exists  

---

## Current (insecure shape)

```text
Google → API callback → redirect ?token=JWT → localStorage → Bearer header
         (no session row, client-only logout)
```

## Target

```text
Google → API callback → redirect ?code=one-time
      → BFF/API exchange → Create Mongo Session → Set-Cookie HttpOnly
      → Browser calls same-origin /api/* with cookie
      → Logout deletes Mongo session (immediate revoke)
```

Large uploads continue: **presign → direct PUT to object storage** (never through Vercel body limits).

---

## Mongo session document (sketch)

```text
sessions {
  id: string          # opaque session id (cookie value)
  user_id: string
  created_at, expires_at, last_seen_at
  user_agent_hash?, ip_hash?   # optional device hints
  revoked: bool
}
index: id unique; user_id; expires_at TTL
```

Cookie: `swappy_sid=<id>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=…`  
(Optionally `Domain=.swappystudio.com` only if API is on a sibling host **without** BFF — prefer BFF same-origin.)

---

## Rollout

| Step | Change | Rollback |
|------|--------|----------|
| 0 | Deploy same-origin rewrite for `/api/*` JSON | Remove rewrite |
| 1 | Dual auth: Cookie session **or** Bearer JWT | Flag off cookie |
| 2 | OAuth issues one-time `code` (Mongo, TTL 60s) instead of JWT in URL | Flag |
| 3 | Exchange sets cookie; stop writing localStorage | Keep Bearer login temporarily |
| 4 | Force re-login; remove Bearer-from-localStorage | — |

## CSRF

Same-origin + `SameSite=Lax` + reject mutating requests with bad `Origin`.

## Vercel constraints (why not proxy everything)

- External rewrite ~**120s** to first byte  
- Function body default **4.5 MB** (20 MiB beta)  
→ Videos and long AI: signed URLs / async jobs, not Next proxy bodies  

## Verification

- [ ] OAuth redirect URL has `code=` only  
- [ ] No `swappy_token` in localStorage  
- [ ] Cookie HttpOnly; `/auth/me` works credentialed same-origin  
- [ ] Logout → immediate 401 on next API call  
- [ ] Direct ECS origin without cookie still rejects browser credentialed calls as designed  

## Teaching note

**Stateless JWT** = “prove who you are with a signed card.” Lost card works until expiry.  
**Server session** = “hotel keycard checked against the front desk.” Desk can cancel immediately.  
HttpOnly means the keycard is in a locked wallet JavaScript cannot open (XSS-resistant for token theft).  
