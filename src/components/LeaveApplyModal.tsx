import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "./Modal";
import { Employee, LeaveBalance } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Calendar, AlertTriangle, CheckCircle, Info, Sparkles, FileText } from "lucide-react";

interface LeaveApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employee[];
  onSuccess: () => void;
}

export const LeaveApplyModal: React.FC<LeaveApplyModalProps> = ({
  isOpen,
  onClose,
  employees: propEmployees = [],
  onSuccess
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(propEmployees);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    employeeId: user?.employeeId || "",
    leaveType: "Casual Leave" as const,
    startDate: todayStr,
    endDate: todayStr,
    reason: "",
    documentUrl: ""
  });

  const leaveTypes = [
    { name: "Casual Leave", key: "casualLeave", description: "Routine personal time-off" },
    { name: "Sick Leave", key: "sickLeave", description: "Health issues, recovery, doctor visits" },
    { name: "Earned Leave", key: "earnedLeave", description: "Annual accrued vacation" },
    { name: "Emergency Leave", key: "emergencyLeave", description: "Unforeseen urgent events" },
    { name: "Maternity Leave", key: "maternityLeave", description: "Parental maternity period" },
    { name: "Paternity Leave", key: "paternityLeave", description: "Parental paternity period" },
    { name: "Unpaid Leave", key: "unpaidLeave", description: "Extended unpaid sabbatical" }
  ] as const;

  const quickReasons = [
    "Personal & Family Event",
    "Medical appointment / recovery",
    "Annual planned vacation",
    "Home emergency / repairs",
    "Festival celebration with family",
    "Childcare / school event"
  ];

  // Fetch employees list if manager/admin
  useEffect(() => {
    if (propEmployees.length > 0) {
      setEmployees(propEmployees);
    } else if (isOpen && user?.role !== "Employee") {
      api.getEmployees({ limit: 100 })
        .then((res) => {
          if (res.success && res.data) {
            setEmployees(res.data);
            if (!formData.employeeId && res.data.length > 0) {
              setFormData((prev) => ({ ...prev, employeeId: user?.employeeId || res.data[0].id }));
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, propEmployees, user?.role]);

  // Fetch balance for the chosen employee
  const targetEmpId = formData.employeeId || user?.employeeId || "";
  useEffect(() => {
    if (isOpen && targetEmpId) {
      api.getLeaveBalances(targetEmpId)
        .then((res) => {
          if (res.success && res.data) {
            setLeaveBalance(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, targetEmpId]);

  // Calculate duration
  const calculatedDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 1;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return 0;
    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [formData.startDate, formData.endDate]);

  // Current category remaining
  const currentRemaining = useMemo(() => {
    if (!leaveBalance) return 12;
    const selected = leaveTypes.find((lt) => lt.name === formData.leaveType);
    if (!selected) return 12;
    const quota = (leaveBalance as any)[selected.key];
    if (!quota) return 12;
    return Math.max(0, quota.total - quota.used);
  }, [leaveBalance, formData.leaveType]);

  const isExceeding = formData.leaveType !== "Unpaid Leave" && calculatedDays > currentRemaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      showToast("Please provide a clear reason for your leave request.", "error");
      return;
    }
    if (calculatedDays <= 0) {
      showToast("End date must be on or after the start date.", "error");
      return;
    }
    if (isExceeding) {
      showToast(`Requested duration (${calculatedDays} days) exceeds available balance (${currentRemaining} days).`, "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.applyLeave(formData);
      if (res.success) {
        showToast(res.message || "Leave request submitted successfully.", "success");
        setFormData({
          employeeId: user?.employeeId || "",
          leaveType: "Casual Leave",
          startDate: todayStr,
          endDate: todayStr,
          reason: "",
          documentUrl: ""
        });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to submit leave request.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Leave"
      subtitle="Submit planned absence with real-time balance tracking & validation."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Employee Selection if Admin/Manager */}
        {user?.role !== "Employee" && (
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Employee *
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 font-sans"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.departmentName} - {e.employeeId})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Leave Category Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Leave Category *
            </label>
            <span className="text-[11px] font-mono font-semibold text-orange-500">
              Available: {currentRemaining} day{currentRemaining !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {leaveTypes.map((type) => {
              const isSelected = formData.leaveType === type.name;
              const quota = leaveBalance ? (leaveBalance as any)[type.key] : null;
              const rem = quota ? quota.total - quota.used : "-";

              return (
                <button
                  type="button"
                  key={type.name}
                  onClick={() => setFormData({ ...formData, leaveType: type.name as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/10 text-zinc-900 dark:text-white shadow-sm"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>{type.name}</span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                    {rem} left / {quota ? quota.total : "-"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Start Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 font-sans"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              End Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 font-sans"
              />
            </div>
          </div>
        </div>

        {/* Duration Calculation Banner */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-sans ${
            calculatedDays <= 0
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : isExceeding
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {calculatedDays <= 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : isExceeding ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <div>
              <span className="font-bold">Requested Duration: </span>
              <span className="font-mono font-black">
                {calculatedDays} Day{calculatedDays !== 1 ? "s" : ""}
              </span>
              {isExceeding && (
                <span className="text-[11px] block mt-0.5 text-amber-300">
                  Exceeds remaining {formData.leaveType} quota ({currentRemaining} days remaining)
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 text-right">
            Remaining: <strong className="text-white">{Math.max(0, currentRemaining - calculatedDays)}</strong>
          </div>
        </div>

        {/* Quick Reason Suggestions */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Quick Reason Tags
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickReasons.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setFormData({ ...formData, reason: r })}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-zinc-800/80 hover:bg-orange-500/20 text-zinc-600 dark:text-zinc-300 hover:text-orange-400 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                + {r}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Reason */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Reason for Absence *
          </label>
          <textarea
            required
            rows={2}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Explain the context or project coverage arrangements..."
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 resize-none font-sans"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2.5 border-t border-zinc-200 dark:border-zinc-800/80 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isExceeding || calculatedDays <= 0}
            className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Submit Application
          </button>
        </div>
      </form>
    </Modal>
  );
};
