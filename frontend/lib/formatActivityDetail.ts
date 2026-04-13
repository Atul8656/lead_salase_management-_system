import { formatRemarkTimestamp } from "./formatDate";

const FIELD_LABELS: Record<string, string> = {
  follow_up_date: "Follow-up date",
  company_name: "Company",
  website_url: "Website",
  linkedin_url: "LinkedIn",
  lead_type: "Lead type",
  assigned_to: "Assigned to",
  payment_amount: "Payment amount",
  payment_method: "Payment method",
  source_detail: "Source detail",
  interest: "Interest",
  description: "Description",
  notes: "Notes",
  status: "Status",
};

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function noneish(s: string): boolean {
  const t = s.trim();
  return t === "" || t.toLowerCase() === "none" || t.toLowerCase() === "null";
}

function fieldLabel(snake: string): string {
  if (FIELD_LABELS[snake]) return FIELD_LABELS[snake];
  return snake
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatShortDate(d: Date): string {
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function parseActivityDateValue(raw: string): Date | null {
  const s = raw.trim();
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  const spaced = s.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d)/, "$1T$2");
  const d2 = new Date(spaced);
  if (!Number.isNaN(d2.getTime())) return d2;
  return null;
}

/** Format a single value for activity lines; follow-up dates use calendar day only. */
function formatFieldValue(field: string, raw: string): string {
  if (noneish(raw)) return "—";
  const f = field.trim();
  if (f === "follow_up_date") {
    const d = parseActivityDateValue(raw);
    if (d) return formatShortDate(d);
  }
  const d = parseActivityDateValue(raw);
  if (d) return formatRemarkTimestamp(d.toISOString());
  return raw.trim();
}

function formatFieldChangeLine(fieldRaw: string, oldRaw: string, newRaw: string): string {
  const f = fieldRaw.trim();
  if (f === "description" && noneish(oldRaw) && !noneish(newRaw)) {
    return `Description added: ${formatFieldValue(f, newRaw)}`;
  }
  const label = fieldLabel(f);
  const oldFmt = formatFieldValue(f, oldRaw);
  const newFmt = formatFieldValue(f, newRaw);
  return `${label}: ${oldFmt} → ${newFmt}`;
}

/** "Scheduled at … | notes" from follow-up logs */
function formatScheduledPart(part: string): string | null {
  const m = part.match(/^Scheduled at\s+(.+?)(?:\s*\|\s*(.*))?$/i);
  if (!m) return null;
  const dtRaw = m[1].trim();
  const notes = (m[2] ?? "").trim();
  const d = parseActivityDateValue(dtRaw);
  const when = d ? formatRemarkTimestamp(d.toISOString()) : dtRaw;
  let out = `Scheduled for ${when}`;
  if (notes) out += `\nNote: ${notes}`;
  return out;
}

/** "Status changed from a → b" from pipeline */
function formatStatusChangedPart(part: string): string | null {
  const m = part.match(/^Status changed from\s+(.+?)\s*→\s*(.+)$/i);
  if (!m) return null;
  return `Status: ${formatFieldValue("status", m[1])} → ${formatFieldValue("status", m[2])}`;
}

/** "field: old → new" (Unicode arrow; split from last arrow so values may contain ":") */
function formatKeyArrowPart(part: string): string | null {
  const m = part.match(/^([a-z][a-z0-9_]*):\s*(.+)$/i);
  if (!m) return null;
  const key = m[1];
  const rest = m[2];
  const arrow = " → ";
  const arrowIdx = rest.lastIndexOf(arrow);
  if (arrowIdx === -1) return null;
  const oldRaw = rest.slice(0, arrowIdx);
  const newRaw = rest.slice(arrowIdx + arrow.length);
  return formatFieldChangeLine(key, oldRaw, newRaw);
}

/**
 * Turn raw activity detail strings into readable lines (one change per line).
 */
export function formatActivityDetail(rawText: string | null | undefined): string {
  if (rawText == null) return "";
  const raw = rawText.trim();
  if (!raw) return "";

  if (!raw.includes(" | ")) {
    const sched = formatScheduledPart(raw);
    if (sched) return sched;
    const st = formatStatusChangedPart(raw);
    if (st) return st;
    const one = formatKeyArrowPart(raw);
    if (one) return one;
    return raw;
  }

  const segments = raw
    .split(" | ")
    .map((s) => s.trim())
    .filter(Boolean);
  const lines: string[] = [];
  for (const seg of segments) {
    const sched = formatScheduledPart(seg);
    if (sched) {
      lines.push(sched);
      continue;
    }
    const st = formatStatusChangedPart(seg);
    if (st) {
      lines.push(st);
      continue;
    }
    const kv = formatKeyArrowPart(seg);
    if (kv) {
      lines.push(kv);
      continue;
    }
    lines.push(seg);
  }
  return lines.join("\n");
}
