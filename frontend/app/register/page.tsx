"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { sendOtpRequest, verifyOtpRequest } from "@/lib/api";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await sendOtpRequest({ email });
      setOtpSent(true);
      setSuccess("OTP sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }
    setLoading(true);
    try {
      await verifyOtpRequest({ email, otp, full_name: fullName });
      setSuccess("Account created successfully. Please check your email for password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
    } finally {
      setLoading(false);
    }
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
          Enter your email and full name to receive OTP. Account is created only after OTP verification.
        </p>
        <form onSubmit={otpSent ? onVerifyOtp : onSendOtp} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-black">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 outline-none focus:border-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-black">Full name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 outline-none focus:border-neutral-900"
            />
          </div>
          {otpSent && (
            <div>
              <label className="block text-xs font-semibold text-black">OTP</label>
              <input
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 outline-none focus:border-neutral-900"
              />
            </div>
          )}
          {error && (
            <p className="text-sm font-semibold text-neutral-900" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm font-semibold text-green-700" role="status">
              {success}
            </p>
          )}
          <button
            type="submit"
            disabled={
              loading ||
              !email.trim() ||
              !fullName.trim() ||
              (otpSent && !otp.trim())
            }
            className="w-full rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Please wait…" : otpSent ? "Register" : "Get OTP"}
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
