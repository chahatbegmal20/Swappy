import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, BigInteger, DateTime, JSON, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship

from apps.api.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


def new_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=new_uuid)
    email = Column(String(255), unique=True, nullable=True, index=True)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    auth_provider = Column(String(50), default="email", nullable=False)
    role = Column(String(50), default="creator", nullable=False)
    tier = Column(String(50), default="free", nullable=False)
    region = Column(String(100), nullable=True)
    language = Column(String(10), default="en", nullable=False)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    social_accounts = relationship("SocialAccount", back_populates="user", cascade="all, delete-orphan")


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(String(36), primary_key=True, default=new_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False, index=True)
    provider_user_id = Column(String(255), nullable=False)
    provider_email = Column(String(255), nullable=True)
    provider_name = Column(String(255), nullable=True)
    provider_avatar = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="social_accounts")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=new_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="draft", nullable=False)
    target_platform = Column(String(100), nullable=True)
    target_audience = Column(String(255), nullable=True)
    hashtags = Column(JSON, nullable=True)
    genres = Column(JSON, nullable=True)
    moods = Column(JSON, nullable=True)
    language = Column(String(50), nullable=True)
    region = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="projects")
    uploads = relationship("ContentUpload", back_populates="project", cascade="all, delete-orphan")
    scores = relationship("ContentScore", back_populates="project", cascade="all, delete-orphan")


class ContentUpload(Base):
    __tablename__ = "content_uploads"

    id = Column(String(36), primary_key=True, default=new_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    content_type = Column(String(50), nullable=False)
    s3_key = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    mime_type = Column(String(255), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)
    processing_status = Column(String(50), default="pending", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    project = relationship("Project", back_populates="uploads")


class ContentScore(Base):
    __tablename__ = "content_scores"

    id = Column(String(36), primary_key=True, default=new_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    model_version = Column(String(50), nullable=False)
    trend_alignment = Column(Float, nullable=False)
    virality_probability = Column(Float, nullable=False)
    audience_fit = Column(Float, nullable=False)
    novelty = Column(Float, nullable=False)
    competitiveness = Column(Float, nullable=False)
    launch_timing = Column(Float, nullable=False)
    trend_creation_probability = Column(Float, nullable=False)
    overall_viability = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=False)
    confidence_upper = Column(Float, nullable=False)
    explanations = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    comparable_examples = Column(JSON, nullable=True)
    best_publish_window = Column(JSON, nullable=True)
    best_platforms = Column(JSON, nullable=True)
    models_used = Column(JSON, nullable=True)
    feature_importance = Column(JSON, nullable=True)
    scored_at = Column(DateTime, default=utcnow, nullable=False)

    project = relationship("Project", back_populates="scores")


class TrendSignal(Base):
    __tablename__ = "trend_signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    topic = Column(String(255), nullable=False, index=True)
    region = Column(String(100), nullable=True)
    signal_type = Column(String(50), nullable=False)
    velocity = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    raw_data = Column(JSON, nullable=True)
    captured_at = Column(DateTime, default=utcnow, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
