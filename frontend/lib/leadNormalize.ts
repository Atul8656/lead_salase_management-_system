import type { Lead, LeadStatus, LeadType } from "@/lib/types";

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
  };
}
