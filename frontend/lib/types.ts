export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow-up"
  | "converted"
  | "lost";

export type LeadType = "inbound" | "outbound";

export type LeadPriority = "hot" | "warm" | "cold";

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  location: string | null;
  source: string | null;
  source_detail: string | null;
  lead_type: LeadType;
  status: LeadStatus;
  assigned_to: number | null;
  interest: string | null;
  budget: string | null;
  timeline: string | null;
  description: string | null;
  notes: string | null;
  priority?: LeadPriority | null;
  payment_amount: number;
  payment_method: string | null;
  follow_up_date: string | null;
  last_contacted: string | null;
  follow_up_count: number;
  converted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface LeadRemark {
  id: number;
  lead_id: number;
  user_id: number;
  user_name?: string | null;
  body: string;
  created_at: string;
}

export interface ActivityItem {
  id: number;
  lead_id: number;
  user_id: number;
  user_name?: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

export interface User {
  id: number;
  login_id: string | null;
  member_id?: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  phone?: string | null;
  /** Public image URL for profile avatar; optional. */
  avatar_url?: string | null;
  created_at?: string | null;
}

export interface MemberCreatedResponse extends User {
  generated_password: string;
}

export interface NextMemberIdResponse {
  next_member_id: string;
}

export interface FollowUp {
  id: number;
  lead_id: number;
  user_id: number;
  scheduled_at: string;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface StatsSummary {
  total_leads: number;
  status_summary: Record<string, number>;
  converted: number;
  followups_today?: number;
  overdue?: number;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
}
