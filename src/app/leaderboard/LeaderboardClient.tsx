"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Sparkles,
  Info,
  X,
  ChevronRight,
} from "lucide-react";
import { PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface CompletedTaskItem {
  id: string;
  taskId: string;
  title: string;
  priority: string;
  storyPoints?: number | null;
  projectName: string;
  completedAt: string | null;
  points: number;
  basePoints: number;
  storyPointsBonus: number;
  onTimeBonus: number;
  isOnTime: boolean;
}

interface RankedMember {
  id: string;
  fullName: string;
  employeeId: string;
  avatarUrl: string | null;
  role: string;
  department: string;
  departmentCode: string;
  designation: string;
  rank: number;
  totalPoints: number;
  potentialPoints: number;
  completedCount: number;
  inProgressCount: number;
  onTimeRate: number;
  priorityBreakdown: {
    urgent: { count: number; points: number };
    high: { count: number; points: number };
    medium: { count: number; points: number };
    low: { count: number; points: number };
  };
  tier: {
    tier: string;
    label: string;
    badgeColor: string;
    nextTier: string | null;
    pointsNeeded: number;
    progressPercent: number;
  };
  completedTasks: CompletedTaskItem[];
}

interface LeaderboardClientProps {
  departments: Department[];
  currentUser: any;
}

export const LeaderboardClient: React.FC<LeaderboardClientProps> = ({
  departments,
  currentUser,
}) => {
  const [data, setData] = useState<RankedMember[]>([]);
  const [currentUserStanding, setCurrentUserStanding] = useState<RankedMember | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRules, setShowRules] = useState(false);

  // Modal inspection
  const [selectedMember, setSelectedMember] = useState<RankedMember | null>(null);

  const fetchLeaderboard = () => {
    setLoading(true);
    fetch(`/api/leaderboard?departmentId=${departmentFilter}&timeframe=${timeframe}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.leaderboard) {
          setData(res.leaderboard);
          setCurrentUserStanding(res.currentUserStanding);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [departmentFilter, timeframe]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.employeeId.toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const top3 = data.slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-200">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Team Work Leaderboard
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Work Impact
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Every completed task earns points calculated by work priority level, story complexity, and delivery velocity.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowRules(!showRules)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>{showRules ? "Hide Scoring Formula" : "How Points Are Calculated"}</span>
        </button>
      </div>

      {/* Scoring Formula Explainer Banner */}
      {showRules && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Transparent Work-Based Scoring System</span>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Urgent Priority Task
              </div>
              <p className="text-2xl font-black text-white">100 <span className="text-xs font-normal text-slate-400">pts</span></p>
              <p className="text-[11px] text-slate-400 mt-1">High-pressure mission-critical work.</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-orange-400 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                High Priority Task
              </div>
              <p className="text-2xl font-black text-white">60 <span className="text-xs font-normal text-slate-400">pts</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Core sprint objectives & roadmap items.</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Medium Priority Task
              </div>
              <p className="text-2xl font-black text-white">35 <span className="text-xs font-normal text-slate-400">pts</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Operational enhancements & routine tasks.</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Low Priority Task
              </div>
              <p className="text-2xl font-black text-white">15 <span className="text-xs font-normal text-slate-400">pts</span></p>
              <p className="text-[11px] text-slate-400 mt-1">Maintenance, backlog, and minor polish.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-700/80 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                🎯
              </div>
              <div>
                <span className="font-bold text-white">Story Points Multiplier:</span> +10 pts per Story Point weight.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                ⏱️
              </div>
              <div>
                <span className="font-bold text-white">On-Time Bonus:</span> +25 bonus points when delivered on or before due date!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Personal Standing Card */}
      {currentUserStanding && (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-800 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <UserAvatar
                  fullName={currentUserStanding.fullName}
                  avatarUrl={currentUserStanding.avatarUrl}
                  size="lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                  #{currentUserStanding.rank}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">
                    {currentUserStanding.fullName}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentUserStanding.tier.badgeColor}`}>
                    {currentUserStanding.tier.label}
                  </span>
                </div>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  {currentUserStanding.designation} • {currentUserStanding.department}
                </p>
                <p className="text-[11px] text-slate-300 mt-1">
                  You are currently ranked <strong className="text-amber-300">#{currentUserStanding.rank}</strong> out of {data.length} active team members.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
              <div>
                <div className="text-[10px] text-emerald-200/70 font-semibold uppercase tracking-wider">
                  Total Points
                </div>
                <div className="text-2xl font-black text-amber-300 flex items-center gap-1">
                  <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>{currentUserStanding.totalPoints}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <div>
                <div className="text-[10px] text-emerald-200/70 font-semibold uppercase tracking-wider">
                  Tasks Done
                </div>
                <div className="text-xl font-bold text-white flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{currentUserStanding.completedCount}</span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <div>
                <div className="text-[10px] text-emerald-200/70 font-semibold uppercase tracking-wider">
                  On-Time Rate
                </div>
                <div className="text-xl font-bold text-white flex items-center gap-1">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>{currentUserStanding.onTimeRate}%</span>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

              <div>
                <div className="text-[10px] text-emerald-200/70 font-semibold uppercase tracking-wider">
                  In-Flight Pts
                </div>
                <div className="text-xl font-bold text-slate-300">
                  +{currentUserStanding.potentialPoints}
                </div>
              </div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {currentUserStanding.tier.nextTier && (
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-100/90">
              <div className="flex items-center gap-2">
                <span>Progress to <strong>{currentUserStanding.tier.nextTier}</strong>:</span>
                <span className="font-semibold text-amber-300">{currentUserStanding.tier.pointsNeeded} more points needed</span>
              </div>
              <div className="w-full sm:w-48 bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${currentUserStanding.tier.progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Top Work Leaders</span>
            </h2>
            <span className="text-xs text-slate-500">
              Based on verified task delivery & priority velocity
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 (Silver) */}
            {top3[1] && (
              <div
                onClick={() => setSelectedMember(top3[1])}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between order-2 md:order-1"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-black border border-slate-200">
                  <Medal className="w-3.5 h-3.5 text-slate-500" />
                  <span>#2 Silver</span>
                </div>

                <div className="flex items-center gap-3.5 mt-2">
                  <UserAvatar
                    fullName={top3[1].fullName}
                    avatarUrl={top3[1].avatarUrl}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm hover:text-emerald-600 transition-colors">
                      {top3[1].fullName}
                    </h3>
                    <p className="text-xs text-slate-500">{top3[1].designation}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {top3[1].department}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Work Points</span>
                    <p className="text-2xl font-black text-slate-800">{top3[1].totalPoints}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Tasks Completed</span>
                    <p className="text-sm font-bold text-slate-700">{top3[1].completedCount} tasks</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Elevated) */}
            {top3[0] && (
              <div
                onClick={() => setSelectedMember(top3[0])}
                className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white rounded-2xl p-5 border-2 border-amber-400 shadow-md hover:shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between order-1 md:order-2 md:-translate-y-1"
              >
                <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                  <Crown className="w-3.5 h-3.5 fill-amber-950" />
                  <span>#1 Champion</span>
                </div>

                <div className="flex items-center gap-3.5 mt-2">
                  <div className="relative">
                    <UserAvatar
                      fullName={top3[0].fullName}
                      avatarUrl={top3[0].avatarUrl}
                      size="xl"
                    />
                    <div className="absolute -top-2.5 -right-1 bg-amber-400 text-slate-900 rounded-full p-1 shadow-sm">
                      <Crown className="w-4 h-4 fill-amber-900 text-amber-900" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 text-base hover:text-amber-700 transition-colors">
                      {top3[0].fullName}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">{top3[0].designation}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      {top3[0].department}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-800 uppercase font-extrabold tracking-wider">
                      Work Points
                    </span>
                    <p className="text-3xl font-black text-amber-900 flex items-center gap-1">
                      <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                      <span>{top3[0].totalPoints}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">On-Time Rate</span>
                    <p className="text-sm font-black text-emerald-600">{top3[0].onTimeRate}% on-time</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3[2] && (
              <div
                onClick={() => setSelectedMember(top3[2])}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between order-3"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-900/10 text-amber-900 px-2.5 py-1 rounded-full text-xs font-black border border-amber-900/20">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  <span>#3 Bronze</span>
                </div>

                <div className="flex items-center gap-3.5 mt-2">
                  <UserAvatar
                    fullName={top3[2].fullName}
                    avatarUrl={top3[2].avatarUrl}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm hover:text-emerald-600 transition-colors">
                      {top3[2].fullName}
                    </h3>
                    <p className="text-xs text-slate-500">{top3[2].designation}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {top3[2].department}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Work Points</span>
                    <p className="text-2xl font-black text-slate-800">{top3[2].totalPoints}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Tasks Completed</span>
                    <p className="text-sm font-bold text-slate-700">{top3[2].completedCount} tasks</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Timeframe:</span>
          </div>

          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setTimeframe("all")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                timeframe === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                timeframe === "month"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                timeframe === "week"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Week
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Team Member</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Work Completed by Level</th>
                <th className="py-3 px-4 text-center">On-Time</th>
                <th className="py-3 px-4 text-right">Total Points</th>
                <th className="py-3 px-4 text-center w-24">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading live leaderboard data...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No team members found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isCurrent = member.id === currentUser?.id;
                  const isTop1 = member.rank === 1;
                  const isTop2 = member.rank === 2;
                  const isTop3 = member.rank === 3;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isCurrent ? "bg-emerald-50/40 font-medium" : ""
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black shadow-2xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black shadow-2xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-900 font-black shadow-2xs">
                            🥉
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-semibold">#{member.rank}</span>
                        )}
                      </td>

                      {/* Member */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            fullName={member.fullName}
                            avatarUrl={member.avatarUrl}
                            size="md"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{member.fullName}</span>
                              {isCurrent && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {member.employeeId} • {member.designation}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {member.department}
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${member.tier.badgeColor}`}>
                          {member.tier.label}
                        </span>
                      </td>

                      {/* Work Completed by Priority Level */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {member.priorityBreakdown.urgent.count > 0 && (
                            <span
                              title={`Urgent Tasks: ${member.priorityBreakdown.urgent.count} (${member.priorityBreakdown.urgent.points} pts)`}
                              className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            >
                              ⚡ {member.priorityBreakdown.urgent.count} Urgent
                            </span>
                          )}

                          {member.priorityBreakdown.high.count > 0 && (
                            <span
                              title={`High Priority: ${member.priorityBreakdown.high.count} (${member.priorityBreakdown.high.points} pts)`}
                              className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            >
                              🔴 {member.priorityBreakdown.high.count} High
                            </span>
                          )}

                          {member.priorityBreakdown.medium.count > 0 && (
                            <span
                              title={`Medium Priority: ${member.priorityBreakdown.medium.count} (${member.priorityBreakdown.medium.points} pts)`}
                              className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            >
                              🟡 {member.priorityBreakdown.medium.count} Med
                            </span>
                          )}

                          {member.priorityBreakdown.low.count > 0 && (
                            <span
                              title={`Low Priority: ${member.priorityBreakdown.low.count} (${member.priorityBreakdown.low.points} pts)`}
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            >
                              🟢 {member.priorityBreakdown.low.count} Low
                            </span>
                          )}

                          {member.completedCount === 0 && (
                            <span className="text-slate-400 text-[11px] italic">No completed tasks yet</span>
                          )}
                        </div>
                      </td>

                      {/* On Time */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-slate-800 text-[11px]">
                            {member.onTimeRate}%
                          </span>
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${member.onTimeRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-sm font-black text-slate-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{member.totalPoints}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMember(member);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="View completed tasks and points breakdown"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Work Inspection Slide-over / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/60">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  fullName={selectedMember.fullName}
                  avatarUrl={selectedMember.avatarUrl}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedMember.fullName}
                    </h3>
                    <span className="text-xs font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                      Rank #{selectedMember.rank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedMember.designation} • {selectedMember.department} ({selectedMember.employeeId})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Summary Metrics */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Points</div>
                <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <Zap className="w-5 h-5 fill-amber-400" />
                  <span>{selectedMember.totalPoints}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Tasks Delivered</div>
                <div className="text-xl font-bold text-white mt-0.5">
                  {selectedMember.completedCount}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">On-Time Velocity</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">
                  {selectedMember.onTimeRate}%
                </div>
              </div>
            </div>

            {/* Completed Tasks List */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Completed Work Contributions ({selectedMember.completedTasks.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Points awarded upon verified task completion
                </span>
              </div>

              {selectedMember.completedTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No completed tasks on record yet for this member.
                </div>
              ) : (
                selectedMember.completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {task.taskId}
                          </span>
                          <PriorityBadge priority={task.priority as any} />
                          {task.isOnTime && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              ✓ On-Time (+25 pts)
                            </span>
                          )}
                        </div>
                        <h5 className="font-semibold text-xs text-slate-900 mt-1">
                          {task.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Project: {task.projectName} • {task.storyPoints || 1} Story Points
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-sm font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                          +{task.points} pts
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Base {task.basePoints} + SP {task.storyPointsBonus}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{selectedMember.fullName} • Trash2Treasure Innovations</span>
              <button
                onClick={() => setSelectedMember(null)}
                className="px-3.5 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
