import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  Building,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  RefreshCw,
  ShieldAlert
} from "lucide-react";
import { Designation, Department } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Modal } from "../components/Modal";
import { ConfirmModal } from "../components/ConfirmModal";
import { formatINR } from "../utils/formatters";

interface DesignationsPageProps {
  onNavigate: (path: string) => void;
}

export const DesignationsPage: React.FC<DesignationsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [deletingDesignation, setDeletingDesignation] = useState<Designation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    departmentId: "",
    description: "",
    minSalary: 800000,
    maxSalary: 1600000,
    status: "Active" as "Active" | "Inactive"
  });

  const canManage = user?.role === "Super Admin" || user?.role === "HR Admin";

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const [desigRes, deptRes] = await Promise.all([
        api.getDesignations({ search, departmentId: selectedDept, status: selectedStatus }),
        api.getDepartments()
      ]);

      if (desigRes.success) setDesignations(desigRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
    } catch (err: any) {
      error(err.message || "Failed to load designations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, [search, selectedDept, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingDesignation(null);
    setFormData({
      title: "",
      departmentId: departments[0]?.id || "",
      description: "",
      minSalary: 800000,
      maxSalary: 1600000,
      status: "Active"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (desig: Designation) => {
    setEditingDesignation(desig);
    setFormData({
      title: desig.title,
      departmentId: desig.departmentId,
      description: desig.description,
      minSalary: desig.minSalary,
      maxSalary: desig.maxSalary,
      status: desig.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error("Designation title is required.");
      return;
    }
    if (!formData.departmentId) {
      error("Please select a department.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingDesignation) {
        await api.updateDesignation(editingDesignation.id, formData);
        success(`Designation "${formData.title}" updated successfully.`);
      } else {
        await api.createDesignation(formData);
        success(`Designation "${formData.title}" added successfully.`);
      }
      setIsModalOpen(false);
      fetchDesignations();
    } catch (err: any) {
      error(err.message || "Failed to save designation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDesignation) return;
    try {
      setIsSubmitting(true);
      await api.deleteDesignation(deletingDesignation.id);
      success(`Designation "${deletingDesignation.title}" removed.`);
      setDeletingDesignation(null);
      fetchDesignations();
    } catch (err: any) {
      error(err.message || "Failed to delete designation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Designations & Job Roles</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
              {designations.length} Roles
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Define corporate job bands, designations, reporting departments, and salary ranges.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Designation
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role, department, code..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs">
            <Building className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            onClick={fetchDesignations}
            title="Refresh"
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Designations Table */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3.5">Designation ID</th>
                <th className="px-5 py-3.5">Role Title & Description</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Compensation Band</th>
                <th className="px-5 py-3.5 text-center">Assigned Employees</th>
                <th className="px-5 py-3.5">Status</th>
                {canManage && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading designations...
                  </td>
                </tr>
              ) : designations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-400">
                    <Briefcase className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">No designations found</p>
                    <p className="text-xs text-zinc-500 mt-1">Try refining your search or add a new job designation.</p>
                  </td>
                </tr>
              ) : (
                designations.map((desig) => (
                  <tr
                    key={desig.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
                      {desig.designationId}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">{desig.title}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-sm mt-0.5">
                        {desig.description}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                        <Building className="w-3 h-3 text-zinc-400" />
                        {desig.departmentName}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                        {formatINR(desig.minSalary)} - {formatINR(desig.maxSalary)}
                      </div>
                      <span className="text-[10px] text-zinc-500">Per Annum CTC</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 text-xs font-semibold">
                        <Users className="w-3 h-3" />
                        {desig.employeeCount || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          desig.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {desig.status === "Active" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {desig.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(desig)}
                            title="Edit Designation"
                            className="p-1.5 text-zinc-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingDesignation(desig)}
                            title="Delete Designation"
                            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDesignation ? `Edit Designation: ${editingDesignation.title}` : "Create Job Designation"}
        subtitle="Specify role hierarchy, department placement, and standard salary limits."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Designation Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Machine Learning Engineer"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Department *
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Minimum Annual CTC (₹)
              </label>
              <input
                type="number"
                value={formData.minSalary}
                onChange={(e) => setFormData({ ...formData, minSalary: Number(e.target.value) })}
                step="50000"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Maximum Annual CTC (₹)
              </label>
              <input
                type="number"
                value={formData.maxSalary}
                onChange={(e) => setFormData({ ...formData, maxSalary: Number(e.target.value) })}
                step="50000"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description & Key Responsibilities
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline the scope, objectives, and domain competencies for this role..."
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
                  name="status"
                  checked={formData.status === "Active"}
                  onChange={() => setFormData({ ...formData, status: "Active" })}
                  className="text-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formData.status === "Inactive"}
                  onChange={() => setFormData({ ...formData, status: "Inactive" })}
                  className="text-orange-500"
                />
                <span className="text-zinc-700 dark:text-zinc-300">Inactive</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-md shadow-orange-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : editingDesignation ? "Update Designation" : "Create Designation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingDesignation}
        onClose={() => setDeletingDesignation(null)}
        onConfirm={handleDelete}
        title="Delete Designation"
        message={`Are you sure you want to delete designation "${deletingDesignation?.title}" (${deletingDesignation?.designationId})? This action cannot be reversed.`}
        confirmText="Delete Role"
        isDestructive
        isLoading={isSubmitting}
      />
    </div>
  );
};
