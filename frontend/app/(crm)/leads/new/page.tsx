"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leadsApi, usersApi } from "@/lib/api";
import type { LeadStatus, LeadType, User } from "@/lib/types";

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow-up",
  "converted",
  "not_interested",
];

export default function NewLeadPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
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

  useEffect(() => {
    usersApi
      .assignees()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company_name: form.company_name || null,
        website_url: form.website_url || null,
        linkedin_url: form.linkedin_url || null,
        location: form.location || null,
        source: form.source || null,
        source_detail: form.source_detail || null,
        lead_type: form.lead_type,
        status: form.status,
        interest: form.interest || null,
        budget: form.budget || null,
        timeline: form.timeline || null,
        notes: form.notes || null,
        payment_amount: form.payment_amount ? parseFloat(form.payment_amount) : 0,
        payment_method: form.payment_method || null,
      };
      if (form.assigned_to) body.assigned_to = parseInt(form.assigned_to, 10);
      if (form.follow_up_date)
        body.follow_up_date = new Date(form.follow_up_date).toISOString();

      const lead = await leadsApi.create(body);
      router.push(`/leads/${lead.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create lead");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link href="/leads" className="app-link text-sm">
          ← Back to leads
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-neutral-900">Add lead</h2>
        <p className="text-sm font-medium text-neutral-500">
          Interested status requires a follow-up date. Converted requires payment
          details.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {err && (
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm font-semibold text-neutral-900">
            {err}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name *"
            value={form.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            required
          />
          <Field
            label="Company"
            value={form.company_name}
            onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          />
          <Field
            label="Website"
            value={form.website_url}
            onChange={(v) => setForm((f) => ({ ...f, website_url: v }))}
          />
          <Field
            label="LinkedIn"
            value={form.linkedin_url}
            onChange={(v) => setForm((f) => ({ ...f, linkedin_url: v }))}
          />
          <Field
            label="Location"
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
          />
          <Field
            label="Source"
            value={form.source}
            onChange={(v) => setForm((f) => ({ ...f, source: v }))}
          />
          <Field
            label="Source detail"
            value={form.source_detail}
            onChange={(v) => setForm((f) => ({ ...f, source_detail: v }))}
          />
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Lead type</label>
            <select
              value={form.lead_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, lead_type: e.target.value as LeadType }))
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
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as LeadStatus }))
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
              value={form.assigned_to}
              onChange={(e) =>
                setForm((f) => ({ ...f, assigned_to: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
            >
              <option value="">Default (me)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} · {u.login_id} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Interest"
            value={form.interest}
            onChange={(v) => setForm((f) => ({ ...f, interest: v }))}
          />
          <Field
            label="Budget"
            value={form.budget}
            onChange={(v) => setForm((f) => ({ ...f, budget: v }))}
          />
          <Field
            label="Timeline"
            value={form.timeline}
            onChange={(v) => setForm((f) => ({ ...f, timeline: v }))}
          />
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Follow-up date / time
            </label>
            <input
              type="datetime-local"
              value={form.follow_up_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, follow_up_date: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
            />
          </div>
          <Field
            label="Payment amount (if converted)"
            value={form.payment_amount}
            onChange={(v) => setForm((f) => ({ ...f, payment_amount: v }))}
          />
          <Field
            label="Payment method (if converted)"
            value={form.payment_method}
            onChange={(v) => setForm((f) => ({ ...f, payment_method: v }))}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700">Notes</label>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Create lead"}
        </button>
      </form>
    </div>
  );
}

function Field({
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
