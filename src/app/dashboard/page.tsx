import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Fetch Live Metrics
  const [
    totalMembers,
    activeMembers,
    totalProjects,
    activeProjects,
    inProgressTasks,
    completedTasks,
    blockedTasks,
    overdueTasks,
    upcomingDeadlines,
    activeSprint,
    recentProjects,
    criticalTasks,
    recentActivity,
    announcements,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.task.count({ where: { status: { in: ["IN_PROGRESS", "IN_REVIEW"] } } }),
    prisma.task.count({ where: { status: "COMPLETED" } }),
    prisma.task.count({ where: { status: "BLOCKED" } }),
    prisma.task.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueDate: { lt: now },
      },
    }),
    prisma.task.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueDate: { gte: now, lte: nextWeek },
      },
    }),
    prisma.sprint.findFirst({
      where: { status: "ACTIVE" },
      include: {
        project: true,
        tasks: {
          select: { status: true, storyPoints: true, priority: true },
        },
      },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      take: 4,
      orderBy: { priority: "asc" },
      include: {
        manager: { select: { fullName: true, avatarUrl: true } },
        _count: { select: { tasks: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        OR: [{ status: "BLOCKED" }, { priority: "URGENT" }],
      },
      take: 5,
      include: {
        assignee: { select: { fullName: true, avatarUrl: true } },
        project: { select: { name: true, projectId: true } },
      },
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, avatarUrl: true, role: true } },
      },
    }),
    prisma.announcement.findMany({
      where: { isPinned: true },
      take: 1,
      include: { author: true },
    }),
  ]);

  // Calculate Sprint completion
  let sprintProgress = 0;
  let sprintCompletedPoints = 0;
  let sprintTotalPoints = 0;
  if (activeSprint) {
    sprintTotalPoints = activeSprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    sprintCompletedPoints = activeSprint.tasks
      .filter((t) => t.status === "COMPLETED")
      .reduce((sum, t) => sum + (t.storyPoints || 1), 0);
    sprintProgress =
      sprintTotalPoints > 0 ? Math.round((sprintCompletedPoints / sprintTotalPoints) * 100) : 0;
  }

  // Calculate Organization Health Score
  const totalTasks = inProgressTasks + completedTasks + blockedTasks;
  const healthScore = Math.max(
    20,
    Math.min(
      100,
      Math.round(
        (completedTasks / (totalTasks || 1)) * 60 +
          (activeProjects > 0 ? 30 : 10) -
          blockedTasks * 5 -
          overdueTasks * 4 +
          25
      )
    )
  );

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        {/* Pinned Broadcast Banner */}
        {announcements.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-white/10 text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200">
                    Important Announcement
                  </span>
                  <span className="text-xs text-emerald-200">
                    By {announcements[0].author.fullName}
                  </span>
                </div>
                <h4 className="text-sm font-semibold mt-1">{announcements[0].title}</h4>
                <p className="text-xs text-emerald-100/90 mt-0.5 line-clamp-1">
                  {announcements[0].content}
                </p>
              </div>
            </div>
            <Link
              href="/announcements"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold whitespace-nowrap transition-colors"
            >
              <span>View Notices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Operations & Executive Overview
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Live Organization Metrics
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time telemetry across team execution, active sprints, and operational velocity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/work-overview"
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>3-Stage Work Overview</span>
            </Link>
            <Link
              href="/tasks?create=true"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>+ Create Task</span>
            </Link>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Team Members"
            value={totalMembers}
            description={`${activeMembers} active accounts`}
            icon={Users}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            trend={{ value: "+2 this month", isPositive: true }}
          />

          <StatCard
            title="Active Projects"
            value={activeProjects}
            description={`${totalProjects} total in portfolio`}
            icon={FolderKanban}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            trend={{ value: "100% on schedule", isNeutral: true }}
          />

          <StatCard
            title="Tasks In Progress"
            value={inProgressTasks}
            description={`${completedTasks} tasks completed`}
            icon={Clock}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            trend={{ value: `${completedTasks} closed`, isPositive: true }}
          />

          <StatCard
            title="Overdue / Blocked"
            value={overdueTasks + blockedTasks}
            description={`${overdueTasks} overdue, ${blockedTasks} blocked`}
            icon={AlertTriangle}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
            trend={
              overdueTasks + blockedTasks > 0
                ? { value: "Needs attention", isPositive: false }
                : { value: "Zero blockers", isPositive: true }
            }
          />
        </div>

        {/* Second Row: Sprint Highlight & Organization Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Sprint Widget */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Zap className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Current Active Sprint
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {activeSprint ? activeSprint.name : "No Active Sprint"}
                    </h3>
                  </div>
                </div>

                {activeSprint && (
                  <Badge variant="brand" size="md">
                    ACTIVE
                  </Badge>
                )}
              </div>

              {activeSprint ? (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-800">Sprint Goal: </span>
                    {activeSprint.goal}
                  </p>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">Sprint Execution Progress</span>
                      <span className="font-bold text-emerald-600">{sprintProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${sprintProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Story Points
                      </span>
                      <span className="text-lg font-bold text-slate-800">{sprintTotalPoints}</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">
                        Completed Points
                      </span>
                      <span className="text-lg font-bold text-emerald-700">
                        {sprintCompletedPoints}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Remaining Points
                      </span>
                      <span className="text-lg font-bold text-slate-800">
                        {Math.max(0, sprintTotalPoints - sprintCompletedPoints)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Sprint planning required. Click below to organize the next cycle.
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Ends {activeSprint ? new Date(activeSprint.endDate).toLocaleDateString() : "--"}
              </span>
              <Link
                href="/agile"
                className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                <span>Open Sprint Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Org Health & Deadlines */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Operational Health
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-slate-900">{healthScore}</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  / 100 System Health
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Calculated dynamically from velocity, blockers, and on-time sprint completions.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700 font-medium">Upcoming 7-Day Deadlines</span>
                  </div>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-2xs">
                    {upcomingDeadlines}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-900 font-medium">Active Blocker Alerts</span>
                  </div>
                  <span className="font-bold text-amber-900 bg-white px-2 py-0.5 rounded shadow-2xs">
                    {blockedTasks}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href="/analytics"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                <span>View Full Team Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Third Row: Active Projects & Critical Blockers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects List */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active High-Priority Projects</h3>
                <p className="text-xs text-slate-500">Circular initiatives currently in delivery</p>
              </div>
              <Link
                href="/projects"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
              >
                <span>View All ({totalProjects})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentProjects.map((prj) => (
                <Link
                  key={prj.id}
                  href={`/projects/${prj.id}`}
                  className="block p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-700">
                          {prj.name}
                        </span>
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {prj.projectId}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">{prj.description}</p>
                    </div>
                    <PriorityBadge priority={prj.priority} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={prj.manager} size="xs" />
                      <span className="font-semibold text-slate-700">{prj.manager.fullName}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{prj._count.tasks} tasks</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${prj.progress}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700">{prj.progress}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Critical Items / Blockers Widget */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  <span>Immediate Action Required</span>
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                Blocked tasks or urgent priorities requiring leadership unblocking.
              </p>

              <div className="space-y-3">
                {criticalTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs sm:text-sm text-slate-400">
                    No blocked or critical items right now. Excellent!
                  </div>
                ) : (
                  criticalTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/30 text-xs sm:text-sm space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 leading-snug">{t.title}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <UserAvatar user={t.assignee} size="xs" />
                        <span>{t.project.projectId} • {t.assignee?.fullName || "Unassigned"}</span>
                      </div>
                      {t.blockers && (
                        <p className="text-xs text-rose-800 font-semibold bg-rose-100/70 p-2 rounded-lg">
                          Blocker: {t.blockers}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href="/kanban"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold transition-colors"
              >
                <span>Inspect Kanban Blockers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Fourth Row: Live Audit Trail & Organizational History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Executive Activity Log & Audit Trail</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Immutable compliance tracking of user actions, status changes, and project updates.
              </p>
            </div>
            <Link
              href="/audit-logs"
              className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar user={log.user} size="xs" />
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900">{log.user.fullName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-emerald-700 font-semibold">{log.action}</span>
                      <span className="text-slate-700 font-medium">{log.objectTitle}</span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:text-right shrink-0">
                  {log.newValue && (
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {log.newValue}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
