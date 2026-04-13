"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import { useAuthUser } from "@/contexts/AuthUserContext";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { onUserUpdated } = useAuthUser();
  const [me, setMe] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwConfirmErr, setPwConfirmErr] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [okProfile, setOkProfile] = useState("");
  const [okPw, setOkPw] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const load = useCallback(async () => {
    const u = await usersApi.me();
    setMe(u);
    setFullName(u.full_name);
    setEmail(u.email);
    setPhone(u.phone ?? "");
    setAvatarUrl(u.avatar_url ?? "");
  }, []);

  useEffect(() => {
    load().catch((e) => setLoadErr(e instanceof Error ? e.message : "Failed to load profile"));
  }, [load]);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr("");
    setOkProfile("");
    setSavingProfile(true);
    try {
      const u = await usersApi.patchMe({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      setMe(u);
      onUserUpdated(u);
      setOkProfile("Profile updated successfully");
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr("");
    setOkPw("");
    setPwConfirmErr("");
    if (!currentPassword.trim()) {
      setPwErr("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setPwErr("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwConfirmErr("Passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      const u = await usersApi.patchMe({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMe(u);
      onUserUpdated(u);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOkPw("Password updated successfully");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed";
      if (msg.toLowerCase().includes("current password") || msg.toLowerCase().includes("incorrect")) {
        setPwErr("Current password is incorrect");
      } else {
        setPwErr(msg);
      }
    } finally {
      setSavingPw(false);
    }
  }

  if (!me && !loadErr) {
    return <p className="font-medium text-neutral-500">Loading…</p>;
  }

  if (!me) {
    return <p className="font-semibold text-red-800">{loadErr}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[480px] space-y-6 px-4 py-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
      >
        ← Back
      </button>

      <div className="rounded-xl border-[0.5px] border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <UserAvatar user={me} loading={false} sizeClass="h-14 w-14" textClass="text-lg" />
          <p className="mt-4 text-lg font-medium text-neutral-900">{me.full_name}</p>
          <p className="mt-1 text-sm text-neutral-500">{me.email}</p>
        </div>
        <hr className="my-6 border-neutral-200" />
        <form onSubmit={onSaveProfile} className="space-y-4">
          {okProfile && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              {okProfile}
            </p>
          )}
          {profileErr && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
              {profileErr}
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Profile photo URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-900"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500">Role</p>
            <p className="mt-1 text-sm font-medium text-neutral-800">
              {(me.role || "").replace(/_/g, " ")}
            </p>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border-[0.5px] border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">Change password</h2>
        <form onSubmit={onSavePassword} className="mt-4 space-y-4">
          {okPw && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              {okPw}
            </p>
          )}
          {pwErr && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
              {pwErr}
            </p>
          )}
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            {pwConfirmErr && (
              <p className="mt-1 text-sm font-medium text-red-700">{pwConfirmErr}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingPw ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
