"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Check,
  FileEdit,
  ArrowRight,
  Layers,
  History,
  Target,
} from "lucide-react";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";
import { getRolePermissions } from "@/lib/types";

interface AgileClientProps {
  initialSprints: any[];
  initialBacklogTasks: any[];
  projects: any[];
  currentUser: any;
}

export const AgileClient: React.FC<AgileClientProps> = ({
  initialSprints,
  initialBacklogTasks,
  projects,
  currentUser,
}) => {
  const router = useRouter();
  const permissions = getRolePermissions(currentUser.role);

  const [sprints, setSprints] = useState<any[]>(initialSprints);
  const [backlogTasks, setBacklogTasks] = useState<any[]>(initialBacklogTasks);
  const [activeTab, setActiveTab] = useState<"active" | "backlog" | "history">("active");

  // Create sprint modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    goal: "",
    projectId: projects[0]?.id || "",
    startDate: "",
    endDate: "",
    status: "PLANNED",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Retro / Review Modal
  const [retroModalOpen, setRetroModalOpen] = useState(false);
  const [selectedSprint, setSelectedSprint] = useState<any | null>(null);
  const [retroNotes, setRetroNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [retroLoading, setRetroLoading] = useState(false);

  const activeSprint = sprints.find((s) => s.status === "ACTIVE");
  const pastSprints = sprints.filter((s) => s.status === "COMPLETED");

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (res.ok) {
        const newSprint = await res.json();
        setSprints((prev) => [newSprint, ...prev]);
        setCreateModalOpen(false);
        setCreateForm({
          name: "",
          goal: "",
          projectId: projects[0]?.id || "",
          startDate: "",
          endDate: "",
          status: "PLANNED",
        });
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create sprint");
      }
    } catch (err) {
      alert("Error submitting sprint");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateSprintStatus = async (sprintId: string, status: string) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSprints((prev) => prev.map((s) => (s.id === sprintId ? { ...s, status } : s)));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRetro = (sprint: any) => {
    setSelectedSprint(sprint);
    setRetroNotes(sprint.retroNotes || "");
    setReviewNotes(sprint.reviewNotes || "");
    setRetroModalOpen(true);
  };

  const handleSaveRetro = async () => {
    if (!selectedSprint) return;
    setRetroLoading(true);

    try {
      const res = await fetch(`/api/sprints/${selectedSprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retroNotes, reviewNotes }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSprints((prev) =>
          prev.map((s) => (s.id === selectedSprint.id ? { ...s, retroNotes, reviewNotes } : s))
        );
        setRetroModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetroLoading(false);
    }
  };

  // Helper metrics for active sprint
  const sprintTasks = activeSprint?.tasks || [];
  const totalPoints = sprintTasks.reduce((sum: number, t: any) => sum + (t.storyPoints || 1), 0);
  const completedPoints = sprintTasks
    .filter((t: any) => t.status === "COMPLETED")
    .reduce((sum: number, t: any) => sum + (t.storyPoints || 1), 0);
  const blockedCount = sprintTasks.filter((t: any) => t.status === "BLOCKED").length;
  const sprintProgress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-600" />
            <span>Agile Sprint Execution & Backlog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sprint iteration planning, story point velocity tracking, retrospectives, and backlog refinement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {permissions.canManageSprints && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Plan New Sprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "active"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Active Sprint</span>
          {activeSprint && (
            <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.2 rounded font-bold">
              LIVE
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("backlog")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "backlog"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Product Backlog</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === "backlog" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {backlogTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "history"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Sprint History & Retros</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === "history" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {pastSprints.length}
          </span>
        </button>
      </div>

      {/* ================= TAB: ACTIVE SPRINT ================= */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {activeSprint ? (
            <>
              {/* Active Sprint Overview Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="brand">ACTIVE SPRINT</Badge>
                      <span className="text-xs text-slate-500 font-medium">
                        Project: {activeSprint.project.name}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mt-2">{activeSprint.name}</h2>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                      <span className="font-bold text-slate-800">Sprint Goal: </span>
                      {activeSprint.goal}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenRetro(activeSprint)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Review / Retro Notes</span>
                    </button>

                    {permissions.canManageSprints && (
                      <button
                        onClick={() => handleUpdateSprintStatus(activeSprint.id, "COMPLETED")}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete Sprint</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Sprint Velocity Numbers */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Sprint Velocity & Burnup</span>
                    <span className="font-bold text-emerald-600">{sprintProgress}% Delivered</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${sprintProgress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Committed Points
                      </span>
                      <span className="text-xl font-bold text-slate-800">{totalPoints}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">
                        Completed Points
                      </span>
                      <span className="text-xl font-bold text-emerald-700">{completedPoints}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Remaining Points
                      </span>
                      <span className="text-xl font-bold text-slate-800">
                        {Math.max(0, totalPoints - completedPoints)}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-xl border ${
                        blockedCount > 0
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-slate-50 border-slate-100 text-slate-800"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold block">Blocked Items</span>
                      <span className="text-xl font-bold">{blockedCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks in Active Sprint */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Committed Tasks ({sprintTasks.length})
                  </h3>
                  <Link
                    href="/kanban"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Manage on Sprint Board →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 text-sm">
                  {sprintTasks.map((t: any) => (
                    <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm leading-snug">{t.title}</span>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{t.taskId}</span>
                          {t.blockers && (
                            <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-semibold border border-rose-200">
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                          <UserAvatar user={t.assignee} size="xs" />
                          <span>Assignee: {t.assignee?.fullName || "Unassigned"} • Story Points: <strong className="text-slate-800 font-mono">{t.storyPoints}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Active Sprint Currently Running</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Plan a new sprint or choose an existing planned sprint below to begin the cycle.
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Plan New Sprint
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB: PRODUCT BACKLOG ================= */}
      {activeTab === "backlog" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Product Backlog ({backlogTasks.length} unassigned items)
              </h3>
              <p className="text-xs text-slate-500">
                Prioritized candidate tasks awaiting assignment to upcoming sprint iterations.
              </p>
            </div>

            <Link
              href="/tasks?create=true"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              + Add Backlog Task
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {backlogTasks.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">
                Product backlog is empty. All current work is assigned to sprints.
              </p>
            ) : (
              backlogTasks.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{t.title}</span>
                      <span className="font-mono text-[10px] text-slate-400">{t.taskId}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Project: {t.project.name} • Assignee: {t.assignee?.fullName || "Unassigned"} •{" "}
                      {t.storyPoints} pts
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB: SPRINT HISTORY ================= */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {pastSprints.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="brand">COMPLETED</Badge>
                  <span className="text-xs font-medium text-slate-500">
                    Project: {s.project.name}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{s.name}</h4>
                <p className="text-xs text-slate-600 mt-1">{s.goal}</p>
                {s.retroNotes && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded mt-2">
                    <strong>Retrospective Notes:</strong> {s.retroNotes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleOpenRetro(s)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  View / Edit Retrospective
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Sprint Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Plan New Agile Sprint"
        subtitle="Define sprint iteration goal, dates, and linked project."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSprint} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Sprint Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint 16: Sensor Calibration & Conveyor Sync"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Sprint Goal *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Primary milestone this sprint iteration must deliver..."
              value={createForm.goal}
              onChange={(e) => setCreateForm({ ...createForm, goal: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Linked Project *
            </label>
            <select
              required
              value={createForm.projectId}
              onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {createLoading ? "Creating Sprint..." : "Schedule Sprint"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Retrospective & Review Modal */}
      {selectedSprint && (
        <Modal
          isOpen={retroModalOpen}
          onClose={() => setRetroModalOpen(false)}
          title={`Sprint Retrospective: ${selectedSprint.name}`}
          subtitle="Document key operational learnings, team achievements, and areas for improvement."
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Sprint Review Notes (What was delivered vs committed)
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Review deliverables, demo findings, user feedback..."
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Sprint Retrospective Notes (What went well, what could be improved)
              </label>
              <textarea
                rows={3}
                value={retroNotes}
                onChange={(e) => setRetroNotes(e.target.value)}
                placeholder="Action items for next sprint, technical debt addressed, process tweaks..."
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRetroModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRetro}
                disabled={retroLoading}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {retroLoading ? "Saving..." : "Save Retrospective Notes"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
