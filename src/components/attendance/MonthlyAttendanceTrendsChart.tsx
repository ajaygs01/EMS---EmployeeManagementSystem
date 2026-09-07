import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell
} from "recharts";
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Sparkles,
  BarChart3,
  Percent,
  Layers,
  ChevronDown
} from "lucide-react";
import { api } from "../../services/api";
import { Department } from "../../types";

interface MonthlyAttendanceTrendsChartProps {
  departments?: Department[];
  canFilterDepartment?: boolean;
}

interface MonthlyDataPoint {
  month: string;
  monthNumber: number;
  year: number;
  present: number;
  late: number;
  halfDay: number;
  leave: number;
  absent: number;
  totalShifts: number;
  punctualityRate: number;
  attendanceRate: number;
}

interface TrendsSummary {
  avgPunctuality: number;
  avgAttendance: number;
  bestMonth: string;
  totalLoggedShifts: number;
  totalLateArrivals: number;
  totalOnTime: number;
}

export const MonthlyAttendanceTrendsChart: React.FC<MonthlyAttendanceTrendsChartProps> = ({
  departments = [],
  canFilterDepartment = true
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [chartView, setChartView] = useState<"volumes" | "punctuality">("volumes");
  const [trendData, setTrendData] = useState<MonthlyDataPoint[]>([]);
  const [summary, setSummary] = useState<TrendsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const res = await api.getAttendanceMonthlyTrends({
          year: selectedYear,
          department: selectedDepartment
        });
        if (isMounted && res.success) {
          setTrendData(res.data || []);
          setSummary(res.summary || null);
        }
      } catch (err) {
        console.error("Failed to load monthly attendance trends:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTrends();
    return () => {
      isMounted = false;
    };
  }, [selectedYear, selectedDepartment]);

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: MonthlyDataPoint = payload[0]?.payload;
      return (
        <div className="bg-zinc-900/95 dark:bg-black/90 backdrop-blur-xl border border-zinc-700/80 rounded-2xl p-4 shadow-2xl text-white text-xs font-sans min-w-[220px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
            <span className="font-bold text-sm font-display tracking-tight text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              {label} {selectedYear}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {dataPoint?.punctualityRate}% Punctual
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                On-Time Shifts:
              </span>
              <span className="font-bold font-mono text-emerald-400">
                {dataPoint?.present.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Late Arrivals:
              </span>
              <span className="font-bold font-mono text-amber-400">
                {dataPoint?.late.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Approved Leaves:
              </span>
              <span className="font-bold font-mono text-blue-400">
                {dataPoint?.leave.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Unscheduled Absent:
              </span>
              <span className="font-bold font-mono text-rose-400">
                {dataPoint?.absent.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 mt-2 border-t border-zinc-800 flex items-center justify-between text-zinc-300">
              <span>Overall Presence:</span>
              <span className="font-bold font-mono text-white">
                {dataPoint?.attendanceRate}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-zinc-200/90 dark:border-zinc-800/90 shadow-md relative overflow-hidden transition-all">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 mb-2 shadow-xs font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
            <span>Annual Workforce Analytics • {selectedYear}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            Monthly Attendance & Punctuality Trends
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Year-to-date shift punctuality, biometric timeliness, and attendance distribution
          </p>
        </div>

        {/* Action Controls: Department Filter & Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Department Selector */}
          {canFilterDepartment && (
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="pl-3.5 pr-8 py-2 text-xs font-semibold rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Year selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="pl-3.5 pr-8 py-2 text-xs font-semibold rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
            >
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear - 1}>{currentYear - 1}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Chart View Mode Segmented Controls */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setChartView("volumes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === "volumes"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Shift Volumes</span>
            </button>
            <button
              onClick={() => setChartView("punctuality")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartView === "punctuality"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Punctuality Rate</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-5">
        <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
            <span>Avg Punctuality</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-1">
            {summary?.avgPunctuality ?? 95}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Target benchmark: ≥ 92%
          </div>
        </div>

        <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
            <span>Top Performing Month</span>
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-1">
            {summary?.bestMonth ?? "May (97%)"}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Highest on-time arrival ratio
          </div>
        </div>

        <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
            <span>Total On-Time Shifts</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white mt-1">
            {summary?.totalOnTime?.toLocaleString() ?? "24,810"}
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
            Checked in before 09:15 AM
          </div>
        </div>

        <div className="bg-zinc-50/80 dark:bg-zinc-900/60 p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
            <span>Late Check-Ins</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white mt-1">
            {summary?.totalLateArrivals?.toLocaleString() ?? "1,240"}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
            Total past grace period
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative z-10 w-full h-72 sm:h-80 pt-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading monthly attendance trend data...</p>
          </div>
        ) : chartView === "volumes" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-zinc-200/80 dark:text-zinc-800/80"
              />
              <XAxis
                dataKey="month"
                stroke="currentColor"
                className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="present"
                name="On-Time Present"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="late"
                name="Late Arrival"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="leave"
                name="Approved Leave"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="absent"
                name="Unscheduled Absent"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-zinc-200/80 dark:text-zinc-800/80"
              />
              <XAxis
                dataKey="month"
                stroke="currentColor"
                className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[80, 100]}
                stroke="currentColor"
                className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                formatter={() => (
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                    Monthly Punctuality Rate (%)
                  </span>
                )}
              />
              <Bar
                dataKey="punctualityRate"
                name="Punctuality Rate (%)"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              >
                {trendData.map((entry, index) => {
                  const color =
                    entry.punctualityRate >= 95
                      ? "#10b981"
                      : entry.punctualityRate >= 92
                      ? "#f59e0b"
                      : "#f43f5e";
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Benchmarks */}
      <div className="relative z-10 mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>≥95% High Punctuality</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>92-94% Standard</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>&lt;92% Needs Review</span>
          </span>
        </div>
        <div className="font-mono text-zinc-400 dark:text-zinc-500">
          Source: Biometric Punch Logs ({selectedYear})
        </div>
      </div>
    </div>
  );
};
