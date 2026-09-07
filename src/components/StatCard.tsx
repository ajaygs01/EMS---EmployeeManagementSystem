import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  color?: "orange" | "amber" | "emerald" | "rose" | "purple" | "blue" | "indigo";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = "orange",
  onClick
}) => {
  const colorMap: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
    orange: {
      bg: "bg-orange-500/10 dark:bg-orange-950/50 border border-orange-500/30",
      text: "text-orange-600 dark:text-orange-400",
      ring: "hover:border-orange-500/60 hover:shadow-[0_15px_35px_-10px_rgba(249,115,22,0.25)]",
      glow: "from-orange-500/10 to-transparent"
    },
    emerald: {
      bg: "bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "hover:border-emerald-500/60 hover:shadow-[0_15px_35px_-10px_rgba(16,185,129,0.25)]",
      glow: "from-emerald-500/10 to-transparent"
    },
    amber: {
      bg: "bg-amber-500/10 dark:bg-amber-950/50 border border-amber-500/30",
      text: "text-amber-600 dark:text-amber-400",
      ring: "hover:border-amber-500/60 hover:shadow-[0_15px_35px_-10px_rgba(245,158,11,0.25)]",
      glow: "from-amber-500/10 to-transparent"
    },
    rose: {
      bg: "bg-rose-500/10 dark:bg-rose-950/50 border border-rose-500/30",
      text: "text-rose-600 dark:text-rose-400",
      ring: "hover:border-rose-500/60 hover:shadow-[0_15px_35px_-10px_rgba(244,63,94,0.25)]",
      glow: "from-rose-500/10 to-transparent"
    },
    purple: {
      bg: "bg-purple-500/10 dark:bg-purple-950/50 border border-purple-500/30",
      text: "text-purple-600 dark:text-purple-400",
      ring: "hover:border-purple-500/60 hover:shadow-[0_15px_35px_-10px_rgba(168,85,247,0.25)]",
      glow: "from-purple-500/10 to-transparent"
    },
    blue: {
      bg: "bg-blue-500/10 dark:bg-blue-950/50 border border-blue-500/30",
      text: "text-blue-600 dark:text-blue-400",
      ring: "hover:border-blue-500/60 hover:shadow-[0_15px_35px_-10px_rgba(59,130,246,0.25)]",
      glow: "from-blue-500/10 to-transparent"
    },
    indigo: {
      bg: "bg-orange-500/10 dark:bg-orange-950/50 border border-orange-500/30",
      text: "text-orange-600 dark:text-orange-400",
      ring: "hover:border-orange-500/60 hover:shadow-[0_15px_35px_-10px_rgba(249,115,22,0.25)]",
      glow: "from-orange-500/10 to-transparent"
    }
  };

  const c = colorMap[color] || colorMap.orange;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] transition-all duration-300 transform-style-3d ${
        onClick ? "cursor-pointer hover:-translate-y-1.5 hover:scale-[1.01]" : "hover:-translate-y-1"
      } ${c.ring}`}
    >
      {/* 3D Top Edge Lighting Sheen */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${c.glow} rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none`} />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-black font-display text-zinc-900 dark:text-white mt-2 tracking-tight">{value}</h4>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.bg} ${c.text} shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="relative z-10 mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-sans">
          {trend && (
            <span
              className={`font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] ${
                trend.isPositive ? "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {subtitle && <span className="text-zinc-500 dark:text-zinc-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
