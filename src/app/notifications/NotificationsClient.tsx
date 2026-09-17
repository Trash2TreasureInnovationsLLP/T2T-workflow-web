"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ArrowRight, Clock, MessageSquare, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface NotificationsClientProps {
  initialNotifications: any[];
  currentUser: any;
}

export const NotificationsClient: React.FC<NotificationsClientProps> = ({
  initialNotifications,
  currentUser,
}) => {
  const [notifications, setNotifications] = useState<any[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            <span>Activity & Notifications Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal updates on task assignments, sprint events, discussions, and blocker alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications in your inbox. You're completely up to date!
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 text-xs flex items-start justify-between gap-4 transition-colors ${
                !n.read ? "bg-emerald-50/30" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unread" />
                  )}
                  <Badge variant="default" size="sm">
                    {n.type}
                  </Badge>
                </div>
                <p className="text-slate-600">{n.message}</p>
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              {n.link && (
                <Link
                  href={n.link}
                  className="shrink-0 text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 mt-1"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
