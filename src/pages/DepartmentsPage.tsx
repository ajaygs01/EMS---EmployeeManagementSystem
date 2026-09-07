import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Users,
  DollarSign,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Search,
  CheckCircle,
  TrendingUp,
  X
} from "lucide-react";
import { Department, Employee } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DepartmentModal } from "../components/DepartmentModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";

interface DepartmentsPageProps {
  onNavigate: (path: string) => void;
  onSelectEmployee?: (id: string) => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({ onNavigate, onSelectEmployee }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Department Employees Viewer Modal
  const [viewingDept, setViewingDept] = useState<Department | null>(null);
  const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
  const [loadingDeptEmps, setLoadingDeptEmps] = useState(false);

  const canManage = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.getDepartments();
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenDeptEmployees = async (dept: Department) => {
    try {
      setViewingDept(dept);
      setLoadingDeptEmps(true);
      const res = await api.getDepartmentEmployees(dept.id);
      if (res.success) {
        setDeptEmployees(res.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load department employees", "error");
    } finally {
      setLoadingDeptEmps(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteDepartment(deletingDept.id);
      if (res.success) {
        showToast("Department deleted successfully", "success");
        setDeletingDept(null);
        fetchDepartments();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete department", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployeesCount = departments.reduce((acc, d) => acc + (d.employeeCount || 0), 0);
  const totalBudget = departments.reduce((acc, d) => acc + (d.budget || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 dark:bg-orange-950/60 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            Departments & Units
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
            Organizational hierarchy, business divisions, team leaders, and operational budgets
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center gap-2 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* KPI Stats Bar with 3D Depth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Total Divisions</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{departments.length}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Assigned Workforce</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5">{totalEmployeesCount}</div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md flex items-center gap-3.5 hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-sans">Total Annual Budget</div>
            <div className="text-xl sm:text-2xl font-black font-display text-zinc-900 dark:text-white mt-0.5 font-mono">
              ${(totalBudget / 1000).toFixed(0)}k
            </div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl p-4 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search departments by name, code, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-sans"
          />
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading departments...</p>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-zinc-200/90 dark:border-zinc-800/90 shadow-md">
          <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold font-display text-zinc-900 dark:text-white">No departments found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((dept) => (
            <div
              key={dept.id}
              className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-md hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.15)] hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold font-display text-base text-zinc-900 dark:text-white">{dept.name}</h3>
                      <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                      {dept.description}
                    </p>
                  </div>
                  <StatusBadge status={dept.status} size="sm" />
                </div>

                <div className="space-y-2 py-3 border-t border-b border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Head of Department:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {dept.managerName || "Unassigned"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Staff Count:</span>
                    <span className="font-bold font-mono text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                      {dept.employeeCount} Members
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Annual Budget:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      ${dept.budget.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Location:
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{dept.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-1 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenDeptEmployees(dept)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> View Members ({dept.employeeCount})
                </button>

                {canManage && (
                  <>
                    <button
                      onClick={() => setEditingDept(dept)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Edit Department"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingDept(dept)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Department"
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

      {/* Department Employees Roster Modal */}
      <Modal
        isOpen={!!viewingDept}
        onClose={() => setViewingDept(null)}
        title={`${viewingDept?.name} (${viewingDept?.code}) - Team Members`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span>Location: {viewingDept?.location}</span>
            <span>Department Head: {viewingDept?.managerName || "Unassigned"}</span>
          </div>

          {loadingDeptEmps ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-400">Loading team members...</p>
            </div>
          ) : deptEmployees.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">No employees currently assigned to this department.</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-96 overflow-y-auto">
              {deptEmployees.map((emp) => (
                <div key={emp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={emp.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                    <div>
                      <div
                        onClick={() => {
                          setViewingDept(null);
                          if (onSelectEmployee) onSelectEmployee(emp.id);
                          onNavigate(`/employees/${emp.id}`);
                        }}
                        className="font-bold text-zinc-900 dark:text-white hover:text-orange-500 cursor-pointer"
                      >
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-zinc-400">{emp.position} • {emp.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={emp.status} size="sm" />
                    <button
                      onClick={() => {
                        setViewingDept(null);
                        if (onSelectEmployee) onSelectEmployee(emp.id);
                        onNavigate(`/employees/${emp.id}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-500/20 transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Create / Edit Department Modal */}
      <DepartmentModal
        isOpen={isCreateOpen || !!editingDept}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingDept(null);
        }}
        initialData={editingDept}
        onSuccess={() => {
          showToast(
            editingDept ? "Department updated successfully" : "Department created successfully",
            "success"
          );
          fetchDepartments();
        }}
      />

      {/* Delete Department Confirmation */}
      <ConfirmModal
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete ${deletingDept?.name}? All attached assignments will need to be reallocated.`}
        confirmText="Delete Department"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
