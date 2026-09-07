import React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Clock,
  CalendarDays,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  CheckSquare,
  Megaphone,
  Bell,
  FolderArchive,
  BarChart3,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Settings,
  X,
  ChevronRight,
  Shield
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface NavItem {
  name: string;
  path: string;
  icon: any;
  roles: UserRole[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onCloseMobile
}) => {
  const { user } = useAuth();
  const userRole = user?.role || "Employee";

  const navSections: NavSection[] = [
    {
      title: "Main",
      items: [
        {
          name: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        },
        {
          name: "Employees",
          path: "/employees",
          icon: Users,
          roles: ["Super Admin", "HR Admin", "Manager"]
        },
        {
          name: "Departments",
          path: "/departments",
          icon: Building2,
          roles: ["Super Admin", "HR Admin", "Manager"]
        },
        {
          name: "Designations",
          path: "/designations",
          icon: Briefcase,
          roles: ["Super Admin", "HR Admin", "Manager"]
        },
        {
          name: "Attendance",
          path: "/attendance",
          icon: Clock,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        },
        {
          name: "Leaves",
          path: "/leave",
          icon: CalendarDays,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        },
        {
          name: "Company Calendar",
          path: "/calendar",
          icon: CalendarIcon,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        },
        {
          name: "Payroll",
          path: "/payroll",
          icon: DollarSign,
          roles: ["Super Admin", "HR Admin", "Employee"]
        },
        {
          name: "Performance",
          path: "/performance",
          icon: TrendingUp,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        },
        {
          name: "Tasks",
          path: "/tasks",
          icon: CheckSquare,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        }
      ]
    },
    {
      title: "Communication",
      items: [
        {
          name: "Announcements",
          path: "/announcements",
          icon: Megaphone,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        },
        {
          name: "Notifications",
          path: "/notifications",
          icon: Bell,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        }
      ]
    },
    {
      title: "Management & AI",
      items: [
        {
          name: "Documents",
          path: "/documents",
          icon: FolderArchive,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"]
        },
        {
          name: "Reports & Analytics",
          path: "/reports",
          icon: BarChart3,
          roles: ["Super Admin", "HR Admin", "Manager"]
        },
        {
          name: "Audit Logs",
          path: "/audit-logs",
          icon: ShieldCheck,
          roles: ["Super Admin", "HR Admin"],
          badge: "SEC"
        },
        {
          name: "AI HR Suite",
          path: "/ai-assistant",
          icon: Sparkles,
          roles: ["Super Admin", "HR Admin", "Manager", "Employee"],
          badge: "AI"
        }
      ]
    },
    {
      title: "System",
      items: [
        {
          name: "User Management",
          path: "/users",
          icon: UserCheck,
          roles: ["Super Admin"],
          badge: "ADMIN"
        },
        {
          name: "Settings",
          path: "/settings",
          icon: Settings,
          roles: ["Super Admin", "HR Admin"]
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white text-zinc-800 flex flex-col border-r border-zinc-200 shadow-sm transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-zinc-200 bg-white shrink-0">
          <button
            onClick={() => onNavigate("/dashboard")}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white font-display font-black text-lg shadow-[0_4px_14px_rgba(249,115,22,0.35)] group-hover:scale-105 transition-transform">
              B
            </div>
            <div>
              <div className="font-display font-black text-sm text-zinc-900 tracking-tight flex items-center gap-1.5">
                BharatCorp EMS
              </div>
              <div className="text-[10px] text-zinc-500 font-medium">Smart Workforce Hub</div>
            </div>
          </button>

          <button
            onClick={onCloseMobile}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 font-mono">
                  {section.title}
                </div>

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    currentPath === item.path ||
                    (item.path !== "/dashboard" && currentPath.startsWith(item.path));

                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        onNavigate(item.path);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_6px_18px_-4px_rgba(249,115,22,0.35)] font-bold translate-x-1"
                          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 hover:translate-x-0.5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? "text-white" : "text-zinc-400 group-hover:text-orange-500"
                          }`}
                        />
                        <span className="tracking-wide">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                              item.badge === "SEC"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-orange-500 text-white shadow-sm"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-90" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Role Footnote */}
        <div className="p-3 border-t border-zinc-200 shrink-0 bg-zinc-50/60">
          <div className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-zinc-200 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-zinc-900 truncate">{user?.name}</div>
              <div className="text-[10px] text-orange-600 font-semibold">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

