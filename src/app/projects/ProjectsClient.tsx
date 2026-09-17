"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Users,
  CheckCircle2,
} from "lucide-react";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";
import { getRolePermissions } from "@/lib/types";

interface ProjectsClientProps {
  initialProjects: any[];
  users: any[];
  currentUser: any;
}

export const ProjectsClient: React.FC<ProjectsClientProps> = ({
  initialProjects,
  users,
  currentUser,
}) => {
  const permissions = getRolePermissions(currentUser.role);

  const [projects, setProjects] = useState<any[]>(initialProjects);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    managerId: currentUser.id,
    startDate: "",
    targetDate: "",
    priority: "HIGH",
    status: "PLANNING",
    budget: 250000,
    risks: "",
    blockers: "",
    memberIds: [] as string[],
  });

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.projectId.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const newProj = await res.json();
        setProjects((prev) => [newProj, ...prev]);
        setCreateModalOpen(false);
        setForm({
          name: "",
          description: "",
          managerId: currentUser.id,
          startDate: "",
          targetDate: "",
          priority: "HIGH",
          status: "PLANNING",
          budget: 250000,
          risks: "",
          blockers: "",
          memberIds: [],
        });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create project");
      }
    } catch (err) {
      alert("Error submitting project");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-600" />
            <span>Company Projects Portfolio</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end strategic initiatives, circular products, and operational infrastructure programs.
          </p>
        </div>

        {permissions.canManageProjects && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
          {["ALL", "ACTIVE", "PLANNING", "ON_HOLD", "COMPLETED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((prj) => (
          <div
            key={prj.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {prj.projectId}
                </span>
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority={prj.priority} />
                  <StatusBadge status={prj.status} />
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-2.5">{prj.name}</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-2">{prj.description}</p>

              {/* Blocker Alert if active */}
              {prj.blockers && (
                <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{prj.blockers}</span>
                </div>
              )}

              {/* Team Members Avatars */}
              <div className="mt-4 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {prj.members?.slice(0, 4).map((m: any) => (
                    <UserAvatar
                      key={m.id}
                      user={m.user}
                      size="xs"
                      className="border-2 border-white"
                    />
                  ))}
                  {prj.members?.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white text-[10px] font-bold flex items-center justify-center text-emerald-800">
                      +{prj.members.length - 4}
                    </div>
                  )}
                </div>

                <span className="text-slate-500 text-xs">
                  Lead: <strong className="text-slate-800 font-semibold">{prj.manager?.fullName}</strong>
                </span>
              </div>
            </div>

            {/* Bottom Progress & Link */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-emerald-600">{prj.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${prj.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {prj._count?.tasks || 0} tasks • {prj._count?.milestones || 0} milestones
                </span>

                <Link
                  href={`/projects/${prj.id}`}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  <span>Project Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Initialize New Company Project"
        subtitle="Create a new initiative with budget, milestones, and assigned personnel."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Automated Optical Sensor Segregation Platform"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Project Description *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Comprehensive purpose, deliverables, and targets..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Project Manager / Lead *
              </label>
              <select
                required
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Allocated Budget (INR)
              </label>
              <input
                type="number"
                min="0"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Target Date *
              </label>
              <input
                type="date"
                required
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
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
              className="px-5 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-xs transition-colors"
            >
              {createLoading ? "Creating..." : "Initialize Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
