"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
} from "lucide-react";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";

interface TasksClientProps {
  initialTasks: any[];
  projects: any[];
  sprints: any[];
  users: any[];
  currentUser: any;
}

export const TasksClient: React.FC<TasksClientProps> = ({
  initialTasks,
  projects,
  sprints,
  users,
  currentUser,
}) => {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const openCreate = searchParams.get("create") === "true";

  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Create Task Modal state
  const [createModalOpen, setCreateModalOpen] = useState(openCreate);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    projectId: projects[0]?.id || "",
    sprintId: "",
    assigneeId: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
    estimatedEffort: 4,
    storyPoints: 2,
    tags: "",
    blockers: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Detail / Edit Modal state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Auto open highlighted task if ID is in URL
  useEffect(() => {
    if (highlightId) {
      const match = tasks.find((t) => t.id === highlightId);
      if (match) setSelectedTask(match);
    }
  }, [highlightId, tasks]);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (projectFilter !== "ALL" && t.projectId !== projectFilter) return false;
    if (assigneeFilter !== "ALL" && t.assigneeId !== assigneeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.taskId.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        setCreateModalOpen(false);
        setCreateForm({
          title: "",
          description: "",
          projectId: projects[0]?.id || "",
          sprintId: "",
          assigneeId: "",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: "",
          estimatedEffort: 4,
          storyPoints: 2,
          tags: "",
          blockers: "",
        });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create task.");
      }
    } catch (err) {
      alert("Error submitting task.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    setCommentLoading(true);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        const updatedTask = {
          ...selectedTask,
          comments: [...(selectedTask.comments || []), comment],
        };
        setSelectedTask(updatedTask);
        setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
        if (selectedTask?.id === taskId) {
          setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setSelectedTask(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete task.");
      }
    } catch (err) {
      alert("Error deleting task.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-600" />
            <span>Task Management Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete inventory of organizational tasks, effort tracking, sprint linkages, and deliverables.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by task title, ID (e.g. T2T-1001), description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 hover:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses ({tasks.length})</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-500 max-w-[180px] truncate"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-sm font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-500 max-w-[180px] truncate"
            >
              <option value="ALL">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4">Task</th>
                <th className="py-3.5 px-4">Project</th>
                <th className="py-3.5 px-4">Assignee</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4 min-w-[130px]">Status</th>
                <th className="py-3.5 px-4">Story Pts</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    No tasks found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className={`hover:bg-emerald-50/40 transition-colors cursor-pointer ${
                      highlightId === t.id ? "bg-emerald-50/70" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 leading-snug">{t.title}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                          {t.taskId}
                        </span>
                        {t.blockers && (
                          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.2 rounded-md font-semibold">
                            Blocked
                          </span>
                        )}
                        {t.tags && (
                          <span className="text-xs text-slate-400 truncate max-w-[160px]">
                            {t.tags}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {t.project?.name || "General"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={t.assignee} size="xs" />
                        <span className="text-slate-800 font-semibold text-sm">
                          {t.assignee?.fullName || "Unassigned"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {t.storyPoints} pts
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "--"}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(t);
                        }}
                        className="px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold border border-emerald-200 transition-colors shadow-2xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CREATE TASK MODAL ================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Operational Task"
        subtitle="Add a task with estimated effort, priority, assignee, and Agile story points."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Calibrate optical sensor array on Conveyor Line 2"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Description & Acceptance Criteria
            </label>
            <textarea
              rows={3}
              placeholder="Detailed explanation of what needs to be executed..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Project *
              </label>
              <select
                required
                value={createForm.projectId}
                onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Sprint (Optional)
              </label>
              <select
                value={createForm.sprintId}
                onChange={(e) => setCreateForm({ ...createForm, sprintId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">No Sprint (Product Backlog)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Assignee
              </label>
              <select
                value={createForm.assigneeId}
                onChange={(e) => setCreateForm({ ...createForm, assigneeId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.designation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Story Points
              </label>
              <input
                type="number"
                min="1"
                max="21"
                value={createForm.storyPoints}
                onChange={(e) =>
                  setCreateForm({ ...createForm, storyPoints: parseInt(e.target.value) || 1 })
                }
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Est. Hours
              </label>
              <input
                type="number"
                min="0"
                value={createForm.estimatedEffort}
                onChange={(e) =>
                  setCreateForm({ ...createForm, estimatedEffort: parseFloat(e.target.value) || 0 })
                }
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. AI, Hardware, Sorting, API"
              value={createForm.tags}
              onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg"
            />
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
              {createLoading ? "Creating Task..." : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= TASK DETAIL & COMMENTS MODAL ================= */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`${selectedTask.taskId}: ${selectedTask.title}`}
          subtitle={`Created in ${selectedTask.project?.name || "General"} by ${
            selectedTask.createdBy?.fullName || "Leadership"
          }`}
          maxWidth="3xl"
        >
          <div className="space-y-6 text-sm">
            {/* Top Badges & Status Transition Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <PriorityBadge priority={selectedTask.priority} />
                <StatusBadge status={selectedTask.status} />
                <span className="text-slate-600 font-semibold text-xs ml-1">
                  {selectedTask.storyPoints} Story Points
                </span>
              </div>

              {/* Instant Status Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold text-xs">Change Status:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleQuickStatusChange(selectedTask.id, e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs shadow-2xs"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Task Description */}
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-1.5">
                Description
              </h4>
              <p className="text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed text-sm">
                {selectedTask.description || "No description provided."}
              </p>
            </div>

            {/* Reported Blocker Notice */}
            {selectedTask.blockers && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sm">Active Blocker:</span>
                  <p className="mt-0.5 text-rose-700 text-xs">{selectedTask.blockers}</p>
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-slate-500 text-xs font-bold uppercase block">Assignee</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedTask.assignee?.fullName || "Unassigned"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-slate-500 text-xs font-bold uppercase block">Sprint</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                  {selectedTask.sprint?.name || "Product Backlog"}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-slate-500 text-xs font-bold uppercase block">Effort Logged</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedTask.actualEffort} / {selectedTask.estimatedEffort} hrs
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-slate-500 text-xs font-bold uppercase block">Due Date</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedTask.dueDate
                    ? new Date(selectedTask.dueDate).toLocaleDateString()
                    : "No deadline"}
                </span>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Discussion & Operational Updates ({selectedTask.comments?.length || 0})</span>
              </h4>

              <div className="max-h-56 overflow-y-auto space-y-2.5 divide-y divide-slate-100 pr-1">
                {(!selectedTask.comments || selectedTask.comments.length === 0) && (
                  <p className="text-slate-400 text-xs py-3">No comments yet. Start the conversation below.</p>
                )}
                {selectedTask.comments?.map((c: any) => (
                  <div key={c.id} className="pt-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-bold text-slate-900 text-xs">
                        {c.author?.fullName || "Team Member"} ({c.author?.role})
                      </span>
                      <span className="text-[11px]">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Write an operational standup comment or update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={commentLoading || !newComment.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>

              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
