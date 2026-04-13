"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { downloadLeadsCsv, leadsApi, usersApi } from "@/lib/api";
import type { Lead, LeadListParams, StatsSummary, User } from "@/lib/types";
import { localTodayYMD } from "@/lib/formatDate";
import { StatusBadge } from "@/components/StatusBadge";
import { formatAppDateTime } from "@/lib/formatDate";
import LeadsPanelModal from "@/components/LeadsPanelModal";

function memberLabel(u: { member_id?: string; id: number }) {
  return u.member_id ?? `M${String(u.id).padStart(3, "0")}`;
}

type StatModal = null | "all" | "converted" | "followups_today" | "overdue";

const MODAL_FETCH_LIMIT = 1000;

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [recent, setRecent] = useState<Lead[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<StatModal>(null);
  const [modalLeads, setModalLeads] = useState<Lead[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalErr, setModalErr] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, listRes, profile, assignees] = await Promise.all([
        leadsApi.stats(),
        leadsApi.list({ limit: 8 }),
        usersApi.me(),
        usersApi.assignees(),
      ]);
      setStats(s);
      setRecent(listRes.items);
      setMe(profile);
      setUsers(assignees);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- initial load + polling */
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function closeStatModal() {
    setModal(null);
    setModalLeads([]);
    setModalErr("");
    setModalLoading(false);
  }

  /* eslint-disable react-hooks/set-state-in-effect -- modal fetch lifecycle */
  useEffect(() => {
    if (!modal) return;
    let cancelled = false;
    const params: LeadListParams = { skip: 0, limit: MODAL_FETCH_LIMIT };
    if (modal === "converted") params.status = "converted";
    if (modal === "followups_today") params.follow_up_on = localTodayYMD();
    if (modal === "overdue") params.overdue_only = true;

    setModalLoading(true);
    setModalErr("");
    leadsApi
      .list(params)
      .then((res) => {
        if (!cancelled) setModalLeads(res.items);
      })
      .catch((e) => {
        if (!cancelled)
          setModalErr(e instanceof Error ? e.message : "Failed to load leads");
      })
      .finally(() => {
        if (!cancelled) setModalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const statStyles = [
    { color: "#0a0a0a" },
    { color: "#525252" },
    { color: "#737373" },
    { color: "#a3a3a3" },
  ];

  const statCards: {
    label: string;
    value: string | number;
    key: StatModal;
    title: string;
  }[] = [
    { label: "Total leads", value: stats?.total_leads ?? "—", key: "all", title: "All leads" },
    { label: "Converted", value: stats?.converted ?? "—", key: "converted", title: "Converted leads" },
    {
      label: "Follow-ups today",
      value: stats?.followups_today ?? "—",
      key: "followups_today",
      title: "Follow-ups due today",
    },
    { label: "Overdue", value: stats?.overdue ?? "—", key: "overdue", title: "Overdue follow-ups" },
  ];

  const modalTitle = statCards.find((c) => c.key === modal)?.title ?? "Leads";

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      <LeadsPanelModal
        title={modalTitle}
        open={modal !== null}
        onClose={closeStatModal}
        items={modalLeads}
        users={users}
        loading={modalLoading}
        err={modalErr}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h2>
          {me && (
            <p className="mt-1 text-sm font-medium text-neutral-600">
              Signed in as <span className="font-semibold text-neutral-900">{me.full_name}</span>
              <span className="text-neutral-500"> · {me.email}</span>
              <span className="text-neutral-500"> · {memberLabel(me)}</span>
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
        {statCards.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setModalLeads([]);
              setModalErr("");
              setModal(s.key);
            }}
            className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition hover:border-neutral-400 hover:shadow-md focus-visible:outline focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-neutral-900">{s.value}</p>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: "65%", backgroundColor: statStyles[i].color }}
              />
            </div>
          </button>
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
                      {formatAppDateTime(lead.updated_at || lead.created_at)}
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
