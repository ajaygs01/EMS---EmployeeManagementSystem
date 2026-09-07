import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Employee, LeaveBalance } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Sliders, Save } from "lucide-react";

interface LeaveQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  currentBalance: LeaveBalance | null;
  onSuccess: () => void;
}

export const LeaveQuotaModal: React.FC<LeaveQuotaModalProps> = ({
  isOpen,
  onClose,
  employee,
  currentBalance,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [quotas, setQuotas] = useState({
    casualLeaveTotal: 12,
    casualLeaveUsed: 0,
    sickLeaveTotal: 10,
    sickLeaveUsed: 0,
    earnedLeaveTotal: 15,
    earnedLeaveUsed: 0,
    emergencyLeaveTotal: 5,
    emergencyLeaveUsed: 0,
    maternityLeaveTotal: 90,
    maternityLeaveUsed: 0,
    paternityLeaveTotal: 14,
    paternityLeaveUsed: 0,
    unpaidLeaveTotal: 30,
    unpaidLeaveUsed: 0
  });

  useEffect(() => {
    if (currentBalance) {
      setQuotas({
        casualLeaveTotal: currentBalance.casualLeave.total,
        casualLeaveUsed: currentBalance.casualLeave.used,
        sickLeaveTotal: currentBalance.sickLeave.total,
        sickLeaveUsed: currentBalance.sickLeave.used,
        earnedLeaveTotal: currentBalance.earnedLeave.total,
        earnedLeaveUsed: currentBalance.earnedLeave.used,
        emergencyLeaveTotal: currentBalance.emergencyLeave.total,
        emergencyLeaveUsed: currentBalance.emergencyLeave.used,
        maternityLeaveTotal: currentBalance.maternityLeave.total,
        maternityLeaveUsed: currentBalance.maternityLeave.used,
        paternityLeaveTotal: currentBalance.paternityLeave.total,
        paternityLeaveUsed: currentBalance.paternityLeave.used,
        unpaidLeaveTotal: currentBalance.unpaidLeave.total,
        unpaidLeaveUsed: currentBalance.unpaidLeave.used
      });
    }
  }, [currentBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);
    try {
      const payload = {
        casualLeave: { total: Number(quotas.casualLeaveTotal), used: Number(quotas.casualLeaveUsed) },
        sickLeave: { total: Number(quotas.sickLeaveTotal), used: Number(quotas.sickLeaveUsed) },
        earnedLeave: { total: Number(quotas.earnedLeaveTotal), used: Number(quotas.earnedLeaveUsed) },
        emergencyLeave: { total: Number(quotas.emergencyLeaveTotal), used: Number(quotas.emergencyLeaveUsed) },
        maternityLeave: { total: Number(quotas.maternityLeaveTotal), used: Number(quotas.maternityLeaveUsed) },
        paternityLeave: { total: Number(quotas.paternityLeaveTotal), used: Number(quotas.paternityLeaveUsed) },
        unpaidLeave: { total: Number(quotas.unpaidLeaveTotal), used: Number(quotas.unpaidLeaveUsed) }
      };

      const res = await api.updateLeaveBalance(employee.id, payload);
      if (res.success) {
        showToast(`Leave quota updated for ${employee.firstName} ${employee.lastName}`, "success");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update leave quotas", "error");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { label: "Casual Leave", totalKey: "casualLeaveTotal", usedKey: "casualLeaveUsed" },
    { label: "Sick Leave", totalKey: "sickLeaveTotal", usedKey: "sickLeaveUsed" },
    { label: "Earned / Vacation Leave", totalKey: "earnedLeaveTotal", usedKey: "earnedLeaveUsed" },
    { label: "Emergency Leave", totalKey: "emergencyLeaveTotal", usedKey: "emergencyLeaveUsed" },
    { label: "Maternity Leave", totalKey: "maternityLeaveTotal", usedKey: "maternityLeaveUsed" },
    { label: "Paternity Leave", totalKey: "paternityLeaveTotal", usedKey: "paternityLeaveUsed" },
    { label: "Unpaid Leave (Days Limit)", totalKey: "unpaidLeaveTotal", usedKey: "unpaidLeaveUsed" }
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Leave Quotas & Balances"
      subtitle={employee ? `Update yearly entitlement for ${employee.firstName} ${employee.lastName} (${employee.departmentName})` : ""}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3.5 flex items-center gap-3">
          <Sliders className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-zinc-300">
            Adjusting total allowance or consumed days will instantly update employee availability metrics across the system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
          {categories.map((cat) => {
            const total = (quotas as any)[cat.totalKey];
            const used = (quotas as any)[cat.usedKey];
            const remaining = Math.max(0, total - used);

            return (
              <div
                key={cat.label}
                className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white">
                  <span>{cat.label}</span>
                  <span className="text-[11px] font-mono text-orange-500">{remaining} Days Left</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Total Days</label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={total}
                      onChange={(e) =>
                        setQuotas({ ...quotas, [cat.totalKey]: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Used Days</label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={used}
                      onChange={(e) =>
                        setQuotas({ ...quotas, [cat.usedKey]: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-center font-mono font-bold text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
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
            disabled={loading}
            className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Adjustments
          </button>
        </div>
      </form>
    </Modal>
  );
};
