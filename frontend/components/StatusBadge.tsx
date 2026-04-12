import type { LeadStatus } from "@/lib/types";

/** Soft neutrals only — readable on white, semibold labels */
const styles: Record<LeadStatus, string> = {
  new: "border border-neutral-200 bg-neutral-100 text-neutral-900",
  contacted: "border border-neutral-300 bg-neutral-200 text-neutral-900",
  interested: "border border-neutral-300 bg-neutral-100 text-neutral-900",
  "follow-up": "border border-neutral-400 bg-white text-neutral-900",
  converted: "border border-neutral-900 bg-neutral-900 text-white",
  lost: "border border-neutral-400 bg-neutral-100 text-neutral-700",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status.replace("-", " ")}
    </span>
  );
}
