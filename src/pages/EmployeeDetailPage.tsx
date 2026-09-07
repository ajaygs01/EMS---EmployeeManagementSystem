import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  User,
  DollarSign,
  Clock,
  CalendarDays,
  TrendingUp,
  CheckSquare,
  FolderArchive,
  Sparkles,
  Edit,
  Shield,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Employee, PayrollRecord } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { EmployeeFormModal } from "../components/EmployeeFormModal";
import { PayslipModal } from "../components/PayslipModal";
import { formatINR, formatLPA } from "../utils/formatters";

interface EmployeeDetailPageProps {
  employeeId: string;
  onNavigate: (path: string) => void;
  onBack?: () => void;
}

export const EmployeeDetailPage: React.FC<EmployeeDetailPageProps> = ({
  employeeId,
  onNavigate,
  onBack
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "attendance" | "leaves" | "payroll" | "performance" | "tasks" | "documents"
  >("overview");

  // Modals & AI State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const canEdit = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployee(employeeId);
      if (res.success) {
        setEmployee(res.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load employee details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const handleGenerateAiSummary = async () => {
    try {
      setIsGeneratingAi(true);
      const res = await api.aiEmployeeSummary(employeeId);
      if (res.success) {
        setAiSummary(res.summary);
        showToast("AI Summary generated!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to generate AI summary", "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-semibold text-zinc-400">Loading profile details...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-zinc-200/80 dark:border-zinc-800/80 card-3d">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">Employee record not found</h3>
        <button
          onClick={() => (onBack ? onBack() : onNavigate("/employees"))}
          className="mt-4 px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/30 cursor-pointer"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const related = employee.related;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Button */}
      <button
        onClick={() => (onBack ? onBack() : onNavigate("/employees"))}
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-orange-500" /> Back to Employee Directory
      </button>

      {/* Main Profile Header Card */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl relative overflow-hidden card-3d">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <img
              src={employee.avatar}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="w-24 h-24 rounded-3xl object-cover border-4 border-orange-500/20 dark:border-zinc-800 shadow-xl"
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-black text-zinc-900 dark:text-white">
                  {employee.firstName} {employee.lastName}
                </h1>
                <StatusBadge status={employee.status} size="md" />
              </div>

              <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                {employee.position} • {employee.departmentName}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-zinc-500 dark:text-zinc-400 mt-3 font-medium">
                <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300">
                  ID: {employee.employeeId}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" /> {employee.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" /> {employee.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {employee.city}, {employee.country}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <button
              onClick={handleGenerateAiSummary}
              disabled={isGeneratingAi}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30 hover:opacity-90 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingAi ? "Analyzing..." : "AI Executive Summary"}</span>
            </button>

            {canEdit && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-orange-500" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* AI Performance Summary Banner */}
        {aiSummary && (
          <div className="mt-6 p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-zinc-800 dark:text-zinc-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-400">
                <Sparkles className="w-4 h-4 text-orange-500" /> Gemini AI Talent Assessment
              </div>
              <button
                onClick={() => setAiSummary(null)}
                className="text-zinc-400 hover:text-zinc-600 text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <div className="whitespace-pre-line leading-relaxed">{aiSummary}</div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
        {[
          { id: "overview", label: "Overview & Personal", icon: User },
          { id: "attendance", label: "Attendance Log", icon: Clock },
          { id: "leaves", label: "Leaves & Quotas", icon: CalendarDays },
          { id: "payroll", label: "Compensation & Payslips", icon: DollarSign },
          { id: "performance", label: "KPIs & Reviews", icon: TrendingUp },
          { id: "tasks", label: "Tasks & Projects", icon: CheckSquare },
          { id: "documents", label: "Documents Repository", icon: FolderArchive }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? "border-orange-500 text-orange-600 dark:text-orange-400"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-orange-500" : ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panes */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employment Info */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 text-xs card-3d">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                Employment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-400 block mb-1">Employment Type</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{employee.employmentType}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1">Joining Date</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{employee.joiningDate}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1">System Role</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{employee.role}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1">Direct Manager</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{employee.managerName || "Executive Board"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block mb-1">Annual CTC & Compensation</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatLPA(employee.salary)} ({formatINR(Math.round(employee.salary / 12))}/mo)
                  </span>
                </div>
              </div>
            </div>

            {/* Personal & Emergency Info */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 text-xs card-3d">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
                Personal & Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-400 block mb-1">Date of Birth</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{employee.dob || "1994-05-12"}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-1">Gender</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{employee.gender || "Not specified"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block mb-1">Residential Address</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {employee.address}, {employee.city}, {employee.state} {employee.country}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 block mb-1">Emergency Contact</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {employee.emergencyContact?.name} ({employee.emergencyContact?.relationship}) •{" "}
                    {employee.emergencyContact?.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Attendance Log (Last 30 Days)</h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                98% Punctuality Rating
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Check In</th>
                    <th className="p-3">Check Out</th>
                    <th className="p-3">Working Hours</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {!related?.attendance || related.attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        No recent attendance records logged
                      </td>
                    </tr>
                  ) : (
                    related.attendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                        <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">{rec.date}</td>
                        <td className="p-3 font-mono text-zinc-600 dark:text-zinc-300">{rec.checkIn || "--:--"}</td>
                        <td className="p-3 font-mono text-zinc-600 dark:text-zinc-300">{rec.checkOut || "--:--"}</td>
                        <td className="p-3 font-medium">{rec.workingHours} hrs</td>
                        <td className="p-3">
                          <StatusBadge status={rec.status} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LEAVES */}
        {activeTab === "leaves" && (
          <div className="space-y-6">
            {/* Balances Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs card-3d">
                <div className="text-zinc-400 font-medium">Casual Leave</div>
                <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1 font-mono">10 / 12</div>
                <div className="text-[10px] text-zinc-400 mt-1">2 days consumed</div>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs card-3d">
                <div className="text-zinc-400 font-medium">Sick Leave</div>
                <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1 font-mono">8 / 10</div>
                <div className="text-[10px] text-zinc-400 mt-1">2 days consumed</div>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs card-3d">
                <div className="text-zinc-400 font-medium">Earned / Vacation</div>
                <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1 font-mono">14 / 15</div>
                <div className="text-[10px] text-zinc-400 mt-1">1 day consumed</div>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs card-3d">
                <div className="text-zinc-400 font-medium">Emergency Leave</div>
                <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1 font-mono">5 / 5</div>
                <div className="text-[10px] text-zinc-400 mt-1">0 days consumed</div>
              </div>
            </div>

            {/* Leave History Table */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Leave History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Days</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {!related?.leaves || related.leaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          No leave applications on file
                        </td>
                      </tr>
                    ) : (
                      related.leaves.map((l) => (
                        <tr key={l.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                          <td className="p-3 font-semibold text-zinc-800 dark:text-zinc-200">{l.leaveType}</td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-300">
                            {l.startDate} to {l.endDate}
                          </td>
                          <td className="p-3 font-bold">{l.totalDays}</td>
                          <td className="p-3 text-zinc-500 max-w-xs truncate">{l.reason}</td>
                          <td className="p-3">
                            <StatusBadge status={l.status} size="sm" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYROLL */}
        {activeTab === "payroll" && (
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Generated Payslips & Salary Records</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">Pay Period</th>
                    <th className="p-3">Basic Salary</th>
                    <th className="p-3">Allowances</th>
                    <th className="p-3">Deductions & Tax</th>
                    <th className="p-3">Net Disbursed</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {!related?.payrolls || related.payrolls.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-400">
                        No payroll records found
                      </td>
                    </tr>
                  ) : (
                    related.payrolls.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                        <td className="p-3 font-bold text-zinc-900 dark:text-white">{p.month}</td>
                        <td className="p-3 font-mono">{formatINR(p.basicSalary)}</td>
                        <td className="p-3 font-mono text-emerald-600">+{formatINR(p.allowances + p.bonus)}</td>
                        <td className="p-3 font-mono text-rose-500">-{formatINR(p.deductions + p.tax)}</td>
                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">
                          {formatINR(p.netSalary)}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={p.status} size="sm" />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedPayslipId(p.id)}
                            className="px-3 py-1 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-500/20 transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Payslip
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PERFORMANCE */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            {!related?.performances || related.performances.length === 0 ? (
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800 card-3d">
                <TrendingUp className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No performance review cycle recorded yet.</p>
              </div>
            ) : (
              related.performances.map((perf) => (
                <div
                  key={perf.id}
                  className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-5 card-3d"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                        Review Cycle: {perf.reviewPeriod}
                      </h3>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        Reviewed by {perf.reviewerName} on {perf.reviewDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-orange-500 dark:text-orange-400 font-mono">
                        {perf.overallScore} / 5.0
                      </span>
                      <StatusBadge status={perf.ratingLevel} size="md" />
                    </div>
                  </div>

                  {/* Criteria Rating Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {[
                      { label: "Productivity", score: perf.productivityScore },
                      { label: "Deliverable Quality", score: perf.qualityScore },
                      { label: "Teamwork & Collaboration", score: perf.teamworkScore },
                      { label: "Communication", score: perf.communicationScore },
                      { label: "Leadership & Initiative", score: perf.leadershipScore }
                    ].map((item) => (
                      <div key={item.label} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60">
                        <div className="flex justify-between font-semibold mb-1.5">
                          <span className="text-zinc-600 dark:text-zinc-300">{item.label}</span>
                          <span className="font-mono text-orange-500 dark:text-orange-400">{item.score} / 5.0</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full"
                            style={{ width: `${(item.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Manager Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">Key Strengths</div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{perf.strengths}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
                      <div className="font-bold text-amber-800 dark:text-amber-300 mb-1">Areas for Growth</div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{perf.areasForImprovement}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 6: TASKS */}
        {activeTab === "tasks" && (
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Assigned Tasks & Deliverables</h3>
            <div className="space-y-3">
              {!related?.tasks || related.tasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">No active tasks assigned</div>
              ) : (
                related.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-zinc-900 dark:text-white text-sm">{t.title}</span>
                        <StatusBadge status={t.priority} size="sm" />
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 line-clamp-1">{t.description}</p>
                      <div className="text-[11px] text-zinc-400 mt-2">Due Date: {t.dueDate}</div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-28 text-right">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          {t.progressPercent}%
                        </span>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{ width: `${t.progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4 card-3d">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Uploaded Personnel Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!related?.documents || related.documents.length === 0 ? (
                <div className="col-span-3 py-8 text-center text-xs text-zinc-400">
                  No employee documents uploaded
                </div>
              ) : (
                related.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-zinc-900 dark:text-white truncate">{doc.name}</div>
                        <div className="text-[11px] text-zinc-400">
                          {doc.type} • {doc.fileSize}
                        </div>
                      </div>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-zinc-600 shadow-sm shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={employee}
        onSuccess={() => {
          showToast("Profile updated successfully", "success");
          fetchEmployeeData();
        }}
      />

      {/* Payslip Modal */}
      <PayslipModal
        isOpen={!!selectedPayslipId}
        onClose={() => setSelectedPayslipId(null)}
        payrollId={selectedPayslipId}
      />
    </div>
  );
};
