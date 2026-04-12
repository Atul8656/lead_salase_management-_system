"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { leadsApi } from "@/lib/api";
import type { ActivityItem, Lead } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

function waLink(phone: string | null) {
  if (!phone) return null;
  const n = phone.replace(/\D/g, "");
  if (!n.length) return null;
  return `https://wa.me/${n}`;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      const [l, acts] = await Promise.all([
        leadsApi.get(id),
        leadsApi.activities(id),
      ]);
      setLead(l);
      setNotes(l.notes ?? "");
      setActivities(acts);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function saveNotes() {
    if (!lead) return;
    setSaving(true);
    try {
      await leadsApi.patch(lead.id, { notes });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeLead() {
    if (!lead || !confirm("Delete this lead permanently?")) return;
    try {
      await leadsApi.remove(lead.id);
      router.push("/leads");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (!lead && !err) {
    return (
      <div className="font-medium text-neutral-500">Loading…</div>
    );
  }

  if (!lead) {
    return (
      <p className="font-semibold text-neutral-900">{err || "Not found"}</p>
    );
  }

  const whatsapp = waLink(lead.phone);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/leads" className="app-link text-sm">
          ← Leads
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{lead.name}</h2>
            <p className="font-medium text-neutral-500">{lead.company_name ?? "No company"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              {lead.follow_up_date &&
                new Date(lead.follow_up_date) < new Date() &&
                lead.status !== "converted" &&
                lead.status !== "not_interested" && (
                  <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-900">
                    Follow-up overdue
                  </span>
                )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                WhatsApp
              </a>
            )}
            <Link
              href="/pipeline"
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
            >
              Pipeline
            </Link>
            <button
              type="button"
              onClick={removeLead}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {err && (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm font-semibold text-neutral-900">
          {err}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-neutral-900">Contact</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={lead.email} />
            <Row label="Phone" value={lead.phone} />
            <Row label="Location" value={lead.location} />
            <Row label="Website" value={lead.website_url} link />
            <Row label="LinkedIn" value={lead.linkedin_url} link />
            <Row label="Source" value={lead.source} />
            <Row label="Budget" value={lead.budget} />
            <Row label="Timeline" value={lead.timeline} />
            <Row
              label="Follow-up"
              value={
                lead.follow_up_date
                  ? new Date(lead.follow_up_date).toLocaleString()
                  : null
              }
            />
            <Row
              label="Payment"
              value={
                lead.payment_amount
                  ? `${lead.payment_amount} · ${lead.payment_method ?? ""}`
                  : null
              }
            />
          </dl>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-neutral-900">Notes</h3>
          <textarea
            className="mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-900 focus:border-neutral-900"
            rows={8}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            type="button"
            onClick={saveNotes}
            disabled={saving}
            className="mt-3 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-neutral-900">Activity timeline</h3>
        <ul className="mt-4 space-y-4">
          {activities.map((a) => (
            <li
              key={a.id}
              className="border-l-2 border-neutral-900 pl-4 text-sm"
            >
              <p className="font-semibold text-neutral-900">{a.action}</p>
              {a.details && (
                <p className="mt-1 font-medium text-neutral-600 line-clamp-3">{a.details}</p>
              )}
              <p className="mt-1 text-xs font-medium text-neutral-500">
                {new Date(a.created_at).toLocaleString()}
              </p>
            </li>
          ))}
          {activities.length === 0 && (
            <li className="font-medium text-neutral-500">No activity yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  link,
}: {
  label: string;
  value: string | null;
  link?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-medium text-neutral-500">{label}</dt>
      <dd className="text-right font-semibold text-neutral-900">
        {link ? (
          <a href={value} className="url-link" target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
