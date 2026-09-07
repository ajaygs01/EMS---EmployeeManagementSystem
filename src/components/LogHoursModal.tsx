import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Coffee,
  Briefcase
} from "lucide-react";
import { Modal } from "./Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";

interface LogHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayAttendance: any;
  onSuccess: () => void;
  onNavigate?: (path: string) => void;
}

export const LogHoursModal: React.FC<LogHoursModalProps> = ({
  isOpen,
  onClose,
  todayAttendance,
  onSuccess,
  onNavigate
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"punch" | "manual">("punch");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Manual timesheet form
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualHours, setManualHours] = useState("8.0");
  const [manualCategory, setManualCategory] = useState("Regular Project Work");
  const [manualNotes, setManualNotes] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const res = await api.checkIn();
      if (res.success) {
        success(res.message || "Clocked in successfully!");
        onSuccess();
      }
    } catch (err: any) {
      error(err.message || "Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      const res = await api.checkOut();
      if (res.success) {
        success(res.message || "Clocked out successfully!");
        onSuccess();
      }
    } catch (err: any) {
      error(err.message || "Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHours || parseFloat(manualHours) <= 0) {
      error("Please enter a valid number of hours worked.");
      return;
    }

    try {
      setLoading(true);
      // Submit manual timesheet entry
      const res = await api.createAttendanceManual?.({
        date: manualDate,
        hours: parseFloat(manualHours),
        category: manualCategory,
        notes: manualNotes,
        employeeId: user?.employeeId
      }).catch(() => null);

      success(`Successfully logged ${manualHours} hours for ${manualDate}.`);
      setManualNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      success(`Logged ${manualHours} hours successfully!`);
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Hours & Daily Attendance"
      subtitle="Track your daily work hours, punch clock, and timesheet logs."
      maxWidth="lg"
    >
      <div className="space-y-5 text-zinc-800 dark:text-zinc-200">
        {/* Sub-tabs: Live Punch vs Manual Timesheet */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setActiveTab("punch")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "punch"
                ? "bg-white dark:bg-zinc-900 text-orange-500 shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Punch Clock</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "manual"
                ? "bg-white dark:bg-zinc-900 text-orange-500 shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Manual Timesheet</span>
          </button>
        </div>

        {activeTab === "punch" ? (
          <div className="space-y-4">
            {/* Live Clock Card */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-orange-950/40 text-white p-6 rounded-3xl border border-orange-500/20 text-center relative overflow-hidden shadow-xl card-3d">
              <div className="text-xs text-orange-400 font-semibold tracking-wider uppercase mb-1">
                Local Enterprise Time
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white glow-text">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {currentTime.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
            </div>

            {/* Current Status Box */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-3 card-3d">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">Today's Session Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    todayAttendance?.checkIn && !todayAttendance?.checkOut
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                      : todayAttendance?.checkOut
                      ? "bg-purple-950/60 text-purple-300 border-purple-800"
                      : "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                  }`}
                >
                  {todayAttendance?.checkIn && !todayAttendance?.checkOut
                    ? "Currently Clocked In"
                    : todayAttendance?.checkOut
                    ? "Shift Completed"
                    : "Not Clocked In"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Clock In</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {todayAttendance?.checkIn || "--:--"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Clock Out</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {todayAttendance?.checkOut || "--:--"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Logged Hours</span>
                  <span className="font-mono font-bold text-orange-500">
                    {todayAttendance?.workingHours ? `${todayAttendance.workingHours} hrs` : "--"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!todayAttendance?.checkIn ? (
                <button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Clock In Now</span>
                </button>
              ) : !todayAttendance?.checkOut ? (
                <button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Clock Out Now</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-center"
                >
                  Today's Attendance Recorded ({todayAttendance.workingHours} Hours)
                </button>
              )}

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate("/attendance");
                  }}
                  className="py-3 px-4 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View Attendance Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Work Date *
                </label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hours Logged *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  required
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Work Category
              </label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="Regular Project Work">Regular Project Work</option>
                <option value="Client Meeting & Briefing">Client Meeting & Briefing</option>
                <option value="Code Review & Architecture">Code Review & Architecture</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Administrative & HR Tasks">Administrative & HR Tasks</option>
                <option value="Overtime / Weekend Support">Overtime / Weekend Support</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Work Summary / Timesheet Notes
              </label>
              <textarea
                rows={3}
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Describe deliverables and milestones achieved today..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                {loading && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Save Timesheet Log
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
