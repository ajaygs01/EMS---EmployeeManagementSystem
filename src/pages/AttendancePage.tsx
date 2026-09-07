import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Square,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Edit2,
  CalendarDays,
  RotateCcw,
  Sparkles
} from "lucide-react";
import { AttendanceRecord, Department } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { MonthlyAttendanceTrendsChart } from "../components/attendance/MonthlyAttendanceTrendsChart";

interface AttendancePageProps {
  onNavigate: (path: string) => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editStatus, setEditStatus] = useState<any>("Present");
  const [isUpdating, setIsUpdating] = useState(false);

  // Timer
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const canManage = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, deptRes, todayRes] = await Promise.all([
        api.getAttendance({
          date: selectedDate,
          departmentId: selectedDept,
          status: selectedStatus,
          search
        }),
        api.getDepartments(),
        api.getTodayAttendanceStatus().catch(() => ({ success: false, data: null }))
      ]);

      if (attRes.success) {
        setRecords(attRes.data);
      }
      if (deptRes.success) {
        setDepartments(deptRes.data);
      }
      if (todayRes?.success) {
        setTodayStatus(todayRes.data || todayRes.record || null);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load attendance logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedDept, selectedStatus, search]);

  const handlePunchIn = async (customTime?: string) => {
    try {
      setPunchLoading(true);
      const res = await api.checkIn(customTime ? { checkInTime: customTime } : undefined);
      if (res.success) {
        showToast(res.message || "Checked in successfully!", "success");
        setTodayStatus(res.data || res.record || null);
        fetchAttendance();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to clock in", "error");
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async (customTime?: string) => {
    try {
      setPunchLoading(true);
      const res = await api.checkOut(customTime ? { checkOutTime: customTime } : undefined);
      if (res.success) {
        showToast(res.message || "Checked out successfully!", "success");
        setTodayStatus(res.data || res.record || null);
        fetchAttendance();
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
        setTodayStatus(null);
        fetchAttendance();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to reset attendance card", "error");
    } finally {
      setPunchLoading(false);
    }
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setEditCheckIn(rec.checkIn || "09:00 AM");
    setEditCheckOut(rec.checkOut || "05:30 PM");
    setEditStatus(rec.status);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      setIsUpdating(true);
      const res = await api.updateAttendance(editingRecord.id, {
        checkIn: editCheckIn,
        checkOut: editCheckOut,
        status: editStatus
      });
      if (res.success) {
        showToast("Attendance regularized successfully", "success");
        setEditingRecord(null);
        fetchAttendance();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update record", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Date", "Employee Name", "Department", "Check In", "Check Out", "Working Hours", "Status"];
    const rows = records.map((r) => [
      r.date,
      `"${r.employeeName}"`,
      `"${r.departmentName}"`,
      r.checkIn || "--",
      r.checkOut || "--",
      r.workingHours,
      r.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Attendance report exported to CSV", "success");
  };

  // Metrics
  const presentCount = records.filter((r) => r.status === "Present").length;
  const lateCount = records.filter((r) => r.status === "Late").length;
  const leaveCount = records.filter((r) => r.status === "Leave").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
            Attendance & Time Tracker
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Real-time biometric punch logs, punctuality metrics, working hours, and shift regularizations
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-zinc-400" />
          <span>Export Daily Report</span>
        </button>
      </div>

      {/* Clock In/Out Banner for Current User */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl text-zinc-900 dark:text-white rounded-3xl p-6 sm:p-7 shadow-md border border-zinc-200/90 dark:border-zinc-800/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1 font-mono flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${todayStatus?.checkIn ? (todayStatus.checkOut ? "bg-zinc-400" : "bg-emerald-500 animate-pulse") : "bg-orange-500 animate-ping"}`} />
            My Daily Time Card ({new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })})
          </div>
          <h3 className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white">
            {user?.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Standard Shift: 09:00 AM - 06:00 PM • Grace Period: 15 mins (09:15 AM threshold)
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900/90 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase font-sans">Live Clock</div>
            <div className="text-lg font-mono font-bold text-zinc-900 dark:text-white tracking-wider">{currentTime.toLocaleTimeString()}</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/90 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase font-sans">Today's Status</div>
            <div className="text-xs font-bold mt-0.5 font-sans flex items-center gap-1.5 justify-center">
              {todayStatus?.checkIn ? (
                <>
                  <span className={todayStatus.status === "Late" ? "text-amber-500" : "text-emerald-500"}>
                    {todayStatus.status}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                    ({todayStatus.checkIn}{todayStatus.checkOut ? ` - ${todayStatus.checkOut}` : ""})
                  </span>
                </>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">Not Clocked In</span>
              )}
            </div>
          </div>

          {!todayStatus?.checkIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePunchIn()}
                disabled={punchLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Clock In Now
              </button>

              {/* Test late punch helper */}
              <button
                onClick={() => handlePunchIn("09:42:00")}
                disabled={punchLoading}
                title="Test check-in past 09:15 AM to verify 'Late' flag calculation"
                className="flex items-center gap-1.5 px-3 py-3 rounded-2xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Late</span>
              </button>
            </div>
          ) : !todayStatus?.checkOut ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePunchOut()}
                disabled={punchLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                Clock Out
              </button>
              <button
                onClick={handleResetToday}
                disabled={punchLoading}
                title="Reset today's punch card for testing"
                className="p-3 rounded-2xl text-zinc-400 hover:text-orange-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                Completed ({todayStatus.workingHours} hrs)
              </span>
              <button
                onClick={handleResetToday}
                disabled={punchLoading}
                title="Reset today's punch card for testing"
                className="p-2.5 rounded-2xl text-zinc-400 hover:text-orange-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Bar with 3D Depth */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Present On-Time</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{presentCount}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Late Arrivals</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{lateCount}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Approved Leave</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{leaveCount}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Absent</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{absentCount}</div>
          </div>
        </div>
      </div>

      {/* Monthly Attendance & Punctuality Trends Bar Chart */}
      <MonthlyAttendanceTrendsChart departments={departments} canFilterDepartment={canManage} />

      {/* Filters Bar */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex flex-wrap items-center gap-3 text-xs">
        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-500 font-sans">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
          />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans"
          />
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
        >
          <option value="">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Leave">Leave</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      {/* Attendance Table */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400">Loading attendance data...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            No attendance records found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 font-sans">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Check In</th>
                  <th className="py-3.5 px-4">Check Out</th>
                  <th className="py-3.5 px-4">Working Hours</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Regularize</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-200">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-orange-500/[0.03] dark:hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3 px-4 font-bold font-sans text-zinc-900 dark:text-white">
                      {rec.employeeName}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-sans">{rec.departmentName}</td>
                    <td className="py-3 px-4 text-zinc-500 font-mono">{rec.date}</td>
                    <td className="py-3 px-4 font-mono font-medium">{rec.checkIn || "--:--"}</td>
                    <td className="py-3 px-4 font-mono font-medium">{rec.checkOut || "--:--"}</td>
                    <td className="py-3 px-4 font-semibold font-mono">{rec.workingHours} hrs</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rec.status} size="sm" />
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-2 rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                          title="Edit / Regularize Punch"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Regularization Modal */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title={`Regularize Attendance: ${editingRecord?.employeeName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Check In Time</label>
            <input
              type="text"
              value={editCheckIn}
              onChange={(e) => setEditCheckIn(e.target.value)}
              placeholder="e.g. 09:00 AM"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Check Out Time</label>
            <input
              type="text"
              value={editCheckOut}
              onChange={(e) => setEditCheckOut(e.target.value)}
              placeholder="e.g. 05:30 PM"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attendance Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingRecord(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-sm"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
