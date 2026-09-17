"use client";

import React, { useState, useEffect } from "react";
import { Users, Filter, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface PerformanceClientProps {
  departments: any[];
  currentUser: any;
}

export const PerformanceClient: React.FC<PerformanceClientProps> = ({
  departments,
  currentUser,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    fetch(`/api/users/performance?departmentId=${departmentFilter}&role=${roleFilter}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [departmentFilter, roleFilter]);

  const getWorkloadBadge = (status: string) => {
    switch (status) {
      case "CAPACITY_WARNING":
        return <Badge variant="danger">High Load (Capacity Warning)</Badge>;
      case "ELEVATED":
        return <Badge variant="warning">Moderate Workload</Badge>;
      case "BALANCED":
      default:
        return <Badge variant="brand">Balanced Capacity</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Member Performance & Workload Balancing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Constructive team workload distribution, delivery metrics, and capacity analysis.
          </p>
        </div>
      </div>

      {/* Constructive analytics notice */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Operational Philosophy:</span>
          <p className="text-emerald-800 text-[11px] mt-0.5">
            T2T uses performance analytics for work visibility, preventing member burnout, and ensuring healthy sprint velocity. We do not use destructive competitive rankings.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Team:</span>
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
        >
          <option value="ALL">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin / CEO</option>
          <option value="COO">COO</option>
          <option value="CTO">CTO</option>
          <option value="CFO">CFO</option>
          <option value="CMO">CMO</option>
          <option value="CAO">CAO</option>
          <option value="EMPLOYEE">Employees</option>
          <option value="INTERN">Interns</option>
        </select>
      </div>

      {/* Members Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Active Load</th>
                <th className="py-3 px-4">Points Delivered</th>
                <th className="py-3 px-4">Completion Rate</th>
                <th className="py-3 px-4">On-Time Rate</th>
                <th className="py-3 px-4">Workload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 animate-pulse">
                    Calculating workload analytics...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No team members found for this filter.
                  </td>
                </tr>
              ) : (
                data.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={m} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{m.fullName}</div>
                          <span className="font-mono text-xs text-slate-500 font-medium">
                            {m.employeeId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{m.designation}</div>
                      <span className="text-[10px] text-slate-400">
                        {m.department} • {m.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800">
                        {m.inProgressCount} in progress
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {m.activeWorkloadPoints} story pts queued
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {m.storyPointsCompleted} pts
                      <span className="text-[10px] text-slate-400 font-normal block">
                        ({m.completedCount} tasks)
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${m.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{m.completionRate}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-700">{m.onTimeRate}%</td>

                    <td className="py-3.5 px-4">{getWorkloadBadge(m.workloadStatus)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
