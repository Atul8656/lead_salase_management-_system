import type { LeadStatus } from "@/lib/types";

/** CRM-style pills: converted green, follow-up orange, lost red, others neutral. */
const styles: Record<LeadStatus, string> = {
  new: "border border-neutral-200 bg-neutral-100 text-neutral-800",
  contacted: "border border-sky-200 bg-sky-50 text-sky-900",
  interested: "border border-amber-200 bg-amber-50 text-amber-900",
  "follow-up": "border border-orange-300 bg-orange-50 text-orange-900",
  converted: "border border-emerald-600 bg-emerald-600 text-white",
  lost: "border border-red-300 bg-red-50 text-red-800",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}
