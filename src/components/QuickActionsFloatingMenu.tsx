import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  X,
  CalendarDays,
  Clock,
  DollarSign,
  CheckSquare,
  Sparkles,
  UserPlus,
  FileText,
  Building2,
  ChevronRight,
  Play,
  Square,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface QuickActionsFloatingMenuProps {
  onRequestLeave: () => void;
  onLogHours: () => void;
  onViewPaystub: () => void;
  onAssignTask: () => void;
  onAskAI: () => void;
  onAddEmployee?: () => void;
  onNavigate: (path: string) => void;
  todayAttendance?: any;
  onPunchIn?: () => void;
  onPunchOut?: () => void;
  punchLoading?: boolean;
}

export const QuickActionsFloatingMenu: React.FC<QuickActionsFloatingMenuProps> = ({
  onRequestLeave,
  onLogHours,
  onViewPaystub,
  onAssignTask,
  onAskAI,
  onAddEmployee,
  onNavigate,
  todayAttendance,
  onPunchIn,
  onPunchOut,
  punchLoading = false
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      // Alt + Q shortcut to toggle
      if (e.altKey && (e.key === "q" || e.key === "Q")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isAdminOrHR = user?.role === "Super Admin" || user?.role === "HR Admin";
  const isManagerOrHigher = isAdminOrHR || user?.role === "Manager";

  const actionItems = [
    {
      id: "leave",
      title: "Request Leave",
      subtitle: "Apply for vacation, sick, or casual absence",
      icon: CalendarDays,
      badge: "Self-Service",
      badgeColor: "bg-orange-950/80 text-orange-300 border-orange-800/80",
      iconColor: "text-orange-400 bg-orange-950/70 border-orange-800/80",
      onClick: () => {
        setIsOpen(false);
        onRequestLeave();
      }
    },
    {
      id: "hours",
      title: "Log Hours",
      subtitle: todayAttendance?.checkIn && !todayAttendance?.checkOut
        ? `Clocked in (${todayAttendance.checkIn}) • Tap to manage`
        : "Punch in/out & submit daily timesheet",
      icon: Clock,
      badge: todayAttendance?.checkIn && !todayAttendance?.checkOut ? "Active Shift" : "Attendance",
      badgeColor: todayAttendance?.checkIn && !todayAttendance?.checkOut
        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/80 animate-pulse"
        : "bg-amber-950/80 text-amber-300 border-amber-800/80",
      iconColor: "text-amber-400 bg-amber-950/70 border-amber-800/80",
      onClick: () => {
        setIsOpen(false);
        onLogHours();
      }
    },
    {
      id: "paystub",
      title: "View Paystub",
      subtitle: "Instant salary slip, allowances & tax summary",
      icon: DollarSign,
      badge: "Compensation",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
      iconColor: "text-emerald-400 bg-emerald-950/70 border-emerald-800/80",
      onClick: () => {
        setIsOpen(false);
        onViewPaystub();
      }
    },
    {
      id: "task",
      title: "Assign Task",
      subtitle: isManagerOrHigher ? "Delegate action item to team member" : "Create personal task item",
      icon: CheckSquare,
      badge: "Workflow",
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800/80",
      iconColor: "text-amber-400 bg-amber-950/70 border-amber-800/80",
      onClick: () => {
        setIsOpen(false);
        onAssignTask();
      }
    },
    {
      id: "ai",
      title: "Ask Gemini HR",
      subtitle: "Generate policies, job briefs & HR answers",
      icon: Sparkles,
      badge: "AI Powered",
      badgeColor: "bg-orange-950/80 text-orange-300 border-orange-800/80",
      iconColor: "text-orange-400 bg-orange-950/70 border-orange-800/80",
      onClick: () => {
        setIsOpen(false);
        onAskAI();
      }
    },
    ...(isAdminOrHR
      ? [
          {
            id: "employee",
            title: "Add Employee",
            subtitle: "Onboard new staff member to roster",
            icon: UserPlus,
            badge: "Admin",
            badgeColor: "bg-rose-950/80 text-rose-300 border-rose-800/80",
            iconColor: "text-rose-400 bg-rose-950/70 border-rose-800/80",
            onClick: () => {
              setIsOpen(false);
              if (onAddEmployee) {
                onAddEmployee();
              } else {
                onNavigate("/employees");
              }
            }
          }
        ]
      : []),
    {
      id: "documents",
      title: "Company Documents",
      subtitle: "Handbook, forms & legal repository",
      icon: FileText,
      badge: "Repository",
      badgeColor: "bg-zinc-800 text-zinc-300 border-zinc-700",
      iconColor: "text-zinc-300 bg-zinc-800 border-zinc-700",
      onClick: () => {
        setIsOpen(false);
        onNavigate("/documents");
      }
    }
  ];

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40 select-none">
      {/* Dim backdrop when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Action Menu Panel */}
      {isOpen && (
        <div
          id="quick-actions-panel"
          className="absolute bottom-16 right-0 mb-3 w-[340px] sm:w-[380px] bg-white border border-zinc-200 rounded-3xl shadow-2xl shadow-black/10 backdrop-blur-2xl z-40 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    Quick Actions
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-50 text-orange-600 font-mono border border-orange-200">
                    Alt+Q
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">Instant shortcuts for frequent tasks</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Punch Status Bar */}
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-between mb-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Shift Status:
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    todayAttendance?.checkIn && !todayAttendance?.checkOut
                      ? "bg-emerald-500 animate-pulse"
                      : todayAttendance?.checkOut
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                  }`}
                />
                <span className="text-xs font-bold text-zinc-900">
                  {todayAttendance?.checkIn && !todayAttendance?.checkOut
                    ? `Clocked in at ${todayAttendance.checkIn}`
                    : todayAttendance?.checkOut
                    ? `Done (${todayAttendance.workingHours} hrs)`
                    : "Not Clocked In Today"}
                </span>
              </div>
            </div>

            {onPunchIn && onPunchOut && (
              <div>
                {!todayAttendance?.checkIn ? (
                  <button
                    onClick={() => {
                      onPunchIn();
                    }}
                    disabled={punchLoading}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Clock In</span>
                  </button>
                ) : !todayAttendance?.checkOut ? (
                  <button
                    onClick={() => {
                      onPunchOut();
                    }}
                    disabled={punchLoading}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-900/20 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Clock Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLogHours();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11px] font-semibold transition-colors"
                  >
                    Timesheet
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Items List */}
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-0.5 custom-scrollbar">
            {actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`quick-action-${item.id}`}
                  onClick={item.onClick}
                  className="w-full p-2.5 sm:p-3 rounded-2xl bg-zinc-50/80 hover:bg-orange-50/50 border border-zinc-200 hover:border-orange-500/50 transition-all text-left group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${item.iconColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors truncate">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none shrink-0 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Bottom Footer hint */}
          <div className="mt-3 pt-2.5 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500">
            <span>Press <kbd className="px-1 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 font-mono">ESC</kbd> to close</span>
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate("/attendance");
              }}
              className="text-orange-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Workforce Portal</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        id="quick-actions-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick Actions Floating Menu"
        className={`group relative flex items-center gap-2.5 px-4 py-3.5 rounded-full shadow-2xl border transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bg-zinc-900 text-white border-zinc-700 shadow-black/80 rotate-0"
            : "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-orange-400/40 shadow-orange-600/40 hover:shadow-orange-600/60 hover:scale-105"
        }`}
      >
        {/* Pulsing indicator when shift not clocked in or active */}
        {!isOpen && todayAttendance?.checkIn && !todayAttendance?.checkOut && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#090a0f]" />
          </span>
        )}

        <div
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-90 text-rose-400" : "group-hover:scale-110 text-white"
          }`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5 fill-white" />}
        </div>

        <span className="text-xs font-black tracking-wide uppercase pr-0.5">
          {isOpen ? "Close" : "Quick Actions"}
        </span>
      </button>
    </div>
  );
};
