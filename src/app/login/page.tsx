"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please contact your Super Admin if you need access.");
        setLoading(false);
        return;
      }

      if (data.mustChangePassword) {
        router.push("/change-password");
      } else if (data.user?.role === "EMPLOYEE" || data.user?.role === "INTERN") {
        router.push("/my-work");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError("An unexpected connection error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FDF8] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* T2T Brand Logo */}
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-white shadow-sm border border-emerald-100 mb-4">
          <Image
            src="/t2t-logo.png"
            alt="Trash2Treasure Innovations"
            width={84}
            height={84}
            className="object-contain"
            priority
          />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Trash2Treasure Innovations LLP
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 max-w-sm mx-auto">
          Internal Operations & Agile Work Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-emerald-950/5 rounded-2xl sm:px-10 border border-slate-200/90">
          {error && (
            <div className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email or Employee ID
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  placeholder="name@trash2treasure.com or T2T-001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/60 hover:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Account Password
                </label>
              </div>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/60 hover:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Organization Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50/80 p-3 rounded-xl border">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700">Authorized Personnel Only</span>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                Login accounts and initial credentials are issued directly by the T2T Super Admin. All actions are monitored via the immutable audit trail.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          <p>© 2026 Trash2Treasure Innovations LLP. All rights reserved.</p>
          <p className="text-[11px] mt-0.5">Confidential Internal Operations Platform</p>
        </div>
      </div>
    </div>
  );
}
