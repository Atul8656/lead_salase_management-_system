import type {
  ActivityItem,
  FollowUp,
  Lead,
  LeadListResponse,
  LeadRemark,
  MemberCreatedResponse,
  NextMemberIdResponse,
  StatsSummary,
  User,
} from "./types";

export type LeadListParams = {
  skip?: number;
  limit?: number;
  q?: string;
  status?: string;
  assigned_to?: number;
  lead_type?: string;
  source?: string;
  created_from?: string;
  created_to?: string;
  overdue_only?: boolean;
  /** Local calendar date YYYY-MM-DD — follow-up scheduled this day */
  follow_up_on?: string;
};

function buildLeadQuery(params?: LeadListParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  (Object.entries(params) as [string, string | number | boolean | undefined][]).forEach(
    ([k, v]) => {
      if (v === undefined || v === "") return;
      if (typeof v === "boolean") {
        if (v) sp.set(k, "true");
        return;
      }
      sp.set(k, String(v));
    }
  );
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/** Default when no public env is set (local uvicorn). */
const DEFAULT_API_BASE = "http://127.0.0.1:8000";

/**
 * Resolve API origin for browser fetch:
 * - NEXT_PUBLIC_API_URL or REACT_APP_API_URL (see next.config env) → use that (e.g. Cloudflare tunnel)
 * - else → http://127.0.0.1:8000
 */
function getApiBase(): string {
  const v =
    process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.REACT_APP_API_URL?.trim();
  if (v) return v.replace(/\/$/, "");
  return DEFAULT_API_BASE.replace(/\/$/, "");
}

let apiBaseLogged = false;
function logApiBaseOnce(): void {
  if (typeof window === "undefined" || apiBaseLogged) return;
  apiBaseLogged = true;
  const base = getApiBase();
  const source = process.env.NEXT_PUBLIC_API_URL?.trim()
    ? "NEXT_PUBLIC_API_URL"
    : process.env.REACT_APP_API_URL?.trim()
      ? "REACT_APP_API_URL"
      : `default (${DEFAULT_API_BASE})`;
  console.info(`[SALENLO] API base URL: ${base} (from ${source})`);
}

/** Full URL or path for fetch, e.g. /api/auth/login */
function apiUrl(apiPath: string): string {
  const base = getApiBase();
  if (base) return `${base}${apiPath}`;
  return apiPath;
}

function explainNetworkError(): Error {
  return new Error(
    "Cannot reach the server. Check your connection and try again."
  );
}

async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (e) {
    if (e instanceof TypeError) {
      throw explainNetworkError();
    }
    throw e;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (j.detail) {
      if (Array.isArray(j.detail))
        return j.detail.map((d: { msg?: string }) => d.msg).join(", ");
      return String(j.detail);
    }
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed";
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  logApiBaseOnce();
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (
    !headers["Content-Type"] &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await safeFetch(apiUrl(path), { ...options, headers });
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(await parseError(res));
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) return res.json() as Promise<T>;
  return undefined as T;
}

export async function loginRequest(usernameOrEmail: string, password: string) {
  logApiBaseOnce();
  const body = new URLSearchParams();
  body.set("username", usernameOrEmail);
  body.set("password", password);
  const res = await safeFetch(apiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export interface UserRegisteredResponse {
  id: number;
  login_id: string | null;
  member_id?: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  generated_password: string;
}

export async function registerRequest(payload: {
  email: string;
  full_name: string;
}): Promise<UserRegisteredResponse> {
  logApiBaseOnce();
  const res = await safeFetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<UserRegisteredResponse>;
}

export const leadsApi = {
  list: (params?: LeadListParams) =>
    api<LeadListResponse>(`/api/leads/${buildLeadQuery(params)}`),
  get: (id: number) => api<Lead>(`/api/leads/${id}`),
  create: (body: Record<string, unknown>) =>
    api<Lead>("/api/leads/", { method: "POST", body: JSON.stringify(body) }),
  patch: (id: number, body: Record<string, unknown>) =>
    api<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/leads/${id}`, { method: "DELETE" }),
  pipeline: (id: number, body: Record<string, unknown>) =>
    api<Lead>(`/api/leads/${id}/pipeline`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  activities: (id: number) =>
    api<ActivityItem[]>(`/api/leads/${id}/activities`),
  remarks: (id: number) => api<LeadRemark[]>(`/api/leads/${id}/remarks`),
  addRemark: (id: number, body: string, createdAt?: string) =>
    api<LeadRemark>(`/api/leads/${id}/remarks`, {
      method: "POST",
      body: JSON.stringify({ body, created_at: createdAt }),
    }),
  stats: () => api<StatsSummary>("/api/leads/stats/summary"),
  overdue: () => api<Lead[]>("/api/leads/overdue"),
  importFile: (file: File, mode: string = "skip") => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ 
      total: number;
      success: number; 
      updated: number; 
      failed: number; 
      errors: string[];
    }>(`/api/leads/import?mode=${mode}`, {
      method: "POST",
      body: fd,
    });
  },
};

export const usersApi = {
  me: () => api<User>("/api/users/me"),
  patchMe: (body: Record<string, unknown>) =>
    api<User>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),
  assignees: () => api<User[]>("/api/users/assignees"),
  nextMemberId: () => api<NextMemberIdResponse>("/api/users/members/next-id"),
  createMember: (body: {
    first_name: string;
    last_name: string;
    surname?: string;
    email: string;
    phone: string;
  }) =>
    api<MemberCreatedResponse>("/api/users/members", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getMember: (id: number) => api<User>(`/api/users/members/${id}`),
  patchMember: (id: number, body: Record<string, unknown>) =>
    api<User>(`/api/users/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

export const followupsApi = {
  mine: () => api<FollowUp[]>("/api/followups/my"),
  create: (body: { lead_id: number; scheduled_at: string; notes?: string }) =>
    api<FollowUp>("/api/followups/", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export async function downloadLeadsCsv() {
  logApiBaseOnce();
  const token = getToken();
  const res = await safeFetch(apiUrl("/api/leads/export/csv"), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await parseError(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads_export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Resolved API base (same logic as fetch). */
export const API = getApiBase();
