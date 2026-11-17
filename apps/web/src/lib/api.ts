import type { User } from "./store";

function getApiBase() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (
    configured &&
    !/^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?\/?$/i.test(configured)
  ) {
    return configured.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      // Use 127.0.0.1 so Windows doesn't resolve localhost to ::1 while the API
      // is bound to IPv4 only (which makes fetch/uploads hang).
      return "http://127.0.0.1:8000";
    }
    return `${protocol}//${hostname}:8000`;
  }

  return "http://127.0.0.1:8000";
}

export const API_BASE = getApiBase();

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  target_platform: string | null;
  target_audience: string | null;
  hashtags: string[] | null;
  genres: string[] | null;
  moods: string[] | null;
  language: string | null;
  region: string | null;
  created_at: string;
  updated_at: string;
  uploads?: Upload[];
  scores?: Score[];
}

export interface Upload {
  id: string;
  content_type: string;
  original_filename: string;
  file_size_bytes: number;
  processing_status: string;
  created_at: string;
}

export interface Score {
  id: string;
  model_version: string;
  trend_alignment: number;
  virality_probability: number;
  audience_fit: number;
  novelty: number;
  competitiveness: number;
  launch_timing: number;
  trend_creation_probability: number;
  overall_viability: number;
  confidence_lower: number;
  confidence_upper: number;
  explanations: Record<string, string[]> | null;
  recommendations: Record<string, string[]> | null;
  comparable_examples: { title: string; score: number; similarity: number; outcome?: string }[] | null;
  best_publish_window: { best_days: string[]; best_hours: string } | null;
  best_platforms: { rankings: { platform: string; fit_score: number; selected?: boolean }[] } | null;
  models_used: string[] | null;
  feature_importance: { feature: string; importance: number; direction: string }[] | null;
  scored_at: string;
}

export interface TrendSignal {
  id: string;
  source: string;
  category: string | null;
  topic: string;
  region: string | null;
  signal_type: string;
  velocity: number;
  volume: number;
  captured_at: string;
  raw_data?: Record<string, unknown> | null;
  trend_score?: number | null;
}

export interface TrendEngagement {
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  metrics_note: string;
}

export interface TrendDetail {
  id: string;
  source: string;
  category: string | null;
  topic: string;
  region: string | null;
  signal_type: string;
  velocity: number;
  volume: number;
  trend_score: number;
  captured_at: string;
  raw_data?: Record<string, unknown> | null;
  engagement: TrendEngagement;
  related_news: { title: string; url?: string }[];
  data_points: {
    date: string;
    captured_at?: string;
    velocity: number;
    volume: number;
    score: number;
    signal_type?: string;
    source?: string;
    estimated?: boolean;
  }[];
}

export interface CreatorDashboard {
  total_projects: number;
  total_uploads: number;
  average_viability: number | null;
  best_project: Project | null;
  recent_scores: Score[];
  score_history: { date: string; score: number }[];
}

export interface MarketOverview {
  hot_trends: TrendSignal[];
  emerging_trends: TrendSignal[];
  declining_trends: TrendSignal[];
  top_categories: { category: string; count: number }[];
  regional_highlights: { region: string; count: number }[];
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("swappy_token", token);
      else localStorage.removeItem("swappy_token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("swappy_token");
    }
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ detail: "Request failed" }));
      const detail = error.detail;
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail
                .map((item) =>
                  typeof item === "string"
                    ? item
                    : item?.msg || JSON.stringify(item),
                )
                .join("; ")
            : detail
              ? JSON.stringify(detail)
              : `HTTP ${res.status}`;
      throw new Error(message);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // Auth
  async register(data: {
    email: string;
    name: string;
    password: string;
    region?: string;
    language?: string;
  }): Promise<TokenResponse> {
    return this.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    return this.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async socialLogin(provider: string, token: string): Promise<TokenResponse> {
    return this.request("/api/v1/auth/social", {
      method: "POST",
      body: JSON.stringify({ provider, token }),
    });
  }

  async getSocialProviders(): Promise<
    Record<string, { configured: boolean; authorize_url: string; redirect_uri?: string }>
  > {
    const payload = await this.request<
      | Record<string, { configured: boolean; authorize_url: string; redirect_uri?: string }>
      | {
          providers: Record<
            string,
            { configured: boolean; authorize_url: string; redirect_uri?: string }
          >;
        }
    >("/api/v1/auth/social/providers");

    if (payload && typeof payload === "object" && "providers" in payload && payload.providers) {
      return payload.providers;
    }
    return payload as Record<
      string,
      { configured: boolean; authorize_url: string; redirect_uri?: string }
    >;
  }

  async phoneSendOtp(phone: string): Promise<{
    message: string;
    expires_in_seconds: number;
    dev_otp?: string;
  }> {
    return this.request("/api/v1/auth/phone/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  async phoneVerify(phone: string, code: string): Promise<TokenResponse> {
    return this.request("/api/v1/auth/phone/verify", {
      method: "POST",
      body: JSON.stringify({ phone, code }),
    });
  }

  async getMe(): Promise<User> {
    return this.request("/api/v1/auth/me");
  }

  async getSocialAccounts(): Promise<{ id: string; provider: string; provider_user_id: string; provider_email: string | null; provider_name: string | null; created_at: string }[]> {
    return this.request("/api/v1/auth/social/accounts");
  }

  async updateMe(data: Record<string, string>): Promise<User> {
    return this.request("/api/v1/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async setPassword(data: {
    new_password: string;
    current_password?: string;
  }): Promise<void> {
    return this.request("/api/v1/auth/set-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Projects
  async createProject(data: {
    name: string;
    description?: string;
    target_platform?: string;
    target_audience?: string;
  }): Promise<Project> {
    return this.request("/api/v1/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProjects(): Promise<Project[]> {
    return this.request("/api/v1/projects/");
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/api/v1/projects/${id}`);
  }

  async updateProjectMetadata(
    id: string,
    data: {
      name?: string;
      description?: string;
      target_platform?: string;
      target_audience?: string;
      hashtags?: string[];
      genres?: string[];
      moods?: string[];
      language?: string;
      region?: string;
    },
  ): Promise<Project> {
    return this.request(`/api/v1/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request(`/api/v1/projects/${id}`, { method: "DELETE" });
  }

  // Uploads
  async getPresignedUrl(data: {
    filename: string;
    content_type: string;
    file_size_bytes: number;
    project_id: string;
  }): Promise<{ upload_url: string; s3_key: string; upload_id: string }> {
    return this.request("/api/v1/uploads/presign", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async completeUpload(data: {
    upload_id: string;
    content_type: string;
    metadata?: Record<string, unknown>;
  }): Promise<Upload> {
    return this.request("/api/v1/uploads/complete", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Scoring
  async analyzeProject(projectId: string): Promise<Score> {
    return this.request("/api/v1/scoring/analyze", {
      method: "POST",
      body: JSON.stringify({ project_id: projectId }),
    });
  }

  async getScores(projectId: string): Promise<Score[]> {
    return this.request(`/api/v1/scoring/${projectId}/scores`);
  }

  async getLatestScore(projectId: string): Promise<Score> {
    return this.request(`/api/v1/scoring/${projectId}/latest`);
  }

  // Trends
  async getTrends(params?: {
    category?: string;
    region?: string;
    signal_type?: string;
    limit?: number;
  }): Promise<TrendSignal[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.region) query.set("region", params.region);
    if (params?.signal_type) query.set("signal_type", params.signal_type);
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return this.request(`/api/v1/trends/${qs ? `?${qs}` : ""}`);
  }

  async refreshTrends(force = true): Promise<{
    refreshed: boolean;
    reason: string;
    total: number;
    fetched: number;
    inserted: number;
    sources?: string[];
  }> {
    const qs = force ? "?force=true" : "";
    return this.request(`/api/v1/trends/refresh${qs}`, { method: "POST" });
  }

  async searchTrends(q: string): Promise<TrendSignal[]> {
    return this.request(
      `/api/v1/trends/search?q=${encodeURIComponent(q)}`,
    );
  }

  async getTrendHeatmap(): Promise<
    { region: string; count: number; avg_velocity: number }[]
  > {
    return this.request("/api/v1/trends/heatmap");
  }

  async getTrendTrajectory(
    topic: string,
  ): Promise<{
    topic: string;
    trend?: TrendSignal | null;
    engagement?: TrendEngagement;
    related_news?: { title: string; url?: string }[];
    data_points: TrendDetail["data_points"];
  }> {
    return this.request(
      `/api/v1/trends/${encodeURIComponent(topic)}/trajectory`,
    );
  }

  async getTrendDetail(topic: string): Promise<TrendDetail> {
    return this.request(
      `/api/v1/trends/detail/${encodeURIComponent(topic)}`,
    );
  }

  // Dashboard
  async getCreatorDashboard(): Promise<CreatorDashboard> {
    return this.request("/api/v1/dashboard/creator");
  }

  async getMarketOverview(): Promise<MarketOverview> {
    return this.request("/api/v1/dashboard/market");
  }
}

export const api = new ApiClient();
