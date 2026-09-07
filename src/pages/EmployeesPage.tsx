import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  CheckCircle,
  Briefcase,
  UserCheck,
  ArrowUpDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Employee, Department } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatusBadge } from "../components/StatusBadge";
import { EmployeeFormModal } from "../components/EmployeeFormModal";
import { BulkImportModal } from "../components/BulkImportModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { formatINR, formatLPA } from "../utils/formatters";

interface EmployeesPageProps {
  onNavigate: (path: string) => void;
  onSelectEmployee?: (id: string) => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ onNavigate, onSelectEmployee }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Filters
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<"employeeId" | "firstName" | "joiningDate" | "salary">("employeeId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = user?.role === "Super Admin" || user?.role === "HR Admin";
  const canViewSalary = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.getEmployees({
          search,
          departmentId: selectedDept,
          status: selectedStatus,
          role: selectedRole,
          employmentType: selectedEmploymentType,
          sortBy,
          sortOrder
        }),
        api.getDepartments()
      ]);

      if (empRes.success) {
        setEmployees(empRes.data);
      }
      if (deptRes.success) {
        setDepartments(deptRes.data);
      }
    } catch (err: any) {
      error(err.message || "Failed to load employee records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept, selectedStatus, selectedRole, selectedEmploymentType, sortBy, sortOrder]);

  const handleDeleteConfirm = async () => {
    if (!deletingEmployee) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteEmployee(deletingEmployee.id);
      if (res.success) {
        success(`Employee ${deletingEmployee.firstName} ${deletingEmployee.lastName} removed.`);
        setDeletingEmployee(null);
        fetchEmployees();
      }
    } catch (err: any) {
      error(err.message || "Failed to delete employee.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (emp: Employee, newStatus: "Active" | "Inactive" | "On Leave" | "Probation") => {
    if (!canManage) return;
    try {
      const res = await api.updateEmployeeStatus(emp.id, newStatus);
      if (res.success) {
        success(`Status updated to ${newStatus} for ${emp.firstName} ${emp.lastName}.`);
        fetchEmployees();
      }
    } catch (err: any) {
      error(err.message || "Failed to update status.");
    }
  };

  const handleExportCSV = () => {
    if (employees.length === 0) {
      error("No employee data available to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Gender",
      "Department",
      "Designation",
      "System Role",
      "Employment Type",
      ...(canViewSalary ? ["Salary (INR / LPA)"] : []),
      "Status",
      "Joining Date",
      "Address",
      "City",
      "State",
      "Emergency Contact Name",
      "Emergency Contact Relationship",
      "Emergency Contact Phone"
    ];

    const rows = employees.map((e) => [
      `"${e.employeeId}"`,
      `"${e.firstName}"`,
      `"${e.lastName}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      `"${e.gender}"`,
      `"${e.departmentName}"`,
      `"${e.position}"`,
      `"${e.role}"`,
      `"${e.employmentType}"`,
      ...(canViewSalary ? [e.salary] : []),
      `"${e.status}"`,
      `"${e.joiningDate}"`,
      `"${e.address || ""}"`,
      `"${e.city || ""}"`,
      `"${e.state || ""}"`,
      `"${e.emergencyContact?.name || ""}"`,
      `"${e.emergencyContact?.relationship || ""}"`,
      `"${e.emergencyContact?.phone || ""}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_roster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Employee roster exported to CSV.");
  };

  const toggleSort = (field: "employeeId" | "firstName" | "joiningDate" | "salary") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Stats summary counts
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
  const probationCount = employees.filter((e) => e.status === "Probation").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            Employee Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Directory, profiles, departmental placement, and personnel operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <>
              <button
                onClick={() => setIsBulkImportOpen(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-orange-500" />
                <span>Bulk Import CSV</span>
              </button>

              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Bar with 3D Depth */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Total Staff</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Active</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">On Leave</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{onLeaveCount}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Probation</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{probationCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, employee ID, email, role, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
          >
            <option value="">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="HR Admin">HR Admin</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
          </select>

          {/* Employment Type Filter */}
          <select
            value={selectedEmploymentType}
            onChange={(e) => setSelectedEmploymentType(e.target.value)}
            className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 font-sans"
          >
            <option value="">All Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-xl shrink-0 border border-zinc-200/80 dark:border-zinc-800">
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-orange-500 text-white shadow-sm font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-orange-500 text-white shadow-sm font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content: Table vs Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading employees database...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800/80">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No matching employees found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new employee to the database.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* Mandatory Table View with All Columns */
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-sans">Photo</th>
                  <th
                    onClick={() => toggleSort("employeeId")}
                    className="py-3.5 px-4 cursor-pointer hover:text-orange-500 transition-colors font-sans"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Employee ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("firstName")}
                    className="py-3.5 px-4 cursor-pointer hover:text-orange-500 transition-colors font-sans"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-sans">Email</th>
                  <th className="py-3.5 px-4 font-sans">Department</th>
                  <th className="py-3.5 px-4 font-sans">Designation</th>
                  <th
                    onClick={() => toggleSort("joiningDate")}
                    className="py-3.5 px-4 cursor-pointer hover:text-orange-500 transition-colors font-sans"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Joining Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  {canViewSalary && (
                    <th
                      onClick={() => toggleSort("salary")}
                      className="py-3.5 px-4 cursor-pointer hover:text-orange-500 transition-colors font-sans"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Salary</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  )}
                  <th className="py-3.5 px-4 font-sans">Status</th>
                  <th className="py-3.5 px-4 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-zinc-700 dark:text-zinc-200">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-orange-500/[0.03] dark:hover:bg-zinc-900/60 transition-colors">
                    {/* Photo */}
                    <td className="py-3 px-4">
                      <img
                        src={emp.avatar}
                        alt={`${emp.firstName} ${emp.lastName}`}
                        className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      />
                    </td>

                    {/* Employee ID */}
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {emp.employeeId}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => {
                          if (onSelectEmployee) onSelectEmployee(emp.id);
                          onNavigate(`/employees/${emp.id}`);
                        }}
                        className="font-bold text-zinc-900 dark:text-white hover:text-orange-500 cursor-pointer font-sans"
                      >
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-medium">{emp.role}</div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                      {emp.email}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {emp.departmentName}
                    </td>

                    {/* Designation */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {emp.position}
                    </td>

                    {/* Joining Date */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {emp.joiningDate}
                    </td>

                    {/* Salary (if privileged) */}
                    {canViewSalary && (
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatLPA(emp.salary || 0)}
                      </td>
                    )}

                    {/* Status with Quick Toggle for Admins */}
                    <td className="py-3 px-4">
                      {canManage ? (
                        <select
                          value={emp.status}
                          onChange={(e) => handleStatusChange(emp, e.target.value as any)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            emp.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : emp.status === "On Leave"
                              ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                              : emp.status === "Probation"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          <option value="Active">Active</option>
                          <option value="Probation">Probation</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : (
                        <StatusBadge status={emp.status} size="sm" />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (onSelectEmployee) onSelectEmployee(emp.id);
                            onNavigate(`/employees/${emp.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => setEditingEmployee(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Employee"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingEmployee(emp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View with 3D Floating Effect */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="group bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)] hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      alt={`${emp.firstName} ${emp.lastName}`}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-orange-500/20 shadow-sm"
                    />
                    <div>
                      <h3
                        onClick={() => {
                          if (onSelectEmployee) onSelectEmployee(emp.id);
                          onNavigate(`/employees/${emp.id}`);
                        }}
                        className="font-bold font-display text-sm text-zinc-900 dark:text-white group-hover:text-orange-500 cursor-pointer transition-colors"
                      >
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium font-sans">
                        {emp.position}
                      </div>
                      <div className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-bold mt-0.5">
                        {emp.employeeId}
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={emp.status} size="sm" />
                </div>

                <div className="space-y-2 py-3 border-t border-b border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> Department:
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                      {emp.departmentName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email:
                    </span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate max-w-[170px]">
                      {emp.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {emp.phone}
                    </span>
                  </div>

                  {canViewSalary && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> CTC / Salary:
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {formatLPA(emp.salary || 0)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-1 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (onSelectEmployee) onSelectEmployee(emp.id);
                    onNavigate(`/employees/${emp.id}`);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Profile
                </button>

                {canManage && (
                  <>
                    <button
                      onClick={() => setEditingEmployee(emp)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Employee"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingEmployee(emp)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={isCreateOpen || !!editingEmployee}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
        departments={departments}
        employees={employees}
        onSuccess={() => {
          fetchEmployees();
        }}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        departments={departments}
        onSuccess={() => {
          fetchEmployees();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Record"
        message={`Are you sure you want to permanently delete employee ${deletingEmployee?.firstName} ${deletingEmployee?.lastName} (${deletingEmployee?.employeeId})? Their user account, attendance records, and leave balance will be updated.`}
        confirmText="Yes, Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
