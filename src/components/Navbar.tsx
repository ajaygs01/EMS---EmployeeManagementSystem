import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Sparkles,
  Check,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Shield,
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Film
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useAmbientVideo } from "../context/AmbientVideoContext";
import { api } from "../services/api";
import { NotificationItem, UserRole } from "../types";

interface NavbarProps {
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onToggleMobileSidebar, onNavigate }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    isVideoActive,
    toggleVideo
  } = useAmbientVideo();

  const handleToggle = () => {
    if (onToggleMobileSidebar) {
      onToggleMobileSidebar();
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User Dropdown State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Demo Role Dropdown State
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        if (res && res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {
        // Graceful silent fallback
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Global search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchGlobal(searchQuery);
        if (res.success) {
          setSearchResults(res.results);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.read) {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setShowNotifications(false);
      if (notif.link) {
        onNavigate(notif.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: "Super Admin", label: "Super Admin", desc: "Full organization access" },
    { role: "HR Admin", label: "HR Admin", desc: "Staff, leaves & payroll" },
    { role: "Manager", label: "Manager", desc: "Team tasks & approvals" },
    { role: "Employee", label: "Employee", desc: "Personal portal & punch" }
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-[#08090d]/85 backdrop-blur-2xl border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors shadow-sm dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
      {/* Left: Sidebar Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={handleToggle}
          className="p-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search employees, departments, tasks, docs..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-100/90 dark:bg-zinc-900/90 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/90 focus:bg-white dark:focus:bg-black text-black dark:text-white rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin block" />
              </div>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 dark:bg-[#0c0e14]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 py-3 px-2 max-h-96 overflow-y-auto z-50 text-xs">
              {/* Employees */}
              {searchResults.employees?.length > 0 && (
                <div className="mb-3">
                  <div className="px-3 py-1 font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">
                    Employees
                  </div>
                  {searchResults.employees.map((e: any) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        onNavigate(e.link);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <img src={e.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{e.title}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">{e.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Departments */}
              {searchResults.departments?.length > 0 && (
                <div className="mb-3">
                  <div className="px-3 py-1 font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">
                    Departments
                  </div>
                  {searchResults.departments.map((d: any) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        onNavigate(d.link);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <Briefcase className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{d.title}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">{d.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {searchResults.tasks?.length > 0 && (
                <div className="mb-3">
                  <div className="px-3 py-1 font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[10px]">
                    Tasks
                  </div>
                  {searchResults.tasks.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onNavigate(t.link);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                    >
                      <Check className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">{t.subtitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {(!searchResults.employees || searchResults.employees.length === 0) &&
                (!searchResults.departments || searchResults.departments.length === 0) &&
                (!searchResults.tasks || searchResults.tasks.length === 0) && (
                  <div className="py-6 text-center text-zinc-400 dark:text-zinc-500">No matching records found</div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Role Switcher */}
        <div ref={roleMenuRef} className="relative hidden md:block">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-orange-500" />
            <span>Role: {user?.role}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Switch Demo Role Instantly
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchDemoRole(r.role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                    user?.role === r.role
                      ? "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div>
                    <div className="font-semibold">{r.label}</div>
                    <div className="text-[10px] text-zinc-400">{r.desc}</div>
                  </div>
                  {user?.role === r.role && <Check className="w-4 h-4 text-orange-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Quick Button */}
        <button
          onClick={() => onNavigate("/ai-assistant")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 shadow-md shadow-orange-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI HR Assistant</span>
        </button>

        {/* Ambient Video Background Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            isVideoActive
              ? "text-orange-600 bg-orange-50 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-800 shadow-xs ring-1 ring-orange-400/20"
              : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
          }`}
          title={isVideoActive ? "Ambient Video: Active (Click to Pause)" : "Ambient Video: Paused (Click to Enable)"}
        >
          <Film className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        </button>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white dark:ring-black animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2 z-50">
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-black dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 py-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors text-xs flex gap-3 items-start ${
                        !n.read
                          ? "bg-orange-50/60 dark:bg-orange-950/30 hover:bg-orange-50 dark:hover:bg-orange-950/50"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" style={{ opacity: n.read ? 0 : 1 }} />
                      <div className="flex-1">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</div>
                        <div className="text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{n.message}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate("/notifications");
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 rounded-xl transition-colors"
                >
                  Open Full Notifications Center &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 pl-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-black dark:text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{user?.role}</div>
            </div>
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
              alt={user?.name || "Avatar"}
              className="w-8 h-8 rounded-full object-cover border border-orange-300 dark:border-orange-800 shadow-sm"
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                <div className="font-bold text-black dark:text-white">{user?.name}</div>
                <div className="text-zinc-400 text-[11px]">{user?.email}</div>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onNavigate("/profile");
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-orange-500" />
                My Profile
              </button>

              <button
                onClick={() => {
                  onNavigate("/settings");
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <Shield className="w-4 h-4 text-orange-500" />
                Settings & Security
              </button>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
