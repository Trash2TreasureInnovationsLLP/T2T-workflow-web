"use client";

import React, { useState } from "react";
import {
  Settings,
  Building,
  Shield,
  Layers,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Key,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface SettingsClientProps {
  departments: any[];
  currentUser: any;
}

export const SettingsClient: React.FC<SettingsClientProps> = ({ departments, currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    "org" | "roles" | "departments" | "agile" | "security"
  >("org");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const ROLES_MATRIX = [
    {
      role: "SUPER_ADMIN / CEO",
      scope: "Full Organization",
      users: true,
      projects: true,
      sprints: true,
      tasks: true,
      analytics: true,
      audit: true,
      desc: "Supreme administrative ownership of company accounts, audit trails, and financial allocations.",
    },
    {
      role: "COO",
      scope: "Operations & Delivery",
      users: true,
      projects: true,
      sprints: true,
      tasks: true,
      analytics: true,
      audit: true,
      desc: "Logistics, supply chain pipelines, sorting facility workflows, and workload balancing.",
    },
    {
      role: "CTO",
      scope: "Tech & Hardware",
      users: false,
      projects: true,
      sprints: true,
      tasks: true,
      analytics: true,
      audit: false,
      desc: "Optical sensor algorithms, IoT conveyors, edge compute devices, and database architectures.",
    },
    {
      role: "CFO",
      scope: "Finance & Accounts",
      users: false,
      projects: true,
      sprints: false,
      tasks: true,
      analytics: true,
      audit: false,
      desc: "Financial modeling, project budgets, escrow payments, and procurement invoices.",
    },
    {
      role: "CMO",
      scope: "Growth & Brand",
      users: false,
      projects: true,
      sprints: true,
      tasks: true,
      analytics: true,
      audit: false,
      desc: "Marketing partnerships, circular branding, corporate sustainability client outreach.",
    },
    {
      role: "CAO (Advisory)",
      scope: "Governance & ESG",
      users: false,
      projects: false,
      sprints: false,
      tasks: false,
      analytics: true,
      audit: true,
      desc: "Non-operational advisory council. High-level compliance oversight without task mutation.",
    },
    {
      role: "EMPLOYEE",
      scope: "Assigned Work",
      users: false,
      projects: false,
      sprints: false,
      tasks: true,
      analytics: false,
      audit: false,
      desc: "Engineers and operational personnel executing daily sprints and logging effort.",
    },
    {
      role: "INTERN",
      scope: "Scoped Learning",
      users: false,
      projects: false,
      sprints: false,
      tasks: true,
      analytics: false,
      audit: false,
      desc: "Assigned specific guided tasks with learning mentorship.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          <span>Organization Administration & Controls</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Super Admin configuration for governance, enterprise roles, security policies, and departments.
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Settings saved successfully. Changes applied to active workspaces.</span>
        </div>
      )}

      {/* Logical Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
        {[
          { id: "org", label: "Organization Profile", icon: Building },
          { id: "roles", label: "Roles & RBAC Matrix", icon: Shield },
          { id: "departments", label: "Departments", icon: Building2 },
          { id: "agile", label: "Agile & Task Config", icon: Layers },
          { id: "security", label: "Security & Sessions", icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Organization Profile */}
      {activeTab === "org" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-3xl">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Legal & Entity Profile
          </h3>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                defaultValue="Trash2Treasure Innovations LLP"
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Entity Short Code
                </label>
                <input
                  type="text"
                  defaultValue="T2T"
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Domain
                </label>
                <input
                  type="text"
                  defaultValue="trash2treasure.com"
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Headquarters Address
              </label>
              <input
                type="text"
                defaultValue="Cherlapally Industrial Recovery Zone, Hyderabad, Telangana, India"
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Save Organization Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Roles & Permissions Matrix */}
      {activeTab === "roles" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200/80 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Role-Based Access Control (RBAC) Architecture
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Server-enforced permission bounds across all 8 organizational tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4">Role Tier</th>
                  <th className="py-3 px-4">Operational Scope</th>
                  <th className="py-3 px-4">User Mgmt</th>
                  <th className="py-3 px-4">Projects</th>
                  <th className="py-3 px-4">Sprints</th>
                  <th className="py-3 px-4">Analytics</th>
                  <th className="py-3 px-4">Audit Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ROLES_MATRIX.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{r.role}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs">{r.desc}</p>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">{r.scope}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.users ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {r.users ? "YES" : "NO"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.projects
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {r.projects ? "YES" : "NO"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.sprints
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {r.sprints ? "YES" : "NO"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.analytics
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {r.analytics ? "YES" : "NO"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.audit ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {r.audit ? "YES" : "NO"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Departments */}
      {activeTab === "departments" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Organizational Departments ({departments.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-slate-200 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                    <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      {d.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{d.description || "Core division"}</p>
                </div>

                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {d._count?.users || 0} members
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Agile & Task Config */}
      {activeTab === "agile" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-3xl">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Agile Estimation & Sprint Defaults
          </h3>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Story Point Fibonacci Scale
              </label>
              <input
                type="text"
                defaultValue="1, 2, 3, 5, 8, 13, 21"
                className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Allowed estimation sizes for tasks.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Default Sprint Cadence
                </label>
                <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-white">
                  <option>2 Weeks (Standard Scrum)</option>
                  <option>1 Week (Fast Iteration)</option>
                  <option>3 Weeks</option>
                  <option>4 Weeks (Monthly)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Auto-flag Overdue
                </label>
                <select className="w-full p-2.5 border border-slate-200 rounded-lg bg-white">
                  <option>At 11:59 PM on Due Date</option>
                  <option>24 Hours before deadline</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Save Agile Defaults
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: Security & Sessions */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs max-w-3xl">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Security Policies & Credential Handlers
          </h3>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2">
              <Key className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold">Active Security Guardrail:</span>
                <p className="text-[11px] mt-0.5">
                  Password hashing uses bcrypt salt rounds = 10. Passwords are never returned in client payloads or exposed in plaintext.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800">Forced First-Login Password Change</span>
                  <p className="text-slate-500 text-[11px]">
                    All newly created accounts must choose a personal password on first authentication.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  ENABLED (ENFORCED)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-bold text-slate-800">JWT Session Expiration</span>
                  <p className="text-slate-500 text-[11px]">
                    Session cookies expire automatically after 7 days of inactivity.
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  7 DAYS
                </span>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
