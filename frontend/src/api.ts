import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach stored token if present
const tokenKey = "cypadi_admin_token";

export function setAuthToken(token: string) {
  localStorage.setItem(tokenKey, token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

const existing = localStorage.getItem(tokenKey);
if (existing) {
  api.defaults.headers.common.Authorization = `Bearer ${existing}`;
}

export interface ChatQueryRequest {
  conversation_id?: number;
  message: string;
  language_hint?: string;
}

export interface ChatQueryResponse {
  conversation_id: number;
  reply: string;
  confidence: number;
  intent?: string;
  actions: string[];
}

export interface KBArticle {
  id: number;
  title: string;
  slug: string;
  language: string;
  body_markdown: string;
  tags?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  updated_by_user_id: number;
  version: number;
}

export interface AnalyticsOverview {
  total_conversations: number;
  automated_resolution_rate: number;
  average_resolution_time_minutes: number;
  top_intents: { intent: string; count: number }[];
}

export interface Ticket {
  id: number;
  external_ticket_id: string;
  user_id: number;
  source: string;
  status: string;
  priority?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserMe {
  id: number;
  username: string;
  email?: string | null;
  display_name?: string | null;
  department?: string | null;
  locale: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: string[];
}

export const chatApi = {
  async query(payload: ChatQueryRequest): Promise<ChatQueryResponse> {
    const res = await api.post<ChatQueryResponse>("/chat/query", payload);
    return res.data;
  },
};

export const kbApi = {
  async listArticles(params?: { query?: string; language?: string; tag?: string }): Promise<KBArticle[]> {
    const res = await api.get<KBArticle[]>("/kb/articles", { params });
    return res.data;
  },
};

export const analyticsApi = {
  async getOverview(): Promise<AnalyticsOverview> {
    const res = await api.get<AnalyticsOverview>("/analytics/overview");
    return res.data;
  },
};

export const ticketsApi = {
  async listTickets(): Promise<Ticket[]> {
    const res = await api.get<Ticket[]>("/tickets/");
    return res.data;
  },
};

export const authApi = {
  async login(email: string, password: string): Promise<string> {
    const res = await api.post<TokenResponse>("/auth/login", { email, password });
    setAuthToken(res.data.access_token);
    return res.data.access_token;
  },
  async me(): Promise<UserMe> {
    const res = await api.get<UserMe>("/auth/me");
    return res.data;
  },
  logout() {
    localStorage.removeItem(tokenKey);
    delete api.defaults.headers.common.Authorization;
  },
};

