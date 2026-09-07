import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  CalendarDays,
  CheckSquare,
  DollarSign,
  TrendingUp,
  Megaphone,
  Info,
  ArrowUpRight,
  RefreshCw,
  Clock
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { NotificationItem } from "../types";

interface NotificationsPageProps {
  onNavigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.markNotificationRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        showToast("Notification marked as read", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to mark as read", "error");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        showToast("All notifications marked as read", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update notifications", "error");
    }
  };

  const handleDeleteNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        showToast("Notification removed", "info");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete notification", "error");
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) {
      handleMarkAsRead(item.id);
    }
    if (item.link) {
      onNavigate(item.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "leave":
        return <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "task":
        return <CheckSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case "payroll":
        return <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case "performance":
        return <TrendingUp className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
      case "announcement":
        return <Megaphone className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== "all" && n.type !== filterType) return false;
    if (statusFilter === "unread" && n.read) return false;
    if (statusFilter === "read" && !n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            Notifications & System Alerts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time activity updates, leave decisions, task assignments, and corporate bulletins
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 rounded-xl bg-white/95 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-zinc-200/90 dark:border-zinc-800/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Types" },
            { id: "leave", label: "Leaves" },
            { id: "task", label: "Tasks" },
            { id: "payroll", label: "Payroll" },
            { id: "performance", label: "Performance" },
            { id: "announcement", label: "Announcements" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-orange-500"
          >
            <option value="all">All</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 bg-white/95 dark:bg-zinc-950/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 text-center text-zinc-400 text-xs">
            <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 bg-white/95 dark:bg-zinc-950/90 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 text-center text-zinc-400 text-xs">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-zinc-400" />
            No notifications found matching your criteria.
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                item.read
                  ? "bg-white/95 dark:bg-zinc-950/90 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                  : "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/90 dark:border-orange-900/60 shadow-xs hover:border-orange-300 dark:hover:border-orange-800"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    item.read
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "bg-white dark:bg-zinc-900 shadow-xs border border-orange-200/50 dark:border-orange-900/40"
                  }`}
                >
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-xs sm:text-sm font-bold ${item.read ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-900 dark:text-white"}`}>
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      {item.type}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    {item.link && (
                      <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-0.5 hover:underline">
                        View Details <ArrowUpRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {!item.read && (
                  <button
                    onClick={(e) => handleMarkAsRead(item.id, e)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-orange-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={(e) => handleDeleteNotification(item.id, e)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
