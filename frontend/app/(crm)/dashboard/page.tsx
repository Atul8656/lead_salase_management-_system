"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { downloadLeadsCsv, leadsApi, usersApi } from "@/lib/api";
import type { Lead, StatsSummary, User } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [recent, setRecent] = useState<Lead[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, listRes, profile] = await Promise.all([
        leadsApi.stats(),
        leadsApi.list({ limit: 8 }),
        usersApi.me(),
      ]);
      setStats(s);
      setRecent(listRes.items);
      setMe(profile);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const statStyles = [
    { color: "#0a0a0a" },
    { color: "#525252" },
    { color: "#737373" },
    { color: "#a3a3a3" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h2>
          {me && (
            <p className="mt-1 text-sm font-medium text-neutral-600">
              Signed in as <span className="font-semibold text-neutral-900">{me.full_name}</span>
              <span className="text-neutral-500"> · {me.email}</span>
              {me.login_id ? <span className="text-neutral-500"> · {me.login_id}</span> : null}
            </p>
          )}
          <p className="mt-1 text-sm font-medium text-neutral-500">
            Refreshes every 30s · pipeline-focused overview
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-900">
          {err}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total leads", value: stats?.total_leads ?? "—" },
          { label: "Converted", value: stats?.converted ?? "—" },
          { label: "Follow-ups today", value: stats?.followups_today ?? "—" },
          { label: "Overdue", value: stats?.overdue ?? "—" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-900">{s.value}</p>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: "65%", backgroundColor: statStyles[i].color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 glass overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <h3 className="font-bold text-neutral-900">Recent leads</h3>
            <Link href="/leads" className="app-link text-sm">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-500">
                  <th className="px-6 py-3">Lead</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recent.map((lead) => (
                  <tr key={lead.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-3">
                      <Link href={`/leads/${lead.id}`} className="app-link font-semibold">
                        {lead.name}
                      </Link>
                      <div className="text-xs font-medium text-neutral-500">{lead.company_name ?? "—"}</div>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-neutral-500">
                      {timeAgo(lead.updated_at || lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="font-bold text-neutral-900">Quick links</h3>
          <ul className="mt-4 space-y-3 text-sm font-medium">
            <li>
              <Link href="/pipeline" className="app-link">
                Open pipeline board
              </Link>
            </li>
            <li>
              <Link href="/follow-ups" className="app-link">
                Overdue follow-ups
              </Link>
            </li>
            <li>
              <Link href="/team" className="app-link">
                Team &amp; assignees
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
