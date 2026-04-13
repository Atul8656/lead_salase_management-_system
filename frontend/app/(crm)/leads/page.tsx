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
import { formatAppDateTime, localDateEndISO, localDateStartISO, localTodayYMD } from "@/lib/formatDate";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { assigneeLabel } from "@/components/LeadsDataTable";

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow-up",
  "converted",
  "lost",
];

const PAGE_SIZE = 25;

function parseCsvPreview(text: string, maxRows: number) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return { headers: [] as string[], rows: [] as string[][] };
  const split = (line: string) => {
    const out: string[] = [];
    let field = "";
    let inQ = false;
    for (let i = 0; i <= line.length; i++) {
      const c = line[i];
      if (c === undefined) {
        out.push(field.trim());
        break;
      }
      if (c === '"') {
        inQ = !inQ;
        continue;
      }
      if (!inQ && c === ",") {
        out.push(field.trim());
        field = "";
        continue;
      }
      field += c;
    }
    return out;
  };
  const headers = split(lines[0]!);
  const rows = lines.slice(1, 1 + maxRows).map((ln) => split(ln));
  return { headers, rows };
}

function leadIsOverdue(l: Lead): boolean {
  return Boolean(
    l.follow_up_date &&
      new Date(l.follow_up_date) < new Date() &&
      l.status !== "converted" &&
      l.status !== "lost"
  );
}

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
  const [importPreview, setImportPreview] = useState<{
    headers: string[];
    rows: string[][];
  } | null>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<"" | LeadStatus>("");
  const [assignedTo, setAssignedTo] = useState("");
  const [leadType, setLeadType] = useState<"" | LeadType>("");
  const [source, setSource] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [followUpToday, setFollowUpToday] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const filters = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status: status || undefined,
      assigned_to: assignedTo ? parseInt(assignedTo, 10) : undefined,
      lead_type: leadType || undefined,
      source: source.trim() || undefined,
      created_from: localDateStartISO(createdFrom),
      created_to: localDateEndISO(createdTo),
      overdue_only: overdueOnly || undefined,
      follow_up_on: followUpToday ? localTodayYMD() : undefined,
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    [
      debouncedQ,
      status,
      assignedTo,
      leadType,
      source,
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

  /* eslint-disable react-hooks/set-state-in-effect -- refetch when filters change */
  useEffect(() => {
    load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function clearFilters() {
    setQ("");
    setDebouncedQ("");
    setStatus("");
    setAssignedTo("");
    setLeadType("");
    setSource("");
    setCreatedFrom("");
    setCreatedTo("");
    setOverdueOnly(false);
    setFollowUpToday(false);
    setPage(0);
  }

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (debouncedQ) n++;
    if (status) n++;
    if (assignedTo) n++;
    if (leadType) n++;
    if (source.trim()) n++;
    if (createdFrom || createdTo) n++;
    if (overdueOnly) n++;
    if (followUpToday) n++;
    return n;
  }, [
    debouncedQ,
    status,
    assignedTo,
    leadType,
    source,
    createdFrom,
    createdTo,
    overdueOnly,
    followUpToday,
  ]);

  const filterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (debouncedQ)
      chips.push({
        key: "q",
        label: `Search: ${debouncedQ}`,
        onRemove: () => {
          setQ("");
          setDebouncedQ("");
          setPage(0);
        },
      });
    if (status)
      chips.push({
        key: "status",
        label: `Status: ${status}`,
        onRemove: () => {
          setStatus("");
          setPage(0);
        },
      });
    if (assignedTo) {
      const u = users.find((x) => x.id === parseInt(assignedTo, 10));
      chips.push({
        key: "assigned",
        label: `Assigned: ${u?.full_name ?? assignedTo}`,
        onRemove: () => {
          setAssignedTo("");
          setPage(0);
        },
      });
    }
    if (leadType)
      chips.push({
        key: "type",
        label: `Type: ${leadType}`,
        onRemove: () => {
          setLeadType("");
          setPage(0);
        },
      });
    if (source.trim())
      chips.push({
        key: "source",
        label: `Source: ${source.trim()}`,
        onRemove: () => {
          setSource("");
          setPage(0);
        },
      });
    if (createdFrom || createdTo) {
      chips.push({
        key: "dates",
        label: `Created: ${createdFrom || "…"} → ${createdTo || "…"}`,
        onRemove: () => {
          setCreatedFrom("");
          setCreatedTo("");
          setPage(0);
        },
      });
    }
    if (overdueOnly)
      chips.push({
        key: "overdue",
        label: "Overdue only",
        onRemove: () => {
          setOverdueOnly(false);
          setPage(0);
        },
      });
    if (followUpToday)
      chips.push({
        key: "futoday",
        label: "Follow-up today",
        onRemove: () => {
          setFollowUpToday(false);
          setPage(0);
        },
      });
    return chips;
  }, [
    debouncedQ,
    status,
    assignedTo,
    leadType,
    source,
    createdFrom,
    createdTo,
    overdueOnly,
    followUpToday,
    users,
  ]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  async function onPickImportFile(f: File | null) {
    setImportPreview(null);
    setPendingImportFile(null);
    setImportMsg("");
    if (!f) return;
    setPendingImportFile(f);
    const name = f.name.toLowerCase();
    if (name.endsWith(".csv")) {
      const text = await f.text();
      const prev = parseCsvPreview(text, 10);
      setImportPreview(prev);
      setImportMsg(
        prev.headers.length
          ? "Review the first rows below, then confirm import."
          : "Could not parse CSV header."
      );
    } else {
      setImportMsg(
        "Excel file — preview is not shown. Confirm to import on the server (name & phone required per row)."
      );
    }
  }

  async function confirmImport() {
    if (!pendingImportFile) return;
    setImportMsg("Uploading…");
    try {
      const r = await leadsApi.importFile(pendingImportFile);
      setImportPreview(null);
      setPendingImportFile(null);
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
            {data.total} record{data.total !== 1 ? "s" : ""}
            {activeFilterCount > 0
              ? ` · ${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active (AND; follow-up vs overdue uses OR when both on)`
              : ""}
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
              setImportPreview(null);
              setPendingImportFile(null);
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
              className="app-select rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
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
              className="app-select rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
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
              className="app-select rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            >
              <option value="">All</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </label>
          <label className="flex min-w-[140px] flex-col gap-1">
            <span className="text-xs font-semibold text-neutral-600">Source contains</span>
            <input
              value={source}
              onChange={(e) => {
                setPage(0);
                setSource(e.target.value);
              }}
              placeholder="e.g. Facebook"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
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
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="text-xs font-semibold text-neutral-600">
                {activeFilterCount} active
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Clear all filters
            </button>
          </div>
        </div>
        {filterChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Active:
            </span>
            {filterChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
              >
                {c.label}
                <span className="text-neutral-500" aria-hidden>
                  ×
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {importOpen && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-neutral-900">Import leads</h3>
          <p className="mt-1 text-sm text-neutral-600">
            CSV or Excel · required columns: <strong>name</strong>, <strong>phone</strong>. Optional:
            email, company_name, status, assigned_to, source, location, description, remarks (notes), budget.
          </p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="mt-3 block text-sm"
            onChange={(e) => onPickImportFile(e.target.files?.[0] ?? null)}
          />
          {importMsg && (
            <p className="mt-2 text-sm font-medium text-neutral-800">{importMsg}</p>
          )}
          {importPreview && importPreview.headers.length > 0 && (
            <div className="mt-4 max-h-64 overflow-auto rounded-xl border border-neutral-200">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 font-semibold">
                    {importPreview.headers.map((h) => (
                      <th key={h} className="px-2 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-neutral-100">
                      {importPreview.headers.map((_, ci) => (
                        <td key={ci} className="px-2 py-1.5 font-medium text-neutral-700">
                          {row[ci] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {pendingImportFile && (
              <button
                type="button"
                onClick={() => confirmImport()}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Confirm import
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setImportOpen(false);
                setImportPreview(null);
                setPendingImportFile(null);
                setImportMsg("");
              }}
              className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {err && (
        <p className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 text-sm font-medium text-neutral-800">
          {err}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="divide-y divide-neutral-200">
          {data.items.map((l) => {
            const overdue = leadIsOverdue(l);
            return (
              <Link
                key={l.id}
                href={`/leads/${l.id}`}
                className={`block px-4 py-3 transition hover:bg-neutral-50/90 ${
                  overdue ? "bg-red-50/60" : ""
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium leading-snug text-neutral-900">{l.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {[l.phone, l.email].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                    <PriorityBadge priority={l.priority} size="xs" />
                    <StatusBadge status={l.status} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                  <span>
                    <span className="font-semibold text-neutral-600">Assigned:</span>{" "}
                    {assigneeLabel(users, l.assigned_to)}
                  </span>
                  <span>
                    <span className="font-semibold text-neutral-600">Created:</span>{" "}
                    {formatAppDateTime(l.created_at)}
                  </span>
                  <span>
                    <span className="font-semibold text-neutral-600">Follow-up:</span>{" "}
                    {l.follow_up_date ? formatAppDateTime(l.follow_up_date) : "—"}
                  </span>
                  {overdue && (
                    <span className="font-bold text-red-700">Overdue</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        {data.items.length === 0 && !err && (
          <p className="px-4 py-12 text-center text-sm font-medium text-neutral-500">
            No leads match these filters.
          </p>
        )}
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
