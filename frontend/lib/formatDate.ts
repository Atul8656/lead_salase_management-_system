const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** e.g. 13 April 2026 4:40 PM (12-hour, local timezone, single space before time) */
export function formatAppDateTime(iso: string | Date | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = String(m).padStart(2, "0");
  return `${day} ${month} ${year} ${h}:${mm} ${ampm}`;
}

/** Start of local calendar day as ISO string (for API created_from). */
export function localDateStartISO(dateStr: string): string | undefined {
  if (!dateStr?.trim()) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

/** End of local calendar day as ISO string (for API created_to, inclusive). */
export function localDateEndISO(dateStr: string): string | undefined {
  if (!dateStr?.trim()) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

/** e.g. 13 April 2026, 4:40 PM — for remark lines */
export function formatRemarkTimestamp(iso: string | Date | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const base = formatAppDateTime(iso);
  if (base === "—") return "—";
  const parts = base.split(" ");
  if (parts.length >= 4) {
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const time = parts.slice(3).join(" ");
    return `${day} ${month} ${year}, ${time}`;
  }
  return base;
}

/** Local calendar YYYY-MM-DD for API follow_up_on */
export function localTodayYMD(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type FollowUpStatus = "OVERDUE" | "TODAY" | "PENDING";

export function getFollowUpStatus(
  iso: string | null | undefined,
  leadStatus?: string
): FollowUpStatus | null {
  if (!iso || leadStatus === "converted" || leadStatus === "lost") return null;
  
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  // Compare YYYY-MM-DD strings to ignore time
  const p = (n: number) => String(n).padStart(2, "0");
  const followDate = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const today = localTodayYMD();

  if (followDate < today) return "OVERDUE";
  if (followDate === today) return "TODAY";
  return "PENDING";
}
