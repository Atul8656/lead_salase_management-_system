"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { downloadLeadsCsv, leadsApi } from "@/lib/api";
import type { Lead } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setLeads(await leadsApi.list());
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 25000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Leads</h2>
          <p className="text-sm font-medium text-neutral-500">All records · auto-refresh ~25s</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => downloadLeadsCsv().catch(console.error)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          >
            Export CSV
          </button>
          <Link
            href="/leads/new"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Add lead
          </Link>
        </div>
      </div>

      {err && (
        <p className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 text-sm font-medium text-neutral-800">
          {err}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Follow-up</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {leads.map((l) => {
                const overdue =
                  l.follow_up_date &&
                  new Date(l.follow_up_date) < new Date() &&
                  l.status !== "converted" &&
                  l.status !== "not_interested";
                return (
                  <tr
                    key={l.id}
                    className={`hover:bg-neutral-50 ${overdue ? "bg-neutral-100/80" : ""}`}
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
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-600">
                      {l.follow_up_date
                        ? new Date(l.follow_up_date).toLocaleString()
                        : "—"}
                      {overdue && (
                        <span className="ml-2 text-xs font-bold text-neutral-900">Overdue</span>
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
      </div>
    </div>
  );
}
