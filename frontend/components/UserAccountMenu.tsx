"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { clearToken, usersApi } from "@/lib/api";
import { useAuthUser } from "@/contexts/AuthUserContext";

type Props = {
  variant: "sidebar" | "header";
};

export default function UserAccountMenu({ variant }: Props) {
  const { user, loading, onUserUpdated } = useAuthUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPwOpen(false);
    setPwErr("");
    setPwOk("");
    setCurrentPassword("");
    setNewPassword("");
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close();
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);

  function signOut() {
    clearToken();
    close();
    router.push("/login");
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwErr("");
    setPwOk("");
    if (!newPassword.trim()) {
      setPwErr("Enter a new password.");
      return;
    }
    if (newPassword.trim().length < 8) {
      setPwErr("New password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    try {
      const u = await usersApi.patchMe({
        current_password: currentPassword,
        new_password: newPassword.trim(),
      });
      onUserUpdated(u);
      setCurrentPassword("");
      setNewPassword("");
      setPwOk("Password updated.");
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPwSaving(false);
    }
  }

  const panel = open && (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg"
      role="dialog"
      aria-label="Account menu"
    >
      {user && (
        <div className="border-b border-neutral-100 pb-3">
          <p className="font-semibold text-neutral-900">{user.full_name}</p>
          <p className="truncate text-sm text-neutral-600">{user.email}</p>
          <p className="mt-1 text-xs font-medium text-neutral-500">
            {(user.role || "").replace(/_/g, " ")}
          </p>
        </div>
      )}

      <div className="pt-3">
        <Link
          href="/profile"
          className="block rounded-xl px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          onClick={() => close()}
        >
          My Profile
        </Link>
        <button
          type="button"
          className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
          onClick={() => setPwOpen((v) => !v)}
        >
          {pwOpen ? "Hide password form" : "Change password"}
        </button>
      </div>

      {pwOpen && (
        <form onSubmit={onPasswordSubmit} className="mt-3 space-y-3 border-t border-neutral-100 pt-3">
          {pwErr && (
            <p className="text-sm font-medium text-red-800" role="alert">
              {pwErr}
            </p>
          )}
          {pwOk && (
            <p className="text-sm font-medium text-green-800" role="status">
              {pwOk}
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
            <label className="block text-xs font-semibold text-neutral-700">New password (min 8)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pwSaving ? "Saving…" : "Update password"}
          </button>
        </form>
      )}

      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </div>
  );

  if (variant === "header") {
    return (
      <div ref={rootRef} className="relative shrink-0 md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full ring-1 ring-neutral-200 hover:ring-neutral-400"
          aria-expanded={open}
          aria-haspopup="dialog"
          title="Account"
        >
          <UserAvatar user={user} loading={loading} />
        </button>
        {panel}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full ring-1 ring-neutral-200 hover:ring-neutral-400 focus-visible:outline focus-visible:ring-2 focus-visible:ring-neutral-900"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        <UserAvatar user={user} loading={loading} />
      </button>
      {open && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-1 w-[min(100vw-2rem,16rem)] -translate-x-1/2 rounded-xl border-[0.5px] border-neutral-200 bg-white p-1 shadow-none"
          role="menu"
        >
          <Link
            href="/profile"
            role="menuitem"
            className="block rounded-lg px-4 py-2 text-[13px] font-medium text-neutral-900 hover:bg-[var(--color-background-secondary)]"
            onClick={() => close()}
          >
            My Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-lg px-4 py-2 text-left text-[13px] font-medium text-neutral-900 hover:bg-[var(--color-background-secondary)]"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
