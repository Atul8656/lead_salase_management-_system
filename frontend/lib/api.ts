import type {
  ActivityItem,
  FollowUp,
  Lead,
  LeadListResponse,
  LeadRemark,
  MemberCreatedResponse,
  NextMemberIdResponse,
  StatsSummary,
  Todo,
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

/** Localhost fallback if environment variables are missing. */
const DEFAULT_API_BASE =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "https://lead-salal-management.onrender.com";

/**
 * Resolve API origin for browser fetch:
 * - NEXT_PUBLIC_API_URL or REACT_APP_API_URL → absolute origin (e.g. https://….onrender.com)
 * - "/", empty, or unset → relative paths (same origin; Next/Netlify rewrites if configured)
 * Trailing slashes are stripped so paths like /api/... join correctly.
 */
function getApiBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL?.trim() || 
    process.env.REACT_APP_API_URL?.trim() || 
    DEFAULT_API_BASE;
  
  // Strip trailing slash
  return raw.replace(/\/$/, "");
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
  console.info(
    `[SALENLO] API base URL: ${base || "(relative — same origin)"} (from ${source}). ` +
      "NEXT_PUBLIC_* is inlined at build time; set it in Netlify env before `npm run build`."
  );
}

/** Full URL or path for fetch, e.g. /api/auth/login */
function apiUrl(apiPath: string): string {
  const base = getApiBase();
  if (base) return `${base}${apiPath}`;
  return apiPath;
}

/** Absolute URL string for logging and fetch (relative paths use current origin in the browser). */
function resolveFetchUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined") return new URL(url, window.location.origin).href;
  return url;
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
  const path = "/api/auth/login";
  const url = apiUrl(path);
  const fullUrl = resolveFetchUrl(url);

  console.log("[SALENLO] login — API base (NEXT_PUBLIC_API_URL):", getApiBase() || "(empty → same-origin)");
  console.log("[SALENLO] login — full request URL:", fullUrl);

  const body = new URLSearchParams();
  body.set("username", usernameOrEmail);
  body.set("password", password);

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (e) {
    console.error("[SALENLO] login — fetch error:", e);
    if (e instanceof TypeError) throw explainNetworkError();
    throw e;
  }

  console.log("[SALENLO] login — response status:", res.status, res.statusText);
  if (!res.ok) {
    const msg = await parseError(res);
    console.error("[SALENLO] login — error detail:", msg);
    throw new Error(msg);
  }
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
  logApiBaseOnce();
  const res = await safeFetch(apiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<UserRegisteredResponse>;
}

export async function sendOtpRequest(payload: {
  email: string;
}): Promise<{ message: string }> {
  logApiBaseOnce();
  const res = await safeFetch(apiUrl("/api/auth/send-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ message: string }>;
}

export async function verifyOtpRequest(payload: {
  email: string;
  otp: string;
  full_name: string;
}): Promise<{ message: string }> {
  logApiBaseOnce();
  const res = await safeFetch(apiUrl("/api/auth/verify-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ message: string }>;
}

export async function forgotPasswordSendOtpRequest(payload: {
  email: string;
}): Promise<{ message: string }> {
  logApiBaseOnce();
  const res = await safeFetch(apiUrl("/api/auth/forgot-password/send-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ message: string }>;
}

export async function forgotPasswordResetRequest(payload: {
  email: string;
  otp: string;
  new_password: string;
}): Promise<{ message: string }> {
  logApiBaseOnce();
  const res = await safeFetch(apiUrl("/api/auth/forgot-password/reset"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ message: string }>;
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
  complete: (id: number) =>
    api<FollowUp>(`/api/followups/${id}/complete`, { method: "POST" }),
};

export const todosApi = {
  list: () => api<Todo[]>("/api/todos"),
  create: (body: { title: string }) =>
    api<Todo>("/api/todos", { method: "POST", body: JSON.stringify(body) }),
  patch: (id: number, body: Partial<{ title: string; is_completed: boolean; is_deleted: boolean }>) =>
    api<Todo>(`/api/todos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: number) => api(`/api/todos/${id}`, { method: "DELETE" }),
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
