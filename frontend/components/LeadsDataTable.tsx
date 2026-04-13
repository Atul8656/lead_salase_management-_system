"use client";

import Link from "next/link";
import type { Lead, User } from "@/lib/types";
import { formatAppDateTime } from "@/lib/formatDate";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { coerceLeadPriority } from "@/lib/leadNormalize";

export function assigneeLabel(users: User[], assignedTo: number | null): string {
  if (assignedTo == null) return "—";
  const u = users.find((x) => x.id === assignedTo);
  return u ? `${u.full_name}` : `#${assignedTo}`;
}

function isOverdue(lead: Lead): boolean {
  return Boolean(
    lead.follow_up_date &&
      new Date(lead.follow_up_date) < new Date() &&
      lead.status !== "converted" &&
      lead.status !== "lost"
  );
}

const leadLinkClass =
  "font-bold text-neutral-900 underline decoration-neutral-400 underline-offset-[3px] transition hover:decoration-neutral-900";

type Props = {
  items: Lead[];
  users: User[];
  emptyMessage?: string;
};

export default function LeadsDataTable({
  items,
  users,
  emptyMessage = "No leads match these filters.",
}: Props) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm font-medium text-neutral-500">{emptyMessage}</p>
    );
  }

  return (
    <div>
      <div className="divide-y divide-neutral-200 md:hidden">
        {items.map((l) => {
          const overdue = isOverdue(l);
          const hot = coerceLeadPriority(l.priority) === "hot";
          const rowBg = overdue ? "bg-rose-50/50" : hot ? "bg-emerald-50/50" : "bg-white";
          return (
            <div key={l.id} className={`px-4 py-4 ${rowBg}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/leads/${l.id}`} className={leadLinkClass}>
                    {l.name}
                  </Link>
                  <p className="mt-1 text-xs font-medium text-neutral-500">
                    {[l.company_name, l.phone, l.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <PriorityBadge priority={l.priority} size="xs" />
                  <StatusBadge status={l.status} variant="solid" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                <span>
                  <span className="font-semibold text-neutral-700">Assigned:</span>{" "}
                  {assigneeLabel(users, l.assigned_to)}
                </span>
                <span>
                  <span className="font-semibold text-neutral-700">Follow-up:</span>{" "}
                  {l.follow_up_date ? formatAppDateTime(l.follow_up_date) : "—"}
                  {overdue && (
                    <span className="ml-1 font-bold text-red-600">Overdue</span>
                  )}
                </span>
              </div>
              <div className="mt-2">
                <Link href={`/leads/${l.id}`} className={`${leadLinkClass} text-sm`}>
                  Open lead
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50/90">
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Name
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Company
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Email
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Phone
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Priority
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Status
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Assigned
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Created
            </th>
            <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-neutral-600">
              Follow-up
            </th>
            <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-neutral-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {items.map((l) => {
            const overdue = isOverdue(l);
            const hot = coerceLeadPriority(l.priority) === "hot";
            const rowBg = overdue
              ? "bg-rose-50/50"
              : hot
                ? "bg-emerald-50/50"
                : "bg-white";
            return (
              <tr
                key={l.id}
                className={`transition-colors hover:bg-neutral-50/90 ${rowBg}`}
              >
                <td className="px-4 py-4 align-top">
                  <Link href={`/leads/${l.id}`} className={leadLinkClass}>
                    {l.name}
                  </Link>
                </td>
                <td className="px-4 py-4 align-top font-medium text-neutral-800">
                  {l.company_name ?? "—"}
                </td>
                <td className="px-4 py-4 align-top font-medium text-neutral-800 break-all">
                  {l.email ?? "—"}
                </td>
                <td className="px-4 py-4 align-top font-medium text-neutral-800 whitespace-nowrap">
                  {l.phone ?? "—"}
                </td>
                <td className="px-4 py-4 align-top">
                  <PriorityBadge priority={l.priority} size="xs" />
                </td>
                <td className="px-4 py-4 align-top">
                  <StatusBadge status={l.status} variant="solid" />
                </td>
                <td className="px-4 py-4 align-top font-medium text-neutral-800">
                  {assigneeLabel(users, l.assigned_to)}
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="block max-w-[158px] text-[13px] leading-snug font-medium text-neutral-800">
                    {formatAppDateTime(l.created_at)}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="text-[13px] font-medium leading-snug text-neutral-800">
                    {l.follow_up_date ? formatAppDateTime(l.follow_up_date) : "—"}
                    {overdue && (
                      <>
                        {" "}
                        <span className="font-bold text-red-600">Overdue</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-right">
                  <Link href={`/leads/${l.id}`} className={`${leadLinkClass} text-sm`}>
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
