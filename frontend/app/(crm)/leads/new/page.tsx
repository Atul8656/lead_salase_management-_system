"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { leadsApi, usersApi } from "@/lib/api";
import type { LeadPriority, LeadStatus, LeadType, User } from "@/lib/types";
import { CustomSelect } from "@/components/CustomSelect";

function memberLabel(u: User) {
  return u.member_id ?? u.login_id ?? `M${String(u.id).padStart(3, "0")}`;
}

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "follow-up",
  "converted",
  "lost",
];

const STEPS = ["Basic info", "Sales", "Remarks"];

export default function NewLeadPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    website_url: "",
    linkedin_url: "",
    location: "",
    source: "",
    lead_type: "inbound" as LeadType,
    status: "new" as LeadStatus,
    assigned_to: "" as string,
    interest: "",
    budget: "",
    timeline: "",
    notes: "",
    description: "",
    payment_amount: "",
    payment_method: "",
    follow_up_date: "",
    priority: "" as "" | LeadPriority,
  });

  useEffect(() => {
    usersApi
      .assignees()
      .then(setUsers)
      .catch(() => setUsers([]));
    usersApi
      .me()
      .then((me) =>
        setForm((f) =>
          f.assigned_to === "" ? { ...f, assigned_to: String(me.id) } : f
        )
      )
      .catch(() => {});
  }, []);

  function validateStep(s: number): boolean {
    if (s === 0) {
      if (!form.name.trim() || !form.phone.trim()) {
        setErr("Name and phone are required.");
        return false;
      }
    }
    if (s === 1) {
      if (!form.assigned_to) {
        setErr("Assign this lead to a team member.");
        return false;
      }
      if (form.status === "interested" && !form.follow_up_date) {
        setErr("Follow-up date is required for Interested.");
        return false;
      }
      if (
        form.status === "converted" &&
        (!form.payment_amount.trim() || !form.payment_method.trim())
      ) {
        setErr("Payment amount and method are required for Converted.");
        return false;
      }
    }
    setErr("");
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((x) => Math.min(STEPS.length - 1, x + 1));
  }

  function goBack() {
    setErr("");
    setStep((x) => Math.max(0, x - 1));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }
    if (!validateStep(0) || !validateStep(1)) return;
    setErr("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone.trim(),
        company_name: form.company_name || null,
        website_url: form.website_url || null,
        linkedin_url: form.linkedin_url || null,
        location: form.location || null,
        source: form.source || null,
        lead_type: form.lead_type,
        status: form.status,
        interest: form.interest || null,
        budget: form.budget || null,
        timeline: form.timeline || null,
        notes: form.notes || null,
        description: form.description.trim() || null,
        priority: form.priority || null,
        payment_amount: form.payment_amount ? parseFloat(form.payment_amount) : 0,
        payment_method: form.payment_method || null,
      };
      body.assigned_to = parseInt(form.assigned_to, 10);
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
          Step {step + 1} of {STEPS.length}: {STEPS[step]} · phone is required. Interested
          needs follow-up; converted needs payment.
        </p>
        <div className="mt-4 flex gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-neutral-900" : "bg-neutral-200"}`}
            />
          ))}
        </div>
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

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name *"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              required
            />
            <Field
              label="Phone *"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
            <Field
              label="Company"
              value={form.company_name}
              onChange={(v) => setForm((f) => ({ ...f, company_name: v }))}
            />
            <Field
              label="Location"
              value={form.location}
              onChange={(v) => setForm((f) => ({ ...f, location: v }))}
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700">
                Description / requirements
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What does this lead need? Products, budget context, timeline…"
                className="mt-1 min-h-[4.5rem] w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
            <CustomSelect
              label="Source"
              value={form.source}
              onChange={(val) => setForm((f) => ({ ...f, source: val }))}
              options={[
                { value: "", label: "Select…" },
                { value: "facebook", label: "Facebook" },
                { value: "website", label: "Website" },
                { value: "referral", label: "Referral" },
                { value: "other", label: "Other" },
              ]}
            />
            </div>
            <div>
            <CustomSelect
              label="Lead type"
              value={form.lead_type}
              onChange={(val) =>
                setForm((f) => ({ ...f, lead_type: val as LeadType }))
              }
              options={[
                { value: "inbound", label: "Inbound" },
                { value: "outbound", label: "Outbound" },
              ]}
            />
            </div>
            <div>
            <CustomSelect
              label="Status"
              value={form.status}
              onChange={(val) =>
                setForm((f) => ({ ...f, status: val as LeadStatus }))
              }
              options={STATUSES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
            </div>
            <div>
            <CustomSelect
              label="Priority"
              value={form.priority}
              onChange={(val) =>
                setForm((f) => ({
                  ...f,
                  priority: val as typeof form.priority,
                }))
              }
              options={[
                { value: "", label: "None" },
                { value: "HOT", label: "Hot" },
                { value: "WARM", label: "Warm" },
                { value: "COLD", label: "Cold" },
              ]}
            />
            </div>
            <div>
            <CustomSelect
              label="Assigned to *"
              value={form.assigned_to}
              onChange={(val) => setForm((f) => ({ ...f, assigned_to: val }))}
              options={users.map((u) => ({
                value: String(u.id),
                label: `${u.full_name} · ${memberLabel(u)}`,
              }))}
            />
            </div>
            <div className="sm:col-span-2">
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
        )}

        {step === 2 && (
          <div className="space-y-4">
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
              <label className="block text-xs font-semibold text-neutral-700">Remarks</label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 focus:border-neutral-900"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="min-w-[160px] flex-1 rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading
              ? "Saving…"
              : step < STEPS.length - 1
                ? "Continue"
                : "Create lead"}
          </button>
        </div>
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
