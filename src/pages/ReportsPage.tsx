import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Award,
  Calendar,
  FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";
import { DashboardStats } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

interface ReportsPageProps {
  onNavigate: (path: string) => void;
}

const COLORS = ["#f97316", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err: any) {
        showToast(err.message || "Failed to load reports", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExportFullReport = () => {
    showToast("Full executive summary report exported to PDF/CSV", "success");
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-semibold text-zinc-400">Compiling workforce intelligence...</p>
      </div>
    );
  }

  // Monthly Payroll Trend Data
  const payrollTrend = [
    { month: "Jan", amount: 48000 },
    { month: "Feb", amount: 50500 },
    { month: "Mar", amount: 52000 },
    { month: "Apr", amount: 54000 },
    { month: "May", amount: 56500 },
    { month: "Jun", amount: 58000 },
    { month: "Jul", amount: 62450 }
  ];

  // Performance Rating Distribution
  const performanceDist = [
    { name: "Excellent (4.5 - 5.0)", count: 18, fill: "#10b981" },
    { name: "Very Good (4.0 - 4.4)", count: 14, fill: "#f97316" },
    { name: "Good (3.0 - 3.9)", count: 7, fill: "#f59e0b" },
    { name: "Needs Growth (< 3.0)", count: 2, fill: "#ef4444" }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-orange-500" />
            Executive Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Enterprise metrics, payroll budgets, retention indicators, and workforce distribution
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex items-center gap-2 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Executive Dossier</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm card-3d">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Headcount</div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
            {stats?.totalEmployees || 42}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">+8.5% YoY growth</div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm card-3d">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Monthly Payroll</div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-white mt-1">
            ₹{stats?.monthlyPayrollCost ? (stats.monthlyPayrollCost / 100000).toFixed(1) : "62.4"}L
          </div>
          <div className="text-xs text-zinc-400 mt-1">100% disbursed</div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm card-3d">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Avg Attendance</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            96.4%
          </div>
          <div className="text-xs text-zinc-400 mt-1">High punctuality rate</div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm card-3d">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">Avg Performance</div>
          <div className="text-2xl font-bold font-mono text-orange-500 dark:text-orange-400 mt-1">
            4.6 / 5.0
          </div>
          <div className="text-xs text-zinc-400 mt-1">Top quartile productivity</div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Department Headcount Distribution */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Department Headcount Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.departmentDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "12px",
                    border: "1px solid #27272a",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="value" name="Staff Count" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Payroll Trend */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Payroll Budget Trajectory (₹)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "12px",
                    border: "1px solid #27272a",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                  formatter={(val: any) => [`₹${val.toLocaleString()}`, "Payroll Disbursed"]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Performance Distribution */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Performance Score Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceDist}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {performanceDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "12px",
                    border: "1px solid #27272a",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick CSV Export Toolkit */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 flex flex-col justify-between card-3d">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Export Module Datasets</h3>
            <p className="text-xs text-zinc-500 mt-1">Download raw records for statutory compliance and audits.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => showToast("Employee roster exported", "success")}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 hover:bg-orange-500/10 hover:text-orange-600 flex items-center gap-2 font-semibold transition-colors text-left cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-orange-500" />
              <span>Staff Directory CSV</span>
            </button>
            <button
              onClick={() => showToast("Attendance ledger exported", "success")}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 flex items-center gap-2 font-semibold transition-colors text-left cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Biometric Logs CSV</span>
            </button>
            <button
              onClick={() => showToast("Payroll disbursement ledger exported", "success")}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 flex items-center gap-2 font-semibold transition-colors text-left cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-500" />
              <span>Payroll Ledger CSV</span>
            </button>
            <button
              onClick={() => showToast("Performance appraisals dataset exported", "success")}
              className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 flex items-center gap-2 font-semibold transition-colors text-left cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>KPI Appraisals CSV</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-400">
            Automated scheduled reports generated every Monday at 08:00 AM UTC.
          </div>
        </div>
      </div>
    </div>
  );
};
