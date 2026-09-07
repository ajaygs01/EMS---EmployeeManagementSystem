import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Clock,
  CalendarDays,
  DollarSign,
  TrendingUp,
  CheckSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Square,
  PlusCircle,
  FileSpreadsheet,
  RotateCcw
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { LeaveApplyModal } from "../components/LeaveApplyModal";
import { TaskModal } from "../components/TaskModal";
import { LogHoursModal } from "../components/LogHoursModal";
import { PayslipModal } from "../components/PayslipModal";
import { EmployeeFormModal } from "../components/EmployeeFormModal";
import { QuickActionsFloatingMenu } from "../components/QuickActionsFloatingMenu";
import { AttendanceTrendsChart } from "../components/dashboard/AttendanceTrendsChart";
import { DepartmentPerformanceChart } from "../components/dashboard/DepartmentPerformanceChart";
import { PayrollRecord } from "../types";

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [punchLoading, setPunchLoading] = useState(false);

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);
  const [showPaystubModal, setShowPaystubModal] = useState(false);
  const [selectedPaystub, setSelectedPaystub] = useState<PayrollRecord | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Live timer
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, attendanceRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTodayAttendanceStatus().catch(() => ({ success: false, data: null }))
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (attendanceRes?.success) {
        setTodayAttendance(attendanceRes.data || attendanceRes.record || null);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  const handlePunchIn = async () => {
    try {
      setPunchLoading(true);
      const res = await api.checkIn();
      if (res.success) {
        showToast(res.message || "Clocked in successfully!", "success");
        setTodayAttendance(res.data || res.record || null);
        loadDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to clock in", "error");
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setPunchLoading(true);
      const res = await api.checkOut();
      if (res.success) {
        showToast(res.message || "Clocked out successfully!", "success");
        setTodayAttendance(res.data || res.record || null);
        loadDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to clock out", "error");
    } finally {
      setPunchLoading(false);
    }
  };

  const handleResetToday = async () => {
    try {
      setPunchLoading(true);
      const res = await api.resetTodayAttendance();
      if (res.success) {
        showToast(res.message || "Today's attendance card reset.", "success");
        setTodayAttendance(null);
        loadDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to reset attendance", "error");
    } finally {
      setPunchLoading(false);
    }
  };

  const handleQuickApproveLeave = async (leaveId: string) => {
    try {
      const res = await api.approveLeave(leaveId, "Approved via Dashboard quick action");
      if (res.success) {
        showToast("Leave request approved", "success");
        loadDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to approve leave", "error");
    }
  };

  const handleQuickRejectLeave = async (leaveId: string) => {
    try {
      const res = await api.rejectLeave(leaveId, "Rejected via Dashboard quick action");
      if (res.success) {
        showToast("Leave request rejected", "info");
        loadDashboardData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to reject leave", "error");
    }
  };

  const handleViewPaystub = async () => {
    try {
      const res = await api.getPayrolls(user?.employeeId ? { employeeId: user.employeeId } : {});
      if (res.success && res.data && res.data.length > 0) {
        setSelectedPaystub(res.data[0]);
        setShowPaystubModal(true);
      } else {
        const allRes = await api.getPayrolls({});
        if (allRes.success && allRes.data && allRes.data.length > 0) {
          setSelectedPaystub(allRes.data[0]);
          setShowPaystubModal(true);
        } else {
          showToast("No generated payslips found. Opening Payroll dashboard...", "info");
          onNavigate("/payroll");
        }
      }
    } catch (err: any) {
      onNavigate("/payroll");
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your workspace...</p>
      </div>
    );
  }

  // Chart data setup
  const deptData = Array.isArray(stats?.departmentsSummary)
    ? stats.departmentsSummary
    : Array.isArray(stats?.charts?.departmentDistribution)
    ? stats.charts.departmentDistribution.map((d: any) => ({ ...d, employeeCount: d.employees || 0 }))
    : [];

  const attendanceBreakdown = [
    { name: "Present", value: stats?.attendanceToday?.present || stats?.summary?.presentToday || 0, color: "#10b981" },
    { name: "Late", value: stats?.attendanceToday?.late || 0, color: "#f59e0b" },
    { name: "On Leave", value: stats?.attendanceToday?.onLeave || stats?.summary?.onLeaveEmployees || 0, color: "#6366f1" },
    { name: "Absent", value: stats?.attendanceToday?.absent || stats?.summary?.absentToday || 0, color: "#f43f5e" }
  ];

  const payrollTrends = [
    { month: "Mar", total: 64200 },
    { month: "Apr", total: 65100 },
    { month: "May", total: 68400 },
    { month: "Jun", total: 69800 },
    { month: "Jul", total: stats?.payrollSummary?.totalNet || stats?.summary?.totalPayrollAmount || 71200 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner & Role Header with 3D Depth */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl text-zinc-900 dark:text-white rounded-3xl p-6 sm:p-8 shadow-md border border-zinc-200/90 dark:border-zinc-800/90 relative overflow-hidden">
        {/* Subtle ambient decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-16 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>EMS Enterprise Hub • {user?.role} Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-zinc-900 dark:text-white">
              Welcome back, {user?.name.split(" ")[0]}!
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-xl font-sans leading-relaxed">
              {user?.role === "Super Admin" && "System health is optimal. Overviewing company-wide HR operations, biometric attendance, and finances."}
              {user?.role === "HR Admin" && "Review pending leaves, payroll batches, and department records for today."}
              {user?.role === "Manager" && "Track team progress, monitor sprint tasks, and review pending staff requests."}
              {user?.role === "Employee" && "View your daily attendance punch, personal leave balances, and assigned tasks."}
            </p>
          </div>

          {/* Quick Punch Clock Widget */}
          <div className="bg-zinc-50/90 dark:bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-5 shrink-0 shadow-xs hover:border-orange-500/40 transition-all duration-300">
            <div className="text-center sm:text-left">
              <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">Current Time (IST)</div>
              <div className="text-2xl font-black font-mono text-zinc-900 dark:text-white mt-0.5 tracking-tight">
                {currentTime.toLocaleTimeString("en-IN")}
              </div>
              <div className="text-[11px] text-orange-600 dark:text-orange-400 mt-1 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                <span className={`w-2 h-2 rounded-full ${todayAttendance?.checkIn ? (todayAttendance.checkOut ? "bg-zinc-400" : "bg-emerald-500 animate-pulse") : "bg-zinc-300 dark:bg-zinc-600"}`} />
                <span>
                  {todayAttendance?.checkIn
                    ? `In: ${todayAttendance.checkIn} ${todayAttendance.checkOut ? `• Out: ${todayAttendance.checkOut} (${todayAttendance.workingHours}h)` : "• Active"}`
                    : "Not clocked in today"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!todayAttendance?.checkIn ? (
                <button
                  onClick={handlePunchIn}
                  disabled={punchLoading}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Clock In
                </button>
              ) : !todayAttendance?.checkOut ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePunchOut}
                    disabled={punchLoading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-[0_4px_14px_rgba(244,63,94,0.35)] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    Clock Out
                  </button>
                  <button
                    onClick={handleResetToday}
                    disabled={punchLoading}
                    title="Reset punch card for testing"
                    className="p-3 rounded-xl text-zinc-400 hover:text-orange-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    Completed ({todayAttendance.workingHours} hrs)
                  </span>
                  <button
                    onClick={handleResetToday}
                    disabled={punchLoading}
                    title="Reset punch card for testing"
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-orange-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          subtitle={`${stats?.activeEmployees || 0} Active Staff`}
          trend={{ value: "+4 this month", isPositive: true }}
          icon={Users}
          color="orange"
          onClick={() => onNavigate("/employees")}
        />

        <StatCard
          title="Departments"
          value={stats?.totalDepartments || 0}
          subtitle="All business units active"
          icon={Building2}
          color="amber"
          onClick={() => onNavigate("/departments")}
        />

        <StatCard
          title="Today's Attendance"
          value={`${stats?.attendanceToday?.presentRate || 95}%`}
          subtitle={`${stats?.attendanceToday?.present || 0} Present / ${stats?.attendanceToday?.late || 0} Late`}
          trend={{ value: "98% target", isPositive: true }}
          icon={Clock}
          color="emerald"
          onClick={() => onNavigate("/attendance")}
        />

        <StatCard
          title="Pending Requests"
          value={stats?.pendingLeavesCount || 0}
          subtitle="Requires supervisor action"
          icon={CalendarDays}
          color="orange"
          onClick={() => onNavigate("/leave")}
        />
      </div>

      {/* Visual Analytics Row: Real-Time Attendance Trends & Departmental Performance Metrics */}
      <div className="space-y-6">
        <AttendanceTrendsChart
          trendData={stats?.charts?.attendanceTrend || []}
          punchBuckets={stats?.charts?.punchBuckets || []}
          todayAttendance={stats?.attendanceToday || todayAttendance}
          summary={stats?.summary || stats}
          onNavigate={onNavigate}
        />

        <DepartmentPerformanceChart
          departmentsData={stats?.charts?.departmentPerformance || stats?.departmentsSummary || deptData || []}
          onNavigate={onNavigate}
        />
      </div>

      {/* Middle Operations Grid: Pending Leaves & Tasks & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Requests */}
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">Pending Leave Requests</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Awaiting supervisor decision</p>
            </div>
            <button
              onClick={() => onNavigate("/leave")}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              All Leaves
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
            {!stats?.recentLeaves || stats.recentLeaves.filter((l: any) => l.status === "Pending").length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                No pending leave requests
              </div>
            ) : (
              stats.recentLeaves
                .filter((l: any) => l.status === "Pending")
                .map((leave: any) => (
                  <div
                    key={leave.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between gap-3 text-xs hover:border-orange-500/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 dark:text-white">{leave.employeeName}</span>
                        <StatusBadge status={leave.leaveType} size="sm" />
                      </div>
                      <div className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-1 font-mono">
                        {leave.startDate} to {leave.endDate} ({leave.totalDays} day{leave.totalDays > 1 ? "s" : ""})
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-300 mt-1 italic line-clamp-1">
                        "{leave.reason}"
                      </div>
                    </div>

                    {(user?.role === "Super Admin" || user?.role === "HR Admin" || user?.role === "Manager") && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80">
                        <button
                          onClick={() => handleQuickRejectLeave(leave.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleQuickApproveLeave(leave.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Priority Project Tasks */}
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">Active Tasks</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Team deliverables & deadlines</p>
            </div>
            <button
              onClick={() => onNavigate("/tasks")}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Task Board
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
            {!stats?.recentTasks || stats.recentTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">No active tasks found</div>
            ) : (
              stats.recentTasks.slice(0, 4).map((task: any) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800/80 text-xs hover:border-orange-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">
                      {task.title}
                    </span>
                    <StatusBadge status={task.priority} size="sm" />
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between mb-2">
                    <span>{task.assignedEmployeeName}</span>
                    <span className="font-mono">Due: {task.dueDate}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all"
                      style={{ width: `${task.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Launch & AI Assistant Panel */}
        <div className="bg-white text-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-orange-600 text-xs font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Smart HR Shortcuts</span>
            </div>
            <h2 className="text-lg font-black font-display text-zinc-900">Quick Actions</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Execute frequent employee workflows in one click</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-4 relative z-10">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-orange-50/70 border border-zinc-200 hover:border-orange-500/40 text-left transition-all duration-200 flex flex-col gap-1.5 cursor-pointer group"
            >
              <CalendarDays className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">Apply Leave</span>
            </button>

            <button
              onClick={() => setShowTaskModal(true)}
              className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-emerald-50/70 border border-zinc-200 hover:border-emerald-500/40 text-left transition-all duration-200 flex flex-col gap-1.5 cursor-pointer group"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">Assign Task</span>
            </button>

            <button
              onClick={() => onNavigate("/ai-assistant")}
              className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-amber-50/70 border border-zinc-200 hover:border-orange-500/40 text-left transition-all duration-200 flex flex-col gap-1.5 cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">AI Assistant</span>
            </button>

            <button
              onClick={() => onNavigate("/payroll")}
              className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-orange-50/70 border border-zinc-200 hover:border-orange-500/40 text-left transition-all duration-200 flex flex-col gap-1.5 cursor-pointer group"
            >
              <DollarSign className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-900">View Payroll</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate("/ai-assistant")}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-[0_4px_14px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer relative z-10"
          >
            <Sparkles className="w-4 h-4" /> Ask Gemini HR Assistant
          </button>
        </div>
      </div>

      {/* Modals for Quick Actions */}
      <LeaveApplyModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onSuccess={() => {
          showToast("Leave request submitted successfully!", "success");
          loadDashboardData();
        }}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSuccess={() => {
          showToast("Task created successfully!", "success");
          loadDashboardData();
        }}
      />

      <LogHoursModal
        isOpen={showLogHoursModal}
        onClose={() => setShowLogHoursModal(false)}
        todayAttendance={todayAttendance}
        onSuccess={() => {
          loadDashboardData();
        }}
        onNavigate={onNavigate}
      />

      <PayslipModal
        isOpen={showPaystubModal}
        onClose={() => setShowPaystubModal(false)}
        payroll={selectedPaystub}
      />

      <EmployeeFormModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        onSuccess={() => {
          showToast("Employee roster updated!", "success");
          loadDashboardData();
        }}
      />

      {/* Quick Actions Floating Speed-Dial Menu */}
      <QuickActionsFloatingMenu
        onRequestLeave={() => setShowLeaveModal(true)}
        onLogHours={() => setShowLogHoursModal(true)}
        onViewPaystub={handleViewPaystub}
        onAssignTask={() => setShowTaskModal(true)}
        onAskAI={() => onNavigate("/ai-assistant")}
        onAddEmployee={() => setShowEmployeeModal(true)}
        onNavigate={onNavigate}
        todayAttendance={todayAttendance}
        onPunchIn={handlePunchIn}
        onPunchOut={handlePunchOut}
        punchLoading={punchLoading}
      />
    </div>
  );
};
