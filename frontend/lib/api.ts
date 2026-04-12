import type { ActivityItem, FollowUp, Lead, StatsSummary, User } from "./types";

/**
 * If NEXT_PUBLIC_API_URL is set → call that host directly.
 * If empty/unset → use same-origin `/api/...` (Next.js rewrites to BACKEND_PROXY_URL, default :8000).
 */
function getApiBase(): string {
  const v = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (v) return v.replace(/\/$/, "");
  return "";
}

/** Full URL or path for fetch, e.g. /api/auth/login */
function apiUrl(apiPath: string): string {
  const base = getApiBase();
  if (base) return `${base}${apiPath}`;
  return apiPath;
}

function explainNetworkError(): Error {
  return new Error(
    "Cannot reach the API. Start the backend: cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"
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
  const res = await safeFetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<UserRegisteredResponse>;
}

export const leadsApi = {
  list: () => api<Lead[]>("/api/leads/"),
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
  stats: () => api<StatsSummary>("/api/leads/stats/summary"),
  overdue: () => api<Lead[]>("/api/leads/overdue"),
};

export const usersApi = {
  me: () => api<User>("/api/users/me"),
  assignees: () => api<User[]>("/api/users/assignees"),
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

/** Resolved API base for debugging (empty = using Next proxy) */
export const API = getApiBase() || "/api (proxied to backend :8000)";
