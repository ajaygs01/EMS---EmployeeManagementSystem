import React, { useState, useEffect } from "react";
import { Printer, Building2, CheckCircle } from "lucide-react";
import { Modal } from "./Modal";
import { PayrollRecord } from "../types";
import { formatINR } from "../utils/formatters";
import { api } from "../services/api";

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll?: PayrollRecord | null;
  payrollId?: string | null;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, payroll: propPayroll, payrollId }) => {
  const [payroll, setPayroll] = useState<PayrollRecord | null>(propPayroll || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propPayroll) {
      setPayroll(propPayroll);
    } else if (payrollId && isOpen) {
      setLoading(true);
      api.getPayslip(payrollId).then((res) => {
        if (res.success && res.data) {
          setPayroll(res.data);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [propPayroll, payrollId, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Employee Salary Slip" subtitle="Loading..." maxWidth="3xl">
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading payslip record...</p>
        </div>
      </Modal>
    );
  }

  if (!payroll) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Salary Slip" subtitle={`Month: ${payroll.month}`} maxWidth="3xl">
      <div id="printable-payslip" className="bg-white dark:bg-zinc-900 p-4 sm:p-6 text-zinc-800 dark:text-zinc-100">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200 dark:border-zinc-800 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight font-display">BharatCorp Technologies India Pvt. Ltd.</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Tower B, Level 8, Global Tech Park, Outer Ring Road • Bellandur, Bengaluru 560103</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              STATUS: {payroll.status.toUpperCase()}
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">Ref: PAY-IN-{payroll.id.replace("pay-", "")}</p>
          </div>
        </div>

        {/* Employee Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-zinc-200 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-400 block mb-0.5">Employee Name</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{payroll.employeeName}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-0.5">Employee ID</span>
            <span className="font-semibold font-mono text-zinc-800 dark:text-zinc-200 text-sm">{payroll.employeeId}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-0.5">Department</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{payroll.departmentName}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-0.5">Designation</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{payroll.designation}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-0.5">Pay Period</span>
            <span className="font-semibold font-mono text-zinc-800 dark:text-zinc-200 text-sm">{payroll.month}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-0.5">Disbursement Date</span>
            <span className="font-semibold font-mono text-zinc-800 dark:text-zinc-200 text-sm">{payroll.paymentDate || "Processed"}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-0.5">Payment Method</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">{payroll.paymentMethod || "NEFT / RTGS Transfer"}</span>
          </div>
          <div>
            <span className="text-zinc-400 block mb-0.5">Currency</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">INR (₹)</span>
          </div>
        </div>

        {/* Earnings & Deductions Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5">
          {/* Earnings */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden card-3d">
            <div className="bg-zinc-50 dark:bg-zinc-800/80 px-4 py-2.5 font-bold text-xs text-zinc-700 dark:text-zinc-300 flex justify-between">
              <span>EARNINGS</span>
              <span>AMOUNT (INR)</span>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Basic Salary</span>
                <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{formatINR(payroll.basicSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">House Rent Allowance (HRA) & Special</span>
                <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{formatINR(payroll.allowances)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Performance Bonus</span>
                <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{formatINR(payroll.bonus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Overtime & Shift Allowance</span>
                <span className="font-semibold font-mono text-zinc-900 dark:text-zinc-100">{formatINR(payroll.overtime)}</span>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex justify-between font-bold text-sm text-zinc-900 dark:text-white">
                <span>Total Gross Earnings</span>
                <span className="font-mono">{formatINR(payroll.grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden card-3d">
            <div className="bg-zinc-50 dark:bg-zinc-800/80 px-4 py-2.5 font-bold text-xs text-zinc-700 dark:text-zinc-300 flex justify-between">
              <span>STATUTORY DEDUCTIONS & TDS</span>
              <span>AMOUNT (INR)</span>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Income Tax TDS (Sec 192)</span>
                <span className="font-semibold font-mono text-rose-600 dark:text-rose-400">-{formatINR(payroll.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Provident Fund (EPF) & Prof Tax</span>
                <span className="font-semibold font-mono text-rose-600 dark:text-rose-400">-{formatINR(payroll.deductions)}</span>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex justify-between font-bold text-sm text-rose-600 dark:text-rose-400">
                <span>Total Deductions</span>
                <span className="font-mono">-{formatINR(payroll.tax + payroll.deductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary Highlight */}
        <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/30 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-3 card-3d">
          <div>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Net Take-Home Salary</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Directly credited to employee bank account</p>
          </div>
          <div className="text-3xl font-black font-mono text-orange-600 dark:text-orange-400 tracking-tight glow-text">
            {formatINR(payroll.netSalary)}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-5">
          This is a computer-generated official payroll slip from BharatCorp EMS and does not require a physical signature.
        </p>

        {/* Print / Close Actions */}
        <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};
