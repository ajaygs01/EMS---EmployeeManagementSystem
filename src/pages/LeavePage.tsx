import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Sliders,
  FileSpreadsheet,
  RotateCcw,
  UserCheck,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react";
import { LeaveRequest, LeaveBalance, Employee } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { LeaveApplyModal } from "../components/LeaveApplyModal";
import { LeaveQuotaModal } from "../components/LeaveQuotaModal";
import { Modal } from "../components/Modal";

interface LeavePageProps {
  onNavigate: (path: string) => void;
}

export const LeavePage: React.FC<LeavePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [allBalances, setAllBalances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [activeTab, setActiveTab] = useState<"my-leaves" | "all-requests" | "balances-dir">("my-leaves");
  const [activeFilter, setActiveFilter] = useState<"All" | "Pending" | "Approved" | "Rejected" | "Cancelled">("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Quota Modal
  const [selectedEmpForQuota, setSelectedEmpForQuota] = useState<Employee | null>(null);
  const [selectedEmpBalance, setSelectedEmpBalance] = useState<LeaveBalance | null>(null);
  const [isQuotaOpen, setIsQuotaOpen] = useState(false);

  const isAdminOrManager = user?.role === "Super Admin" || user?.role === "HR Admin" || user?.role === "Manager";
  const isHRorSuperAdmin = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const isEmployeeOnly = user?.role === "Employee" || activeTab === "my-leaves";

      const [leaveRes, balRes, allBalRes, empRes] = await Promise.all([
        api.getLeaves({
          status: activeFilter === "All" ? undefined : activeFilter,
          leaveType: leaveTypeFilter === "all" ? undefined : leaveTypeFilter,
          department: departmentFilter === "all" ? undefined : departmentFilter,
          employeeId: isEmployeeOnly && user?.employeeId ? user.employeeId : undefined,
          search: searchQuery || undefined
        }),
        user?.employeeId
          ? api.getLeaveBalances(user.employeeId).catch(() => ({ success: false, data: null }))
          : Promise.resolve({ success: false, data: null }),
        isAdminOrManager
          ? api.getAllLeaveBalances().catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: false, data: [] }),
        isAdminOrManager
          ? api.getEmployees({ limit: 100 }).catch(() => ({ success: false, data: [] }))
          : Promise.resolve({ success: false, data: [] })
      ]);

      if (leaveRes.success) {
        setLeaves(leaveRes.data);
      }
      if (balRes?.success) {
        setBalance(balRes.data);
      }
      if (allBalRes?.success) {
        setAllBalances(allBalRes.data);
      }
      if (empRes?.success) {
        setEmployees(empRes.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load leave records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeFilter, leaveTypeFilter, departmentFilter, activeTab, user]);

  const handleReview = async () => {
    if (!selectedLeave || !actionType) return;
    try {
      setIsReviewing(true);
      const res =
        actionType === "approve"
          ? await api.approveLeave(selectedLeave.id, reviewRemarks)
          : await api.rejectLeave(selectedLeave.id, reviewRemarks);

      if (res.success) {
        showToast(
          actionType === "approve" ? "Leave request approved successfully!" : "Leave request rejected.",
          actionType === "approve" ? "success" : "info"
        );
        setSelectedLeave(null);
        setActionType(null);
        setReviewRemarks("");
        fetchLeaves();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to review leave", "error");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    try {
      const res = await api.cancelLeave(id);
      if (res.success) {
        showToast("Leave request cancelled successfully.", "info");
        fetchLeaves();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to cancel leave", "error");
    }
  };

  const handleOpenQuota = (empId: string) => {
    const emp = employees.find((e) => e.id === empId || e.employeeId === empId) || null;
    const b = allBalances.find((item) => item.employeeId === empId) || balance;
    setSelectedEmpForQuota(emp);
    setSelectedEmpBalance(b);
    setIsQuotaOpen(true);
  };

  // Export leaves to CSV
  const handleExportCSV = () => {
    if (leaves.length === 0) {
      showToast("No records available to export.", "info");
      return;
    }
    const headers = ["Employee ID", "Employee Name", "Department", "Leave Type", "Start Date", "End Date", "Total Days", "Status", "Reason", "Applied Date"];
    const rows = leaves.map((l) => [
      l.employeeId,
      `"${l.employeeName}"`,
      `"${l.departmentName}"`,
      `"${l.leaveType}"`,
      l.startDate,
      l.endDate,
      l.totalDays,
      l.status,
      `"${l.reason.replace(/"/g, '""')}"`,
      l.appliedDate
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EMS_Leave_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Leave report downloaded.", "success");
  };

  // Filtered leaves according to search
  const filteredLeaves = useMemo(() => {
    if (!searchQuery.trim()) return leaves;
    const q = searchQuery.toLowerCase();
    return leaves.filter(
      (l) =>
        l.employeeName.toLowerCase().includes(q) ||
        l.departmentName.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q)
    );
  }, [leaves, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: leaves.length,
      pending: leaves.filter((l) => l.status === "Pending").length,
      approved: leaves.filter((l) => l.status === "Approved").length,
      rejected: leaves.filter((l) => l.status === "Rejected").length,
      cancelled: leaves.filter((l) => l.status === "Cancelled").length
    };
  }, [leaves]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0 shadow-inner">
              <CalendarDays className="w-5 h-5" />
            </div>
            Leave Management & Balances
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track annual quotas, submit absence requests, and manage corporate leave approvals
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Main Mode Tabs */}
      {isAdminOrManager && (
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-2.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab("my-leaves")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "my-leaves"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            My Leaves & Balance
          </button>
          <button
            onClick={() => setActiveTab("all-requests")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "all-requests"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Team Requests
          </button>
          <button
            onClick={() => setActiveTab("balances-dir")}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "balances-dir"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Team Quota Directory
          </button>
        </div>
      )}

      {/* Leave Balance Quotas Summary Cards (Shown for user's personal view or main leave overview) */}
      {activeTab !== "balances-dir" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Casual Leave */}
          <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>Casual Leave</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-1.5 flex items-baseline gap-1">
              <span>{balance ? balance.casualLeave.total - balance.casualLeave.used : 10}</span>
              <span className="text-xs font-normal text-zinc-400 font-sans">/ {balance ? balance.casualLeave.total : 12} days</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${balance ? Math.min(100, ((balance.casualLeave.total - balance.casualLeave.used) / balance.casualLeave.total) * 100) : 80}%`
                }}
              />
            </div>
            <div className="text-[10px] text-zinc-400 mt-2 flex justify-between font-mono">
              <span>{balance ? balance.casualLeave.used : 2} days used</span>
              <span>Available</span>
            </div>
          </div>

          {/* Sick Leave */}
          <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>Sick Leave</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-1.5 flex items-baseline gap-1">
              <span>{balance ? balance.sickLeave.total - balance.sickLeave.used : 8}</span>
              <span className="text-xs font-normal text-zinc-400 font-sans">/ {balance ? balance.sickLeave.total : 10} days</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${balance ? Math.min(100, ((balance.sickLeave.total - balance.sickLeave.used) / balance.sickLeave.total) * 100) : 80}%`
                }}
              />
            </div>
            <div className="text-[10px] text-zinc-400 mt-2 flex justify-between font-mono">
              <span>{balance ? balance.sickLeave.used : 2} days used</span>
              <span>Available</span>
            </div>
          </div>

          {/* Earned Leave */}
          <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>Earned / Vacation</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-1.5 flex items-baseline gap-1">
              <span>{balance ? balance.earnedLeave.total - balance.earnedLeave.used : 14}</span>
              <span className="text-xs font-normal text-zinc-400 font-sans">/ {balance ? balance.earnedLeave.total : 15} days</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${balance ? Math.min(100, ((balance.earnedLeave.total - balance.earnedLeave.used) / balance.earnedLeave.total) * 100) : 93}%`
                }}
              />
            </div>
            <div className="text-[10px] text-zinc-400 mt-2 flex justify-between font-mono">
              <span>{balance ? balance.earnedLeave.used : 1} days used</span>
              <span>Available</span>
            </div>
          </div>

          {/* Emergency Leave */}
          <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>Emergency Leave</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-1.5 flex items-baseline gap-1">
              <span>{balance ? balance.emergencyLeave.total - balance.emergencyLeave.used : 5}</span>
              <span className="text-xs font-normal text-zinc-400 font-sans">/ {balance ? balance.emergencyLeave.total : 5} days</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${balance ? Math.min(100, ((balance.emergencyLeave.total - balance.emergencyLeave.used) / balance.emergencyLeave.total) * 100) : 100}%`
                }}
              />
            </div>
            <div className="text-[10px] text-zinc-400 mt-2 flex justify-between font-mono">
              <span>{balance ? balance.emergencyLeave.used : 0} days used</span>
              <span>Available</span>
            </div>
          </div>
        </div>
      )}

      {/* View Directory for Team Quotas */}
      {activeTab === "balances-dir" && (
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">
                Team Leave Balances Directory
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Overview of total and consumed leave allowances across all staff members
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/60 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Casual (Avail/Tot)</th>
                  <th className="py-3 px-4">Sick (Avail/Tot)</th>
                  <th className="py-3 px-4">Earned (Avail/Tot)</th>
                  <th className="py-3 px-4">Emergency (Avail/Tot)</th>
                  {isHRorSuperAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {allBalances.map((b) => (
                  <tr key={b.employeeId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={b.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.employeeName || "User")}&background=f97316&color=fff`}
                          alt={b.employeeName}
                          className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-white">{b.employeeName}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">{b.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">{b.departmentName}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-blue-500">{b.casualLeave.total - b.casualLeave.used}</span>
                      <span className="text-zinc-400 text-[11px]"> / {b.casualLeave.total}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-emerald-500">{b.sickLeave.total - b.sickLeave.used}</span>
                      <span className="text-zinc-400 text-[11px]"> / {b.sickLeave.total}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-amber-500">{b.earnedLeave.total - b.earnedLeave.used}</span>
                      <span className="text-zinc-400 text-[11px]"> / {b.earnedLeave.total}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-rose-500">{b.emergencyLeave.total - b.emergencyLeave.used}</span>
                      <span className="text-zinc-400 text-[11px]"> / {b.emergencyLeave.total}</span>
                    </td>
                    {isHRorSuperAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenQuota(b.employeeId)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-orange-500/40 text-orange-500 hover:bg-orange-500/10 transition-colors cursor-pointer"
                        >
                          Adjust Quota
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Leave Requests Section */}
      {activeTab !== "balances-dir" && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Status Tabs, Leave Type Dropdown, View Toggle */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-3.5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs font-semibold">
              {(["All", "Pending", "Approved", "Rejected", "Cancelled"] as const).map((tab) => {
                const count = tab === "All" ? counts.all : counts[tab.toLowerCase() as keyof typeof counts];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeFilter === tab
                        ? "bg-orange-500 text-white font-bold shadow-sm"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        activeFilter === tab ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-2">
              {/* Search Field */}
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search leaves..."
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>

              {/* Leave Type Select */}
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:border-orange-500 font-sans"
              >
                <option value="all">All Leave Types</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Earned Leave">Earned Leave</option>
                <option value="Emergency Leave">Emergency Leave</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>

              {/* Grid / Table View Switcher */}
              <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 bg-zinc-50 dark:bg-zinc-900">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-white dark:bg-zinc-800 text-orange-500 shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "table" ? "bg-white dark:bg-zinc-800 text-orange-500 shadow-xs" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Table View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading & Empty States */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-zinc-400">Loading leave requests...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-zinc-200/90 dark:border-zinc-800/90 shadow-md">
              <CalendarDays className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold font-display text-zinc-900 dark:text-white">No leave requests found</h3>
              <p className="text-xs text-zinc-500 mt-1">There are no leave applications matching your search or filters.</p>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-5 border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:shadow-lg hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Employee info + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold font-display text-sm text-zinc-900 dark:text-white">{leave.employeeName}</h3>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{leave.departmentName}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                          {leave.leaveType}
                        </span>
                        <StatusBadge status={leave.status} size="sm" />
                      </div>
                    </div>

                    {/* Meta info box */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/70 p-3 rounded-2xl space-y-1 text-xs text-zinc-600 dark:text-zinc-300 my-3 border border-zinc-100 dark:border-zinc-800/60 font-sans">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Duration:</span>
                        <span className="font-semibold font-mono text-zinc-900 dark:text-white">
                          {leave.startDate} → {leave.endDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Total Days:</span>
                        <span className="font-bold font-mono text-orange-500">
                          {leave.totalDays} Day{leave.totalDays > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Applied Date:</span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {new Date(leave.appliedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
                      <span className="font-semibold text-zinc-900 dark:text-white">Reason: </span>
                      "{leave.reason}"
                    </div>

                    {/* Review remarks if existing */}
                    {leave.reviewRemarks && (
                      <div className="text-[11px] bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 mb-3 font-sans">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Review Remarks ({leave.reviewedBy || "Manager"}):{" "}
                        </span>
                        {leave.reviewRemarks}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2 text-xs">
                    {leave.status === "Pending" && isAdminOrManager && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setActionType("reject");
                          }}
                          className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setActionType("approve");
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      </>
                    )}

                    {leave.status === "Pending" && !isAdminOrManager && (
                      <button
                        onClick={() => handleCancelLeave(leave.id)}
                        className="px-3 py-1.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/60 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                          {leave.employeeName}
                          <div className="text-[10px] text-zinc-400 font-normal">{leave.departmentName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                            {leave.leaveType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {leave.startDate} → {leave.endDate}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-orange-500">{leave.totalDays}d</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={leave.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-zinc-500">{leave.reason}</td>
                        <td className="py-3 px-4 text-right">
                          {leave.status === "Pending" && isAdminOrManager ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setActionType("approve");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] hover:bg-emerald-600 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setActionType("reject");
                                }}
                                className="px-2.5 py-1 rounded-lg border border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-bold text-[11px] cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : leave.status === "Pending" ? (
                            <button
                              onClick={() => handleCancelLeave(leave.id)}
                              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 text-[11px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-400 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      <LeaveApplyModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        employees={employees}
        onSuccess={() => {
          fetchLeaves();
        }}
      />

      {/* Quota Modal */}
      <LeaveQuotaModal
        isOpen={isQuotaOpen}
        onClose={() => {
          setIsQuotaOpen(false);
          setSelectedEmpForQuota(null);
          setSelectedEmpBalance(null);
        }}
        employee={selectedEmpForQuota}
        currentBalance={selectedEmpBalance}
        onSuccess={() => {
          fetchLeaves();
        }}
      />

      {/* Decision Remarks Modal */}
      <Modal
        isOpen={!!selectedLeave && !!actionType}
        onClose={() => {
          setSelectedLeave(null);
          setActionType(null);
          setReviewRemarks("");
        }}
        title={`${actionType === "approve" ? "Approve" : "Reject"} Leave Request`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs font-sans">
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
            You are about to <strong className="uppercase">{actionType}</strong> the leave application for{" "}
            <strong className="text-zinc-900 dark:text-white">{selectedLeave?.employeeName}</strong> (
            {selectedLeave?.totalDays} day{selectedLeave?.totalDays !== 1 ? "s" : ""} of {selectedLeave?.leaveType}).
          </p>

          <div>
            <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Review Remarks / Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="e.g. Approved. Tasks delegated to engineering lead."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:border-orange-500 resize-none font-sans"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => {
                setSelectedLeave(null);
                setActionType(null);
                setReviewRemarks("");
              }}
              className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleReview}
              disabled={isReviewing}
              className={`px-4 py-2 font-bold text-white rounded-xl shadow-md cursor-pointer ${
                actionType === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                  : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20"
              }`}
            >
              {isReviewing ? "Processing..." : `Confirm ${actionType === "approve" ? "Approval" : "Rejection"}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
