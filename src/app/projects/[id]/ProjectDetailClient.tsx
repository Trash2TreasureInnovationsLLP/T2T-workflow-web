"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  Zap,
  CheckSquare,
  ShieldCheck,
  Edit2,
  Plus,
} from "lucide-react";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";

interface ProjectDetailClientProps {
  project: any;
  currentUser: any;
}

export const ProjectDetailClient: React.FC<ProjectDetailClientProps> = ({
  project: initialProject,
  currentUser,
}) => {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "milestones" | "team" | "documents">("overview");

  // Edit project modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    progress: project.progress,
    budget: project.budget,
    risks: project.risks || "",
    blockers: project.blockers || "",
  });
  const [editLoading, setEditLoading] = useState(false);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setProject({ ...project, ...updated });
        setEditModalOpen(false);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update project");
      }
    } catch (err) {
      alert("Error saving updates");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <button
          onClick={() => setEditModalOpen(true)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Project Settings</span>
        </button>
      </div>

      {/* Main Project Hero Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                {project.projectId}
              </span>
              <PriorityBadge priority={project.priority} />
              <StatusBadge status={project.status} />
            </div>

            <h1 className="text-xl font-bold text-slate-900 mt-2">{project.name}</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <div className="text-xs text-slate-500">Overall Progress</div>
            <div className="flex items-center gap-2">
              <div className="w-36 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="text-base font-bold text-emerald-600">{project.progress}%</span>
            </div>
          </div>
        </div>

        {/* Quick Meta Row */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Lead Manager</span>
            <span className="font-bold text-slate-800">{project.manager.fullName}</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Start Date</span>
            <span className="font-medium text-slate-700">
              {new Date(project.startDate).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Delivery</span>
            <span className="font-medium text-slate-700">
              {new Date(project.targetDate).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Budget</span>
            <span className="font-mono font-bold text-slate-800">
              ₹{(project.budget || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Blockers / Risks alerts */}
        {(project.blockers || project.risks) && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {project.blockers && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800">
                <span className="font-bold block mb-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Active Blocker:
                </span>
                <p className="text-[11px]">{project.blockers}</p>
              </div>
            )}
            {project.risks && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
                <span className="font-bold block mb-0.5">Identified Risk:</span>
                <p className="text-[11px]">{project.risks}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
        {[
          { id: "overview", label: "Tasks & Execution", count: project.tasks?.length || 0 },
          { id: "milestones", label: "Milestones", count: project.milestones?.length || 0 },
          { id: "team", label: "Team Members", count: project.members?.length || 0 },
          { id: "documents", label: "Documents", count: project.documents?.length || 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab: Tasks & Execution */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Project Tasks ({project.tasks.length})
            </h3>
            <Link
              href="/kanban"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Open on Kanban Board →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {project.tasks.map((task: any) => (
              <div key={task.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{task.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">{task.taskId}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Assignee: {task.assignee?.fullName || "Unassigned"} • Due:{" "}
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "--"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Milestones */}
      {activeTab === "milestones" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Strategic Delivery Milestones
          </h3>

          <div className="space-y-3">
            {project.milestones.map((m: any) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      m.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{m.title}</span>
                    <p className="text-slate-500 text-[11px]">
                      Target: {new Date(m.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Badge variant={m.status === "COMPLETED" ? "brand" : "warning"}>{m.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Team */}
      {activeTab === "team" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Assigned Personnel & Roles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.members.map((m: any) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-slate-200 flex items-center gap-3.5 bg-white"
              >
                <UserAvatar user={m.user} size="md" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{m.user.fullName}</div>
                  <p className="text-xs text-emerald-700 font-semibold">{m.roleInProject}</p>
                  <p className="text-xs text-slate-400 font-medium">{m.user.designation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Project Documents & Technical Specs
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {project.documents.length === 0 ? (
              <p className="text-slate-400 py-4">No documents uploaded for this project yet.</p>
            ) : (
              project.documents.map((doc: any) => (
                <div key={doc.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-slate-900">{doc.title}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({doc.fileName})</span>
                    </div>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    Uploaded by {doc.uploadedBy.fullName}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Project Settings Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Update Project Settings"
        subtitle="Modify execution status, progress, risks, and blockers."
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold uppercase tracking-wider text-slate-700">
                Execution Progress: {editForm.progress}%
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={editForm.progress}
              onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Active Blocker
            </label>
            <input
              type="text"
              placeholder="Leave blank if unblocked"
              value={editForm.blockers}
              onChange={(e) => setEditForm({ ...editForm, blockers: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Risk Notes
            </label>
            <input
              type="text"
              placeholder="Key technical, supply chain, or regulatory risks"
              value={editForm.risks}
              onChange={(e) => setEditForm({ ...editForm, risks: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
