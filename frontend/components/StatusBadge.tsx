import type { LeadStatus } from "@/lib/types";

/** Default soft pills (borders + light fills). */
const softStyles: Record<LeadStatus, string> = {
  new: "border border-zinc-200/80 bg-zinc-100 text-zinc-800 dark:border-zinc-600/50 dark:bg-zinc-800/80 dark:text-zinc-200",
  contacted:
    "border border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/60 dark:text-sky-200",
  interested:
    "border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-200",
  "follow-up":
    "border border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/30 dark:bg-orange-950/50 dark:text-orange-200",
  converted:
    "border border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600",
  lost: "border border-red-200 bg-red-50 text-red-800 dark:border-red-500/35 dark:bg-red-950/45 dark:text-red-200",
};

/** Solid pills — white label on semantic fill (leads table / data-dense UI). */
const solidStyles: Record<LeadStatus, string> = {
  new: "border-0 bg-zinc-500 text-white",
  contacted: "border-0 bg-slate-500 text-white",
  interested: "border-0 bg-amber-700 text-white",
  "follow-up": "border-0 bg-orange-600 text-white",
  converted: "border-0 bg-emerald-600 text-white",
  lost: "border-0 bg-red-600 text-white",
};

export function StatusBadge({
  status,
  variant = "soft",
}: {
  status: LeadStatus;
  variant?: "soft" | "solid";
}) {
  const styles = variant === "solid" ? solidStyles : softStyles;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}
