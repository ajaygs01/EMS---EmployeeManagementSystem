import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Download,
  PartyPopper,
  Award,
  Palmtree,
  Bell,
  Trash2,
  Edit,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye
} from "lucide-react";
import { Holiday, CalendarEvent } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Modal } from "../components/Modal";
import { ConfirmModal } from "../components/ConfirmModal";

interface CalendarPageProps {
  onNavigate: (path: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"calendar" | "holidays">("calendar");

  // Date State for Monthly Calendar
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Sept 2026
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter toggles
  const [filterHolidays, setFilterHolidays] = useState(true);
  const [filterBirthdays, setFilterBirthdays] = useState(true);
  const [filterAnniversaries, setFilterAnniversaries] = useState(true);
  const [filterLeaves, setFilterLeaves] = useState(true);
  const [filterCompanyEvents, setFilterCompanyEvents] = useState(true);

  // Selected Day Modal
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null);

  // Holiday Add/Edit/Delete
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    type: "National" as "National" | "Regional" | "Corporate",
    applicableLocation: "Pan India",
    status: "Upcoming" as "Active" | "Upcoming" | "Completed"
  });

  const canManage = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const yearStr = currentDate.getFullYear().toString();
      const [eventsRes, holidaysRes] = await Promise.all([
        api.getCalendarEvents({ year: yearStr }),
        api.getHolidays({ year: yearStr })
      ]);

      if (eventsRes.success) setEvents(eventsRes.data);
      if (holidaysRes.success) setHolidays(holidaysRes.data);
    } catch (err: any) {
      error(err.message || "Failed to load calendar events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate.getFullYear()]);

  // Calendar Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Events
  const filteredEvents = events.filter((ev) => {
    if (ev.category === "holiday" && !filterHolidays) return false;
    if (ev.category === "birthday" && !filterBirthdays) return false;
    if (ev.category === "anniversary" && !filterAnniversaries) return false;
    if (ev.category === "leave" && !filterLeaves) return false;
    if (ev.category === "event" && !filterCompanyEvents) return false;
    return true;
  });

  // Helper to get events for a specific day string (YYYY-MM-DD)
  const getEventsForDay = (dateStr: string) => {
    return filteredEvents.filter((ev) => {
      if (ev.date === dateStr) return true;
      if (ev.endDate && ev.date <= dateStr && ev.endDate >= dateStr) return true;
      return false;
    });
  };

  // Holiday CRUD
  const handleOpenAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      name: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      type: "National",
      applicableLocation: "Pan India",
      status: "Upcoming"
    });
    setIsHolidayModalOpen(true);
  };

  const handleOpenEditHoliday = (h: Holiday) => {
    setEditingHoliday(h);
    setHolidayForm({
      name: h.name,
      date: h.date,
      description: h.description,
      type: h.type,
      applicableLocation: h.applicableLocation,
      status: h.status
    });
    setIsHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.date) {
      error("Holiday name and date are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingHoliday) {
        await api.updateHoliday(editingHoliday.id, holidayForm);
        success(`Holiday "${holidayForm.name}" updated successfully.`);
      } else {
        await api.createHoliday(holidayForm);
        success(`Holiday "${holidayForm.name}" added successfully.`);
      }
      setIsHolidayModalOpen(false);
      fetchCalendarData();
    } catch (err: any) {
      error(err.message || "Failed to save holiday.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deletingHoliday) return;
    try {
      setIsSubmitting(true);
      await api.deleteHoliday(deletingHoliday.id);
      success(`Holiday "${deletingHoliday.name}" deleted.`);
      setDeletingHoliday(null);
      fetchCalendarData();
    } catch (err: any) {
      error(err.message || "Failed to delete holiday.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export holidays to CSV
  const handleExportHolidaysCSV = () => {
    const headers = ["Holiday Name", "Date", "Type", "Applicable Location", "Status", "Description"];
    const rows = holidays.map((h) => [
      `"${h.name.replace(/"/g, '""')}"`,
      h.date,
      h.type,
      `"${h.applicableLocation.replace(/"/g, '""')}"`,
      h.status,
      `"${h.description.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BharatCorp_Holidays_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Holidays exported to CSV.");
  };

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case "holiday":
        return <CalendarIcon className="w-3 h-3 text-amber-500" />;
      case "birthday":
        return <PartyPopper className="w-3 h-3 text-purple-400" />;
      case "anniversary":
        return <Award className="w-3 h-3 text-blue-400" />;
      case "leave":
        return <Palmtree className="w-3 h-3 text-emerald-400" />;
      default:
        return <Bell className="w-3 h-3 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Company Calendar & Holidays
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
              {year} Schedule
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Track official public holidays, birthdays, work anniversaries, approved leaves, and corporate events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tabs switch */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Interactive Calendar
            </button>
            <button
              onClick={() => setActiveTab("holidays")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "holidays"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Holidays List ({holidays.length})
            </button>
          </div>

          {canManage && activeTab === "holidays" && (
            <button
              onClick={handleOpenAddHoliday}
              className="flex items-center gap-2 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Holiday
            </button>
          )}

          {activeTab === "holidays" && (
            <button
              onClick={handleExportHolidaysCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {activeTab === "calendar" && (
        <div className="space-y-4">
          {/* Controls & Event Categories Filter Bar */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Month Nav */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white min-w-44 text-center">
                  {monthNames[month]} {year}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium text-[11px] mr-1">Visible Filters:</span>
              <button
                onClick={() => setFilterHolidays(!filterHolidays)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  filterHolidays
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 opacity-60"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Holidays
              </button>

              <button
                onClick={() => setFilterBirthdays(!filterBirthdays)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  filterBirthdays
                    ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 opacity-60"
                }`}
              >
                <PartyPopper className="w-3.5 h-3.5" />
                Birthdays
              </button>

              <button
                onClick={() => setFilterAnniversaries(!filterAnniversaries)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  filterAnniversaries
                    ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 opacity-60"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Anniversaries
              </button>

              <button
                onClick={() => setFilterLeaves(!filterLeaves)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  filterLeaves
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 opacity-60"
                }`}
              >
                <Palmtree className="w-3.5 h-3.5" />
                Approved Leaves
              </button>

              <button
                onClick={() => setFilterCompanyEvents(!filterCompanyEvents)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  filterCompanyEvents
                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 opacity-60"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                Events
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 text-center py-3 bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <div className="text-red-500 dark:text-red-400">Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-orange-500 dark:text-orange-400">Sat</div>
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {/* Prev month tail days */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                const dayNum = prevMonthDays - firstDayOfMonth + i + 1;
                return (
                  <div key={`prev-${i}`} className="min-h-24 p-1.5 bg-zinc-50/30 dark:bg-zinc-950/20 opacity-40">
                    <span className="text-xs font-semibold text-zinc-400">{dayNum}</span>
                  </div>
                );
              })}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
                const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

                const dayEvents = getEventsForDay(dateStr);
                const isToday =
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === month &&
                  new Date().getDate() === dayNum;

                const dayOfWeek = new Date(year, month, dayNum).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => dayEvents.length > 0 && setSelectedDayEvents({ date: dateStr, events: dayEvents })}
                    className={`min-h-24 p-1.5 transition-colors flex flex-col ${
                      isToday ? "bg-orange-50/50 dark:bg-orange-950/20" : isWeekend ? "bg-zinc-50/40 dark:bg-zinc-900/40" : ""
                    } ${dayEvents.length > 0 ? "cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          isToday
                            ? "bg-orange-600 text-white shadow-sm"
                            : isWeekend
                            ? "text-orange-600 dark:text-orange-400 font-semibold"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Events List inside Day Cell */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          title={`${ev.title} - ${ev.description || ""}`}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${
                            ev.category === "holiday"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold"
                              : ev.category === "birthday"
                              ? "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                              : ev.category === "anniversary"
                              ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                              : ev.category === "leave"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              : "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                          }`}
                        >
                          {renderCategoryIcon(ev.category)}
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}

                      {dayEvents.length > 3 && (
                        <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 pl-1">
                          +{dayEvents.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Next month head padding */}
              {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => (
                <div key={`next-${i}`} className="min-h-24 p-1.5 bg-zinc-50/30 dark:bg-zinc-950/20 opacity-40">
                  <span className="text-xs font-semibold text-zinc-400">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Holidays List Tab */}
      {activeTab === "holidays" && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Holiday Name & Details</th>
                  <th className="px-5 py-3.5">Date & Day</th>
                  <th className="px-5 py-3.5">Holiday Type</th>
                  <th className="px-5 py-3.5">Applicable Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  {canManage && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading company holidays...
                    </td>
                  </tr>
                ) : holidays.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                      <CalendarIcon className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2 opacity-60" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No holidays scheduled</p>
                    </td>
                  </tr>
                ) : (
                  holidays.map((h) => {
                    const holidayDateObj = new Date(`${h.date}T00:00:00`);
                    const dayName = holidayDateObj.toLocaleDateString("en-US", { weekday: "long" });

                    return (
                      <tr key={h.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-amber-500" />
                            {h.name}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-md">
                            {h.description}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-zinc-900 dark:text-white font-mono">{h.date}</div>
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">{dayName}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              h.type === "National"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                                : h.type === "Regional"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            }`}
                          >
                            {h.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            {h.applicableLocation}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              h.status === "Upcoming"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                                : h.status === "Completed"
                                ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            }`}
                          >
                            {h.status === "Completed" ? (
                              <CheckCircle2 className="w-3 h-3 text-zinc-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-500" />
                            )}
                            {h.status}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditHoliday(h)}
                                title="Edit Holiday"
                                className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingHoliday(h)}
                                title="Delete Holiday"
                                className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Day Agenda Modal */}
      <Modal
        isOpen={!!selectedDayEvents}
        onClose={() => setSelectedDayEvents(null)}
        title={selectedDayEvents ? `Events for ${selectedDayEvents.date}` : "Day Agenda"}
        subtitle="All scheduled holidays, employee milestones, leaves, and corporate notices."
        maxWidth="md"
      >
        <div className="space-y-3">
          {selectedDayEvents?.events.map((ev) => (
            <div
              key={ev.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                ev.category === "holiday"
                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
                  : ev.category === "birthday"
                  ? "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60"
                  : ev.category === "anniversary"
                  ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60"
                  : ev.category === "leave"
                  ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60"
              }`}
            >
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-800/80 shadow-xs">
                {renderCategoryIcon(ev.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{ev.title}</h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300">
                    {ev.category}
                  </span>
                </div>
                {ev.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{ev.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add / Edit Holiday Modal */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title={editingHoliday ? `Edit Holiday: ${editingHoliday.name}` : "Schedule Company Holiday"}
        subtitle="Specify official date, holiday type, and applicable corporate branches."
        maxWidth="md"
      >
        <form onSubmit={handleSaveHoliday} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Holiday Name *
            </label>
            <input
              type="text"
              required
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              placeholder="e.g. Diwali (Deepavali)"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Holiday Type *
              </label>
              <select
                value={holidayForm.type}
                onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value as any })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              >
                <option value="National">National (Pan-India)</option>
                <option value="Regional">Regional (Specific States)</option>
                <option value="Corporate">Corporate / Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Applicable Location
            </label>
            <input
              type="text"
              value={holidayForm.applicableLocation}
              onChange={(e) => setHolidayForm({ ...holidayForm, applicableLocation: e.target.value })}
              placeholder="e.g. Pan India or Bengaluru & Mumbai Offices"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={holidayForm.description}
              onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
              placeholder="Festival details or background information..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="holidayStatus"
                  checked={holidayForm.status === "Upcoming"}
                  onChange={() => setHolidayForm({ ...holidayForm, status: "Upcoming" })}
                  className="text-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">Upcoming</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="holidayStatus"
                  checked={holidayForm.status === "Completed"}
                  onChange={() => setHolidayForm({ ...holidayForm, status: "Completed" })}
                  className="text-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">Completed</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsHolidayModalOpen(false)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : editingHoliday ? "Update Holiday" : "Add Holiday"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Holiday Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingHoliday}
        onClose={() => setDeletingHoliday(null)}
        onConfirm={handleDeleteHoliday}
        title="Delete Holiday"
        message={`Are you sure you want to remove "${deletingHoliday?.name}" on ${deletingHoliday?.date}? This will remove it from the company calendar.`}
        confirmText="Delete Holiday"
        isDestructive
        isLoading={isSubmitting}
      />
    </div>
  );
};
