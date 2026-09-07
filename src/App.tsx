import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { AmbientVideoProvider, useAmbientVideo } from "./context/AmbientVideoContext";
import { AmbientVideoBackground } from "./components/AmbientVideoBackground";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { AttendancePage } from "./pages/AttendancePage";
import { LeavePage } from "./pages/LeavePage";
import { PayrollPage } from "./pages/PayrollPage";
import { PerformancePage } from "./pages/PerformancePage";
import { TasksPage } from "./pages/TasksPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AiAssistantPage } from "./pages/AiAssistantPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { DesignationsPage } from "./pages/DesignationsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { UserManagementPage } from "./pages/UserManagementPage";

const MainAppLayout: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { isVideoActive } = useAmbientVideo();
  const [currentPath, setCurrentPath] = useState("/dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-zinc-900">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold tracking-wide text-orange-600">Initializing BharatCorp EMS Enterprise Hub...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (path: string) => {
    if (path.startsWith("/employees/")) {
      const id = path.replace("/employees/", "");
      setSelectedEmployeeId(id);
      setCurrentPath("/employees/detail");
    } else {
      setSelectedEmployeeId(null);
      setCurrentPath(path);
    }
    // Close mobile sidebar on navigation
    setIsMobileSidebarOpen(false);
  };

  const renderActivePage = () => {
    switch (currentPath) {
      case "/dashboard":
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id);
              setCurrentPath("/employees/detail");
            }}
          />
        );
      case "/employees":
        return (
          <EmployeesPage
            onNavigate={handleNavigate}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id);
              setCurrentPath("/employees/detail");
            }}
          />
        );
      case "/employees/detail":
        return (
          <EmployeeDetailPage
            employeeId={selectedEmployeeId || user?.employeeId || "emp-1"}
            onNavigate={handleNavigate}
            onBack={() => setCurrentPath("/employees")}
          />
        );
      case "/departments":
        return (
          <DepartmentsPage
            onNavigate={handleNavigate}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id);
              setCurrentPath("/employees/detail");
            }}
          />
        );
      case "/designations":
        return <DesignationsPage onNavigate={handleNavigate} />;
      case "/attendance":
        return <AttendancePage onNavigate={handleNavigate} />;
      case "/leave":
      case "/leaves":
        return <LeavePage onNavigate={handleNavigate} />;
      case "/calendar":
      case "/holidays":
        return <CalendarPage onNavigate={handleNavigate} />;
      case "/payroll":
        return <PayrollPage onNavigate={handleNavigate} />;
      case "/performance":
        return (
          <PerformancePage
            onNavigate={handleNavigate}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id);
              setCurrentPath("/employees/detail");
            }}
          />
        );
      case "/tasks":
        return (
          <TasksPage
            onNavigate={handleNavigate}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id);
              setCurrentPath("/employees/detail");
            }}
          />
        );
      case "/announcements":
        return <AnnouncementsPage onNavigate={handleNavigate} />;
      case "/notifications":
        return <NotificationsPage onNavigate={handleNavigate} />;
      case "/documents":
        return (
          <DocumentsPage
            onNavigate={handleNavigate}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id);
              setCurrentPath("/employees/detail");
            }}
          />
        );
      case "/reports":
        return <ReportsPage onNavigate={handleNavigate} />;
      case "/audit-logs":
        return <AuditLogsPage onNavigate={handleNavigate} />;
      case "/ai-assistant":
        return <AiAssistantPage onNavigate={handleNavigate} />;
      case "/users":
        return <UserManagementPage onNavigate={handleNavigate} />;
      case "/settings":
        return <SettingsPage onNavigate={handleNavigate} />;
      case "/profile":
        return (
          <EmployeeDetailPage
            employeeId={user?.employeeId || "emp-1"}
            onNavigate={handleNavigate}
            onBack={() => setCurrentPath("/dashboard")}
          />
        );
      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onSelectEmployee={(id) => {
              setSelectedEmployeeId(id);
              setCurrentPath("/employees/detail");
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex transition-colors duration-200 antialiased font-sans relative overflow-hidden">
      {/* Ambient Motion Video Background */}
      {isVideoActive && (
        <AmbientVideoBackground showControls={false} />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        {/* Top Navigation Bar */}
        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNavigate={handleNavigate}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AmbientVideoProvider>
            <MainAppLayout />
          </AmbientVideoProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
