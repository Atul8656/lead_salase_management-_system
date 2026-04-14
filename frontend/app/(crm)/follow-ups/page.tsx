"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { followupsApi, leadsApi } from "@/lib/api";
import type { FollowUp, Lead } from "@/lib/types";
import { formatAppDateTime } from "@/lib/formatDate";

export default function FollowUpsPage() {
  const [overdue, setOverdue] = useState<Lead[]>([]);
  const [mine, setMine] = useState<FollowUp[]>([]);
  const [err, setErr] = useState("");
  const [leadId, setLeadId] = useState("");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    try {
      const [o, m] = await Promise.all([
        leadsApi.overdue(),
        followupsApi.mine(),
      ]);
      setOverdue(o || []);
      setMine(m || []); // Backend returns list of followups
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !when) return;
    try {
      await followupsApi.create({
        lead_id: parseInt(leadId, 10),
        scheduled_at: new Date(when).toISOString(),
        notes: note || undefined,
      });
      setLeadId("");
      setWhen("");
      setNote("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Schedule failed");
    }
  }

  async function complete(id: number) {
    try {
      await followupsApi.complete(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Completion failed");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Follow-ups</h2>
        <p className="text-sm font-medium text-neutral-500">
          Overdue follow-up dates are highlighted across the CRM.
        </p>
      </div>

      {err && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
          {err}
        </p>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <h3 className="font-bold text-neutral-900">Overdue follow-ups</h3>
        <ul className="mt-4 space-y-2">
          {overdue.map((l) => (
            <li key={l.id} className="flex items-center justify-between text-sm">
              <span className="font-semibold text-neutral-900">{l.name}</span>
              <div className="flex gap-3">
                <span className="text-xs font-bold text-red-600">OVERDUE</span>
                <Link href={`/leads/${l.id}`} className="app-link">
                  Open
                </Link>
              </div>
            </li>
          ))}
          {overdue.length === 0 && (
            <li className="font-medium text-neutral-500">None overdue.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-neutral-900">Schedule follow-up</h3>
        <form onSubmit={schedule} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-neutral-700">Lead ID</label>
            <input
              type="number"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-medium text-neutral-900 focus:border-neutral-900"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              placeholder="e.g. 1"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-700">When</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-medium text-neutral-900 focus:border-neutral-900"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-700">Notes</label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-medium text-neutral-900 focus:border-neutral-900"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
          >
            Save Schedule
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-neutral-900">My scheduled follow-ups</h3>
        <ul className="mt-4 space-y-3 text-sm">
          {mine.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-col">
                <span className="font-bold text-neutral-900">
                  {f.lead_name || "Lead"}
                </span>
                <span className="text-xs text-neutral-500">
                  {formatAppDateTime(new Date(f.scheduled_at))}
                  {f.notes && <span className="ml-2 italic">"{f.notes}"</span>}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => complete(f.id)}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Mark Done
                </button>
                <Link href={`/leads/${f.lead_id}`} className="app-link">
                  View
                </Link>
              </div>
            </li>
          ))}
          {mine.length === 0 && (
            <li className="py-4 text-center font-medium text-neutral-500">
              No follow-ups logged.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
