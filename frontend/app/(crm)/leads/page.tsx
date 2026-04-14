"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { downloadLeadsCsv, leadsApi, usersApi } from "@/lib/api";
import type { Lead, LeadStatus, LeadType, User } from "@/lib/types";
import { formatAppDateTime, localDateEndISO, localDateStartISO, localTodayYMD } from "@/lib/formatDate";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import LeadsDataTable, { assigneeLabel } from "@/components/LeadsDataTable";
import { coerceLeadPriority } from "@/lib/leadNormalize";
import { FilterPopover } from "@/components/FilterPopover";
import { CustomSelect } from "@/components/CustomSelect";

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
  const importFileInputRef = useRef<HTMLInputElement>(null);

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
  const [leadView, setLeadView] = useState<"list" | "table">("table");
  const [filterOpen, setFilterOpen] = useState(false);
  const [importMode, setImportMode] = useState<"skip" | "update">("skip");

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
    setImportMsg("Uploading and processing…");
    try {
      const r = await leadsApi.importFile(pendingImportFile, importMode);
      setImportPreview(null);
      setPendingImportFile(null);
      
      const summary = `Import complete: ${r.success} created, ${r.updated} updated, ${r.failed} failed out of ${r.total} total rows.`;
      setImportMsg(summary);
      
      if (r.errors.length > 0) {
        setErr(`Import had some issues: ${r.errors.slice(0, 5).join(" | ")}...`);
      } else {
        setErr("");
      }
      
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex rounded-xl border border-neutral-200 bg-neutral-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setLeadView("list")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                leadView === "list"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setLeadView("table")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                leadView === "table"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Table
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <FilterPopover
              isOpen={filterOpen}
              onOpen={() => setFilterOpen(true)}
              onClose={() => setFilterOpen(false)}
              activeCount={activeFilterCount}
              onApply={() => {
                setPage(0);
                load();
              }}
              onClear={clearFilters}
            >
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    Search
                  </span>
                  <input
                    value={q}
                    onChange={(e) => {
                      setPage(0);
                      setQ(e.target.value);
                    }}
                    placeholder="Name, phone, email"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-bold text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none transition-all ${
                      q ? "border-neutral-500 bg-neutral-50" : "border-neutral-200 bg-white"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    label="Status"
                    value={status}
                    onChange={(val) => {
                      setPage(0);
                      setStatus(val as LeadStatus | "");
                    }}
                    options={[
                      { value: "", label: "All Statuses" },
                      ...STATUSES.map((s) => ({
                        value: s,
                        label: s.charAt(0).toUpperCase() + s.slice(1),
                      })),
                    ]}
                  />
                  <CustomSelect
                    label="Type"
                    value={leadType}
                    onChange={(val) => {
                      setPage(0);
                      setLeadType(val as LeadType | "");
                    }}
                    options={[
                      { value: "", label: "All Types" },
                      { value: "inbound", label: "Inbound" },
                      { value: "outbound", label: "Outbound" },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <CustomSelect
                    label="Assigned To"
                    value={assignedTo}
                    onChange={(val) => {
                      setPage(0);
                      setAssignedTo(val);
                    }}
                    options={[
                      { value: "", label: "Anyone" },
                      ...users.map((u) => ({
                        value: String(u.id),
                        label: u.full_name,
                      })),
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    Source contains
                  </span>
                  <input
                    value={source}
                    onChange={(e) => {
                      setPage(0);
                      setSource(e.target.value);
                    }}
                    placeholder="e.g. Facebook, Website"
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-bold text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none transition-all ${
                      source ? "border-neutral-500 bg-neutral-50" : "border-neutral-200 bg-white"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                      Created From
                    </span>
                    <input
                      type="date"
                      value={createdFrom}
                      onChange={(e) => {
                        setPage(0);
                        setCreatedFrom(e.target.value);
                      }}
                      className={`w-full rounded-xl border px-3 py-2.5 text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-none transition-all ${
                        createdFrom ? "border-neutral-500 bg-neutral-50" : "border-neutral-200 bg-white"
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                      Created To
                    </span>
                    <input
                      type="date"
                      value={createdTo}
                      onChange={(e) => {
                        setPage(0);
                        setCreatedTo(e.target.value);
                      }}
                      className={`w-full rounded-xl border px-3 py-2.5 text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-none transition-all ${
                        createdTo ? "border-neutral-500 bg-neutral-50" : "border-neutral-200 bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      overdueOnly
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-md shadow-neutral-100"
                        : "border-neutral-100 bg-neutral-50/50 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={overdueOnly}
                      onChange={(e) => {
                        setPage(0);
                        setOverdueOnly(e.target.checked);
                      }}
                      className={`h-4 w-4 rounded border-neutral-300 focus:ring-0 ${
                        overdueOnly ? "accent-white bg-white text-neutral-900" : "text-neutral-900"
                      }`}
                    />
                    <span className="text-sm font-bold">Overdue leads only</span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      followUpToday
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-md shadow-neutral-100"
                        : "border-neutral-100 bg-neutral-50/50 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={followUpToday}
                      onChange={(e) => {
                        setPage(0);
                        setFollowUpToday(e.target.checked);
                      }}
                      className={`h-4 w-4 rounded border-neutral-300 focus:ring-0 ${
                        followUpToday ? "accent-white bg-white text-neutral-900" : "text-neutral-900"
                      }`}
                    />
                    <span className="text-sm font-bold">Follow-up due today</span>
                  </label>
                </div>
              </div>
            </FilterPopover>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportOpen(true);
                  setImportMsg("");
                  setImportPreview(null);
                  setPendingImportFile(null);
                  requestAnimationFrame(() => {
                    if (importFileInputRef.current) importFileInputRef.current.value = "";
                  });
                }}
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100"
              >
                Import
              </button>
              <button
                type="button"
                onClick={() => downloadLeadsCsv().catch(console.error)}
                className="rounded-xl border border-neutral-300 px-4 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100"
              >
                Export
              </button>
            </div>

            <Link
              href="/leads/new"
              className="flex-1 rounded-xl bg-neutral-900 px-5 py-2.5 text-center text-xs font-black text-white shadow-md shadow-neutral-100 transition hover:opacity-90 active:scale-95 sm:flex-none"
            >
              Add lead
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Active Filters
            </span>
            {filterChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onRemove}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-bold text-neutral-700 transition-all hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                {c.label}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-neutral-400 group-hover:text-white transition-colors"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 underline pointer-cursor ml-1 transition-colors"
            >
              Clear all
            </button>
          </div>
        ) : (
          <div className="px-1 py-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
              No filters applied
            </span>
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
            ref={importFileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              void onPickImportFile(file);
              e.target.value = "";
            }}
          />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Duplicate Handling</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("skip")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                      importMode === "skip" 
                        ? "bg-neutral-900 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    Skip Duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode("update")}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                      importMode === "update" 
                        ? "bg-neutral-900 text-white" 
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    Update Existing
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => importFileInputRef.current?.click()}
                  className="rounded-xl border border-neutral-900 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
                >
                  Choose file…
                </button>
                {pendingImportFile ? (
                  <span className="text-sm font-medium text-neutral-700">
                    Selected: <span className="text-neutral-900">{pendingImportFile.name}</span>
                  </span>
                ) : (
                  <span className="text-sm text-neutral-500">No file chosen</span>
                )}
              </div>
            </div>
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
                if (importFileInputRef.current) importFileInputRef.current.value = "";
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

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        {leadView === "table" ? (
          <LeadsDataTable items={data.items} users={users} />
        ) : (
          <>
            <div className="divide-y divide-neutral-200">
              {data.items.map((l) => {
                const overdue = leadIsOverdue(l);
                const hot = coerceLeadPriority(l.priority) === "HOT";
                const rowBg = overdue ? "bg-rose-50/55" : hot ? "bg-emerald-50/50" : "";
                return (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    className={`block px-5 py-4 transition hover:bg-neutral-50/90 ${rowBg}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold leading-snug text-neutral-900">{l.name}</p>
                        <p className="mt-1.5 text-sm text-neutral-500">
                          {[l.phone, l.email].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                        <PriorityBadge priority={l.priority} size="xs" />
                        <StatusBadge status={l.status} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
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
                      {overdue && <span className="font-bold text-red-600">Overdue</span>}
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
          </>
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
