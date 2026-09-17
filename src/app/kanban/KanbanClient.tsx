"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trello,
  Plus,
  MessageSquare,
  Calendar,
  AlertTriangle,
  User,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
} from "lucide-react";
import { PriorityBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";

interface KanbanClientProps {
  initialTasks: any[];
  projects: any[];
  sprints: any[];
  users: any[];
  currentUser: any;
}

const COLUMNS = [
  { id: "BACKLOG", label: "Backlog", color: "border-slate-300 bg-slate-50/50" },
  { id: "TODO", label: "To Do", color: "border-sky-300 bg-sky-50/20" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-amber-300 bg-amber-50/20" },
  { id: "IN_REVIEW", label: "In Review", color: "border-purple-300 bg-purple-50/20" },
  { id: "BLOCKED", label: "Blocked", color: "border-rose-300 bg-rose-50/30" },
  { id: "COMPLETED", label: "Done", color: "border-emerald-300 bg-emerald-50/20" },
];

export const KanbanClient: React.FC<KanbanClientProps> = ({
  initialTasks,
  projects,
  sprints,
  users,
  currentUser,
}) => {
  const [tasks, setTasks] = useState<any[]>(initialTasks);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [sprintFilter, setSprintFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (projectFilter !== "ALL" && t.projectId !== projectFilter) return false;
    if (sprintFilter !== "ALL" && t.sprintId !== sprintFilter) return false;
    if (assigneeFilter !== "ALL" && t.assigneeId !== assigneeFilter) return false;
    if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    return true;
  });

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === columnId) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: columnId,
              completedAt: columnId === "COMPLETED" ? new Date().toISOString() : null,
            }
          : t
      )
    );

    // Persist to database via API
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: columnId }),
      });

      if (!res.ok) {
        // Revert on error
        const err = await res.json();
        alert(err.error || "Failed to update task status.");
        setTasks(initialTasks);
      }
    } catch (err) {
      console.error("Failed to persist task move:", err);
      setTasks(initialTasks);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Trello className="w-6 h-6 text-emerald-600" />
            <span>Kanban Agile Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Drag cards across columns to update execution state in real time. Changes persist automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tasks?create=true"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-slate-500 font-bold">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Project Filter */}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        >
          <option value="ALL">All Projects ({projects.length})</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Sprint Filter */}
        <select
          value={sprintFilter}
          onChange={(e) => setSprintFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        >
          <option value="ALL">All Sprints</option>
          {sprints.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.status})
            </option>
          ))}
        </select>

        {/* Assignee Filter */}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm max-w-[180px] truncate"
        >
          <option value="ALL">All Members</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        >
          <option value="ALL">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {(projectFilter !== "ALL" ||
          sprintFilter !== "ALL" ||
          assigneeFilter !== "ALL" ||
          priorityFilter !== "ALL") && (
          <button
            onClick={() => {
              setProjectFilter("ALL");
              setSprintFilter("ALL");
              setAssigneeFilter("ALL");
              setPriorityFilter("ALL");
            }}
            className="text-emerald-700 hover:underline font-bold text-sm"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Kanban Board Columns Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl border ${col.color} p-3 min-h-[550px] flex flex-col transition-all duration-200 ${
                isOver ? "ring-2 ring-emerald-500 scale-[1.01] bg-emerald-50/50" : ""
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{col.label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1">
                {colTasks.map((task) => {
                  const isOverdue =
                    task.status !== "COMPLETED" &&
                    task.dueDate &&
                    new Date(task.dueDate) < new Date();

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all cursor-grab active:cursor-grabbing group"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="text-xs font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                          {task.taskId}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>

                      {/* Card Title */}
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Project Name */}
                      <p className="text-xs text-slate-500 mt-1 font-medium line-clamp-1">
                        {task.project.name}
                      </p>

                      {/* Blocker Alert if present */}
                      {task.blockers && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                          <span className="line-clamp-2">{task.blockers}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.split(",").map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Footer: Assignee, Story Points, Due Date */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={task.assignee} size="xs" />
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                            {task.storyPoints} pt
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {task._count?.comments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {task._count.comments}
                            </span>
                          )}

                          {task.dueDate && (
                            <span
                              className={`text-xs font-medium ${
                                isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                              }`}
                            >
                              {new Date(task.dueDate).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200/70 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Quick Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`${selectedTask.taskId}: ${selectedTask.title}`}
          subtitle={`Project: ${selectedTask.project.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
              <PriorityBadge priority={selectedTask.priority} />
              <Badge variant="brand">{selectedTask.status}</Badge>
              <span className="text-slate-500">
                Story Points: <strong className="text-slate-900">{selectedTask.storyPoints}</strong>
              </span>
              <span className="text-slate-500">
                Assignee:{" "}
                <strong className="text-slate-900">
                  {selectedTask.assignee?.fullName || "Unassigned"}
                </strong>
              </span>
            </div>

            <div>
              <h5 className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                Description
              </h5>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedTask.description || "No description provided."}
              </p>
            </div>

            {selectedTask.blockers && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-800">
                <span className="font-bold block mb-0.5">Reported Blocker:</span>
                <p>{selectedTask.blockers}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                href={`/tasks?highlight=${selectedTask.id}`}
                className="text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                View Full Task & Comments →
              </Link>
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
