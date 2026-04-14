"use client";

import { FollowUpStatus } from "@/lib/formatDate";

const THEMES: Record<FollowUpStatus, { bg: string; text: string; label: string; border: string }> = {
  OVERDUE: {
    bg: "#FEF2F2", // Red-50
    text: "#B91C1C", // Red-700
    border: "rgba(185, 28, 28, 0.2)",
    label: "OVERDUE",
  },
  TODAY: {
    bg: "#F0FDF4", // Green-50
    text: "#15803D", // Green-700
    border: "rgba(21, 128, 61, 0.2)",
    label: "DUE TODAY",
  },
  PENDING: {
    bg: "#FFFBEB", // Amber-50
    text: "#B45309", // Amber-700
    border: "rgba(180, 83, 9, 0.2)",
    label: "PENDING",
  },
};

export function FollowUpBadge({ status }: { status: FollowUpStatus | null }) {
  if (!status) return null;
  const t = THEMES[status];

  return (
    <span
      className="inline-flex items-center rounded-lg border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-sm"
      style={{
        backgroundColor: t.bg,
        color: t.text,
        borderColor: t.border,
      }}
    >
      {status === "TODAY" && (
         <span className="mr-1 h-1 w-1 rounded-full bg-current animate-pulse ring-1 ring-current/30" />
      )}
      {t.label}
    </span>
  );
}
