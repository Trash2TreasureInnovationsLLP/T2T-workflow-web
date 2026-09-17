"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  CheckSquare,
  Trello,
  Zap,
  UserCheck,
  BarChart3,
  Calendar as CalendarIcon,
  FileText,
  Bell,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Plus,
  KeyRound,
  Sparkles,
  ChevronDown,
  Megaphone,
} from "lucide-react";
import { SessionUser, getRolePermissions } from "@/lib/types";
import { Badge } from "../ui/Badge";
import { UserAvatar } from "../ui/UserAvatar";
import { CommandPalette } from "../search/CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
  user: SessionUser | null;
}

export const AppShell: React.FC<AppShellProps> = ({ children, user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const permissions = getRolePermissions(user?.role || "EMPLOYEE");

  // Fetch recent notifications
  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }
      })
      .catch(() => {});
  }, [user]);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const markAllNotificationsRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Nav Items Config
  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      label: "Work Overview",
      href: "/work-overview",
      icon: Layers,
      show: true,
    },
    {
      label: "My Work",
      href: "/my-work",
      icon: UserCheck,
      show: true,
      badge: "Personal",
    },
    {
      label: "Projects",
      href: "/projects",
      icon: FolderKanban,
      show: true,
    },
    {
      label: "Tasks Hub",
      href: "/tasks",
      icon: CheckSquare,
      show: true,
    },
    {
      label: "Kanban Board",
      href: "/kanban",
      icon: Trello,
      show: true,
    },
    {
      label: "Agile Sprints",
      href: "/agile",
      icon: Zap,
      show: true,
    },
    {
      label: "Team Analytics",
      href: "/analytics",
      icon: BarChart3,
      show: permissions.canViewExecutiveDashboard,
    },
    {
      label: "Member Performance",
      href: "/performance",
      icon: Users,
      show: permissions.canViewExecutiveDashboard,
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: CalendarIcon,
      show: true,
    },
    {
      label: "Documents",
      href: "/documents",
      icon: FileText,
      show: true,
    },
    {
      label: "Announcements",
      href: "/announcements",
      icon: Megaphone,
      show: true,
    },
    {
      label: "User Management",
      href: "/users",
      icon: Users,
      show: permissions.canManageUsers,
      badge: "Admin",
    },
    {
      label: "Audit Logs",
      href: "/audit-logs",
      icon: ShieldAlert,
      show: permissions.canViewAuditLogs,
      badge: "Audit",
    },
    {
      label: "Organization Settings",
      href: "/settings",
      icon: Settings,
      show: permissions.canManageRoles || permissions.canManageUsers,
    },
  ];

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
      case "CEO":
        return "bg-emerald-600 text-white";
      case "COO":
        return "bg-teal-600 text-white";
      case "CTO":
        return "bg-blue-600 text-white";
      case "CFO":
        return "bg-amber-600 text-white";
      case "CMO":
        return "bg-purple-600 text-white";
      case "CAO":
        return "bg-indigo-600 text-white";
      case "INTERN":
        return "bg-orange-500 text-white";
      default:
        return "bg-slate-700 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FDF8] flex flex-col antialiased">
      {/* Search Command Palette Modal */}
      <CommandPalette
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand Logo & Name */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs">
              <Image
                src="/t2t-logo.png"
                alt="Trash2Treasure Innovations"
                width={36}
                height={36}
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-emerald-700 transition-colors">
                  Trash2Treasure
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  LLP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Operations & Agile Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 text-slate-400 text-xs transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search tasks, projects, sprints, members...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Action Icons & User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create Button (Admins/Managers/Leads) */}
          {user && !permissions.isAdvisoryOnly && (
            <Link
              href="/tasks?create=true"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </Link>
          )}

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Notifications ({unreadCount} new)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet. You're all caught up!
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                          !notif.read ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-800">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{notif.message}</p>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            onClick={() => setNotificationsOpen(false)}
                            className="inline-block mt-1 text-emerald-600 hover:underline font-medium text-[11px]"
                          >
                            View details →
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <UserAvatar user={user} size="sm" />
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.fullName?.split(" ")[0]}
                </div>
                <div className="text-xs text-slate-500 font-medium">{user?.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-2.5">
                    <UserAvatar user={user} size="md" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getRoleColor(
                        user?.role
                      )}`}
                    >
                      {user?.role}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      {user?.employeeId}
                    </span>
                  </div>
                  {user?.departmentName && (
                    <p className="text-xs text-emerald-700 mt-2 font-medium">
                      Dept: {user.departmentName}
                    </p>
                  )}
                </div>

                <div className="py-1.5">
                  <Link
                    href="/my-work"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span>My Workspace</span>
                  </Link>

                  <Link
                    href="/change-password"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                  >
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span>Change Password</span>
                  </Link>
                </div>

                <div className="pt-1.5 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 p-4 shrink-0 overflow-y-auto">
          {/* Org Header Pill */}
          <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase block">
                Workspace
              </span>
              <span className="text-xs font-semibold text-slate-800">
                T2T Operations
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4.5 h-4.5 shrink-0 ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold shrink-0 ${
                          isActive
                            ? "bg-emerald-700 text-emerald-100"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
          </nav>

          {/* Bottom user quick card */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                {user?.fullName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay & Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-72 bg-white h-full flex flex-col p-4 shadow-2xl z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Image
                    src="/t2t-logo.png"
                    alt="T2T"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                  <span className="font-bold text-slate-900 text-sm">
                    Trash2Treasure
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-3">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    setSearchModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs"
                >
                  <Search className="w-4 h-4" />
                  <span>Search anything...</span>
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems
                  .filter((item) => item.show)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4.5 h-4.5 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                              isActive
                                ? "bg-emerald-700 text-emerald-100"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
              </nav>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
