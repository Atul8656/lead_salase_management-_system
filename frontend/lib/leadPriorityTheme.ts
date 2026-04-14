import type { LeadPriority } from "@/lib/types";

/**
 * Single source for priority colors — pipeline cards + lead table badges match.
 * Hot: green accent (same as pipeline left border / label).
 */
export const LEAD_PRIORITY: Record<
  NonNullable<LeadPriority>,
  {
    label: string;
    /** Text, dot, and pipeline left accent */
    accent: string;
    /** Light pill background for tables/cards */
    badgeBg: string;
    badgeBorder: string;
  }
> = {
  HOT: {
    label: "HOT",
    accent: "#60B523",
    badgeBg: "#EFFAE6",
    badgeBorder: "rgba(96, 181, 35, 0.42)",
  },
  WARM: {
    label: "WARM",
    accent: "#DCD354",
    badgeBg: "#FEFCE8",
    badgeBorder: "rgba(220, 211, 84, 0.55)",
  },
  COLD: {
    label: "COLD",
    accent: "#CC652E",
    badgeBg: "#FFF4EC",
    badgeBorder: "rgba(204, 101, 46, 0.45)",
  },
};
