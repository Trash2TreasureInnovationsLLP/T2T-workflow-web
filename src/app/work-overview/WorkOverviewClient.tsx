"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  History,
  Clock,
  Calendar,
  CheckCircle2,
  FolderKanban,
  Zap,
  ArrowRight,
  AlertTriangle,
  Flag,
  User,
} from "lucide-react";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface WorkOverviewClientProps {
  past: {
    completedTasks: any[];
    completedProjects: any[];
    pastSprints: any[];
  };
  current: {
    activeProjects: any[];
    inProgressTasks: any[];
    currentSprints: any[];
  };
  future: {
    upcomingTasks: any[];
    upcomingProjects: any[];
    plannedSprints: any[];
    upcomingMilestones: any[];
  };
}

export const WorkOverviewClient: React.FC<WorkOverviewClientProps> = ({
  past,
  current,
  future,
}) => {
  const [activeTab, setActiveTab] = useState<"current" | "past" | "future">("current");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Company Work Overview</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete panoramic visibility across past deliverables, active execution, and future roadmap.
          </p>
        </div>

        {/* 3-Stage Stage Switcher Tabs */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "current"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Current Work</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "current" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {current.inProgressTasks.length + current.activeProjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("past")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "past"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Past Work</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "past" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {past.completedTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("future")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "future"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Future Work</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "future" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {future.upcomingTasks.length + future.upcomingProjects.length}
            </span>
          </button>
        </div>
      </div>

      {/* ===================== TAB: CURRENT WORK ===================== */}
      {activeTab === "current" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Active Projects Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-600" />
                <span>Active Projects & Deliverables ({current.activeProjects.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {current.activeProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                          {project.projectId}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{project.name}</h3>
                      </div>
                      <PriorityBadge priority={project.priority} />
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {project.description}
                    </p>

                    {project.blockers && (
                      <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>Blocker: {project.blockers}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-medium">Completion Progress</span>
                      <span className="font-bold text-emerald-600">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Lead: {project.manager.fullName}</span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current In-Progress & Blocked Tasks */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Tasks In Progress & Under Review ({current.inProgressTasks.length})</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    <th className="py-3 px-3">Task</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Assignee</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3">Blockers / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {current.inProgressTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 leading-snug">{t.title}</div>
                        <span className="font-mono text-xs text-slate-400 font-medium">{t.taskId}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">{t.project.name}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={t.assignee} size="xs" />
                          <span className="text-slate-800 font-medium">
                            {t.assignee?.fullName || "Unassigned"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3 text-slate-600">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "--"}
                      </td>
                      <td className="py-3">
                        {t.blockers ? (
                          <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                            {t.blockers}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: PAST WORK ===================== */}
      {activeTab === "past" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Completed Projects */}
          {past.completedProjects.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Completed Projects ({past.completedProjects.length})</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {past.completedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 flex items-start justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                        {p.projectId}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 mt-1">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                      <p className="text-[11px] text-slate-400 mt-2">
                        Led by {p.manager.fullName} • Completed on {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="brand">COMPLETED</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>Completed Deliverables & Tasks Archive ({past.completedTasks.length})</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    <th className="py-3 px-3">Task ID & Title</th>
                    <th className="py-3 px-3">Project</th>
                    <th className="py-3 px-3">Completed By</th>
                    <th className="py-3 px-3">Effort</th>
                    <th className="py-3 px-3">Completed Date</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {past.completedTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 leading-snug">{t.title}</div>
                        <span className="font-mono text-xs text-slate-400 font-medium">{t.taskId}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">{t.project.name}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={t.assignee} size="xs" />
                          <span className="text-slate-800 font-medium">
                            {t.assignee?.fullName || "Team"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {t.actualEffort || t.estimatedEffort} hrs ({t.storyPoints} pts)
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {t.completedAt
                          ? new Date(t.completedAt).toLocaleDateString()
                          : new Date(t.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status="COMPLETED" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB: FUTURE WORK ===================== */}
      {activeTab === "future" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Upcoming Milestones */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-600" />
              <span>Upcoming Project Milestones ({future.upcomingMilestones.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {future.upcomingMilestones.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-amber-100 bg-amber-50/20">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      Due {new Date(m.dueDate).toLocaleDateString()}
                    </span>
                    <Badge variant="warning">PENDING</Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">{m.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">Project: {m.project.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Planned Sprints */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" />
              <span>Planned Upcoming Sprints ({future.plannedSprints.length})</span>
            </h2>

            <div className="space-y-3">
              {future.plannedSprints.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{s.name}</span>
                    <p className="text-slate-500 mt-0.5">{s.goal}</p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Target Window: {new Date(s.startDate).toLocaleDateString()} to{" "}
                      {new Date(s.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="default">PLANNED</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Backlog & Upcoming Tasks */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Backlog & Scheduled Next Tasks ({future.upcomingTasks.length})</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Task ID & Title</th>
                    <th className="pb-3 font-semibold">Project</th>
                    <th className="pb-3 font-semibold">Assignee</th>
                    <th className="pb-3 font-semibold">Priority</th>
                    <th className="pb-3 font-semibold">Target Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {future.upcomingTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">{t.title}</div>
                        <span className="font-mono text-[10px] text-slate-400">{t.taskId}</span>
                      </td>
                      <td className="py-3 text-slate-600">{t.project.name}</td>
                      <td className="py-3 text-slate-800">
                        {t.assignee?.fullName || "Pending Assignment"}
                      </td>
                      <td className="py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 text-slate-600">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Unscheduled"}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
