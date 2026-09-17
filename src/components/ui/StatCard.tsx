import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconColor = "text-emerald-600",
  iconBg = "bg-emerald-50",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm transition-all hover:shadow-md ${
        onClick ? "cursor-pointer hover:border-emerald-400" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 truncate">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs sm:text-sm font-semibold whitespace-nowrap ${
              trend.isNeutral
                ? "text-slate-500"
                : trend.isPositive
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {trend.isNeutral ? (
              <Minus className="w-3.5 h-3.5 mr-0.5" />
            ) : trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {description && <p className="mt-1.5 text-xs sm:text-sm text-slate-500 line-clamp-1">{description}</p>}
    </div>
  );
};
