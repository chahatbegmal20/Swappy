from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime


# Auth
class UserRegister(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8)
    region: Optional[str] = None
    language: str = "en"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SocialLoginRequest(BaseModel):
    provider: str = Field(description="google | instagram | twitter")
    token: str = Field(description="OAuth ID token or access token from the provider")


class PhoneLoginRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=20)


class PhoneVerifyRequest(BaseModel):
    phone: str
    code: str = Field(min_length=6, max_length=6)


class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    name: str
    role: str
    tier: str
    phone: Optional[str] = None
    auth_provider: str = "email"
    region: Optional[str] = None
    language: str
    avatar_url: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class SocialAccountResponse(BaseModel):
    id: str
    provider: str
    provider_user_id: str
    provider_email: Optional[str] = None
    provider_name: Optional[str] = None
    provider_avatar: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Projects
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    target_platform: Optional[str] = None
    target_audience: Optional[str] = None


class ProjectMetadataUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_platform: Optional[str] = None
    target_audience: Optional[str] = None
    hashtags: Optional[list[str]] = None
    genres: Optional[list[str]] = None
    moods: Optional[list[str]] = None
    language: Optional[str] = None
    region: Optional[str] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    target_platform: Optional[str]
    target_audience: Optional[str]
    hashtags: Optional[list[str]] = None
    genres: Optional[list[str]] = None
    moods: Optional[list[str]] = None
    language: Optional[str] = None
    region: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    uploads: list["UploadResponse"] = []
    scores: list["ScoreResponse"] = []


# Uploads
class PresignRequest(BaseModel):
    filename: str
    content_type: str
    file_size_bytes: int
    project_id: str


class PresignResponse(BaseModel):
    upload_url: str
    s3_key: str
    upload_id: str


class UploadCompleteRequest(BaseModel):
    upload_id: str
    content_type: str
    metadata: Optional[dict] = None


class UploadResponse(BaseModel):
    id: str
    content_type: str
    original_filename: str
    file_size_bytes: int
    processing_status: str
    created_at: datetime
    model_config = {"from_attributes": True}


# Scores
class ScoreResponse(BaseModel):
    id: str
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
    explanations: Optional[dict]
    recommendations: Optional[dict]
    comparable_examples: Optional[Any] = None
    best_publish_window: Optional[dict] = None
    best_platforms: Optional[Any] = None
    models_used: Optional[list[str]] = None
    feature_importance: Optional[list[dict]] = None
    scored_at: datetime
    model_config = {"from_attributes": True}


class AnalyzeRequest(BaseModel):
    project_id: str


# Trends
class TrendResponse(BaseModel):
    id: int
    source: str
    category: Optional[str]
    topic: str
    region: Optional[str]
    signal_type: str
    velocity: float
    volume: float
    captured_at: datetime
    model_config = {"from_attributes": True}


class TrendSearchParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    signal_type: Optional[str] = None
    limit: int = 50


# Dashboard
class CreatorDashboard(BaseModel):
    total_projects: int
    total_uploads: int
    average_viability: Optional[float]
    best_project: Optional[ProjectResponse]
    recent_scores: list[ScoreResponse] = []
    score_history: list[dict] = []


class MarketOverview(BaseModel):
    hot_trends: list[TrendResponse] = []
    emerging_trends: list[TrendResponse] = []
    declining_trends: list[TrendResponse] = []
    top_categories: list[dict] = []
    regional_highlights: list[dict] = []
