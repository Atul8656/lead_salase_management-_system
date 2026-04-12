"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  downloadImportSampleCsv,
  downloadLeadsCsv,
  leadsApi,
  usersApi,
} from "@/lib/api";
import type { Lead, LeadStatus, LeadType, User } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow-up",
  "converted",
  "lost",
];

const PAGE_SIZE = 25;

export default function LeadsPage() {
  const [data, setData] = useState<{ items: Lead[]; total: number }>({
    items: [],
    total: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState("");
  const [page, setPage] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | LeadStatus>("");
  const [assignedTo, setAssignedTo] = useState("");
  const [leadType, setLeadType] = useState<"" | LeadType>("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [followUpToday, setFollowUpToday] = useState(false);

  const filters = useMemo(
    () => ({
      q: q.trim() || undefined,
      status: status || undefined,
      assigned_to: assignedTo ? parseInt(assignedTo, 10) : undefined,
      lead_type: leadType || undefined,
      created_from: createdFrom
        ? new Date(createdFrom).toISOString()
        : undefined,
      created_to: createdTo ? new Date(createdTo).toISOString() : undefined,
      overdue_only: overdueOnly || undefined,
      follow_up_today: followUpToday || undefined,
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [
      q,
      status,
      assignedTo,
      leadType,
      createdFrom,
      createdTo,
      overdueOnly,
      followUpToday,
      page,
    ]
  );

  const load = useCallback(async () => {
    try {
      const res = await leadsApi.list(filters);
      setData(res);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [filters]);

  useEffect(() => {
    usersApi
      .assignees()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function clearFilters() {
    setQ("");
    setStatus("");
    setAssignedTo("");
    setLeadType("");
    setCreatedFrom("");
    setCreatedTo("");
    setOverdueOnly(false);
    setFollowUpToday(false);
    setPage(0);
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  async function onImportFile(f: File | null) {
    if (!f) return;
    setImportMsg("Uploading…");
    try {
      const r = await leadsApi.importFile(f);
      setImportMsg(
        `Imported ${r.created} lead(s).${r.errors.length ? ` ${r.errors.slice(0, 5).join(" ")}` : ""}`
      );
      await load();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "Import failed");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Leads</h2>
          <p className="text-sm font-medium text-neutral-500">
            {data.total} record{data.total !== 1 ? "s" : ""} · filters apply instantly
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadImportSampleCsv().catch(console.error)}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          >
            Sample CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setImportOpen(true);
              setImportMsg("");
            }}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          >
            Import leads
          </button>
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

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[160px] flex-1 flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-600">Search</span>
            <input
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
              placeholder="Name, phone, email"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </label>
          <label className="flex min-w-[120px] flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-600">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setPage(0);
                setStatus(e.target.value as LeadStatus | "");
              }}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-600">Assigned</span>
            <select
              value={assignedTo}
              onChange={(e) => {
                setPage(0);
                setAssignedTo(e.target.value);
              }}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            >
              <option value="">All</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[120px] flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-600">Type</span>
            <select
              value={leadType}
              onChange={(e) => {
                setPage(0);
                setLeadType(e.target.value as LeadType | "");
              }}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            >
              <option value="">All</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </label>
          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-600">Created from</span>
            <input
              type="date"
              value={createdFrom}
              onChange={(e) => {
                setPage(0);
                setCreatedFrom(e.target.value);
              }}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </label>
          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-600">Created to</span>
            <input
              type="date"
              value={createdTo}
              onChange={(e) => {
                setPage(0);
                setCreatedTo(e.target.value);
              }}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setPage(0);
                setOverdueOnly(e.target.checked);
              }}
              className="rounded border-neutral-400"
            />
            <span className="text-sm font-semibold text-neutral-800">Overdue</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={followUpToday}
              onChange={(e) => {
                setPage(0);
                setFollowUpToday(e.target.checked);
              }}
              className="rounded border-neutral-400"
            />
            <span className="text-sm font-semibold text-neutral-800">Follow-up today</span>
          </label>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Clear filters
          </button>
        </div>
      </div>

      {importOpen && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-neutral-900">Import leads</h3>
          <p className="mt-1 text-sm text-neutral-600">
            CSV or Excel · required columns: <strong>name</strong>, <strong>phone</strong>. Optional:
            email, company_name, status, assigned_to, source, location, notes, budget.
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="mt-3 block text-sm"
            onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
          />
          {importMsg && (
            <p className="mt-2 text-sm font-medium text-neutral-800">{importMsg}</p>
          )}
          <button
            type="button"
            onClick={() => setImportOpen(false)}
            className="mt-3 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            Close
          </button>
        </div>
      )}

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
              {data.items.map((l) => {
                const overdue =
                  l.follow_up_date &&
                  new Date(l.follow_up_date) < new Date() &&
                  l.status !== "converted" &&
                  l.status !== "lost";
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
                    <td className="px-4 py-3 font-medium text-neutral-600">
                      {l.company_name ?? "—"}
                    </td>
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 px-4 py-3 text-sm">
          <span className="font-medium text-neutral-600">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-neutral-300 px-3 py-1 font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-300 px-3 py-1 font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
