import React, { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  ComposedChart
} from "recharts";
import {
  Clock,
  Calendar,
  Activity,
  TrendingUp,
  Filter,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame
} from "lucide-react";

interface AttendanceTrendsChartProps {
  trendData: any[];
  punchBuckets: any[];
  todayAttendance: any;
  summary: any;
  onNavigate?: (path: string) => void;
}

export const AttendanceTrendsChart: React.FC<AttendanceTrendsChartProps> = ({
  trendData = [],
  punchBuckets = [],
  todayAttendance,
  summary,
  onNavigate
}) => {
  // Chart modes: "composed" (14d/7d Area/Bars), "hourly" (Today's checkin times), "distribution" (Donut)
  const [viewMode, setViewMode] = useState<"14d" | "7d" | "hourly" | "donut">("14d");
  const [visibleSeries, setVisibleSeries] = useState({
    present: true,
    late: true,
    absent: true,
    onLeave: true,
    punctualityRate: true
  });
  const [hoveredSlice, setHoveredSlice] = useState<any>(null);

  // Filter 7d vs 14d
  const displayedTrend =
    viewMode === "7d"
      ? trendData.slice(-7)
      : trendData.length > 0
      ? trendData
      : [];

  const toggleSeries = (key: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Today Donut breakdown
  const presentCount = todayAttendance?.present ?? summary?.presentToday ?? 12;
  const lateCount = todayAttendance?.late ?? 2;
  const onLeaveCount = todayAttendance?.onLeave ?? summary?.onLeaveEmployees ?? 1;
  const absentCount = todayAttendance?.absent ?? summary?.absentToday ?? 0;
  const totalEmployees = summary?.totalEmployees || (presentCount + onLeaveCount + absentCount) || 15;

  const distributionData = [
    { name: "On-Time Present", value: Math.max(0, presentCount - lateCount), color: "#10b981", rawKey: "present" },
    { name: "Late Arrival", value: lateCount, color: "#f59e0b", rawKey: "late" },
    { name: "Approved Leave", value: onLeaveCount, color: "#f97316", rawKey: "onLeave" },
    { name: "Unscheduled Absent", value: absentCount, color: "#f43f5e", rawKey: "absent" }
  ].filter((d) => d.value > 0);

  // Overall punctuality rate
  const avgPunctuality =
    displayedTrend.length > 0
      ? Math.round(displayedTrend.reduce((sum, d) => sum + (d.punctualityRate || 95), 0) / displayedTrend.length)
      : 96;

  return (
    <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] flex flex-col justify-between transition-all">
      {/* Header with Title & Mode Controls */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                  Workforce Attendance Trends
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Real-time punch velocity, punctuality compliance & absence timelines
              </p>
            </div>
          </div>

          {/* View Mode Toggle Pill */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setViewMode("14d")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "14d"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              14-Day Flow
            </button>
            <button
              onClick={() => setViewMode("7d")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "7d"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              7-Day
            </button>
            <button
              onClick={() => setViewMode("hourly")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "hourly"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Hourly Pulse
            </button>
            <button
              onClick={() => setViewMode("donut")}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "donut"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              Today's Donut
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80">
            <span className="text-[11px] font-semibold text-zinc-400 block">Punctuality Score</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-black text-zinc-900 dark:text-white font-mono">
                {avgPunctuality}%
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                +2.4% vs last wk
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80">
            <span className="text-[11px] font-semibold text-zinc-400 block">Today On-Time</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {Math.max(0, presentCount - lateCount)}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">/ {totalEmployees} active</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80">
            <span className="text-[11px] font-semibold text-zinc-400 block">Late Arrivals</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-black text-amber-500 font-mono">
                {lateCount}
              </span>
              <span className="text-[10px] text-zinc-400">grace period</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80">
            <span className="text-[11px] font-semibold text-zinc-400 block">Approved Absence</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-black text-orange-600 dark:text-orange-400 font-mono">
                {onLeaveCount}
              </span>
              <span className="text-[10px] text-slate-400">on leave</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full h-72 my-2">
        {viewMode === "14d" || viewMode === "7d" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayedTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#71717a20" vertical={false} />
              <XAxis
                dataKey={viewMode === "14d" ? "fullDate" : "day"}
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={{ stroke: "#71717a30" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={{ stroke: "#71717a30" }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[50, 100]}
                tick={{ fontSize: 10, fill: "#fb923c" }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#090a0f",
                  borderRadius: "16px",
                  border: "1px solid #27272a",
                  boxShadow: "0 20px 35px -5px rgba(0, 0, 0, 0.8)",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "12px 14px"
                }}
                formatter={(value: any, name: any) => {
                  if (name === "Punctuality Rate") return [`${value}% Compliance`, name];
                  return [`${value} Staff`, name];
                }}
                labelFormatter={(label) => `Timeline: ${label}`}
              />

              {visibleSeries.present && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#presentGrad)"
                />
              )}
              {visibleSeries.late && (
                <Bar
                  yAxisId="left"
                  dataKey="late"
                  name="Late Arrival"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  barSize={12}
                />
              )}
              {visibleSeries.onLeave && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="onLeave"
                  name="On Leave"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#leaveGrad)"
                />
              )}
              {visibleSeries.absent && (
                <Bar
                  yAxisId="left"
                  dataKey="absent"
                  name="Unexcused Absent"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={8}
                />
              )}
              {visibleSeries.punctualityRate && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="punctualityRate"
                  name="Punctuality Rate"
                  stroke="#fb923c"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: "#fb923c" }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : viewMode === "hourly" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={punchBuckets}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b820" vertical={false} />
              <XAxis
                dataKey="timeSlot"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={{ stroke: "#94a3b830" }}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#94a3b830" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "16px",
                  border: "1px solid #334155",
                  color: "#fff",
                  fontSize: "12px"
                }}
                formatter={(val: any, _, item: any) => [
                  `${val} Check-ins (${item?.payload?.label})`,
                  "Punch Volume"
                ]}
              />
              <Bar
                dataKey="count"
                fill="#ea580c"
                radius={[8, 8, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoveredSlice(distributionData[index])}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-transform hover:scale-105"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090a0f",
                    borderRadius: "12px",
                    border: "1px solid #27272a",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                  formatter={(val: any, name: any) => [`${val} Staff`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                {hoveredSlice ? hoveredSlice.value : presentCount}
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                {hoveredSlice ? hoveredSlice.name : "Active Today"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend & Series Filter */}
      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => toggleSeries("present")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              visibleSeries.present
                ? "bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "opacity-40 line-through border-transparent"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Present</span>
          </button>

          <button
            onClick={() => toggleSeries("late")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              visibleSeries.late
                ? "bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "opacity-40 line-through border-transparent"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Late</span>
          </button>

          <button
            onClick={() => toggleSeries("onLeave")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              visibleSeries.onLeave
                ? "bg-orange-50/70 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
                : "opacity-40 line-through border-transparent"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>On Leave</span>
          </button>

          <button
            onClick={() => toggleSeries("absent")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              visibleSeries.absent
                ? "bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                : "opacity-40 line-through border-transparent"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Absent</span>
          </button>

          <button
            onClick={() => toggleSeries("punctualityRate")}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
              visibleSeries.punctualityRate
                ? "bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "opacity-40 line-through border-transparent"
            }`}
          >
            <span className="w-2.5 h-1 border-t-2 border-dashed border-amber-500" />
            <span>Punctuality %</span>
          </button>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate("/attendance")}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
          >
            <span>Full Roster</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
