import React, { useState } from "react";
import {
  Settings,
  Building,
  Shield,
  Clock,
  DollarSign,
  Sun,
  Moon,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Bell,
  UserCheck,
  Briefcase,
  Calendar as CalendarIcon,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState("BharatCorp Technologies India Pvt. Ltd.");
  const [companyEmail, setCompanyEmail] = useState("hr.operations@bharatcorp.in");
  const [timezone, setTimezone] = useState("UTC+05:30 (India Standard Time)");
  const [currency, setCurrency] = useState("INR (₹)");
  const [workStartTime, setWorkStartTime] = useState("09:30");
  const [workEndTime, setWorkEndTime] = useState("18:30");
  const [gracePeriodMins, setGracePeriodMins] = useState("15");
  const [taxRateDefault, setTaxRateDefault] = useState("12");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [leaveAutoAlerts, setLeaveAutoAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = user?.role === "Super Admin" || user?.role === "HR Admin";

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Enterprise system configurations saved!", "success");
    }, 600);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            System & Enterprise Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Global organization policies, working schedules, payroll parameters, and interface configurations
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* SECTION 1: ORGANIZATION PROFILE */}
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-200/90 dark:border-zinc-800/90 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">Organization Identity</h2>
              <p className="text-xs text-zinc-400 font-sans">Business registration and global contact parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={!canManage}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Operations Email
              </label>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                disabled={!canManage}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-60 font-sans"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Corporate Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={!canManage}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 disabled:opacity-60 font-sans"
              >
                <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time - US & Canada)</option>
                <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time - US & Canada)</option>
                <option value="UTC+00:00 (London/GMT)">UTC+00:00 (London / GMT)</option>
                <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                <option value="UTC+08:00 (Singapore / HK)">UTC+08:00 (Singapore / HK)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Accounting Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={!canManage}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 disabled:opacity-60 font-sans"
              >
                <option value="INR (₹)">INR - Indian Rupee (₹) [Default]</option>
                <option value="USD ($)">USD - US Dollar ($)</option>
                <option value="EUR (€)">EUR - Euro (€)</option>
                <option value="GBP (£)">GBP - British Pound (£)</option>
                <option value="CAD ($)">CAD - Canadian Dollar ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: ATTENDANCE & SHIFT POLICIES */}
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-200/90 dark:border-zinc-800/90 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">Shift Timings & Punctuality Logic</h2>
              <p className="text-xs text-zinc-400 font-sans">Define office working hours and punch grace allowances</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs font-sans">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Standard Shift Start
              </label>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                disabled={!canManage}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Standard Shift End
              </label>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                disabled={!canManage}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Grace Period (Minutes)
              </label>
              <input
                type="number"
                value={gracePeriodMins}
                onChange={(e) => setGracePeriodMins(e.target.value)}
                disabled={!canManage}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SYSTEM APPEARANCE & PREFERENCES */}
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-200/90 dark:border-zinc-800/90 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-950/60 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">Appearance & Theme</h2>
              <p className="text-xs text-zinc-400 font-sans">Personalize display mode and notifications</p>
            </div>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="font-bold text-zinc-900 dark:text-white text-sm">Theme Mode</div>
                <div className="text-zinc-400 text-xs mt-0.5">Toggle between High Contrast Light and Obsidian 3D Dark canvas</div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-white font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer hover:border-orange-500/40 transition-colors"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-orange-500" />}
                <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="font-bold text-zinc-900 dark:text-white text-sm">System Notifications</div>
                <div className="text-zinc-400 text-xs mt-0.5">Receive instant in-app alerts on leave reviews and payroll runs</div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: ENTERPRISE ADMINISTRATION & QUICK ACCESS */}
        {canManage && (
          <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-200/90 dark:border-zinc-800/90 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 dark:bg-red-950/60 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-zinc-900 dark:text-white">Enterprise Administration Hub</h2>
                <p className="text-xs text-zinc-400 font-sans">Quickly navigate to organizational structure, credential governance, and security records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
              {user?.role === "Super Admin" && (
                <div
                  onClick={() => onNavigate("/users")}
                  className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">User Management</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">Manage employee portal credentials, account statuses, and role tiers.</p>
                </div>
              )}

              <div
                onClick={() => onNavigate("/designations")}
                className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Designations & Roles</h4>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">Define job title bands, responsibilities, and salary compensation envelopes.</p>
              </div>

              <div
                onClick={() => onNavigate("/calendar")}
                className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:border-orange-500/40 hover:bg-orange-50/20 dark:hover:bg-orange-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Holidays & Calendar</h4>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">Configure corporate public holiday schedules and view aggregated company events.</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
