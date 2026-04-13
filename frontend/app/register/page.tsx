"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerRequest, loginRequest, setToken } from "@/lib/api";
import type { UserRegisteredResponse } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<UserRegisteredResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await registerRequest({ email, full_name: fullName });
      setCreated(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function goToDashboard() {
    if (!created) return;
    setLoading(true);
    try {
      const data = await loginRequest(created.email, created.generated_password);
      setToken(data.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-4 py-10">
        <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <Image src="/brand-mark.png" alt="SALENLO" width={32} height={32} className="object-contain" />
          </div>
          <p className="text-lg font-bold text-neutral-900">SALENLO</p>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-center text-xl font-bold text-neutral-900">Account created</h1>
          <p className="mt-2 text-center text-sm font-medium text-neutral-600">
            Save your sign-in details below. You can change your password anytime from the account menu after you
            sign in.
          </p>
          <dl className="mt-6 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-neutral-500">Email</dt>
              <dd className="text-right font-semibold text-neutral-900">{created.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-neutral-500">Password</dt>
              <dd className="text-right font-semibold text-neutral-900">{created.generated_password}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-neutral-500">Member ID</dt>
              <dd className="font-semibold text-neutral-900">{created.login_id}</dd>
            </div>
          </dl>
          {error && <p className="mt-4 text-sm font-semibold text-neutral-900">{error}</p>}
          <button
            type="button"
            onClick={goToDashboard}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Opening…" : "Continue to dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <Image src="/brand-mark.png" alt="SALENLO" width={32} height={32} className="object-contain" />
        </div>
        <p className="text-xl font-bold tracking-tight text-neutral-900">SALENLO</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Sales &amp; lead management</p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-xl font-bold text-neutral-900 sm:text-2xl">Create account</h1>
        <p className="mt-2 text-center text-sm font-medium text-neutral-600">
          A starter password is created from your name. You will see it once after registration so you can sign in.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 outline-none focus:border-neutral-900"
            />
          </div>
          {error && (
            <p className="text-sm font-semibold text-neutral-900" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm font-medium text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="app-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
