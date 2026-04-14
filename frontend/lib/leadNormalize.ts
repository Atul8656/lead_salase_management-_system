import type { Lead, LeadPriority, LeadStatus, LeadType } from "@/lib/types";

/** Normalize API/CSV/DB values to canonical priority (lowercase). */
export function coerceLeadPriority(
  raw: string | LeadPriority | null | undefined
): LeadPriority | null {
  if (raw == null) return null;
  const x = String(raw).trim().toUpperCase();
  if (!x || x === "NONE" || x === "NULL") return null;
  if (x === "HOT" || x === "HIGH" || x === "URGENT") return "HOT";
  if (x === "WARM" || x === "MEDIUM") return "WARM";
  if (x === "COLD" || x === "LOW") return "COLD";
  return null;
}

export function coerceLeadStatus(raw: string): LeadStatus {
  const x = String(raw).toLowerCase().replace(/_/g, "-");
  const map: Record<string, LeadStatus> = {
    new: "new",
    contacted: "contacted",
    interested: "interested",
    "follow-up": "follow-up",
    followup: "follow-up",
    converted: "converted",
    lost: "lost",
  };
  return (map[x] ?? "new") as LeadStatus;
}

export function coerceLeadType(raw: string): LeadType {
  const x = String(raw).toLowerCase();
  if (x === "outbound") return "outbound";
  return "inbound";
}

export function normalizeLead(l: Lead): Lead {
  return {
    ...l,
    status: coerceLeadStatus(l.status as unknown as string),
    lead_type: coerceLeadType(l.lead_type as unknown as string),
    priority: coerceLeadPriority(l.priority as string | null | undefined),
  };
}
