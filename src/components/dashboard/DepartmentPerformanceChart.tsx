import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Line,
  ReferenceLine
} from "recharts";
import {
  Award,
  TrendingUp,
  Target,
  BarChart3,
  Radar as RadarIcon,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
  Layers,
  Briefcase
} from "lucide-react";

interface DepartmentPerformanceChartProps {
  departmentsData: any[];
  onNavigate?: (path: string) => void;
}

export const DepartmentPerformanceChart: React.FC<DepartmentPerformanceChartProps> = ({
  departmentsData = [],
  onNavigate
}) => {
  const [metricTab, setMetricTab] = useState<"performance" | "tasks" | "attendance" | "headcount">("performance");
  const [chartType, setChartType] = useState<"bar" | "radar">("bar");
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(
    departmentsData.length > 0 ? departmentsData[0].id || departmentsData[0].code : null
  );

  // Normalize department data with fallbacks
  const data = departmentsData.map((dept, index) => ({
    id: dept.id || `dept-${index}`,
    name: dept.name || "Department",
    code: dept.code || dept.name?.substring(0, 3)?.toUpperCase() || `D${index + 1}`,
    employees: dept.employees || dept.employeeCount || 1,
    budget: dept.budget || 50000,
    avgPerformanceScore: dept.avgPerformanceScore || 4.2,
    productivityScore: dept.productivityScore || 4.3,
    qualityScore: dept.qualityScore || 4.4,
    teamworkScore: dept.teamworkScore || 4.5,
    communicationScore: dept.communicationScore || 4.2,
    taskCompletionRate: dept.taskCompletionRate || 88,
    totalTasks: dept.totalTasks || 6,
    completedTasks: dept.completedTasks || 5,
    attendanceRate: dept.attendanceRate || 95
  }));

  // Find selected department
  const currentDept = data.find((d) => d.id === selectedDeptId || d.code === selectedDeptId) || data[0];

  // Best performing department
  const topPerformer = [...data].sort((a, b) => (b.avgPerformanceScore || 0) - (a.avgPerformanceScore || 0))[0];

  // Radar data for selected department
  const radarData = currentDept
    ? [
        { subject: "Overall Rating", A: (currentDept.avgPerformanceScore / 5) * 100, fullMark: 100, raw: currentDept.avgPerformanceScore },
        { subject: "Productivity", A: (currentDept.productivityScore / 5) * 100, fullMark: 100, raw: currentDept.productivityScore },
        { subject: "Work Quality", A: (currentDept.qualityScore / 5) * 100, fullMark: 100, raw: currentDept.qualityScore },
        { subject: "Teamwork", A: (currentDept.teamworkScore / 5) * 100, fullMark: 100, raw: currentDept.teamworkScore },
        { subject: "Communication", A: (currentDept.communicationScore / 5) * 100, fullMark: 100, raw: currentDept.communicationScore },
        { subject: "Task Delivery", A: currentDept.taskCompletionRate, fullMark: 100, raw: `${currentDept.taskCompletionRate}%` }
      ]
    : [];

  const getBarColor = (item: any) => {
    if (item.id === selectedDeptId || item.code === selectedDeptId) return "#f97316"; // Active highlighted
    if (item.code === topPerformer?.code) return "#ea580c"; // Orange
    return "#fb923c"; // Light orange
  };

  return (
    <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] flex flex-col justify-between transition-all">
      {/* Header & Dimension Toggles */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                  Departmental Performance & Velocity
                </h2>
                {topPerformer && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Top: {topPerformer.name} ({topPerformer.avgPerformanceScore}★)
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Cross-department evaluation of ratings, task throughput, and delivery consistency
              </p>
            </div>
          </div>

          {/* Controls: Metric Tab + Chart Format */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Dimensions */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold shadow-inner">
              <button
                onClick={() => setMetricTab("performance")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricTab === "performance"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Overall Score
              </button>
              <button
                onClick={() => setMetricTab("tasks")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricTab === "tasks"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Task Delivery
              </button>
              <button
                onClick={() => setMetricTab("attendance")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricTab === "attendance"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Attendance %
              </button>
              <button
                onClick={() => setMetricTab("headcount")}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricTab === "headcount"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                Headcount
              </button>
            </div>

            {/* Visual Type Toggle */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs shadow-inner">
              <button
                onClick={() => setChartType("bar")}
                title="Bar Chart"
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  chartType === "bar"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType("radar")}
                title="Radar Skills Breakdown"
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  chartType === "radar"
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <RadarIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Department Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-none">
          <span className="text-[11px] font-semibold text-zinc-400 shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-zinc-400" /> Filter:
          </span>
          {data.map((dept) => {
            const isSelected = dept.id === selectedDeptId || dept.code === selectedDeptId;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold ring-2 ring-orange-400/40"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{dept.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {dept.employees}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visual Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
        {/* Left 2 Cols: The Chart */}
        <div className="lg:col-span-2 h-72 w-full">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              {metricTab === "performance" ? (
                <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a20" vertical={false} />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                  />
                  <ReferenceLine y={4.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Target (4.0)", fill: "#10b981", fontSize: 10, position: "insideTopRight" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090a0f",
                      borderRadius: "16px",
                      border: "1px solid #27272a",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 20px 35px -5px rgba(0, 0, 0, 0.8)"
                    }}
                    formatter={(val: any) => [`${val} / 5.0 Rating`, "Overall Performance"]}
                    labelFormatter={(_, item) => item?.[0]?.payload?.name || "Department"}
                  />
                  <Bar
                    dataKey="avgPerformanceScore"
                    radius={[8, 8, 0, 0]}
                    onClick={(entry) => setSelectedDeptId(entry.id)}
                    cursor="pointer"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.id === currentDept?.id ? "#ea580c" : "#f97316"}
                        stroke={entry.id === currentDept?.id ? "#fed7aa" : "none"}
                        strokeWidth={entry.id === currentDept?.id ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : metricTab === "tasks" ? (
                <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a20" vertical={false} />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                  />
                  <ReferenceLine y={80} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "SLA (80%)", fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090a0f",
                      borderRadius: "16px",
                      border: "1px solid #27272a",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                    formatter={(val: any, _, item: any) => [
                      `${val}% (${item?.payload?.completedTasks}/${item?.payload?.totalTasks} completed)`,
                      "Task Delivery Rate"
                    ]}
                    labelFormatter={(_, item) => item?.[0]?.payload?.name || "Department"}
                  />
                  <Bar
                    dataKey="taskCompletionRate"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    onClick={(entry) => setSelectedDeptId(entry.id)}
                    cursor="pointer"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.id === currentDept?.id ? "#059669" : "#34d399"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : metricTab === "attendance" ? (
                <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a20" vertical={false} />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[50, 100]}
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    tickFormatter={(v) => `${v}%`}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090a0f",
                      borderRadius: "16px",
                      border: "1px solid #27272a",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                    formatter={(val: any) => [`${val}% Present`, "Attendance Rate"]}
                    labelFormatter={(_, item) => item?.[0]?.payload?.name || "Department"}
                  />
                  <Bar
                    dataKey="attendanceRate"
                    fill="#ea580c"
                    radius={[8, 8, 0, 0]}
                    onClick={(entry) => setSelectedDeptId(entry.id)}
                    cursor="pointer"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.id === currentDept?.id ? "#c2410c" : "#fb923c"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#71717a20" vertical={false} />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={{ stroke: "#71717a30" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090a0f",
                      borderRadius: "16px",
                      border: "1px solid #27272a",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                    formatter={(val: any) => [`${val} Staff Members`, "Headcount"]}
                    labelFormatter={(_, item) => item?.[0]?.payload?.name || "Department"}
                  />
                  <Bar
                    dataKey="employees"
                    fill="#f59e0b"
                    radius={[8, 8, 0, 0]}
                    onClick={(entry) => setSelectedDeptId(entry.id)}
                    cursor="pointer"
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.id === currentDept?.id ? "#d97706" : "#fcd34d"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={85}>
                <PolarGrid stroke="#71717a30" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  angle={30}
                  tick={{ fontSize: 9, fill: "#71717a" }}
                />
                <Radar
                  name={currentDept?.name || "Department"}
                  dataKey="A"
                  stroke="#ea580c"
                  fill="#ea580c"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090a0f",
                    borderRadius: "16px",
                    border: "1px solid #27272a",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                  formatter={(_, __, item: any) => [`${item?.payload?.raw}`, item?.payload?.subject]}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right 1 Col: Selected Department Spotlight Card */}
        {currentDept && (
          <div className="bg-zinc-100/80 dark:bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full shadow-md">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-900/50">
                    {currentDept.code}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-1">
                    {currentDept.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-xl border border-amber-200 dark:border-amber-800 text-xs font-bold font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{currentDept.avgPerformanceScore}</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3">
                Live metrics derived from employee reviews, sprint delivery, and daily rosters.
              </p>

              {/* Stat grid */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Headcount</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                    {currentDept.employees} Staff
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Task Velocity</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {currentDept.taskCompletionRate}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Productivity Rating</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">
                    {currentDept.productivityScore} / 5.0
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-500 dark:text-zinc-400">Attendance Today</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {currentDept.attendanceRate}% Present
                  </span>
                </div>
              </div>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate("/departments")}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-orange-600 dark:text-orange-400 text-xs font-bold border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Explore {currentDept.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
