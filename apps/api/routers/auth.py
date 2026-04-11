import hashlib
import logging
import os
import random
import secrets
import time
import urllib.parse
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.config import settings
from apps.api.core.database import get_db
from apps.api.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from apps.api.models.database import SocialAccount, User
from apps.api.models.schemas import (
    PhoneLoginRequest,
    PhoneVerifyRequest,
    SocialAccountResponse,
    SocialLoginRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# ── stores (use Redis in production) ─────────────────────────────
_otp_store: dict[str, dict] = {}
_oauth_state_store: dict[str, dict] = {}

OTP_TTL_SECONDS = 300
OTP_MAX_ATTEMPTS = 5
OAUTH_STATE_TTL = 600

CALLBACK_BASE = settings.FRONTEND_URL.rstrip("/")

# ── OAuth provider config ────────────────────────────────────────

OAUTH_PROVIDERS: dict[str, dict] = {
    "google": {
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scopes": "openid email profile",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
    },
    "instagram": {
        "authorize_url": "https://www.instagram.com/oauth/authorize",
        "token_url": "https://api.instagram.com/oauth/access_token",
        "userinfo_url": "https://graph.instagram.com/me",
        "scopes": "instagram_business_basic",
        "client_id": settings.INSTAGRAM_CLIENT_ID,
        "client_secret": settings.INSTAGRAM_CLIENT_SECRET,
    },
    "twitter": {
        "authorize_url": "https://twitter.com/i/oauth2/authorize",
        "token_url": "https://api.x.com/2/oauth2/token",
        "userinfo_url": "https://api.x.com/2/users/me",
        "scopes": "tweet.read users.read offline.access",
        "client_id": settings.TWITTER_CLIENT_ID,
        "client_secret": settings.TWITTER_CLIENT_SECRET,
        "pkce": True,
    },
}


# ── helpers ───────────────────────────────────────────────────────

def _get_redirect_uri(provider: str) -> str:
    """Redirect URI must point to the backend callback so it can exchange the code."""
    return f"{settings.BACKEND_URL.rstrip('/')}/api/v1/auth/social/{provider}/callback"


def _make_code_challenge(verifier: str) -> str:
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    import base64
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


async def _find_or_create_social_user(
    db: AsyncSession,
    provider: str,
    provider_user_id: str,
    email: Optional[str],
    name: str,
    avatar: Optional[str],
    access_token: Optional[str] = None,
    refresh_token: Optional[str] = None,
    raw_data: Optional[dict] = None,
) -> User:
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.provider == provider,
            SocialAccount.provider_user_id == provider_user_id,
        )
    )
    existing_link = result.scalar_one_or_none()

    if existing_link:
        user_result = await db.execute(select(User).where(User.id == existing_link.user_id))
        user = user_result.scalar_one()
        existing_link.access_token = access_token
        existing_link.refresh_token = refresh_token
        existing_link.raw_data = raw_data
        return user

    user: Optional[User] = None
    if email:
        user_result = await db.execute(select(User).where(User.email == email))
        user = user_result.scalar_one_or_none()

    if user is None:
        user = User(
            email=email,
            name=name,
            auth_provider=provider,
            avatar_url=avatar,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    social = SocialAccount(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_user_id,
        provider_email=email,
        provider_name=name,
        provider_avatar=avatar,
        access_token=access_token,
        refresh_token=refresh_token,
        raw_data=raw_data,
    )
    db.add(social)
    await db.flush()

    return user


async def _exchange_code_for_profile(provider: str, code: str, state_data: dict) -> dict:
    """Exchange authorization code for tokens, then fetch user profile."""
    cfg = OAUTH_PROVIDERS[provider]
    redirect_uri = _get_redirect_uri(provider)

    token_data: dict = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
    }

    headers: dict = {}

    if provider == "twitter":
        token_data["code_verifier"] = state_data.get("code_verifier", "")
        del token_data["client_secret"]
        import base64
        creds = base64.b64encode(
            f"{cfg['client_id']}:{cfg['client_secret']}".encode()
        ).decode()
        headers["Authorization"] = f"Basic {creds}"

    async with httpx.AsyncClient(timeout=15) as client:
        if provider == "instagram":
            resp = await client.post(cfg["token_url"], data=token_data)
        else:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
            resp = await client.post(cfg["token_url"], data=token_data, headers=headers)

    if resp.status_code != 200:
        logger.error("Token exchange failed for %s: %s %s", provider, resp.status_code, resp.text)
        raise HTTPException(status_code=401, detail=f"Token exchange failed with {provider}")

    tokens = resp.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    id_token = tokens.get("id_token")

    if provider == "google" and id_token:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                cfg["userinfo_url"],
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch Google profile")
        profile = resp.json()
        return {
            "provider_user_id": profile["sub"],
            "email": profile.get("email"),
            "name": profile.get("name", profile.get("email", "Google User")),
            "avatar": profile.get("picture"),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "raw": profile,
        }

    if provider == "instagram":
        user_id = tokens.get("user_id", "")
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                cfg["userinfo_url"],
                params={"fields": "id,username", "access_token": access_token},
            )
        if resp.status_code == 200:
            profile = resp.json()
            return {
                "provider_user_id": str(profile.get("id", user_id)),
                "email": None,
                "name": profile.get("username", "Instagram User"),
                "avatar": None,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "raw": profile,
            }
        return {
            "provider_user_id": str(user_id),
            "email": None,
            "name": "Instagram User",
            "avatar": None,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "raw": tokens,
        }

    if provider == "twitter":
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                cfg["userinfo_url"],
                params={"user.fields": "id,name,username,profile_image_url"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch Twitter profile")
        data = resp.json().get("data", {})
        return {
            "provider_user_id": str(data["id"]),
            "email": None,
            "name": data.get("name", data.get("username", "Twitter User")),
            "avatar": data.get("profile_image_url"),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "raw": data,
        }

    raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")


# ── email auth ────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
        auth_provider="email",
        region=body.region,
        language=body.language,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ── OAuth2 authorization code flow ───────────────────────────────

@router.get("/social/{provider}/authorize")
async def social_authorize(provider: str):
    """
    Step 1: Redirect the user's browser to the OAuth provider's consent screen.
    The frontend opens this URL in a popup window.
    """
    cfg = OAUTH_PROVIDERS.get(provider)
    if not cfg:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    if not cfg["client_id"]:
        raise HTTPException(
            status_code=400,
            detail=f"{provider} OAuth is not configured. Set {provider.upper()}_CLIENT_ID and {provider.upper()}_CLIENT_SECRET in your .env file.",
        )

    state = secrets.token_urlsafe(32)
    state_data: dict = {"provider": provider, "created_at": time.time()}

    params: dict = {
        "client_id": cfg["client_id"],
        "redirect_uri": _get_redirect_uri(provider),
        "response_type": "code",
        "scope": cfg["scopes"],
        "state": state,
    }

    if provider == "google":
        params["access_type"] = "offline"
        params["prompt"] = "consent"

    if cfg.get("pkce"):
        code_verifier = secrets.token_urlsafe(64)
        code_challenge = _make_code_challenge(code_verifier)
        params["code_challenge"] = code_challenge
        params["code_challenge_method"] = "S256"
        state_data["code_verifier"] = code_verifier

    _oauth_state_store[state] = state_data

    auth_url = f"{cfg['authorize_url']}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=auth_url, status_code=302)


@router.get("/social/{provider}/callback")
async def social_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2: Provider redirects here after user consents.
    Exchange the code for tokens, fetch profile, create/find user, issue Swappy JWT.
    Redirect back to frontend with token in URL fragment.
    """
    state_data = _oauth_state_store.pop(state, None)
    if not state_data:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    if time.time() - state_data["created_at"] > OAUTH_STATE_TTL:
        raise HTTPException(status_code=400, detail="OAuth state expired")

    profile = await _exchange_code_for_profile(provider, code, state_data)

    user = await _find_or_create_social_user(
        db=db,
        provider=provider,
        provider_user_id=profile["provider_user_id"],
        email=profile.get("email"),
        name=profile["name"],
        avatar=profile.get("avatar"),
        access_token=profile.get("access_token"),
        refresh_token=profile.get("refresh_token"),
        raw_data=profile.get("raw"),
    )

    jwt_token = create_access_token({"sub": str(user.id)})

    redirect_url = (
        f"{CALLBACK_BASE}/auth/callback"
        f"?token={urllib.parse.quote(jwt_token)}"
        f"&provider={urllib.parse.quote(provider)}"
    )
    return RedirectResponse(url=redirect_url, status_code=302)


@router.post("/social", response_model=TokenResponse)
async def social_login_direct(body: SocialLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Direct token exchange (for Google ID tokens from GIS popup, etc.).
    The frontend passes a provider token directly; we verify it.
    """
    verifier = _DIRECT_VERIFIERS.get(body.provider)
    if not verifier:
        raise HTTPException(
            status_code=400,
            detail=f"Direct token login not supported for '{body.provider}'. Use the /authorize flow instead.",
        )

    profile = await verifier(body.token)

    user = await _find_or_create_social_user(
        db=db,
        provider=body.provider,
        provider_user_id=profile["provider_user_id"],
        email=profile.get("email"),
        name=profile["name"],
        avatar=profile.get("avatar"),
        raw_data=profile.get("raw"),
    )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


async def _verify_google_id_token(token: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": token},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    data = resp.json()
    return {
        "provider_user_id": data["sub"],
        "email": data.get("email"),
        "name": data.get("name", data.get("email", "Google User")),
        "avatar": data.get("picture"),
        "raw": data,
    }


_DIRECT_VERIFIERS = {
    "google": _verify_google_id_token,
}


@router.get("/social/providers")
async def list_providers():
    """Return which OAuth providers are configured and available."""
    available = {}
    for name, cfg in OAUTH_PROVIDERS.items():
        available[name] = {
            "configured": bool(cfg["client_id"] and cfg["client_secret"]),
            "authorize_url": f"/api/v1/auth/social/{name}/authorize",
        }
    return available


@router.get("/social/accounts", response_model=list[SocialAccountResponse])
async def list_social_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.user_id == current_user.id)
    )
    return [SocialAccountResponse.model_validate(sa) for sa in result.scalars().all()]


# ── phone auth (OTP) ─────────────────────────────────────────────

def _generate_otp() -> str:
    return f"{random.randint(0, 999999):06d}"


@router.post("/phone/send-otp", status_code=200)
async def phone_send_otp(body: PhoneLoginRequest):
    code = _generate_otp()
    _otp_store[body.phone] = {
        "code": code,
        "expires_at": time.time() + OTP_TTL_SECONDS,
        "attempts": 0,
    }
    logger.info("OTP for %s: %s", body.phone, code)
    return {
        "message": "OTP sent successfully",
        "dev_otp": code,
        "expires_in_seconds": OTP_TTL_SECONDS,
    }


@router.post("/phone/verify", response_model=TokenResponse)
async def phone_verify(body: PhoneVerifyRequest, db: AsyncSession = Depends(get_db)):
    entry = _otp_store.get(body.phone)
    if not entry:
        raise HTTPException(status_code=400, detail="No OTP requested for this number. Send OTP first.")

    if time.time() > entry["expires_at"]:
        _otp_store.pop(body.phone, None)
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    entry["attempts"] += 1
    if entry["attempts"] > OTP_MAX_ATTEMPTS:
        _otp_store.pop(body.phone, None)
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new OTP.")

    if entry["code"] != body.code:
        raise HTTPException(status_code=401, detail=f"Invalid OTP. {OTP_MAX_ATTEMPTS - entry['attempts']} attempts left.")

    _otp_store.pop(body.phone, None)

    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            phone=body.phone,
            name=f"User {body.phone[-4:]}",
            auth_provider="phone",
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


# ── profile ───────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    updates: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed_fields = {"name", "region", "language", "avatar_url", "phone", "email"}
    for key, value in updates.items():
        if key in allowed_fields:
            setattr(current_user, key, value)
    await db.flush()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)
