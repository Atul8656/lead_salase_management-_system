export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow-up"
  | "converted"
  | "not_interested";

export type LeadType = "inbound" | "outbound";

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
  notes: string | null;
  payment_amount: number;
  payment_method: string | null;
  follow_up_date: string | null;
  last_contacted: string | null;
  follow_up_count: number;
  converted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ActivityItem {
  id: number;
  lead_id: number;
  user_id: number;
  action: string;
  details: string | null;
  created_at: string;
}

export interface User {
  id: number;
  login_id: string | null;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
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
}
