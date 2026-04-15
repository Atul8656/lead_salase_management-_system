"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import type { MemberCreatedResponse, User } from "@/lib/types";

export default function TeamPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<MemberCreatedResponse | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    surname: "",
    email: "",
    phone: "",
  });

  const load = useCallback(async () => {
    try {
      const [list, profile] = await Promise.all([usersApi.assignees(), usersApi.me()]);
      setUsers(list);
      setMe(profile);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = me?.role === "admin";

  async function openModal() {
    setCreated(null);
    setForm({ first_name: "", last_name: "", surname: "", email: "", phone: "" });
    setModal(true);
    setErr("");
  }

  async function submitMember(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const res = await usersApi.createMember({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setCreated(res);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not add member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Team</h2>
          <p className="text-sm font-medium text-neutral-500">
            People on your team who can be assigned to leads.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openModal}
            className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Add member
          </button>
        )}
      </div>

      {err && (
        <p className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 text-sm font-medium text-neutral-800">
          {err}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Mobile</th>
              <th className="px-6 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((u) => (
              <tr
                key={u.id}
                className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-100/80"
                onClick={() => router.push(`/team/${u.id}`)}
              >
                <td className="px-6 py-3 font-semibold text-neutral-900">{u.id}</td>
                <td className="px-6 py-3 font-semibold text-neutral-900">{u.full_name}</td>
                <td className="px-6 py-3 font-medium text-neutral-600">{u.email}</td>
                <td className="px-6 py-3 font-medium text-neutral-600">{u.phone ?? "—"}</td>
                <td className="px-6 py-3 font-medium text-neutral-600">
                  {(u.role || "").replace(/_/g, " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add team member"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">Add member</h3>

            {created ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="font-medium text-neutral-800">
                  {created.full_name}
                </p>
                <p className="text-neutral-600">
                  Temporary password:{" "}
                  <span className="font-semibold text-neutral-900">{created.generated_password}</span>
                </p>
                <p className="text-xs text-neutral-500">Share securely; they can change it in Account settings.</p>
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white"
                  onClick={() => setModal(false)}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submitMember} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-black">First name *</label>
                  <input
                    required
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black">Last name *</label>
                  <input
                    required
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black">Surname</label>
                  <input
                    value={form.surname}
                    onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-black">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black">Mobile number *</label>
                  <input
                    required
                    minLength={5}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Create member"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal(false)}
                    className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
