"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { leadsApi, usersApi } from "@/lib/api";
import type { ActivityItem, Lead, LeadStatus, LeadType, User } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow-up",
  "converted",
  "lost",
];

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    website_url: "",
    linkedin_url: "",
    location: "",
    source: "",
    source_detail: "",
    lead_type: "inbound" as LeadType,
    status: "new" as LeadStatus,
    assigned_to: "" as string,
    interest: "",
    budget: "",
    timeline: "",
    notes: "",
    payment_amount: "",
    payment_method: "",
    follow_up_date: "",
  });

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      const [l, acts] = await Promise.all([
        leadsApi.get(id),
        leadsApi.activities(id),
      ]);
      setLead(l);
      setNotes(l.notes ?? "");
      setEditForm({
        name: l.name,
        email: l.email ?? "",
        phone: l.phone ?? "",
        company_name: l.company_name ?? "",
        website_url: l.website_url ?? "",
        linkedin_url: l.linkedin_url ?? "",
        location: l.location ?? "",
        source: l.source ?? "",
        source_detail: l.source_detail ?? "",
        lead_type: l.lead_type,
        status: l.status,
        assigned_to: l.assigned_to != null ? String(l.assigned_to) : "",
        interest: l.interest ?? "",
        budget: l.budget ?? "",
        timeline: l.timeline ?? "",
        notes: l.notes ?? "",
        payment_amount: l.payment_amount != null ? String(l.payment_amount) : "",
        payment_method: l.payment_method ?? "",
        follow_up_date: toLocalDatetimeValue(l.follow_up_date),
      });
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

  useEffect(() => {
    usersApi
      .assignees()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

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

  async function saveLeadEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!lead) return;
    setSavingEdit(true);
    setErr("");
    try {
      const body: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        company_name: editForm.company_name || null,
        website_url: editForm.website_url || null,
        linkedin_url: editForm.linkedin_url || null,
        location: editForm.location || null,
        source: editForm.source || null,
        source_detail: editForm.source_detail || null,
        lead_type: editForm.lead_type,
        status: editForm.status,
        interest: editForm.interest || null,
        budget: editForm.budget || null,
        timeline: editForm.timeline || null,
        notes: editForm.notes || null,
        payment_amount: editForm.payment_amount ? parseFloat(editForm.payment_amount) : 0,
        payment_method: editForm.payment_method || null,
      };
      if (editForm.assigned_to) body.assigned_to = parseInt(editForm.assigned_to, 10);
      else body.assigned_to = null;
      if (editForm.follow_up_date) {
        body.follow_up_date = new Date(editForm.follow_up_date).toISOString();
      } else if (lead.follow_up_date) {
        body.follow_up_date = null;
      }

      await leadsApi.patch(lead.id, body);
      setNotes(editForm.notes);
      await load();
      setEditOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingEdit(false);
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
                lead.status !== "lost" && (
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
              onClick={() => setEditOpen((v) => !v)}
              className="rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              {editOpen ? "Close editor" : "Edit lead"}
            </button>
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

      {editOpen && (
        <form
          onSubmit={saveLeadEdit}
          className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-bold text-neutral-900">Edit lead</h3>
          <p className="text-sm font-medium text-neutral-500">
            Changes are saved to the API and logged on the activity timeline with your name.
            Interested status needs a follow-up date; converted needs payment details.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <EditField
              label="Name *"
              value={editForm.name}
              onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
              required
            />
            <EditField
              label="Company"
              value={editForm.company_name}
              onChange={(v) => setEditForm((f) => ({ ...f, company_name: v }))}
            />
            <EditField
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(v) => setEditForm((f) => ({ ...f, email: v }))}
            />
            <EditField
              label="Phone"
              value={editForm.phone}
              onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))}
            />
            <EditField
              label="Website"
              value={editForm.website_url}
              onChange={(v) => setEditForm((f) => ({ ...f, website_url: v }))}
            />
            <EditField
              label="LinkedIn"
              value={editForm.linkedin_url}
              onChange={(v) => setEditForm((f) => ({ ...f, linkedin_url: v }))}
            />
            <EditField
              label="Location"
              value={editForm.location}
              onChange={(v) => setEditForm((f) => ({ ...f, location: v }))}
            />
            <EditField
              label="Source"
              value={editForm.source}
              onChange={(v) => setEditForm((f) => ({ ...f, source: v }))}
            />
            <EditField
              label="Source detail"
              value={editForm.source_detail}
              onChange={(v) => setEditForm((f) => ({ ...f, source_detail: v }))}
            />
            <div>
              <label className="block text-xs font-semibold text-neutral-700">Lead type</label>
              <select
                value={editForm.lead_type}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, lead_type: e.target.value as LeadType }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700">Status</label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, status: e.target.value as LeadStatus }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700">Assigned to</label>
              <select
                value={editForm.assigned_to}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, assigned_to: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} · {u.login_id} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <EditField
              label="Interest"
              value={editForm.interest}
              onChange={(v) => setEditForm((f) => ({ ...f, interest: v }))}
            />
            <EditField
              label="Budget"
              value={editForm.budget}
              onChange={(v) => setEditForm((f) => ({ ...f, budget: v }))}
            />
            <EditField
              label="Timeline"
              value={editForm.timeline}
              onChange={(v) => setEditForm((f) => ({ ...f, timeline: v }))}
            />
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700">
                Follow-up date / time
              </label>
              <input
                type="datetime-local"
                value={editForm.follow_up_date}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, follow_up_date: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
              />
            </div>
            <EditField
              label="Payment amount (if converted)"
              value={editForm.payment_amount}
              onChange={(v) => setEditForm((f) => ({ ...f, payment_amount: v }))}
            />
            <EditField
              label="Payment method (if converted)"
              value={editForm.payment_method}
              onChange={(v) => setEditForm((f) => ({ ...f, payment_method: v }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Notes</label>
            <textarea
              rows={4}
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={savingEdit}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
            >
              Cancel
            </button>
          </div>
        </form>
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
              <p className="mt-0.5 text-xs font-semibold text-neutral-700">
                {a.user_name
                  ? `By ${a.user_name}`
                  : `User #${a.user_id}`}
              </p>
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

function EditField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
      />
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
