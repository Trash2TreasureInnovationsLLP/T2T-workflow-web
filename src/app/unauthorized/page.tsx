import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F7FDF8] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your assigned role does not have operational clearance to access this module.
          If you believe this is in error, please contact your Super Admin.
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
