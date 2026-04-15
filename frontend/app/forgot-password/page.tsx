"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  forgotPasswordSendOtpRequest,
  forgotPasswordResetRequest,
} from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await forgotPasswordSendOtpRequest({ email: email.trim() });
      setOtpSent(true);
      setSuccess(res.message || "OTP sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await forgotPasswordResetRequest({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      setSuccess(res.message || "Password reset successful");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
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
      </div>

      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-center text-xl font-bold text-neutral-900 sm:text-2xl">Forgot password</h1>
        <p className="mt-2 text-center text-sm font-medium text-neutral-600">
          Enter your email to receive OTP, then set a new password.
        </p>

        <form onSubmit={otpSent ? onResetPassword : onSendOtp} className="mt-8 space-y-4">
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

          {otpSent && (
            <>
              <div>
                <label className="block text-xs font-semibold text-neutral-700">OTP</label>
                <input
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700">New password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 font-medium text-neutral-900 outline-none focus:border-neutral-900"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm font-semibold text-neutral-900">{error}</p>}
          {success && <p className="text-sm font-semibold text-green-700">{success}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim() || (otpSent && (!otp.trim() || !newPassword.trim()))}
            className="w-full rounded-xl bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Please wait..." : otpSent ? "Reset password" : "Send OTP"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-neutral-600">
          Back to{" "}
          <Link href="/login" className="app-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
