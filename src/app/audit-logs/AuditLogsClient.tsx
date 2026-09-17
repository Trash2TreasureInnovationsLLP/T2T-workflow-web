"use client";

import React, { useState } from "react";
import { ShieldAlert, Search, Filter, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface AuditLogsClientProps {
  initialLogs: any[];
  currentUser: any;
}

export const AuditLogsClient: React.FC<AuditLogsClientProps> = ({ initialLogs, currentUser }) => {
  const [logs, setLogs] = useState<any[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== "ALL" && l.action !== actionFilter) return false;
    if (typeFilter !== "ALL" && l.objectType !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.user.fullName.toLowerCase().includes(q) ||
        l.objectTitle.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATED":
        return <Badge variant="brand">CREATED</Badge>;
      case "COMPLETED":
        return <Badge variant="success">COMPLETED</Badge>;
      case "STATUS_CHANGE":
        return <Badge variant="info">STATUS CHANGE</Badge>;
      case "DELETED":
        return <Badge variant="danger">DELETED</Badge>;
      case "PASSWORD_CHANGE":
        return <Badge variant="warning">PASSWORD</Badge>;
      case "LOGIN":
        return <Badge variant="default">LOGIN</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            <span>Executive Audit Trail & Activity Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable organizational compliance record tracking all mutations, status transitions, and user management events.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by user, object title, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 hover:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATED">Created</option>
            <option value="UPDATED">Updated</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="COMPLETED">Completed</option>
            <option value="PASSWORD_CHANGE">Password Change</option>
            <option value="LOGIN">Login</option>
            <option value="DELETED">Deleted</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Entity Types</option>
            <option value="TASK">Tasks</option>
            <option value="PROJECT">Projects</option>
            <option value="SPRINT">Sprints</option>
            <option value="USER">Users</option>
            <option value="ANNOUNCEMENT">Announcements</option>
            <option value="DOCUMENT">Documents</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Object</th>
                <th className="py-3 px-4">State Transition (Old → New)</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No activity logs found for this search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.user.fullName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.user.employeeId} ({log.user.role})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{log.objectTitle}</div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Type: {log.objectType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.previousValue || log.newValue ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {log.previousValue && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {log.previousValue}
                            </span>
                          )}
                          {log.previousValue && log.newValue && (
                            <span className="text-slate-400">→</span>
                          )}
                          {log.newValue && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                              {log.newValue}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">--</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {log.details || "--"}
                    </td>
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
