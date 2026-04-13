import type { LeadPriority } from "@/lib/types";
import { coerceLeadPriority } from "@/lib/leadNormalize";
import { LEAD_PRIORITY } from "@/lib/leadPriorityTheme";

export function PriorityBadge({
  priority,
  size = "sm",
}: {
  priority: LeadPriority | null | undefined;
  size?: "sm" | "xs";
}) {
  const p = coerceLeadPriority(priority);
  if (!p || !(p in LEAD_PRIORITY)) return null;
  const t = LEAD_PRIORITY[p];
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wide ${pad}`}
      style={{
        backgroundColor: t.badgeBg,
        color: t.accent,
        borderColor: t.badgeBorder,
      }}
    >
      {p === "hot" && (
        <span
          className="inline-block size-1.5 shrink-0 rounded-full opacity-95"
          style={{ backgroundColor: t.accent }}
          aria-hidden
        />
      )}
      {t.label}
    </span>
  );
}
