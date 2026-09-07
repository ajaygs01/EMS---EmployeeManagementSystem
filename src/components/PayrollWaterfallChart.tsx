import React, { useState } from "react";
import { formatINR } from "../utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Info,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Layers,
  Sparkles
} from "lucide-react";

export interface WaterfallStep {
  name: string;
  category: "base" | "addition" | "subtotal" | "deduction" | "total";
  amount: number;
  description: string;
}

interface PayrollWaterfallChartProps {
  basicSalary?: number;
  allowances?: number;
  bonus?: number;
  deductions?: number;
  tax?: number;
  employeeName?: string;
  className?: string;
}

export const PayrollWaterfallChart: React.FC<PayrollWaterfallChartProps> = ({
  basicSalary = 65000,
  allowances = 25000,
  bonus = 8000,
  deductions = 7800,
  tax = 6200,
  employeeName = "Corporate Baseline",
  className = "",
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Derive granular Indian payroll components for realistic cascade
  const basic = basicSalary;
  const hra = Math.round(basic * 0.4); // 40% HRA
  const specialAllowance = Math.max(0, allowances - hra);
  const perfBonus = bonus;
  const grossSalary = basic + allowances + bonus;

  const epfDeduction = Math.round(basic * 0.12); // 12% PF
  const profTax = 200; // Flat PT in India (₹200/mo)
  const incomeTaxTDS = tax;
  const otherDeductions = Math.max(0, deductions - epfDeduction - profTax);
  const totalDeductionsAll = epfDeduction + profTax + incomeTaxTDS + otherDeductions;
  const netInHand = Math.max(0, grossSalary - totalDeductionsAll);

  // Build the Waterfall steps array
  const steps: WaterfallStep[] = [
    {
      name: "Basic Pay",
      category: "base",
      amount: basic,
      description: "Foundation wage for statutory benefit calculation",
    },
    {
      name: "HRA",
      category: "addition",
      amount: hra,
      description: "House Rent Allowance (Section 10(13A) tax exempt)",
    },
    {
      name: "Special Allowance",
      category: "addition",
      amount: specialAllowance,
      description: "Conveyance, medical, and executive perks",
    },
    {
      name: "Performance Bonus",
      category: "addition",
      amount: perfBonus,
      description: "Quarterly performance and milestone rewards",
    },
    {
      name: "Gross Earnings",
      category: "subtotal",
      amount: grossSalary,
      description: "Total monthly earnings prior to statutory withholdings",
    },
    {
      name: "EPF (12%)",
      category: "deduction",
      amount: -epfDeduction,
      description: "Employee Provident Fund contribution to EPFO",
    },
    {
      name: "Prof. Tax",
      category: "deduction",
      amount: -profTax,
      description: "State-levied monthly professional tax",
    },
    {
      name: "TDS / Income Tax",
      category: "deduction",
      amount: -incomeTaxTDS,
      description: "Tax Withheld at Source per Indian Income Tax brackets",
    },
    {
      name: "Net In-Hand",
      category: "total",
      amount: netInHand,
      description: "Final disbursed amount credited to employee bank account",
    },
  ];

  // Calculate coordinates for waterfall floating bars
  let runningTotal = 0;
  const calculatedBars = steps.map((step) => {
    let start = 0;
    let end = 0;

    if (step.category === "base") {
      start = 0;
      end = step.amount;
      runningTotal = step.amount;
    } else if (step.category === "addition") {
      start = runningTotal;
      end = runningTotal + step.amount;
      runningTotal += step.amount;
    } else if (step.category === "subtotal") {
      start = 0;
      end = step.amount;
      // running total remains unchanged
    } else if (step.category === "deduction") {
      start = runningTotal;
      end = runningTotal + step.amount; // step.amount is negative
      runningTotal += step.amount;
    } else if (step.category === "total") {
      start = 0;
      end = step.amount;
    }

    return {
      ...step,
      start: Math.min(start, end),
      end: Math.max(start, end),
      heightVal: Math.abs(step.amount),
      isPositive: step.amount >= 0,
      postTotal: runningTotal,
    };
  });

  const maxVal = Math.max(grossSalary * 1.12, 10000);

  return (
    <div className={`bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-7 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Compensation Cascade Flow
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            Compensation Flow &amp; Statutory Deductions
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Stepped cascade showing progression from basic pay components to final take-home salary for{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{employeeName}</span>.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Additions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Deductions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Net Disbursed</span>
          </div>
        </div>
      </div>

      {/* Waterfall Graphic Stage */}
      <div className="relative pt-6 pb-2 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Chart Grid Lines */}
          <div className="relative h-64 flex items-end border-b border-zinc-200 dark:border-zinc-800 gap-3 sm:gap-4 px-2">
            
            {/* Horizontal Guide Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-zinc-400 border-dashed w-full" />
              <div className="border-b border-zinc-400 border-dashed w-full" />
              <div className="border-b border-zinc-400 border-dashed w-full" />
              <div className="border-b border-zinc-400 border-dashed w-full" />
            </div>

            {calculatedBars.map((bar, idx) => {
              const bottomPercent = (bar.start / maxVal) * 100;
              const heightPercent = Math.max(3, (bar.heightVal / maxVal) * 100);

              // Styling per category
              let barColor = "bg-orange-500 text-white";
              let badgeColor = "text-orange-600";
              if (bar.category === "addition") {
                barColor = "bg-emerald-500 hover:bg-emerald-600";
                badgeColor = "text-emerald-600";
              } else if (bar.category === "deduction") {
                barColor = "bg-rose-500 hover:bg-rose-600";
                badgeColor = "text-rose-600";
              } else if (bar.category === "subtotal") {
                barColor = "bg-amber-500 hover:bg-amber-600";
                badgeColor = "text-amber-600";
              } else if (bar.category === "total") {
                barColor = "bg-gradient-to-t from-orange-600 to-amber-500 shadow-lg shadow-orange-500/20";
                badgeColor = "text-orange-600";
              } else {
                barColor = "bg-sky-500 hover:bg-sky-600";
                badgeColor = "text-sky-600";
              }

              return (
                <div
                  key={bar.name}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="flex-1 h-full flex flex-col justify-end items-center relative group cursor-pointer"
                >
                  {/* Floating Bar Container */}
                  <div className="relative w-full h-full flex items-end">
                    
                    {/* Stepped Floating Waterfall Bar */}
                    <div
                      style={{
                        bottom: `${bottomPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                      className={`absolute w-full rounded-xl transition-all duration-300 shadow-sm ${barColor} ${
                        hoveredIdx === idx ? "scale-105 ring-2 ring-offset-2 ring-orange-500 z-20" : ""
                      }`}
                    >
                      {/* Bar Value Tag on Top */}
                      <div className="absolute -top-6 inset-x-0 text-center">
                        <span className="text-[10px] font-black tracking-tight text-zinc-800 dark:text-zinc-200">
                          {bar.category === "deduction" ? "-" : "+"}
                          {formatINR(bar.heightVal, false)}
                        </span>
                      </div>

                      {/* Direction Icon inside bar */}
                      <div className="w-full h-full flex items-center justify-center text-white/90">
                        {bar.category === "addition" && <TrendingUp className="w-3.5 h-3.5" />}
                        {bar.category === "deduction" && <TrendingDown className="w-3.5 h-3.5" />}
                        {bar.category === "total" && <Sparkles className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  {/* Step Label Beneath Axis */}
                  <div className="mt-3 text-center w-full">
                    <span className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate">
                      {bar.name}
                    </span>
                    <span className="block text-[10px] text-zinc-400 font-mono">
                      {formatINR(bar.category === "deduction" ? bar.end : bar.end, false)}
                    </span>
                  </div>

                  {/* Detailed Tooltip on Hover */}
                  {hoveredIdx === idx && (
                    <div className="absolute -top-16 z-30 p-2.5 rounded-xl bg-zinc-900 text-white text-[11px] shadow-2xl border border-zinc-700 w-48 pointer-events-none transform -translate-y-2 animate-in fade-in zoom-in-95">
                      <div className="font-bold flex items-center justify-between">
                        <span>{bar.name}</span>
                        <span className={badgeColor}>{formatINR(bar.amount)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">{bar.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
            Gross Total CTC (Monthly)
          </span>
          <div className="text-lg font-black text-zinc-900 dark:text-white mt-0.5">
            {formatINR(grossSalary)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">100% Compensation Base</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
            Statutory Withholdings
          </span>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
            -{formatINR(totalDeductionsAll)}
          </div>
          <span className="text-[10px] text-zinc-500">
            {Math.round((totalDeductionsAll / grossSalary) * 100)}% of Gross (PF + Tax)
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
          <span className="text-[11px] font-semibold text-orange-800 dark:text-orange-300 block">
            Disbursed Net Take-Home
          </span>
          <div className="text-lg font-black text-orange-600 dark:text-orange-400 mt-0.5">
            {formatINR(netInHand)}
          </div>
          <span className="text-[10px] text-orange-700 dark:text-orange-400 font-medium">
            {Math.round((netInHand / grossSalary) * 100)}% Direct In-Hand Credit
          </span>
        </div>
      </div>
    </div>
  );
};
