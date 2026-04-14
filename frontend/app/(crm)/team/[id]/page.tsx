"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/types";
import { formatAppDateTime } from "@/lib/formatDate";
import { CustomSelect } from "@/components/CustomSelect";

function displayMemberId(u: User): string {
  return u.member_id ?? `M${String(u.id).padStart(3, "0")}`;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "sales_agent", label: "Sales agent" },
] as const;

export default function TeamMemberProfilePage() {
  const params = useParams();
  const id = Number(params.id);
  const [me, setMe] = useState<User | null>(null);
  const [member, setMember] = useState<User | null>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "sales_agent" as string,
  });

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    try {
      const [profile, m] = await Promise.all([usersApi.me(), usersApi.getMember(id)]);
      setMe(profile);
      setMember(m);
      setForm({
        full_name: m.full_name,
        email: m.email,
        phone: m.phone ?? "",
        role: m.role,
      });
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
      setMember(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = me?.role === "admin";

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!member || !isAdmin) return;
    const fn = form.full_name.trim();
    const em = form.email.trim();
    if (!fn || !em) {
      setErr("Name and email are required.");
      return;
    }
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const updated = await usersApi.patchMember(member.id, {
        full_name: fn,
        email: em,
        phone: form.phone.trim() || null,
        role: form.role,
      });
      setMember(updated);
      setForm({
        full_name: updated.full_name,
        email: updated.email,
        phone: updated.phone ?? "",
        role: updated.role,
      });
      setOk("Member updated.");
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (!member) return;
    setForm({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone ?? "",
      role: member.role,
    });
    setEditing(false);
    setErr("");
  }

  if (!member && !err) {
    return <p className="font-medium text-neutral-500">Loading…</p>;
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <p className="font-semibold text-neutral-900">{err}</p>
        <Link href="/team" className="app-link text-sm">
          ← Team
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link href="/team" className="app-link text-sm">
          ← Team
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">{member.full_name}</h2>

          </div>
          {isAdmin && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {ok && (
        <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-900">
          {ok}
        </p>
      )}
      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
          {err}
        </p>
      )}

      {editing && isAdmin ? (
        <form
          onSubmit={onSave}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Full name *</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </div>
          <CustomSelect
            label="Role"
            value={form.role}
            onChange={(val) => setForm((f) => ({ ...f, role: val }))}
            options={ROLE_OPTIONS.map((r) => ({
              value: String(r.value),
              label: r.label,
            }))}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-neutral-100 pb-3">
              <dt className="font-medium text-neutral-500">Name</dt>
              <dd className="text-right font-semibold text-neutral-900">{member.full_name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-neutral-100 pb-3">
              <dt className="font-medium text-neutral-500">Email</dt>
              <dd className="text-right font-semibold text-neutral-900">{member.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-neutral-100 pb-3">
              <dt className="font-medium text-neutral-500">Phone</dt>
              <dd className="text-right font-semibold text-neutral-900">{member.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-neutral-100 pb-3">
              <dt className="font-medium text-neutral-500">Role</dt>
              <dd className="text-right font-semibold text-neutral-900">
                {(member.role || "").replace(/_/g, " ")}
              </dd>
            </div>

            <div className="flex justify-between gap-4 pt-1">
              <dt className="font-medium text-neutral-500">Join date</dt>
              <dd className="text-right font-semibold text-neutral-900">
                {member.created_at ? formatAppDateTime(member.created_at) : "—"}
              </dd>
            </div>
          </dl>
          {!isAdmin && (
            <p className="text-xs font-medium text-neutral-500">
              Only an admin can edit member details.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
