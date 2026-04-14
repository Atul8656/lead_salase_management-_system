"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { leadsApi, usersApi } from "@/lib/api";
import type { ActivityItem, Lead, LeadPriority, LeadRemark, LeadStatus, LeadType, User } from "@/lib/types";
import { formatActivityDetail } from "@/lib/formatActivityDetail";
import { formatRemarkTimestamp } from "@/lib/formatDate";
import { userInitials } from "@/lib/userDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { coerceLeadPriority } from "@/lib/leadNormalize";
import { CustomSelect } from "@/components/CustomSelect";
import { FollowUpBadge } from "@/components/FollowUpBadge";
import { getFollowUpStatus } from "@/lib/formatDate";
import {
  IconCalendar,
  IconChevronLeft,
  IconColumns,
  IconGlobe,
  IconLinkedIn,
  IconMail,
  IconMapPin,
  IconPencil,
  IconPhone,
  IconSend,
  IconTag,
  IconTrash,
  IconWhatsApp,
} from "@/components/lead-detail-icons";



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

function formatActivityLabel(action: string): string {
  const map: Record<string, string> = {
    "Lead Created": "Lead created",
    "Lead Updated": "Lead updated",
    "Pipeline Move": "Pipeline updated",
    "Added remark": "Added remark",
    "Follow-up scheduled": "Follow-up scheduled",
  };
  return map[action] ?? action;
}

type TimelineEntry =
  | { kind: "remark"; key: string; at: string; remark: LeadRemark }
  | { kind: "activity"; key: string; at: string; activity: ActivityItem };

function IconMessageCircle({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ActionCircle({
  icon,
  tooltip,
  onClick,
  href,
}: {
  icon: ReactNode;
  tooltip: string;
  onClick?: () => void;
  href?: string;
}) {
  const base =
    "group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all duration-200 hover:border-black hover:bg-black hover:text-white active:scale-95 shadow-sm";

  const tip = (
    <span className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black px-2 py-1 text-[9px] font-bold text-white opacity-0 transition-all duration-200 group-hover:opacity-100 shadow-xl">
      {tooltip}
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[3px] border-l-transparent border-r-transparent border-t-black" />
    </span>
  );

  const content = (
    <>
      {tip}
      {icon}
    </>
  );

  if (href) {
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={base}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={base}>
      {content}
    </button>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [remarks, setRemarks] = useState<LeadRemark[]>([]);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [err, setErr] = useState("");
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
    lead_type: "inbound" as LeadType,
    status: "new" as LeadStatus,
    assigned_to: "" as string,
    interest: "",
    budget: "",
    timeline: "",
    description: "",
    priority: "" as "" | LeadPriority,
    payment_amount: "",
    payment_method: "",
    follow_up_date: "",
  });

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      const [l, acts, rem] = await Promise.all([
        leadsApi.get(id),
        leadsApi.activities(id),
        leadsApi.remarks(id),
      ]);
      setLead(l);
      setRemarks(rem);
      setEditForm({
        name: l.name,
        email: l.email ?? "",
        phone: l.phone ?? "",
        company_name: l.company_name ?? "",
        website_url: l.website_url ?? "",
        linkedin_url: l.linkedin_url ?? "",
        location: l.location ?? "",
        source: l.source ?? "",
        lead_type: l.lead_type,
        status: l.status,
        assigned_to: l.assigned_to != null ? String(l.assigned_to) : "",
        interest: l.interest ?? "",
        budget: l.budget ?? "",
        timeline: l.timeline ?? "",
        description: l.description ?? "",
        priority: coerceLeadPriority(l.priority) || "",
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

  const activitiesSansRemarkEcho = useMemo(
    () => activities.filter((a) => a.action !== "Added remark"),
    [activities]
  );

  const timeline = useMemo((): TimelineEntry[] => {
    const r: TimelineEntry[] = remarks.map((remark) => ({
      kind: "remark",
      key: `r-${remark.id}`,
      at: remark.created_at,
      remark,
    }));
    const a: TimelineEntry[] = activitiesSansRemarkEcho.map((activity) => ({
      kind: "activity",
      key: `a-${activity.id}`,
      at: activity.created_at,
      activity,
    }));
    return [...r, ...a].sort(
      (p, q) => new Date(q.at).getTime() - new Date(p.at).getTime()
    );
  }, [remarks, activitiesSansRemarkEcho]);

  async function submitRemark() {
    if (!lead || !remarkDraft.trim()) return;
    setSavingRemark(true);
    setErr("");
    try {
      const timestamp = new Date().toISOString();
      await leadsApi.addRemark(lead.id, remarkDraft.trim(), timestamp);
      setRemarkDraft("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add remark");
    } finally {
      setSavingRemark(false);
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
        lead_type: editForm.lead_type,
        status: editForm.status,
        interest: editForm.interest || null,
        budget: editForm.budget || null,
        timeline: editForm.timeline || null,
        description: editForm.description || null,
        priority: editForm.priority || null,
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

      console.log("[DEBUG] saveLeadEdit payload:", body);
      await leadsApi.patch(lead.id, body);
      await load();
      setEditOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeLead() {
    if (!lead || !confirm("Delete this lead? (Removed from UI only)")) return;
    try {
      await leadsApi.remove(lead.id);
      router.push("/leads");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (!lead && !err) {
    return (
      <div className="font-medium" style={{ color: "var(--foreground-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!lead) {
    return (
      <p className="font-semibold" style={{ color: "var(--foreground)" }}>
        {err || "Not found"}
      </p>
    );
  }

  const whatsapp = waLink(lead.phone);
  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
  } as const;

  return (
    <div className="mx-auto max-w-6xl animate-fade-in pb-8 md:pb-12">
      <Link
        href="/leads"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
        style={{ color: "var(--foreground-muted)" }}
      >
        <IconChevronLeft className="size-4 opacity-70" />
        Back to leads
      </Link>

      {/* Sticky-style header */}
      <header
        className="crm-card mb-6 px-4 py-5 sm:mb-8 sm:px-8 sm:py-7"
        style={{ borderRadius: "16px" }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem]" style={{ color: "var(--foreground)" }}>
                  {lead.name}
                </h1>
                <p className="mt-1 text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
                  {lead.company_name ?? "No company on file"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-1">
                <ActionCircle
                  onClick={() => setEditOpen((v) => !v)}
                  tooltip={editOpen ? "Close Editor" : "Edit Lead"}
                  icon={<IconPencil className="size-4" />}
                />
                <ActionCircle
                  onClick={removeLead}
                  tooltip="Delete Lead"
                  icon={<IconTrash className="size-4" />}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
                <FollowUpBadge status={getFollowUpStatus(lead.follow_up_date, lead.status)} />
              </div>
              <div className="flex items-center gap-2">
                {whatsapp && (
                  <ActionCircle
                    href={whatsapp}
                    tooltip="WhatsApp"
                    icon={<IconMessageCircle className="size-4" />}
                  />
                )}
                <ActionCircle
                  href="/pipeline"
                  tooltip="Pipeline"
                  icon={<IconColumns className="size-4" />}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {err && (
        <p
          className="mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold"
          style={{
            borderColor: "var(--border)",
            background: "var(--color-background-secondary)",
            color: "var(--foreground)",
          }}
        >
          {err}
        </p>
      )}

      {editOpen && (
        <form
          onSubmit={saveLeadEdit}
          className="crm-card mb-8 space-y-6 p-6 sm:p-8"
          style={{ borderRadius: "16px" }}
        >
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              Edit lead
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
              Priority can only be changed here (not on the pipeline). Interested status needs a follow-up date;
              converted needs payment details.
            </p>
          </div>
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
            <div>
            <CustomSelect
              label="Priority"
              value={editForm.priority}
              onChange={(val) =>
                setEditForm((f) => ({
                  ...f,
                  priority: val as typeof editForm.priority,
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
            <div>
            <CustomSelect
              label="Lead type"
              value={editForm.lead_type}
              onChange={(val) =>
                setEditForm((f) => ({ ...f, lead_type: val as LeadType }))
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
              value={editForm.status}
              onChange={(val) =>
                setEditForm((f) => ({ ...f, status: val as LeadStatus }))
              }
              options={STATUSES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
            </div>
            <div>
            <CustomSelect
              label="Assigned to"
              value={editForm.assigned_to}
              onChange={(val) =>
                setEditForm((f) => ({ ...f, assigned_to: val }))
              }
              options={[
                { value: "", label: "Unassigned" },
                ...users.map((u) => ({
                  value: String(u.id),
                  label: u.full_name,
                })),
              ]}
            />
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
              <label className="block text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                Description / requirements
              </label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does the lead need? Budget, scope, timeline…"
                className="mt-1 min-h-[4.5rem] w-full resize-y rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none"
                style={{ ...inputStyle, boxShadow: "none" }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                Follow-up date / time
              </label>
              <input
                type="datetime-local"
                value={editForm.follow_up_date}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, follow_up_date: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border px-4 py-2.5 font-medium focus:outline-none"
                style={inputStyle}
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
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={savingEdit}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {savingEdit ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:opacity-90"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
        {/* LEFT ~60% — Contact + Description */}
        <div className="space-y-6">
          <section className="crm-card p-6 sm:p-7" style={{ borderRadius: "16px" }}>
            <h2
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--foreground-muted)" }}
            >
              Contact
            </h2>
            <div className="mt-5 divide-y divide-neutral-200/80 dark:divide-zinc-700/80">
              <ContactIconRow icon={<IconMail />} label="Email" value={lead.email} href={lead.email ? `mailto:${lead.email}` : null} />
              <ContactIconRow icon={<IconPhone />} label="Phone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : null} />
              <ContactIconRow icon={<IconMapPin />} label="Location" value={lead.location} />
              <ContactIconRow
                icon={<IconGlobe />}
                label="Website"
                value={lead.website_url}
                href={lead.website_url || null}
                external
              />
              <ContactIconRow
                icon={<IconLinkedIn />}
                label="LinkedIn"
                value={lead.linkedin_url}
                href={lead.linkedin_url || null}
                external
              />
              <ContactIconRow icon={<IconTag />} label="Source" value={lead.source} />
              <ContactIconRow
                icon={<IconCalendar />}
                label="Follow-up"
                value={
                  <div className="flex flex-col gap-1 items-start">
                    <span>{lead.follow_up_date ? formatRemarkTimestamp(lead.follow_up_date) : "—"}</span>
                    <FollowUpBadge status={getFollowUpStatus(lead.follow_up_date, lead.status)} />
                  </div>
                }
              />
            </div>

            <div
              className="mt-8 rounded-2xl p-5"
              style={{ background: "var(--color-background-secondary)" }}
            >
              <h3
                className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "var(--foreground-muted)" }}
              >
                Description
              </h3>
              {(lead.description || "").trim() ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {lead.description}
                </p>
              ) : (
                <p className="mt-3 text-sm" style={{ color: "var(--foreground-muted)" }}>
                  No description added
                </p>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT ~40% — Activity + sticky remark */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <section
            className="crm-card flex max-h-[min(720px,calc(100vh-8rem))] flex-col overflow-hidden"
            style={{ borderRadius: "16px" }}
          >
            <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Activity
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: "var(--foreground-muted)" }}>
                Remarks and updates in one timeline
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              {timeline.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
                  No activity yet. Add a note below.
                </p>
              ) : (
                timeline.map((item) =>
                  item.kind === "remark" ? (
                    <div key={item.key} className="flex gap-3">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          background: "var(--accent-subtle)",
                          color: "var(--accent)",
                        }}
                      >
                        {userInitials(item.remark.user_name || "U")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                            {item.remark.user_name || "Team"}
                          </span>
                          <time className="text-[11px] tabular-nums" style={{ color: "var(--foreground-muted)" }}>
                            {formatRemarkTimestamp(item.remark.created_at)}
                          </time>
                        </div>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                          Remark
                        </p>
                        <div
                          className="mt-2 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed shadow-sm"
                          style={{
                            background: "var(--card)",
                            border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
                            color: "var(--foreground)",
                          }}
                        >
                          {item.remark.body}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={item.key} className="flex gap-3">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          background: "var(--color-background-info)",
                          color: "var(--color-text-info)",
                        }}
                      >
                        {userInitials(item.activity.user_name || "U")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                            {item.activity.user_name || "Team Member"}
                          </span>
                          <time className="text-[11px] tabular-nums" style={{ color: "var(--foreground-muted)" }}>
                            {formatRemarkTimestamp(item.activity.created_at)}
                          </time>
                        </div>
                        <p className="mt-1 text-xs" style={{ color: "var(--foreground-muted)" }}>
                          {formatActivityLabel(item.activity.action)}
                        </p>
                        {item.activity.details ? (
                          <div
                            className="mt-2 rounded-xl px-3 py-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
                            style={{
                              background: "var(--color-background-secondary)",
                              color: "var(--foreground)",
                            }}
                          >
                            {formatActivityDetail(item.activity.details)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <div
              className="shrink-0 border-t p-4 sm:p-5"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}
            >
              <label className="sr-only" htmlFor="lead-remark">
                Add remark
              </label>
              <textarea
                id="lead-remark"
                rows={3}
                value={remarkDraft}
                onChange={(e) => setRemarkDraft(e.target.value)}
                placeholder="Add a remark…"
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm transition placeholder:opacity-60 focus:outline-none"
                style={inputStyle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submitRemark();
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="hidden text-[11px] sm:inline" style={{ color: "var(--foreground-muted)" }}>
                  Cmd/Ctrl + Enter to send
                </span>
                <button
                  type="button"
                  onClick={submitRemark}
                  disabled={savingRemark || !remarkDraft.trim()}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  <IconSend className="size-4 opacity-90" />
                  {savingRemark ? "Sending…" : "Add remark"}
                </button>
              </div>
            </div>
          </section>
        </div>
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
      <label className="block text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm font-medium focus:outline-none"
        style={{
          borderColor: "var(--border)",
          background: "var(--card)",
          color: "var(--foreground)",
        }}
      />
    </div>
  );
}

function ContactIconRow({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  href?: string | null;
  external?: boolean;
}) {
  const isStr = typeof value === "string";
  const empty = !value || (isStr && !value.trim());
  const display = empty ? "—" : value;

  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="mt-0.5 shrink-0 opacity-70" style={{ color: "var(--foreground-muted)" }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--foreground-muted)" }}>
          {label}
        </p>
        <div className="mt-1 text-sm break-words" style={{ color: empty ? "var(--foreground-muted)" : "var(--foreground)" }}>
          {empty ? (
            display
          ) : href ? (
            <a
              href={href}
              className="font-medium underline underline-offset-2 transition opacity-90 hover:opacity-100"
              style={{ color: "var(--accent)" }}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {display}
            </a>
          ) : (
            display
          )}
        </div>
      </div>
    </div>
  );
}
