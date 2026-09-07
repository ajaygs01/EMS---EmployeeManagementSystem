import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  UserCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  IndianRupee,
  Award,
  FileText,
  Bot,
  Layers,
  ChevronRight,
  Shield,
  Zap,
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  Film
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAmbientVideo } from "../context/AmbientVideoContext";
import { AmbientVideoBackground } from "../components/AmbientVideoBackground";
import { UserRole } from "../types";
import { api } from "../services/api";

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const { success, error, info } = useToast();
  const {
    isVideoActive,
    toggleVideo
  } = useAmbientVideo();

  // Navigation & Modals
  const [activeModal, setActiveModal] = useState<"login" | "register" | "forgot" | null>(null);
  const [heroCardTab, setHeroCardTab] = useState<"login" | "demo" | "register" | "metrics">("login");
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>("Super Admin");

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("admin@example.com");
  const [loginPassword, setLoginPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);

  // Register Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("Employee");
  const [regDepartment, setRegDepartment] = useState("Information Technology");
  const [regPosition, setRegPosition] = useState("Software Engineer");
  const [regLoading, setRegLoading] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState("");

  // Live Stats
  const [stats, setStats] = useState({
    totalEmployees: 250,
    departments: 6,
    attendanceRate: 98.4,
    monthlyPayroll: 485000
  });

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const res = await api.getDashboardStats();
        if (res.success && res.stats) {
          setStats({
            totalEmployees: res.stats.totalEmployees || 250,
            departments: res.stats.totalDepartments || 6,
            attendanceRate: 98.4,
            monthlyPayroll: res.stats.monthlyPayroll || 485000
          });
        }
      } catch (e) {
        // Fallback defaults in place
      }
    };
    fetchLiveStats();
  }, []);

  const demoRoles: {
    role: UserRole;
    email: string;
    pass: string;
    title: string;
    desc: string;
    badge: string;
  }[] = [
    {
      role: "Super Admin",
      email: "admin@example.com",
      pass: "Admin@123",
      title: "Super Admin",
      desc: "Full organization access, system settings & compliance",
      badge: "bg-orange-950/80 text-orange-300 border border-orange-800"
    },
    {
      role: "HR Admin",
      email: "hr@example.com",
      pass: "HR@123",
      title: "HR Administrator",
      desc: "Staff directory, leave approvals, payroll & documents",
      badge: "bg-zinc-800 text-white border border-zinc-700"
    },
    {
      role: "Manager",
      email: "manager@example.com",
      pass: "Manager@123",
      title: "Department Manager",
      desc: "Team tasks, attendance tracking & performance reviews",
      badge: "bg-amber-950/80 text-amber-300 border border-amber-800"
    },
    {
      role: "Employee",
      email: "employee@example.com",
      pass: "Employee@123",
      title: "Staff Employee",
      desc: "Self-service clock in/out, leave requests & payslips",
      badge: "bg-zinc-900 text-zinc-300 border border-zinc-700"
    }
  ];

  const handleDemoFill = (roleEmail: string, rolePass: string, role: UserRole) => {
    setLoginEmail(roleEmail);
    setLoginPassword(rolePass);
    setSelectedDemoRole(role);
    setLoginErrorMsg(null);
  };

  const handleDirectDemoLogin = async (roleEmail: string, rolePass: string) => {
    setLoading(true);
    setLoginErrorMsg(null);
    try {
      const ok = await login(roleEmail, rolePass);
      if (ok) {
        setActiveModal(null);
      }
    } catch (err: any) {
      setLoginErrorMsg(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg(null);
    if (!loginEmail || !loginPassword) {
      setLoginErrorMsg("Please enter both email and password.");
      error("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const ok = await login(loginEmail.trim(), loginPassword);
      if (ok) {
        setActiveModal(null);
      } else {
        setLoginErrorMsg("Invalid email or password. Please verify your credentials.");
      }
    } catch (err: any) {
      setLoginErrorMsg(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      error("Please fill in all required registration fields.");
      return;
    }
    setRegLoading(true);
    try {
      const ok = await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        departmentName: regDepartment,
        position: regPosition
      });
      if (ok) {
        setActiveModal(null);
      }
    } catch (err: any) {
      // Handled in context
    } finally {
      setRegLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient Motion Video Background */}
      {isVideoActive && (
        <AmbientVideoBackground
          showControls={true}
          controlsPosition="bottom-right"
        />
      )}

      {/* TOP HEADER NAVBAR */}
      <header className="relative z-30 border-b border-white/10 bg-zinc-950/75 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 border border-orange-400/50 flex items-center justify-center text-white shadow-md">
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center font-black text-xs text-orange-600">
                B
              </div>
            </div>
            <div>
              <div className="font-black text-lg text-white tracking-tight leading-none uppercase">
                BHARATCORP EMS
              </div>
              <p className="text-[11px] text-zinc-400 font-medium tracking-wide mt-0.5">
                Smart Employee Management System
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-300">
            <button
              onClick={() => setActiveModal("login")}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("modules")}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Modules
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Ambient Video Motion Live Toggle */}
            <button
              onClick={toggleVideo}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isVideoActive
                  ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
              }`}
              title="Toggle Live Ambient Motion Video"
            >
              <Film className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isVideoActive ? "Ambient Motion: Active" : "Ambient Motion: Off"}</span>
            </button>

            <button
              onClick={() => {
                setRegRole("HR Admin");
                setActiveModal("register");
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-orange-500/50 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-orange-400" />
              <span>Register</span>
            </button>

            <button
              onClick={() => setActiveModal("login")}
              className="px-4.5 py-2 rounded-xl text-xs sm:text-sm font-black text-white bg-orange-500 hover:bg-orange-600 transition-all flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-current" />
              <span>Login Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH LIVE INTEGRATED LOGIN PORTAL CARD */}
      <section id="portal" className="relative z-10 pt-10 pb-16 sm:pt-14 sm:pb-24 lg:pt-18 lg:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
          
          {/* Left Column: Eyebrow, Headline, Description, Quick Demo Launcher */}
          <div className="lg:col-span-6 flex flex-col items-start text-left pt-2">
            
            {/* Stylized Eyebrow Tags & Effect Mode Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <div className="relative inline-flex items-center px-4 py-1.5 rounded-md border border-orange-200 bg-orange-50 text-[11px] font-black uppercase tracking-widest text-orange-700 shadow-xs">
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-orange-500" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-orange-500" />
                ENTERPRISE HR &amp; WORKFORCE SYSTEM
              </div>

              {/* Ambient Motion Mode Badge */}
              <div
                onClick={toggleVideo}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-bold shadow-xs cursor-pointer transition-all ${
                  isVideoActive
                    ? "border-orange-300 bg-orange-50 text-orange-700 ring-1 ring-orange-400/30"
                    : "border-zinc-200 bg-white/90 text-zinc-600 hover:bg-zinc-50"
                }`}
                title="Cinematic Ambient Video Background Active"
              >
                <Film className="w-3.5 h-3.5 text-orange-600" />
                <span>Ambient Motion: {isVideoActive ? "Active" : "Paused"}</span>
              </div>
            </div>

            {/* Display Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12] mb-5 drop-shadow-sm">
              Streamline Workforce Operations with Precision &amp; Efficiency
            </h1>

            {/* Subtitle Description */}
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl mb-6 drop-shadow-xs">
              A unified enterprise platform for managing Indian workforce employee profiles, department hierarchies, biometric attendance tracking, automated payroll (INR / LPA), 360 appraisals, and leave records.
            </p>

            {/* Primary Hero CTAs (Click to Open Login / Register Modal) */}
            <div className="flex flex-wrap items-center gap-4 mb-8 w-full">
              <button
                type="button"
                onClick={() => setActiveModal("login")}
                className="px-7 py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-3 shadow-[0_12px_30px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_18px_40px_-5px_rgba(249,115,22,0.5)] hover:-translate-y-1 transform cursor-pointer ring-1 ring-white/20"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Sign In to EMS Portal</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegRole("HR Admin");
                  setActiveModal("register");
                }}
                className="px-6 py-4 rounded-2xl text-sm font-bold text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-orange-500/60 transition-all duration-300 flex items-center gap-2.5 shadow-sm hover:-translate-y-0.5 cursor-pointer backdrop-blur-sm"
              >
                <UserPlus className="w-4 h-4 text-orange-400" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Key System Highlights Pills */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xl text-xs text-zinc-300 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-medium text-zinc-200">Zero-Trust RBAC</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-medium text-zinc-200">Biometric Attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-medium text-zinc-200">Indian Statutory Payroll</span>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Platform Showcase Card */}
          <div className="lg:col-span-6 relative">
            
            {/* Ambient Lighting Glow Behind Card */}
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent rounded-[32px] blur-2xl opacity-80 pointer-events-none" />

            {/* Floating Micro-Badges */}
            <div className="absolute -top-4 -right-2 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/95 border border-orange-500/30 text-zinc-200 text-[11px] font-bold shadow-xl backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Smart Analytics 2.0</span>
            </div>

            <div className="absolute -bottom-4 -left-3 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/95 border border-emerald-500/30 text-zinc-200 text-[11px] font-bold shadow-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-400">Biometric Live Feed Active</span>
            </div>

            {/* Outer Card Container */}
            <div className="relative rounded-3xl border border-white/10 bg-zinc-900/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
              
              {/* Corner Styling Accents */}
              <span className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-orange-500 rounded-tl" />
              <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-orange-500 rounded-br" />

              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-5 mb-6 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shadow-md shadow-orange-500/40" />
                    <span className="font-display text-sm font-black tracking-wider text-white uppercase">
                      BHARATCORP PLATFORM OVERVIEW
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 font-sans">Live Enterprise Workforce Telemetry</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-xs">
                    Online &bull; 99.98%
                  </span>
                </div>
              </div>

              {/* 4 Telemetry Metric Blocks */}
              <div className="grid grid-cols-2 gap-3.5 mb-6">
                <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-orange-400 transition-colors">
                      ACTIVE EMPLOYEES
                    </span>
                    <Users className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-white">
                    {stats.totalEmployees}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    Across 5 Indian Regional Hubs
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-orange-400 transition-colors">
                      DEPARTMENTS
                    </span>
                    <Building2 className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-white">
                    {stats.departments}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    IT, HR, Sales, Finance, Ops
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-400 transition-colors">
                      TODAY'S ATTENDANCE
                    </span>
                    <Clock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-white">
                    {stats.attendanceRate}%
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                    IST Biometric &amp; Geo-Clock Synced
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 group-hover:text-orange-400 transition-colors">
                      MONTHLY PAYROLL
                    </span>
                    <IndianRupee className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-display font-black text-white">
                    ₹{((stats.monthlyPayroll * 84) / 100000).toFixed(1)}L
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">
                    PF, ESIC &amp; TDS Compliant
                  </div>
                </div>
              </div>

              {/* Interactive Modal Launch Triggers */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    Ready to access your workspace?
                  </span>
                  <span className="text-[10px] font-mono text-zinc-300 bg-zinc-700/80 px-2 py-0.5 rounded">JWT 256-bit</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveModal("login")}
                    className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-white" />
                    <span>Open Login Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegRole("HR Admin");
                      setActiveModal("register");
                    }}
                    className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 shadow-xs"
                  >
                    <UserPlus className="w-4 h-4 text-orange-400" />
                    <span>Register New User</span>
                  </button>
                </div>
              </div>

              {/* Bottom Card Footer Status */}
              <div className="mt-4 pt-3.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5 text-orange-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                  RBAC Matrix Active
                </span>
                <span>Node &bull; React &bull; Secure JWT</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CORE ENTERPRISE MODULES SHOWCASE (#modules) */}
      <section id="modules" className="relative z-10 py-20 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/60 text-orange-400 border border-orange-500/30 mb-3 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              Comprehensive HR Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Enterprise Modules Built for Indian Workforces
            </h2>
            <p className="text-sm text-zinc-400 mt-3">
              Everything required to oversee, evaluate, and compensate your talent pool from a centralized console.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Users className="w-6 h-6 text-orange-400" />,
                title: "Employee 360",
                desc: "Unified personnel profiles, job designations, salary history, emergency contacts, and document vaults."
              },
              {
                icon: <Building2 className="w-6 h-6 text-orange-400" />,
                title: "Department Budgets",
                desc: "Hierarchical division management, team leadership assignments, headcount analytics, and cost allocation."
              },
              {
                icon: <Clock className="w-6 h-6 text-orange-400" />,
                title: "Smart Attendance",
                desc: "Live check-in/out logging, automatic working hour calculation, overtime, late-arrival, and CSV exports."
              },
              {
                icon: <Briefcase className="w-6 h-6 text-orange-400" />,
                title: "Leave Workflows",
                desc: "Multi-tier approvals for casual, sick, earned, and maternity leaves with real-time balance ledgers."
              },
              {
                icon: <DollarSign className="w-6 h-6 text-orange-400" />,
                title: "Payroll & Payslips",
                desc: "Automated calculation of basic salary, PF, HRA, professional tax, and printable PDF payslips."
              },
              {
                icon: <Award className="w-6 h-6 text-orange-400" />,
                title: "360 Appraisals",
                desc: "Structured quarterly reviews assessing productivity, quality, teamwork, leadership, and feedback."
              },
              {
                icon: <FileText className="w-6 h-6 text-orange-400" />,
                title: "Compliance Vault",
                desc: "Encrypted company document storage, tax certificates, contract management, and corporate bulletins."
              },
              {
                icon: <Bot className="w-6 h-6 text-orange-400" />,
                title: "Gemini AI HR Suite",
                desc: "AI-generated job descriptions, policy drafting, interview questions, and performance summarization."
              }
            ].map((m, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-850/90 transition-all group shadow-xs backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                  {m.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{m.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FEATURES & RBAC HIGHLIGHTS (#features) */}
      <section id="features" className="relative z-10 py-20 border-t border-white/10 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/60 text-orange-400 border border-orange-500/30 mb-3 shadow-xs">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                Zero-Trust Role-Based Access Control
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                Granular Security for Every Organizational Tier
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                EMS Enterprise guarantees confidential payroll information, internal performance reviews, and personnel records are strictly restricted to authenticated personas.
              </p>

              <div className="space-y-3.5">
                {[
                  {
                    role: "Super Admin",
                    desc: "Full organization authority, audit logs, system-wide company settings, and user provisioning."
                  },
                  {
                    role: "HR Administrator",
                    desc: "Employee lifecycle, leave approvals, salary calculations, performance review cycles, and documents."
                  },
                  {
                    role: "Department Manager",
                    desc: "Subordinate task delegations, team attendance monitoring, leave approvals, and review scoring."
                  },
                  {
                    role: "Employee Self-Service",
                    desc: "Personal check-in/out, leave applications, task checklists, payslip downloads, and appraisals."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-xs backdrop-blur-sm">
                    <div className="w-5 h-5 rounded-md bg-orange-950/70 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-orange-500/30">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white">{item.role}:</span>{" "}
                      <span className="text-xs text-zinc-400">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-zinc-900/85 border border-zinc-800 shadow-xl relative backdrop-blur-md">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                  <span className="font-mono text-xs font-bold text-zinc-400 uppercase">
                    EMS Access Matrix
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-orange-950/60 text-orange-400 border border-orange-500/30">
                    Active &amp; Enforced
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
                    <span className="text-zinc-300 font-medium">View Confidential Salaries</span>
                    <span className="text-orange-400 font-bold">Admin &amp; HR Only</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
                    <span className="text-zinc-300 font-medium">Approve Leave Requests</span>
                    <span className="text-orange-400 font-bold">Admin, HR &amp; Manager</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
                    <span className="text-zinc-300 font-medium">Biometric Clock In / Clock Out</span>
                    <span className="text-orange-400 font-bold">All Employees</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/70 border border-zinc-700/60">
                    <span className="text-zinc-300 font-medium">View System Audit Logs</span>
                    <span className="text-orange-400 font-bold">Super Admin Only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ABOUT & SYSTEM ARCHITECTURE (#about) */}
      <section id="about" className="relative z-10 py-16 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xs backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8 text-orange-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">Immutable Audit Logging</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Full compliance record tracking every login, employee data modification, leave decision, and payroll adjustment with timestamps and IP addresses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xs backdrop-blur-sm">
              <Bot className="w-8 h-8 text-orange-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">Server-Side Gemini AI</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                API keys remain securely stored on the backend. AI queries enforce strict employee boundaries so confidential salary data is never leaked.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xs backdrop-blur-sm">
              <FileText className="w-8 h-8 text-orange-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">High-Fidelity PDF &amp; CSV</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Printable corporate payslips, attendance log exports, performance reports, and employee registries ready for financial audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & CONTACT (#contact) */}
      <footer id="contact" className="relative z-10 py-12 border-t border-white/10 bg-zinc-950/90 text-zinc-400 text-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-xs text-white">
              B
            </div>
            <div>
              <span className="font-bold text-white">BHARATCORP EMS</span>
              <p className="text-[10px] text-zinc-400">Smart Employee Management, Simplified.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => scrollToSection("portal")} className="hover:text-orange-400 transition-colors cursor-pointer">
              Login Portal
            </button>
            <button onClick={() => scrollToSection("features")} className="hover:text-orange-400 transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection("modules")} className="hover:text-orange-400 transition-colors cursor-pointer">
              Modules
            </button>
            <button onClick={() => setActiveModal("register")} className="hover:text-orange-400 transition-colors cursor-pointer">
              Register
            </button>
          </div>

          <div className="text-[11px] text-zinc-500">
            &copy; {new Date().getFullYear()} BharatCorp EMS Enterprise. All rights reserved.
          </div>
        </div>
      </footer>

      {/* MODAL: LOGIN TO PORTAL (For navbar click) */}
      {activeModal === "login" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative animate-in fade-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 mb-2">
                PORTAL AUTHENTICATION
              </div>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Login to EMS Portal</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Enter your credentials or choose a quick demo account.
              </p>
            </div>

            {/* 1-Click Quick Selector in Modal */}
            <div className="mb-5">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Quick Demo Selection:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {demoRoles.map((d) => (
                  <button
                    key={d.role}
                    type="button"
                    onClick={() => handleDemoFill(d.email, d.pass, d.role)}
                    className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between cursor-pointer ${
                      loginEmail === d.email
                        ? "border-orange-500 bg-orange-50/80 ring-1 ring-orange-500"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    <span className="font-bold text-zinc-900 text-[11px]">{d.title}</span>
                    <span className="text-[10px] text-zinc-500 truncate">{d.email}</span>
                  </button>
                ))}
              </div>
            </div>

            {loginErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{loginErrorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginErrorMsg(null);
                    }}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveModal("forgot")}
                    className="text-xs text-orange-600 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginErrorMsg(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-black text-white bg-orange-500 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 cursor-pointer"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter Portal Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-zinc-500">
              Need an employee or admin account?{" "}
              <button
                type="button"
                onClick={() => setActiveModal("register")}
                className="text-orange-600 hover:underline font-bold cursor-pointer"
              >
                Register Here
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: REGISTER ACCOUNT */}
      {activeModal === "register" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 mb-2">
                ACCOUNT REGISTRATION
              </div>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Create EMS Account</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Register as an Admin, HR, Manager, or Employee.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rahul.sharma@bharatcorp.in"
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Assigned Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:border-orange-500 outline-none"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="HR Admin">HR Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Department</label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 focus:border-orange-500 outline-none"
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance & Accounts">Finance &amp; Accounts</option>
                    <option value="Marketing & Growth">Marketing &amp; Growth</option>
                    <option value="Sales & Partnerships">Sales &amp; Partnerships</option>
                    <option value="Operations & Logistics">Operations &amp; Logistics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Position / Job Designation</label>
                <input
                  type="text"
                  value={regPosition}
                  onChange={(e) => setRegPosition(e.target.value)}
                  placeholder="e.g. Senior Software Architect"
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 px-4 rounded-xl text-sm font-black text-white bg-orange-500 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 cursor-pointer"
              >
                {regLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create &amp; Sign In</span>
                    <UserPlus className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-zinc-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveModal("login")}
                className="text-orange-600 hover:underline font-bold cursor-pointer"
              >
                Sign In Instead
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: FORGOT PASSWORD */}
      {activeModal === "forgot" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 relative">
            <h3 className="font-bold text-lg text-zinc-900 mb-2">Reset Password</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Enter your work email address to receive password recovery instructions.
            </p>
            <input
              type="email"
              placeholder="name@company.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-xl mb-4 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-orange-500"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveModal("login")}
                className="px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  info("Password recovery instructions simulated for " + (forgotEmail || "demo email"));
                  setActiveModal("login");
                }}
                className="px-4 py-1.5 font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer"
              >
                Send Instructions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
