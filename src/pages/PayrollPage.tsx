import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  FileSpreadsheet,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  Search,
  Filter,
  CreditCard,
  BarChart3
} from "lucide-react";
import { PayrollRecord, Department } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { PayslipModal } from "../components/PayslipModal";
import { PayrollGenerateModal } from "../components/PayrollGenerateModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { PayrollWaterfallChart } from "../components/PayrollWaterfallChart";

import { formatINR } from "../utils/formatters";

interface PayrollPageProps {
  onNavigate: (path: string) => void;
}

export const PayrollPage: React.FC<PayrollPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [deletingPayroll, setDeletingPayroll] = useState<PayrollRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Waterfall Chart Controls
  const [showWaterfall, setShowWaterfall] = useState(true);
  const [waterfallEmployeeId, setWaterfallEmployeeId] = useState<string>("all");

  const canManage = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const [payRes, deptRes] = await Promise.all([
        api.getPayrolls({
          month: selectedMonth,
          departmentId: selectedDept,
          status: selectedStatus,
          search
        }),
        api.getDepartments()
      ]);

      if (payRes.success) {
        setPayrolls(payRes.data);
      }
      if (deptRes.success) {
        setDepartments(deptRes.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load payroll records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth, selectedDept, selectedStatus, search]);

  const handleDeleteConfirm = async () => {
    if (!deletingPayroll) return;
    try {
      setIsDeleting(true);
      const res = await api.deletePayroll(deletingPayroll.id);
      if (res.success) {
        showToast("Payroll record removed", "success");
        setDeletingPayroll(null);
        fetchPayrolls();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete payroll", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (payrolls.length === 0) return;
    const headers = [
      "Employee Name",
      "Department",
      "Designation",
      "Month",
      "Basic Salary",
      "Allowances",
      "Bonus",
      "Deductions",
      "Tax",
      "Net Salary",
      "Status",
      "Payment Date"
    ];
    const rows = payrolls.map((p) => [
      `"${p.employeeName}"`,
      `"${p.departmentName}"`,
      `"${p.designation}"`,
      p.month,
      p.basicSalary,
      p.allowances,
      p.bonus,
      p.deductions,
      p.tax,
      p.netSalary,
      p.status,
      p.paymentDate || "--"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `payroll_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Payroll ledger exported to CSV", "success");
  };

  // Calculations
  const totalGross = payrolls.reduce((sum, p) => sum + (p.grossSalary || (p.basicSalary + p.allowances + p.bonus)), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + (p.deductions + p.tax), 0);
  const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-inner">
              <DollarSign className="w-5 h-5" />
            </div>
            Payroll & Compensation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Salary disbursements, tax withholdings, deductions, and compliant payslip generation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowWaterfall(!showWaterfall)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              showWaterfall
                ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                : "bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
            }`}
            title="Toggle Compensation Cascade Breakdown"
          >
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <span>{showWaterfall ? "Cascade Breakdown: On" : "Cascade Breakdown: Off"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <button
              onClick={() => setIsGenerateOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Payroll</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Summary Cards with 3D Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Gross Payroll (INR)</div>
          <div className="text-2xl font-black font-mono text-zinc-900 dark:text-white mt-1">
            {formatINR(totalGross)}
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-sans">Basic + HRA + Special Allowances + Bonuses</div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:-translate-y-0.5 transition-all">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Statutory Deductions & TDS</div>
          <div className="text-2xl font-black font-mono text-rose-500 mt-1">
            -{formatINR(totalDeductions)}
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-sans">EPF (12%) + Professional Tax + TDS</div>
        </div>

        <div className="relative overflow-hidden bg-orange-50/70 text-zinc-900 p-5 rounded-3xl border border-orange-200 shadow-sm hover:-translate-y-0.5 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider font-sans">Net Disbursed (INR)</div>
            <div className="text-2xl font-black font-mono text-zinc-900 mt-1">
              {formatINR(totalNet)}
            </div>
            <div className="text-xs text-zinc-600 mt-1 font-sans">100% processed via NEFT / RTGS transfer</div>
          </div>
        </div>
      </div>

      {/* Interactive Payroll Waterfall Effect Breakdown Component */}
      {showWaterfall && (() => {
        const selectedRecord = waterfallEmployeeId === "all"
          ? null
          : payrolls.find((p) => p.id === waterfallEmployeeId || p.employeeId === waterfallEmployeeId);

        const waterfallBasic = selectedRecord
          ? selectedRecord.basicSalary
          : (payrolls.reduce((sum, p) => sum + (p.basicSalary || 0), 0) || 520000);

        const waterfallAllowances = selectedRecord
          ? selectedRecord.allowances
          : (payrolls.reduce((sum, p) => sum + (p.allowances || 0), 0) || 195000);

        const waterfallBonus = selectedRecord
          ? selectedRecord.bonus
          : (payrolls.reduce((sum, p) => sum + (p.bonus || 0), 0) || 45000);

        const waterfallDeductions = selectedRecord
          ? selectedRecord.deductions
          : (payrolls.reduce((sum, p) => sum + (p.deductions || 0), 0) || 85000);

        const waterfallTax = selectedRecord
          ? selectedRecord.tax
          : (payrolls.reduce((sum, p) => sum + (p.tax || 0), 0) || 68000);

        const waterfallEmpName = selectedRecord
          ? (selectedRecord.employee?.name || "Employee")
          : "Enterprise Workforce Aggregate (All Personnel)";

        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-3.5 px-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Compensation Cascade Breakdown
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Interactive cascade illustrating earnings accretion and statutory outflows
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">Breakdown For:</span>
                <select
                  value={waterfallEmployeeId}
                  onChange={(e) => setWaterfallEmployeeId(e.target.value)}
                  className="px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option value="all">Enterprise Cumulative (All {payrolls.length} Personnel)</option>
                  {payrolls.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.employee?.name || p.employeeId} - {p.employee?.designation || "Staff"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <PayrollWaterfallChart
              basicSalary={waterfallBasic}
              allowances={waterfallAllowances}
              bonus={waterfallBonus}
              deductions={waterfallDeductions}
              tax={waterfallTax}
              employeeName={waterfallEmpName}
            />
          </div>
        );
      })()}

      {/* Filter Bar */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex flex-wrap items-center gap-3 text-xs">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-500 font-sans">Pay Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans font-medium"
          >
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name or designation..."
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
          <option value="Paid">Paid</option>
          <option value="Processing">Processing</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Payroll Table */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-zinc-400">Loading payroll ledger...</p>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs font-sans">
            No payroll records found for {selectedMonth}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800 font-sans">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Basic Pay</th>
                  <th className="py-3.5 px-4">Allowances</th>
                  <th className="py-3.5 px-4">Deductions</th>
                  <th className="py-3.5 px-4">Net Salary</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-200">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-orange-500/[0.03] dark:hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-bold font-sans text-zinc-900 dark:text-white">{p.employeeName}</div>
                        <div className="text-[11px] text-zinc-400 font-sans">{p.designation}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium font-sans">{p.departmentName}</td>
                    <td className="py-3.5 px-4 font-mono">{formatINR(p.basicSalary)}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatINR(p.allowances + p.bonus)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-rose-500">
                      -{formatINR(p.deductions + p.tax)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-white text-sm">
                      {formatINR(p.netSalary)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPayslipId(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-orange-500/10 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Payslip
                        </button>
                        {canManage && (
                          <button
                            onClick={() => setDeletingPayroll(p)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Payroll Modal */}
      <PayrollGenerateModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={() => {
          showToast("Payroll batch calculated and saved!", "success");
          fetchPayrolls();
        }}
      />

      {/* Payslip View Modal */}
      <PayslipModal
        isOpen={!!selectedPayslipId}
        onClose={() => setSelectedPayslipId(null)}
        payrollId={selectedPayslipId}
      />

      {/* Delete Record Modal */}
      <ConfirmModal
        isOpen={!!deletingPayroll}
        onClose={() => setDeletingPayroll(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payroll Record"
        message={`Are you sure you want to remove this payroll record for ${deletingPayroll?.employeeName} (${deletingPayroll?.month})?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
