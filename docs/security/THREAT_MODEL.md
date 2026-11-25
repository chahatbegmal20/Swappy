# Threat Model (STRIDE) — SwappyStudio

## Data flow (simplified)

```
User Agent
  │ HTTPS
  ├─► Next.js (Vercel) ── AuthGuard (client) ── localStorage JWT
  │         │
  │         └─ Bearer ──► FastAPI (ECS)
  │                         ├─ MongoDB Atlas
  │                         ├─ S3/R2 (or mock local)
  │                         └─ Google OAuth / Trends RSS
```

## STRIDE map

### Spoofing

| Threat | Likelihood | Impact | Notes |
|--------|------------|--------|-------|
| Stolen JWT from XSS / localStorage | High | High | Migration planned |
| Stolen JWT from URL query / Referer | High | High | Still present until cookie/BFF |
| Host-header OAuth redirect_uri | Medium | Medium | **Mitigated** — canonical BACKEND_URL |
| Google ID token from wrong app (`aud`) | Medium | High | **Mitigated** — aud/iss checks |
| Phone OTP without SMS | High if enabled | High | **Mitigated** — prod/staging blocked |

### Tampering

| Threat | Likelihood | Impact | Notes |
|--------|------------|--------|-------|
| Unauth trends refresh / DB wipe of signals | High | Medium | **Mitigated** — auth required |
| Mock upload path traversal | Med (if mock on) | High | **Mitigated** — path contain + prod forbid |
| Profile email change without verify | Medium | High | Open finding |

### Repudiation

| Threat | Likelihood | Impact | Notes |
|--------|------------|--------|-------|
| Ephemeral JWT_SECRET across tasks | Medium | High | **Mitigated** — fail closed |
| Weak auth audit trail | High | Low | Logs avoid secrets; no immutable audit log yet |

### Information disclosure

| Threat | Likelihood | Impact | Notes |
|--------|------------|--------|-------|
| JWT in browser history | High | High | Open — migration plan |
| OTP / token bodies in logs | Medium | High | **Mitigated** — no OTP/token body logs |
| Provider tokens in Mongo | Medium | High | Open finding |
| Login enumeration messages | High | Low | Open finding |

### Denial of service

| Threat | Likelihood | Impact | Notes |
|--------|------------|--------|-------|
| Unauth refresh storms | High | Medium | **Mitigated** for refresh; GETs still public |
| Mock upload disk fill | Med | Medium | Soft 50 MiB cap; prod mock off |
| No login rate limit | High | Medium | Open finding |

### Elevation of privilege

| Threat | Likelihood | Impact | Notes |
|--------|------------|--------|-------|
| OAuth email auto-link takeover | Medium | High | Open finding |
| Fake account delete (client-only) | High | Medium | **Mitigated** — UI disabled |
| `role` field abuse | Low | High | Not writable via `/me` today |

## Agents / MCP

No agent or MCP backend exists. UI “coming soon” only — out of scope for active attack surface until Phase 3+.

## Cross-origin note (Vercel ↔ ECS)

Bearer tokens in JS tolerate cross-origin easily; **HttpOnly cookies do not** without same-site design. Preferred mitigation: same-origin façade on the frontend host (ADR-002). External Vercel rewrites have ~**120s** to first byte — unsuitable as a pipe for large uploads or slow AI without streaming/async design.
