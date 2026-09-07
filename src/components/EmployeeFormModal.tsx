import React, { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Employee, Department, UserRole } from "../types";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import { Sparkles, User, Briefcase, PhoneCall, Image as ImageIcon } from "lucide-react";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  initialData?: Employee | null;
  departments?: Department[];
  employees?: Employee[];
  onSuccess: () => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
];

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  employee: propEmployee,
  initialData,
  departments: propDepartments,
  employees: propEmployees,
  onSuccess
}) => {
  const targetEmployee = propEmployee || initialData || null;
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>(propDepartments || []);
  const [employeesList, setEmployeesList] = useState<Employee[]>(propEmployees || []);
  const [designationsList, setDesignationsList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "Male" as "Male" | "Female" | "Other",
    dob: "1994-05-15",
    address: "Level 4, Embassy Tech Village, Outer Ring Road",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    departmentId: "",
    position: "",
    role: "Employee" as UserRole,
    joiningDate: new Date().toISOString().split("T")[0],
    employmentType: "Full-Time" as "Full-Time" | "Part-Time" | "Contract" | "Internship",
    managerId: "",
    salary: 1200000,
    status: "Active" as "Active" | "Inactive" | "On Leave" | "Probation",
    emergencyContactName: "Family Contact",
    emergencyContactRelationship: "Spouse",
    emergencyContactPhone: "+91 98765 43210",
    avatar: AVATAR_PRESETS[0],
    notes: ""
  });

  // Fetch departments & employees if not provided in props
  useEffect(() => {
    if (isOpen) {
      if (!propDepartments || propDepartments.length === 0) {
        api.getDepartments().then((res) => {
          if (res.success) setDepartments(res.data);
        }).catch(() => {});
      } else {
        setDepartments(propDepartments);
      }

      if (!propEmployees || propEmployees.length === 0) {
        api.getEmployees({ limit: 200 }).then((res) => {
          if (res.success) setEmployeesList(res.data);
        }).catch(() => {});
      } else {
        setEmployeesList(propEmployees);
      }

      api.getDesignations().then((res) => {
        if (res.success) setDesignationsList(res.data);
      }).catch(() => {});
    }
  }, [isOpen, propDepartments, propEmployees]);

  useEffect(() => {
    if (targetEmployee) {
      setFormData({
        employeeId: targetEmployee.employeeId || "",
        firstName: targetEmployee.firstName || "",
        lastName: targetEmployee.lastName || "",
        email: targetEmployee.email || "",
        phone: targetEmployee.phone || "+91 98765 43210",
        gender: targetEmployee.gender || "Male",
        dob: targetEmployee.dob || "1994-05-15",
        address: targetEmployee.address || "Tech Park",
        city: targetEmployee.city || "Bengaluru",
        state: targetEmployee.state || "Karnataka",
        country: targetEmployee.country || "India",
        departmentId: targetEmployee.departmentId || (departments[0]?.id || ""),
        position: targetEmployee.position || "",
        role: targetEmployee.role || "Employee",
        joiningDate: targetEmployee.joiningDate || new Date().toISOString().split("T")[0],
        employmentType: targetEmployee.employmentType || "Full-Time",
        managerId: targetEmployee.managerId || "",
        salary: targetEmployee.salary || 1200000,
        status: targetEmployee.status || "Active",
        emergencyContactName: targetEmployee.emergencyContact?.name || "Family Contact",
        emergencyContactRelationship: targetEmployee.emergencyContact?.relationship || "Spouse",
        emergencyContactPhone: targetEmployee.emergencyContact?.phone || targetEmployee.phone || "+91 98765 43210",
        avatar: targetEmployee.avatar || AVATAR_PRESETS[0],
        notes: targetEmployee.notes || ""
      });
    } else {
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "+91 98765 43210",
        gender: "Male",
        dob: "1994-05-15",
        address: "Level 4, Embassy Tech Village, Outer Ring Road",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        departmentId: departments[0]?.id || "",
        position: "",
        role: "Employee",
        joiningDate: new Date().toISOString().split("T")[0],
        employmentType: "Full-Time",
        managerId: "",
        salary: 1200000,
        status: "Active",
        emergencyContactName: "Family Contact",
        emergencyContactRelationship: "Spouse",
        emergencyContactPhone: "+91 98765 43210",
        avatar: AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)],
        notes: ""
      });
    }
  }, [targetEmployee, departments, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.position.trim()) {
      error("Please fill in First Name, Last Name, Email, and Job Title.");
      return;
    }

    const selectedDeptId = formData.departmentId || departments[0]?.id;
    if (!selectedDeptId) {
      error("Please select a valid Department.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        departmentId: selectedDeptId,
        emergencyContact: {
          name: formData.emergencyContactName || "Primary Contact",
          relationship: formData.emergencyContactRelationship || "Family",
          phone: formData.emergencyContactPhone || formData.phone
        }
      };

      if (targetEmployee) {
        await api.updateEmployee(targetEmployee.id, payload);
        success("Employee profile updated successfully.");
      } else {
        await api.createEmployee(payload);
        success("New employee added and credentials provisioned.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || "Failed to save employee profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={targetEmployee ? "Edit Employee Profile" : "Add New Employee"}
      subtitle="Complete all mandatory personal, employment, and emergency contact details."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
        {/* SECTION 1: Personal Details */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-4 card-3d">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-xs border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <User className="w-4 h-4 text-orange-500" />
            <span>1. Personal Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Jordan"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Hayes"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other / Non-Binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jordan.hayes@bharatcorp.in"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Flat 402, Shantiniketan Apts, Indiranagar"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Bengaluru"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Karnataka"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="India"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Profile Avatar Selection */}
            <div className="sm:col-span-3 pt-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Profile Photo (Select preset or enter custom image URL)
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={formData.avatar}
                  alt="Preview"
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-orange-500 shadow-md shadow-orange-500/20"
                />
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
                />
                <div className="flex items-center gap-1.5">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <img
                      key={idx}
                      src={preset}
                      alt=""
                      onClick={() => setFormData({ ...formData, avatar: preset })}
                      className={`w-8 h-8 rounded-xl object-cover cursor-pointer border hover:scale-110 transition-transform ${
                        formData.avatar === preset ? "border-orange-500 ring-2 ring-orange-500/50 shadow-md shadow-orange-500/30" : "border-zinc-300 dark:border-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Employment Details */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-4 card-3d">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-xs border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <Briefcase className="w-4 h-4 text-orange-500" />
            <span>2. Employment Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Employee ID <span className="text-[10px] text-zinc-400 font-normal">(Leave blank to auto-generate)</span>
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="e.g. EMP-001"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department *</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Designation / Job Title *</label>
              <input
                type="text"
                required
                list="designations-datalist"
                value={formData.position}
                onChange={(e) => {
                  const val = e.target.value;
                  const matchingDesig = designationsList.find((d) => d.title.toLowerCase() === val.toLowerCase());
                  if (matchingDesig) {
                    setFormData((prev) => ({
                      ...prev,
                      position: val,
                      departmentId: prev.departmentId || matchingDesig.departmentId
                    }));
                  } else {
                    setFormData((prev) => ({ ...prev, position: val }));
                  }
                }}
                placeholder="e.g. Senior Software Architect"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
              <datalist id="designations-datalist">
                {designationsList.map((desig) => (
                  <option key={desig.id} value={desig.title}>
                    {desig.departmentName} ({desig.designationId})
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">System Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="HR Admin">HR Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Reporting Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              >
                <option value="">None / Direct to Executive</option>
                {employeesList
                  .filter((e) => !targetEmployee || e.id !== targetEmployee.id)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.position})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Annual CTC (₹ INR / LPA)</label>
              <input
                type="number"
                min="0"
                step="50000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              >
                <option value="Active">Active</option>
                <option value="Probation">Probation</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Emergency Contact */}
        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-4 card-3d">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-xs border-b border-zinc-200 dark:border-zinc-700 pb-2">
            <PhoneCall className="w-4 h-4 text-orange-500" />
            <span>3. Emergency Contact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Contact Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                placeholder="e.g. Sunita Sharma"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Relationship</label>
              <input
                type="text"
                value={formData.emergencyContactRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                placeholder="e.g. Spouse / Parent / Relative"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {targetEmployee ? "Save Changes" : "Create & Provision Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
