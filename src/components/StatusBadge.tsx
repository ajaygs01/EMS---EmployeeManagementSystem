import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "employee" | "attendance" | "leave" | "payroll" | "priority" | "task" | "general";
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "general", size = "sm" }) => {
  let colorStyles = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";

  const s = status.toLowerCase();

  if (s === "active" || s === "present" || s === "approved" || s === "paid" || s === "completed" || s === "low" || s === "excellent" || s === "holiday") {
    colorStyles = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60";
  } else if (s === "pending" || s === "probation" || s === "half day" || s === "processing" || s === "medium" || s === "in progress" || s === "very good" || s === "events") {
    colorStyles = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60";
  } else if (s === "late" || s === "high" || s === "on leave" || s === "good" || s === "hr") {
    colorStyles = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60";
  } else if (s === "inactive" || s === "absent" || s === "rejected" || s === "cancelled" || s === "critical" || s === "overdue" || s === "urgent" || s === "poor" || s === "emergency") {
    colorStyles = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60";
  } else if (s === "todo" || s === "policy" || s === "contract" || s === "needs improvement") {
    colorStyles = "bg-orange-50/80 text-orange-700 border-orange-200/80 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/40";
  }

  const padding = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs font-semibold";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${padding} ${colorStyles} whitespace-nowrap`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
};
