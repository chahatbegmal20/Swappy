"""MongoDB document models (Beanie ODM).

These replace the former SQLAlchemy ORM models. Relationships that used to be
foreign keys are now stored as string ids (the `*_id` fields) and resolved with
explicit queries in the routers, since MongoDB has no joins.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Any

import pymongo
from beanie import Document
from pydantic import Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_uuid() -> str:
    return str(uuid.uuid4())


class User(Document):
    id: str = Field(default_factory=new_uuid)
    email: Optional[str] = None
    name: str
    hashed_password: Optional[str] = None
    phone: Optional[str] = None
    auth_provider: str = "email"
    role: str = "creator"
    tier: str = "free"
    region: Optional[str] = None
    language: str = "en"
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "users"
        indexes = [
            [("email", pymongo.ASCENDING)],
            [("phone", pymongo.ASCENDING)],
        ]


class SocialAccount(Document):
    id: str = Field(default_factory=new_uuid)
    user_id: str
    provider: str
    provider_user_id: str
    provider_email: Optional[str] = None
    provider_name: Optional[str] = None
    provider_avatar: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    raw_data: Optional[dict] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "social_accounts"
        indexes = [
            [("provider", pymongo.ASCENDING), ("provider_user_id", pymongo.ASCENDING)],
            [("user_id", pymongo.ASCENDING)],
        ]


class Project(Document):
    id: str = Field(default_factory=new_uuid)
    user_id: str
    name: str
    description: Optional[str] = None
    status: str = "draft"
    target_platform: Optional[str] = None
    target_audience: Optional[str] = None
    hashtags: Optional[list] = None
    genres: Optional[list] = None
    moods: Optional[list] = None
    language: Optional[str] = None
    region: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "projects"
        indexes = [
            [("user_id", pymongo.ASCENDING)],
        ]


class ContentUpload(Document):
    id: str = Field(default_factory=new_uuid)
    project_id: str
    content_type: str
    s3_key: str
    original_filename: str
    mime_type: Optional[str] = None
    file_size_bytes: int
    metadata_: Optional[dict] = Field(default=None, alias="metadata")
    processing_status: str = "pending"
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "content_uploads"
        indexes = [
            [("project_id", pymongo.ASCENDING)],
        ]

    model_config = {"populate_by_name": True}


class ContentScore(Document):
    id: str = Field(default_factory=new_uuid)
    project_id: str
    model_version: str
    trend_alignment: float
    virality_probability: float
    audience_fit: float
    novelty: float
    competitiveness: float
    launch_timing: float
    trend_creation_probability: float
    overall_viability: float
    confidence_lower: float
    confidence_upper: float
    explanations: Optional[dict] = None
    recommendations: Optional[dict] = None
    comparable_examples: Optional[Any] = None
    best_publish_window: Optional[dict] = None
    best_platforms: Optional[Any] = None
    models_used: Optional[list] = None
    feature_importance: Optional[list] = None
    scored_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "content_scores"
        indexes = [
            [("project_id", pymongo.ASCENDING)],
        ]


class TrendSignal(Document):
    id: str = Field(default_factory=new_uuid)
    source: str
    category: Optional[str] = None
    topic: str
    region: Optional[str] = None
    signal_type: str
    velocity: float
    volume: float
    raw_data: Optional[dict] = None
    captured_at: datetime = Field(default_factory=utcnow)
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "trend_signals"
        indexes = [
            [("topic", pymongo.ASCENDING)],
        ]
