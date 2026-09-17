import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "brand" | "purple";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "sm",
  className = "",
}) => {
  const sizeClasses = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs font-medium";

  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    brand: "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold",
    success: "bg-green-50 text-green-700 border border-green-200 font-semibold",
    warning: "bg-amber-50 text-amber-800 border border-amber-200 font-semibold",
    danger: "bg-rose-50 text-rose-800 border border-rose-200 font-semibold",
    info: "bg-sky-50 text-sky-800 border border-sky-200 font-semibold",
    purple: "bg-purple-50 text-purple-800 border border-purple-200 font-semibold",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold tracking-wide whitespace-nowrap shadow-2xs ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-rose-50 text-rose-700 border border-rose-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
          Urgent
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
          High
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-sky-50 text-sky-800 border border-sky-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
          Medium
        </span>
      );
    case "LOW":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          Low
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status?.toUpperCase()) {
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-sky-50 text-sky-800 border border-sky-300 whitespace-nowrap shadow-2xs transition-all">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
          In Progress
        </span>
      );
    case "COMPLETED":
    case "DONE":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          Completed
        </span>
      );
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          Active
        </span>
      );
    case "IN_REVIEW":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-purple-50 text-purple-800 border border-purple-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
          In Review
        </span>
      );
    case "BLOCKED":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-rose-50 text-rose-800 border border-rose-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-bounce shrink-0" />
          Blocked
        </span>
      );
    case "TODO":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          To Do
        </span>
      );
    case "BACKLOG":
    case "PLANNING":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-slate-50 text-slate-700 border border-slate-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          {status === "BACKLOG" ? "Backlog" : "Planning"}
        </span>
      );
    case "ON_HOLD":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          On Hold
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 text-slate-500 border border-slate-300 whitespace-nowrap shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap shadow-2xs">
          {status}
        </span>
      );
  }
};
