import type { LeadPriority } from "@/lib/types";

const styles: Record<NonNullable<LeadPriority>, { bg: string; text: string; label: string }> = {
  hot: { bg: "#FCEBEB", text: "#A32D2D", label: "HOT" },
  warm: { bg: "#FAEEDA", text: "#854F0B", label: "WARM" },
  cold: { bg: "#E6F1FB", text: "#185FA5", label: "COLD" },
};

export function PriorityBadge({
  priority,
  size = "sm",
}: {
  priority: LeadPriority | null | undefined;
  size?: "sm" | "xs";
}) {
  if (!priority || !(priority in styles)) return null;
  const s = styles[priority as NonNullable<LeadPriority>];
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide ${pad}`}
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {priority === "hot" && (
        <span className="inline-block h-1.5 w-1.5 rounded-sm bg-current opacity-90" aria-hidden />
      )}
      {s.label}
    </span>
  );
}
