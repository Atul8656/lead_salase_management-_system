"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const u = await usersApi.me();
    setMe(u);
    setFullName(u.full_name);
    setEmail(u.email);
  }, []);

  useEffect(() => {
    load().catch((e) => setErr(e instanceof Error ? e.message : "Failed to load profile"));
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        full_name: fullName,
        email,
      };
      if (newPassword.trim()) {
        body.current_password = currentPassword;
        body.new_password = newPassword;
      }
      const u = await usersApi.patchMe(body);
      setMe(u);
      setCurrentPassword("");
      setNewPassword("");
      setOk("Profile updated.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (!me && !err) {
    return <p className="font-medium text-neutral-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link href="/dashboard" className="app-link text-sm">
          ← Dashboard
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-neutral-900">Profile</h2>
        <p className="text-sm font-medium text-neutral-500">
          Account details and password · same logo as the sidebar
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-neutral-200">
          <Image
            src="/brand-mark.png"
            alt=""
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <div>
          <p className="font-bold text-neutral-900">{me?.full_name}</p>
          <p className="text-sm text-neutral-600">{me?.email}</p>
          <p className="text-xs font-semibold uppercase text-neutral-500">
            Role: {me?.role?.replace("_", " ")}
            {me?.login_id ? ` · ${me.login_id}` : ""}
          </p>
        </div>
      </div>

      <form
        onSubmit={onSave}
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-900">
            {err}
          </p>
        )}
        {ok && (
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm font-semibold text-neutral-900">
            {ok}
          </p>
        )}
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900"
          />
        </div>
        <div className="border-t border-neutral-200 pt-4">
          <p className="text-sm font-semibold text-neutral-800">Change password</p>
          <p className="text-xs text-neutral-500">Leave blank to keep current password.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-900"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-neutral-900 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
