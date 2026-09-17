"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Play,
  Check,
  ShieldAlert,
  History,
  Search,
  RotateCcw,
  FileText,
} from "lucide-react";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";

interface MyWorkClientProps {
  user: any;
  tasks: any[];
  projects: any[];
  activity: any[];
  notifications: any[];
}

export const MyWorkClient: React.FC<MyWorkClientProps> = ({
  user,
  tasks: initialTasks,
  projects,
  activity,
  notifications,
}) => {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [blockerModalOpen, setBlockerModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [blockerText, setBlockerText] = useState("");

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [historySearch, setHistorySearch] = useState("");
  const [historyProject, setHistoryProject] = useState("ALL");
  const [detailModalTask, setDetailModalTask] = useState<any | null>(null);

  const now = new Date();

  // Filter tasks
  const inProgressTasks = tasks.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
  );
  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  const overdueTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < now
  );

  const totalCompletedStoryPoints = completedTasks.reduce(
    (sum, t) => sum + (t.storyPoints || 0),
    0
  );
  const totalCompletedEffort = completedTasks.reduce(
    (sum, t) => sum + (t.actualEffort || t.estimatedEffort || 0),
    0
  );

  const filteredHistoryTasks = completedTasks.filter((t) => {
    if (historyProject !== "ALL" && t.projectId !== historyProject) return false;
    if (
      historySearch &&
      !t.title.toLowerCase().includes(historySearch.toLowerCase()) &&
      !t.taskId.toLowerCase().includes(historySearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const updateTaskStatus = async (taskId: string, newStatus: string, blockerReason?: string) => {
    setUpdatingId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          blockers: blockerReason !== undefined ? blockerReason : undefined,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenBlocker = (task: any) => {
    setSelectedTask(task);
    setBlockerText(task.blockers || "");
    setBlockerModalOpen(true);
  };

  const handleSaveBlocker = async () => {
    if (!selectedTask) return;
    await updateTaskStatus(selectedTask.id, "BLOCKED", blockerText);
    setBlockerModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Blocker Modal */}
      <Modal
        isOpen={blockerModalOpen}
        onClose={() => setBlockerModalOpen(false)}
        title={`Flag Blocker: ${selectedTask?.taskId}`}
        subtitle="Explain what is hindering progress so leadership can unblock you."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Blocker Description
            </label>
            <textarea
              rows={3}
              value={blockerText}
              onChange={(e) => setBlockerText(e.target.value)}
              placeholder="e.g. Waiting on API credentials, vendor hardware delivery delayed, awaiting approvals..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setBlockerModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBlocker}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
            >
              Confirm Blocker & Notify Team
            </button>
          </div>
        </div>
      </Modal>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="xl" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome, {user.fullName}</h1>
              <Badge variant="brand">{user.role}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {user.designation} • {user.departmentName || "Operations"} • {user.employeeId}
            </p>
          </div>
        </div>

        {/* Quick Personal Stats */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("history")}
            title="View Completed Work History"
            className={`px-4 py-2.5 rounded-2xl border text-center min-w-[95px] transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/80"
            }`}
          >
            <span
              className={`text-xs uppercase font-bold block ${
                activeTab === "history" ? "text-emerald-100" : "text-emerald-800"
              }`}
            >
              Completed
            </span>
            <span
              className={`text-xl font-extrabold ${
                activeTab === "history" ? "text-white" : "text-emerald-800"
              }`}
            >
              {completedTasks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("active")}
            title="View In Progress Tasks"
            className={`px-4 py-2.5 rounded-2xl border text-center min-w-[95px] transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-sky-50 border-sky-300 ring-2 ring-sky-200"
                : "bg-sky-50 border-sky-100 hover:bg-sky-100/80"
            }`}
          >
            <span className="text-xs uppercase font-bold text-sky-800 block">In Progress</span>
            <span className="text-xl font-extrabold text-sky-800">{inProgressTasks.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("active")}
            title="View To Do Tasks"
            className="bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-100 text-center min-w-[95px] hover:bg-amber-100/80 transition-all cursor-pointer"
          >
            <span className="text-xs uppercase font-bold text-amber-800 block">To Do</span>
            <span className="text-xl font-extrabold text-amber-800">{todoTasks.length}</span>
          </button>
        </div>
      </div>

      {/* Urgent Overdue Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">You have {overdueTasks.length} overdue task(s)!</span>
              <p className="text-rose-700 text-[11px] mt-0.5">
                Please update the status, log your effort, or raise blockers if you need assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active Workspace</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "active" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {inProgressTasks.length + todoTasks.length + blockedTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Work History & Delivered</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "history" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {completedTasks.length}
            </span>
          </button>
        </div>

        {activeTab === "history" && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Points Delivered: <strong className="text-emerald-700">{totalCompletedStoryPoints} pts</strong></span>
            <span>•</span>
            <span>Effort Logged: <strong className="text-slate-800">{totalCompletedEffort} hrs</strong></span>
          </div>
        )}
      </div>

      {/* Main Workspace 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks / History (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "active" ? (
            <>
              {/* Currently Working On (In Progress) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Currently In Progress ({inProgressTasks.length})</span>
                  </h2>
                </div>

                {inProgressTasks.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
                    You have no tasks currently in progress. Pick one from your To Do list below to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inProgressTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{t.title}</span>
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                {t.taskId}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                          </div>
                          <PriorityBadge priority={t.priority} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                            <span>Project: {t.project.name}</span>
                            {t.dueDate && (
                              <span className={new Date(t.dueDate) < now ? "text-rose-600 font-bold" : ""}>
                                Due: {new Date(t.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenBlocker(t)}
                              disabled={updatingId === t.id}
                              className="px-2.5 py-1 rounded text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            >
                              Flag Blocker
                            </button>
                            <button
                              onClick={() => updateTaskStatus(t.id, "IN_REVIEW")}
                              disabled={updatingId === t.id}
                              className="px-2.5 py-1 rounded text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer"
                            >
                              Submit Review
                            </button>
                            <button
                              onClick={() => updateTaskStatus(t.id, "COMPLETED")}
                              disabled={updatingId === t.id}
                              className="flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blocked Tasks (if any) */}
              {blockedTasks.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-xs">
                  <h2 className="text-sm font-bold text-rose-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Tasks Blocked ({blockedTasks.length})</span>
                  </h2>

                  <div className="space-y-3">
                    {blockedTasks.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-slate-900">{t.title}</span>
                          <Badge variant="danger">BLOCKED</Badge>
                        </div>
                        {t.blockers && (
                          <p className="text-xs text-rose-800 mt-2 bg-white/70 p-2 rounded border border-rose-100">
                            Reason: {t.blockers}
                          </p>
                        )}
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => updateTaskStatus(t.id, "IN_PROGRESS", "")}
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                          >
                            Unblock & Resume Work
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* To Do (Next Tasks) */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Next In Queue ({todoTasks.length})</span>
                </h2>

                {todoTasks.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
                    You're all caught up! No tasks waiting in your queue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todoTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">{t.title}</span>
                            <span className="text-[10px] font-mono text-slate-400">{t.taskId}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t.project.name} • {t.storyPoints} pts • Due:{" "}
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No deadline"}
                          </p>
                        </div>

                        <button
                          onClick={() => updateTaskStatus(t.id, "IN_PROGRESS")}
                          disabled={updatingId === t.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Working</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Work History & Completed Deliverables View */
            <div className="space-y-6">
              {/* History Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivered Work</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{completedTasks.length}</span>
                    <span className="text-xs text-slate-500 font-medium">tasks completed</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Story Points</span>
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-700">{totalCompletedStoryPoints}</span>
                    <span className="text-xs text-slate-500 font-medium">points shipped</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Effort Contributed</span>
                    <Clock className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-teal-700">{totalCompletedEffort}</span>
                    <span className="text-xs text-slate-500 font-medium">hours logged</span>
                  </div>
                </div>
              </div>

              {/* Work History Search & Filter Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search completed tasks by title or task ID (e.g. T2T-)..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={historyProject}
                    onChange={(e) => setHistoryProject(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="ALL">All Projects ({completedTasks.length})</option>
                    {projects.map((p) => {
                      const projCount = completedTasks.filter((t) => t.projectId === p.id).length;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({projCount})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Completed Tasks List */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <span>Completed Deliverables ({filteredHistoryTasks.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Showing {filteredHistoryTasks.length} of {completedTasks.length}
                  </span>
                </div>

                {filteredHistoryTasks.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No completed tasks match your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {completedTasks.length === 0
                        ? "Completed tasks will automatically appear here once you finish work."
                        : "Try clearing your search or project filters to view all work."}
                    </p>
                    {historySearch || historyProject !== "ALL" ? (
                      <button
                        onClick={() => {
                          setHistorySearch("");
                          setHistoryProject("ALL");
                        }}
                        className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistoryTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-slate-200/90 hover:border-emerald-300 transition-all bg-white group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {t.title}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                                {t.taskId}
                              </span>
                              <Badge variant="success" size="sm">
                                COMPLETED
                              </Badge>
                            </div>
                            {t.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">{t.description}</p>
                            )}
                          </div>
                          <PriorityBadge priority={t.priority} />
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                            <span>
                              Project: <strong className="text-slate-700">{t.project?.name}</strong>
                            </span>
                            {t.sprint && (
                              <span>
                                Sprint: <strong className="text-slate-700">{t.sprint.name}</strong>
                              </span>
                            )}
                            {t.storyPoints ? (
                              <span>
                                Points: <strong className="text-indigo-600">{t.storyPoints} pts</strong>
                              </span>
                            ) : null}
                            <span>
                              Completed on:{" "}
                              <strong className="text-slate-700">
                                {new Date(t.updatedAt || t.dueDate || now).toLocaleDateString()}
                              </strong>
                            </span>
                            {t.comments?.length > 0 && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <MessageSquare className="w-3 h-3" />
                                {t.comments.length}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDetailModalTask(t)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Inspect Details</span>
                            </button>
                            <button
                              onClick={() => updateTaskStatus(t.id, "IN_PROGRESS")}
                              disabled={updatingId === t.id}
                              title="Re-open task and return to In Progress"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reopen</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Assigned Projects & Personal Feed (1 span) */}
        <div className="space-y-6">
          {/* Assigned Projects */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-emerald-600" />
              <span>Assigned Projects ({projects.length})</span>
            </h3>

            <div className="space-y-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="block p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                    <Badge variant="default" size="sm">
                      {p.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Progress</span>
                    <span className="font-bold text-slate-700">{p.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Personal Recent Activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Recent Activity</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {activity.map((act) => (
                <div key={act.id} className="py-2.5">
                  <span className="font-mono text-emerald-700 font-bold text-[10px]">
                    {act.action}
                  </span>
                  <p className="font-medium text-slate-800">{act.objectTitle}</p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      {detailModalTask && (
        <Modal
          isOpen={!!detailModalTask}
          onClose={() => setDetailModalTask(null)}
          title={`${detailModalTask.taskId}: ${detailModalTask.title}`}
          subtitle={`Completed deliverable in ${detailModalTask.project?.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              <Badge variant="success">COMPLETED</Badge>
              <PriorityBadge priority={detailModalTask.priority} />
              {detailModalTask.sprint && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium text-[11px]">
                  Sprint: {detailModalTask.sprint.name}
                </span>
              )}
              {detailModalTask.storyPoints ? (
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold text-[11px]">
                  {detailModalTask.storyPoints} Story Points
                </span>
              ) : null}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                Description & Deliverable Scope
              </h4>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                {detailModalTask.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-slate-600 text-[11px]">
              <div>
                <span className="block text-slate-400 uppercase font-semibold text-[10px]">Due Date</span>
                <span className="font-medium text-slate-800">
                  {detailModalTask.dueDate ? new Date(detailModalTask.dueDate).toLocaleDateString() : "None"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase font-semibold text-[10px]">Completed Date</span>
                <span className="font-medium text-emerald-800 font-bold">
                  {new Date(detailModalTask.updatedAt || now).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase font-semibold text-[10px]">Estimated Effort</span>
                <span className="font-medium text-slate-800">
                  {detailModalTask.estimatedEffort ? `${detailModalTask.estimatedEffort} hrs` : "N/A"}
                </span>
              </div>
              <div>
                <span className="block text-slate-400 uppercase font-semibold text-[10px]">Actual Effort</span>
                <span className="font-medium text-slate-800">
                  {detailModalTask.actualEffort ? `${detailModalTask.actualEffort} hrs` : "N/A"}
                </span>
              </div>
            </div>

            {/* Task comments history if present */}
            {detailModalTask.comments && detailModalTask.comments.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Discussion & Update Logs ({detailModalTask.comments.length})</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {detailModalTask.comments.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700">{c.author?.fullName || "Colleague"}</span>
                        <span>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 text-xs">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDetailModalTask(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  updateTaskStatus(detailModalTask.id, "IN_PROGRESS");
                  setDetailModalTask(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reopen Task</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
