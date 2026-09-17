"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FDF8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-sm border border-emerald-100 mb-3">
          <Image
            src="/t2t-logo.png"
            alt="Trash2Treasure Innovations"
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Security Update Required
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Please update your temporary password to secure your account.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Password updated successfully! Redirecting to workspace...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Current / Temporary Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current or temporary password"
                  className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                New Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-2 py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating Credentials..." : "Update Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
