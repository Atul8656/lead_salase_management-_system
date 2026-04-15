"use client";

import Link from "next/link";
import type { Lead, User } from "@/lib/types";
import { formatAppDateTime } from "@/lib/formatDate";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { coerceLeadPriority } from "@/lib/leadNormalize";

import { FollowUpBadge } from "@/components/FollowUpBadge";
import { getFollowUpStatus } from "@/lib/formatDate";

export function assigneeLabel(users: User[], assignedTo: number | null): string {
  if (assignedTo == null) return "—";
  const u = users.find((x) => x.id === assignedTo);
  return u ? u.full_name : "Unknown";
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
      <div className="flex flex-col gap-3 px-3 py-3 md:hidden">
        {items.map((l) => {
          const fuStatus = getFollowUpStatus(l.follow_up_date, l.status);
          const hot = coerceLeadPriority(l.priority) === "HOT";
          const rowBg = fuStatus === "OVERDUE" ? "bg-rose-50/30" : hot ? "bg-emerald-50/30" : "bg-white";
          
          return (
            <div 
              key={l.id} 
              className={`rounded-2xl border border-neutral-200 p-4 shadow-sm transition-all active:scale-[0.98] ${rowBg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/leads/${l.id}`} className={`${leadLinkClass} text-base`}>
                    {l.name}
                  </Link>
                  <p className="mt-1 text-[13px] font-medium text-neutral-500 line-clamp-1">
                    {l.company_name || "No company"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <PriorityBadge priority={l.priority} size="xs" />
                    <StatusBadge status={l.status} variant="solid" />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 border-t border-neutral-100 pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-neutral-400">Assigned</span>
                  <span className="font-bold text-neutral-900">{assigneeLabel(users, l.assigned_to)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-neutral-400">Follow-up</span>
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    {l.follow_up_date ? formatAppDateTime(l.follow_up_date) : "—"}
                    <FollowUpBadge status={getFollowUpStatus(l.follow_up_date, l.status)} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link 
                  href={`/leads/${l.id}`} 
                  className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-center text-xs font-black text-white shadow-md shadow-neutral-100 transition active:opacity-90"
                >
                  View Details
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
            const fuStatus = getFollowUpStatus(l.follow_up_date, l.status);
            const hot = coerceLeadPriority(l.priority) === "HOT";
            const rowBg = fuStatus === "OVERDUE"
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
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-[13px] font-medium leading-snug text-neutral-800">
                      {l.follow_up_date ? formatAppDateTime(l.follow_up_date) : "—"}
                    </span>
                    <FollowUpBadge status={fuStatus} />
                  </div>
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
