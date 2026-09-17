"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  Filter,
  Users,
  Building2,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsClientProps {
  currentUser: any;
}

const COLORS = ["#16A34A", "#0284C7", "#F59E0B", "#8B5CF6", "#EF4444", "#64748B"];

export const AnalyticsClient: React.FC<AnalyticsClientProps> = ({ currentUser }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
        Calculating organizational analytics & velocity telemetry...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-xs text-rose-500">
        Failed to load analytics. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-600" />
          <span>Operational & Team Analytics</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quantitative telemetry on Agile sprint velocity, project throughput, and cross-departmental workload.
        </p>
      </div>

      {/* Row 1: Sprint Velocity & Task Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Velocity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Sprint Velocity (Planned vs Completed Points)</span>
              </h3>
              <p className="text-xs text-slate-400">Story points committed vs points delivered</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sprintVelocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="planned" name="Planned Points" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="completed"
                  name="Completed Points"
                  fill="#16A34A"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-sky-600" />
                <span>Task Distribution by Execution Status</span>
              </h3>
              <p className="text-xs text-slate-400">Live breakdown across pipeline stages</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={4}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Workload Distribution by Member & Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Member Workload Distribution</span>
              </h3>
              <p className="text-xs text-slate-400">Active vs Completed tasks per team member</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="inProgress"
                  name="In Progress"
                  fill="#0284C7"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="#16A34A"
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Project Completion Progress (%)</span>
              </h3>
              <p className="text-xs text-slate-400">Completion percentage across active initiatives</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.projectProgressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="code" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="progress" name="Progress %" fill="#22C55E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Department Activity */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Departmental Task Volume & Activity</span>
            </h3>
            <p className="text-xs text-slate-400">Cross-departmental operational throughput</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.departmentActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="totalTasks" name="Total Tasks" fill="#64748B" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="completedTasks"
                name="Completed Tasks"
                fill="#16A34A"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
