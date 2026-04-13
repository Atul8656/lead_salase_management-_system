"use client";

import Link from "next/link";
import type { Lead, User } from "@/lib/types";
import { formatAppDateTime } from "@/lib/formatDate";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";

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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-500">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Assigned</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Follow-up</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {items.map((l) => {
            const overdue = isOverdue(l);
            return (
              <tr
                key={l.id}
                className={`hover:bg-neutral-50 ${overdue ? "bg-red-50/80" : ""}`}
              >
                <td className="px-4 py-3 font-semibold text-neutral-900">
                  <Link href={`/leads/${l.id}`} className="app-link">
                    {l.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium text-neutral-600">{l.company_name ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-neutral-600">{l.email ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-neutral-600">{l.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={l.priority} size="xs" />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={l.status} />
                </td>
                <td className="px-4 py-3 font-medium text-neutral-600">
                  {assigneeLabel(users, l.assigned_to)}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-600">
                  {formatAppDateTime(l.created_at)}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-600">
                  {l.follow_up_date ? formatAppDateTime(l.follow_up_date) : "—"}
                  {overdue && (
                    <span className="ml-2 text-xs font-bold text-red-700">Overdue</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/leads/${l.id}`} className="app-link text-sm">
                    Open
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
