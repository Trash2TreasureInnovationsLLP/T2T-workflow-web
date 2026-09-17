"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  CheckSquare,
  FolderKanban,
  Zap,
  User,
  FileText,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import { Badge } from "../ui/Badge";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    tasks: any[];
    projects: any[];
    sprints: any[];
    users: any[];
    announcements: any[];
  }>({
    tasks: [],
    projects: [],
    sprints: [],
    users: [],
    announcements: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], projects: [], sprints: [], users: [], announcements: [] });
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (url: string) => {
    router.push(url);
    onClose();
  };

  const hasAnyResults =
    results.tasks.length > 0 ||
    results.projects.length > 0 ||
    results.sprints.length > 0 ||
    results.users.length > 0 ||
    results.announcements.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Type to search across tasks, projects, sprints, team..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-4 text-sm bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <div className="p-3 max-h-96 overflow-y-auto divide-y divide-slate-100">
          {loading && (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Searching T2T platform...
            </div>
          )}

          {!loading && query && !hasAnyResults && (
            <div className="p-8 text-center text-xs text-slate-500">
              No results found for "<span className="font-semibold">{query}</span>"
            </div>
          )}

          {!loading && !query && (
            <div className="p-6 text-center text-xs text-slate-400">
              Search by Task ID (e.g. <span className="font-mono text-emerald-700 font-semibold">T2T-1001</span>), project name, sprint, or team member name.
            </div>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
                Tasks ({results.tasks.length})
              </span>
              {results.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigateTo(`/tasks?highlight=${task.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                          {task.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                          {task.taskId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">{task.status}</Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
                Projects ({results.projects.length})
              </span>
              {results.projects.map((prj) => (
                <div
                  key={prj.id}
                  onClick={() => navigateTo(`/projects/${prj.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderKanban className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-teal-700">
                        {prj.name}
                      </span>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{prj.description}</p>
                    </div>
                  </div>
                  <Badge variant="brand" size="sm">{prj.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Sprints Results */}
          {results.sprints.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
                Sprints ({results.sprints.length})
              </span>
              {results.sprints.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigateTo(`/agile`)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-xs font-semibold text-slate-900">
                        {s.name}
                      </span>
                      <p className="text-[11px] text-slate-500">{s.goal}</p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">{s.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Users Results */}
          {results.users.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1 block">
                Team Members ({results.users.length})
              </span>
              {results.users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => navigateTo(`/users?highlight=${u.id}`)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-700">
                      {u.fullName.slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900">
                        {u.fullName}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {u.designation}
                      </span>
                    </div>
                  </div>
                  <Badge variant="default" size="sm">{u.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or click</span>
          <div className="flex items-center gap-2">
            <span>ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
