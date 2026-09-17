"use client";

import React, { useState } from "react";
import { Megaphone, Plus, Pin, Calendar, Sparkles } from "lucide-react";
import { PriorityBadge, Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { getRolePermissions } from "@/lib/types";

interface AnnouncementsClientProps {
  initialAnnouncements: any[];
  departments: any[];
  currentUser: any;
}

export const AnnouncementsClient: React.FC<AnnouncementsClientProps> = ({
  initialAnnouncements,
  departments,
  currentUser,
}) => {
  const permissions = getRolePermissions(currentUser.role);
  const [announcements, setAnnouncements] = useState<any[]>(initialAnnouncements);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "MEDIUM",
    isPinned: false,
    targetDepartmentId: "",
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const created = await res.json();
        setAnnouncements([created, ...announcements]);
        setCreateModalOpen(false);
        setForm({
          title: "",
          content: "",
          priority: "MEDIUM",
          isPinned: false,
          targetDepartmentId: "",
        });
      } else {
        alert("Failed to post announcement");
      }
    } catch (err) {
      alert("Error submitting announcement");
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
            <Megaphone className="w-6 h-6 text-emerald-600" />
            <span>Company Announcements & Internal Notices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official executive updates, policy changes, quarterly milestones, and circular initiatives.
          </p>
        </div>

        {permissions.canPostAnnouncements && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`bg-white rounded-2xl p-6 border shadow-xs transition-all ${
              ann.isPinned
                ? "border-emerald-200 ring-1 ring-emerald-100 bg-gradient-to-br from-white to-emerald-50/20"
                : "border-slate-200/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {ann.isPinned && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Pin className="w-3 h-3" />
                    Pinned Notice
                  </span>
                )}
                <PriorityBadge priority={ann.priority} />
                {ann.targetDepartment && (
                  <Badge variant="default">Dept: {ann.targetDepartment.name}</Badge>
                )}
              </div>

              <span className="text-[11px] text-slate-400">
                {new Date(ann.createdAt).toLocaleDateString([], {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mt-3">{ann.title}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
              {ann.content}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-700">
                {ann.author.fullName.slice(0, 2)}
              </div>
              <span className="font-semibold text-slate-700">{ann.author.fullName}</span>
              <span>•</span>
              <span>{ann.author.role}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Broadcast Company Announcement"
        subtitle="Publish an organization-wide or department-specific notice."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Circular Material Recovery Target: 1,500 Tons"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Announcement Message *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Write the full message, guidelines, or operational update..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Target Department
              </label>
              <select
                value={form.targetDepartmentId}
                onChange={(e) => setForm({ ...form, targetDepartmentId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">All Company (Entire T2T)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="isPinned" className="text-slate-700 font-medium">
              Pin this notice to top of employee dashboards
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {createLoading ? "Broadcasting..." : "Publish Announcement"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
