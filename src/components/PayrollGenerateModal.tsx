import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Employee, PayrollRecord } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { formatINR } from "../utils/formatters";

interface PayrollGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: Employee[];
  payroll?: PayrollRecord | null;
  onSuccess: () => void;
}

export const PayrollGenerateModal: React.FC<PayrollGenerateModalProps> = ({
  isOpen,
  onClose,
  employees: propEmployees = [],
  payroll = null,
  onSuccess
}) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(propEmployees);

  const [formData, setFormData] = useState({
    employeeId: propEmployees[0]?.id || "",
    month: "2026-08",
    basicSalary: 60000,
    allowances: 30000,
    bonus: 5000,
    overtime: 0,
    deductions: 7400,
    tax: 9500,
    status: "Paid" as "Paid" | "Pending" | "Processing",
    paymentMethod: "NEFT / RTGS Bank Transfer"
  });

  useEffect(() => {
    if (propEmployees.length > 0) {
      setEmployees(propEmployees);
    } else if (isOpen) {
      api.getEmployees({ limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setEmployees(res.data);
          if (!formData.employeeId && res.data.length > 0) {
            setFormData((prev) => ({ ...prev, employeeId: res.data[0].id }));
          }
        }
      }).catch(() => {});
    }
  }, [isOpen, propEmployees]);

  useEffect(() => {
    if (payroll) {
      setFormData({
        employeeId: payroll.employeeId,
        month: payroll.month,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        bonus: payroll.bonus,
        overtime: payroll.overtime,
        deductions: payroll.deductions,
        tax: payroll.tax,
        status: payroll.status,
        paymentMethod: payroll.paymentMethod || "NEFT / RTGS Bank Transfer"
      });
    } else if (employees.length > 0) {
      const selectedEmp = employees[0];
      const monthlyGross = Math.round(selectedEmp.salary / 12);
      const basic = Math.round(monthlyGross * 0.5);
      const allowances = Math.round(monthlyGross * 0.5);
      const pf = Math.round(basic * 0.12) + 200;
      const taxAmount = Math.round(monthlyGross * 0.10);
      setFormData({
        employeeId: selectedEmp.id,
        month: "2026-08",
        basicSalary: basic,
        allowances: allowances,
        bonus: 0,
        overtime: 0,
        deductions: pf,
        tax: taxAmount,
        status: "Paid",
        paymentMethod: "NEFT / RTGS Bank Transfer"
      });
    }
  }, [payroll, employees, isOpen]);

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const monthlyGross = Math.round(emp.salary / 12);
      const basic = Math.round(monthlyGross * 0.5);
      const allowances = Math.round(monthlyGross * 0.5);
      const pf = Math.round(basic * 0.12) + 200;
      const taxAmount = Math.round(monthlyGross * 0.10);
      setFormData({
        ...formData,
        employeeId: empId,
        basicSalary: basic,
        allowances: allowances,
        deductions: pf,
        tax: taxAmount
      });
    } else {
      setFormData({ ...formData, employeeId: empId });
    }
  };

  const calculatedGross = formData.basicSalary + formData.allowances + formData.bonus + formData.overtime;
  const calculatedNet = calculatedGross - formData.deductions - formData.tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.month) {
      error("Employee and month are required.");
      return;
    }

    setLoading(true);
    try {
      if (payroll) {
        await api.updatePayroll(payroll.id, formData);
        success("Payroll record updated successfully.");
      } else {
        await api.createPayroll(formData);
        success("Payroll record processed and payslip generated.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to process payroll.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={payroll ? "Edit Payroll Entry" : "Process Monthly Salary (INR)"}
      subtitle="Calculate gross salary, TDS withholding, Provident Fund (EPF), and net compensation."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employee *</label>
            <select
              disabled={!!payroll}
              value={formData.employeeId}
              onChange={(e) => handleEmployeeSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.departmentName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Payroll Month *</label>
            <input
              type="month"
              required
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Salary Components */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 card-3d">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Basic Salary (₹)</label>
            <input
              type="number"
              value={formData.basicSalary}
              onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-semibold outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">HRA & Allowances (₹)</label>
            <input
              type="number"
              value={formData.allowances}
              onChange={(e) => setFormData({ ...formData, allowances: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-semibold outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Bonus / Incentive (₹)</label>
            <input
              type="number"
              value={formData.bonus}
              onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-semibold outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Overtime (₹)</label>
            <input
              type="number"
              value={formData.overtime}
              onChange={(e) => setFormData({ ...formData, overtime: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-semibold outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">TDS Tax (₹)</label>
            <input
              type="number"
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-semibold outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">EPF & Prof Tax (₹)</label>
            <input
              type="number"
              value={formData.deductions}
              onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white font-semibold outline-none focus:border-orange-500"
            />
          </div>
          <div className="col-span-2 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-zinc-400">Total Gross:</span>
            <span className="text-sm font-bold font-mono text-zinc-800 dark:text-zinc-200">{formatINR(calculatedGross)}</span>
          </div>
        </div>

        {/* Live Net Calculation Preview */}
        <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/30 flex justify-between items-center card-3d">
          <div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Calculated Net Take-Home:</span>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Gross ({formatINR(calculatedGross)}) - TDS ({formatINR(formData.tax)}) - EPF/PT ({formatINR(formData.deductions)})</p>
          </div>
          <span className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400 glow-text">{formatINR(calculatedNet)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Disbursement Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="Paid">Paid (Disbursed)</option>
              <option value="Processing">Processing</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
              <option value="IMPS Instant Bank Transfer">IMPS Instant Bank Transfer</option>
              <option value="UPI Direct Corporate Transfer">UPI Direct Corporate Transfer</option>
              <option value="Corporate Cheque">Corporate Cheque</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {payroll ? "Update Payroll" : "Disburse & Finalize"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
