import { Router } from "express";
import { getDb, saveDb, IEmployee, IUser, logAuditEvent } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/employees - Get all employees with filtering, searching, sorting & pagination
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    let employees = [...db.employees];

    const { department, departmentId, status, role, employmentType, search, sortBy, sortOrder, page = "1", limit = "200" } = req.query;

    // Filters
    const targetDept = (departmentId || department) as string;
    if (targetDept && targetDept !== "all") {
      employees = employees.filter((e) => e.departmentId === targetDept || e.departmentName.toLowerCase() === targetDept.toLowerCase());
    }
    if (status && status !== "all") {
      employees = employees.filter((e) => e.status.toLowerCase() === (status as string).toLowerCase());
    }
    if (role && role !== "all") {
      employees = employees.filter((e) => e.role.toLowerCase() === (role as string).toLowerCase());
    }
    if (employmentType && employmentType !== "all") {
      employees = employees.filter((e) => e.employmentType.toLowerCase() === (employmentType as string).toLowerCase());
    }

    // Search (name, email, employeeId, position, department, phone)
    if (search) {
      const q = (search as string).toLowerCase().trim();
      employees = employees.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.phone.includes(q)
      );
    }

    // Sorting
    if (sortBy) {
      const field = sortBy as keyof IEmployee;
      const order = sortOrder === "desc" ? -1 : 1;
      employees.sort((a, b) => {
        if (field === "salary") {
          return (Number(a.salary) - Number(b.salary)) * order;
        }
        if (field === "joiningDate") {
          return (new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime()) * order;
        }
        const valA = a[field] ?? "";
        const valB = b[field] ?? "";
        if (typeof valA === "number" && typeof valB === "number") {
          return (valA - valB) * order;
        }
        return String(valA).localeCompare(String(valB)) * order;
      });
    } else {
      // Default sort by employee ID
      employees.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
    }

    const total = employees.length;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedEmployees = employees.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: paginatedEmployees,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/employees/:id - Get single employee details with relations
router.get("/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const employee = db.employees.find((e) => e.id === id || e.employeeId === id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Related data for profile tabs
    const attendance = db.attendance.filter((a) => a.employeeId === employee.id).slice(-30);
    const leaves = db.leaves.filter((l) => l.employeeId === employee.id);
    const leaveBalance = db.leaveBalances[employee.id] || null;
    const payrolls = db.payrolls.filter((p) => p.employeeId === employee.id);
    const performances = db.performances.filter((p) => p.employeeId === employee.id);
    const tasks = db.tasks.filter((t) => t.assignedEmployeeId === employee.id);
    const documents = db.documents.filter((d) => d.employeeId === employee.id);

    return res.json({
      success: true,
      data: {
        ...employee,
        related: {
          attendance,
          leaves,
          leaveBalance,
          payrolls,
          performances,
          tasks,
          documents
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/employees - Add new employee
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const {
      employeeId: customEmpId,
      firstName,
      lastName,
      email,
      phone,
      gender = "Other",
      dob,
      address,
      city,
      state,
      country = "United States",
      departmentId,
      position,
      role = "Employee",
      joiningDate,
      employmentType = "Full-Time",
      managerId,
      salary = 60000,
      status = "Active",
      emergencyContact,
      avatar,
      notes
    } = req.body;

    if (!firstName || !lastName || !email || !position || !departmentId) {
      return res.status(400).json({ success: false, message: "First name, last name, email, department, and designation/position are required." });
    }

    const db = getDb();
    const existingEmail = db.employees.find((e) => e.email.toLowerCase() === email.toLowerCase().trim());
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "An employee with this email already exists." });
    }

    // Determine Employee ID
    let finalEmpId = customEmpId ? customEmpId.trim().toUpperCase() : "";
    if (finalEmpId) {
      const existingId = db.employees.find((e) => e.employeeId.toUpperCase() === finalEmpId);
      if (existingId) {
        return res.status(400).json({ success: false, message: `Employee ID "${finalEmpId}" is already assigned to another employee. Please provide a unique ID.` });
      }
    } else {
      const maxNum = db.employees.reduce((max, e) => {
        const match = e.employeeId.match(/EMP-?(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 100);
      finalEmpId = `EMP-${maxNum + 1}`;
    }

    const dept = db.departments.find((d) => d.id === departmentId || d.name.toLowerCase() === departmentId.toLowerCase());
    const departmentName = dept ? dept.name : "General";
    const deptId = dept ? dept.id : departmentId;

    let managerName: string | null = null;
    if (managerId) {
      const mgr = db.employees.find((e) => e.id === managerId || e.employeeId === managerId);
      if (mgr) managerName = `${mgr.firstName} ${mgr.lastName}`;
    }

    const newId = `emp-${Date.now()}`;

    const newEmployee: IEmployee = {
      id: newId,
      employeeId: finalEmpId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || "+1 (555) 000-0000",
      gender: gender || "Other",
      dob: dob || "1995-01-01",
      address: address || "Corporate Park",
      city: city || "San Francisco",
      state: state || "CA",
      country: country || "United States",
      departmentId: deptId,
      departmentName,
      position: position.trim(),
      role: (role as any) || "Employee",
      joiningDate: joiningDate || new Date().toISOString().split("T")[0],
      employmentType: (employmentType as any) || "Full-Time",
      managerId: managerId || null,
      managerName,
      salary: Number(salary) || 60000,
      status: (status as any) || "Active",
      emergencyContact: emergencyContact || {
        name: "Primary Contact",
        relationship: "Family",
        phone: phone || "+1 (555) 000-0000"
      },
      avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      notes: notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.employees.push(newEmployee);

    // Update department employeeCount
    if (dept) {
      dept.employeeCount = db.employees.filter((e) => e.departmentId === dept.id).length;
    }

    // Initialize leave balance
    db.leaveBalances[newId] = {
      employeeId: newId,
      casualLeave: { total: 12, used: 0 },
      sickLeave: { total: 10, used: 0 },
      earnedLeave: { total: 15, used: 0 },
      emergencyLeave: { total: 5, used: 0 },
      maternityLeave: { total: 90, used: 0 },
      paternityLeave: { total: 14, used: 0 },
      unpaidLeave: { total: 30, used: 0 }
    };

    // Create user login account if not exists
    const defaultPasswordHash = bcrypt.hashSync("Employee@123", 10);
    const newUser: IUser = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      passwordHash: defaultPasswordHash,
      role: newEmployee.role,
      employeeId: newId,
      name: `${firstName.trim()} ${lastName.trim()}`,
      avatar: newEmployee.avatar,
      status: newEmployee.status === "Inactive" ? "Inactive" : "Active",
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);

    // Log Audit Event
    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "EMPLOYEE_CREATED",
      resource: "Employee",
      resourceId: newId,
      details: `Created new employee profile: ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.employeeId}) in ${newEmployee.departmentName} as ${newEmployee.position}.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    await saveDb();

    return res.status(201).json({
      success: true,
      message: `Employee ${newEmployee.firstName} ${newEmployee.lastName} (${newEmployee.employeeId}) added successfully. Login account provisioned.`,
      data: newEmployee
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/employees/:id - Update employee
router.put("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const employee = db.employees.find((e) => e.id === id || e.employeeId === id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const {
      employeeId: customEmpId,
      firstName,
      lastName,
      email,
      phone,
      gender,
      dob,
      address,
      city,
      state,
      country,
      departmentId,
      position,
      role,
      joiningDate,
      employmentType,
      managerId,
      salary,
      status,
      emergencyContact,
      avatar,
      notes
    } = req.body;

    // Uniqueness validation if employeeId is changed
    if (customEmpId && customEmpId.trim().toUpperCase() !== employee.employeeId.toUpperCase()) {
      const existingId = db.employees.find((e) => e.id !== employee.id && e.employeeId.toUpperCase() === customEmpId.trim().toUpperCase());
      if (existingId) {
        return res.status(400).json({ success: false, message: `Employee ID "${customEmpId}" is already taken.` });
      }
      employee.employeeId = customEmpId.trim().toUpperCase();
    }

    // Uniqueness validation if email changed
    if (email && email.trim().toLowerCase() !== employee.email.toLowerCase()) {
      const existingEmail = db.employees.find((e) => e.id !== employee.id && e.email.toLowerCase() === email.trim().toLowerCase());
      if (existingEmail) {
        return res.status(400).json({ success: false, message: `Email "${email}" is already used by another employee.` });
      }
      employee.email = email.trim().toLowerCase();
    }

    if (departmentId && departmentId !== employee.departmentId) {
      const dept = db.departments.find((d) => d.id === departmentId || d.name.toLowerCase() === departmentId.toLowerCase());
      if (dept) {
        employee.departmentId = dept.id;
        employee.departmentName = dept.name;
      }
    }

    if (managerId !== undefined) {
      employee.managerId = managerId || null;
      if (managerId) {
        const mgr = db.employees.find((e) => e.id === managerId || e.employeeId === managerId);
        employee.managerName = mgr ? `${mgr.firstName} ${mgr.lastName}` : null;
      } else {
        employee.managerName = null;
      }
    }

    const oldRole = employee.role;
    const oldStatus = employee.status;

    if (firstName) employee.firstName = firstName.trim();
    if (lastName) employee.lastName = lastName.trim();
    if (phone) employee.phone = phone;
    if (gender) employee.gender = gender;
    if (dob) employee.dob = dob;
    if (address) employee.address = address;
    if (city) employee.city = city;
    if (state) employee.state = state;
    if (country) employee.country = country;
    if (position) employee.position = position.trim();
    if (role) employee.role = role;
    if (joiningDate) employee.joiningDate = joiningDate;
    if (employmentType) employee.employmentType = employmentType;
    if (salary !== undefined) employee.salary = Number(salary);
    if (status) employee.status = status;
    if (emergencyContact) employee.emergencyContact = emergencyContact;
    if (avatar) employee.avatar = avatar;
    if (notes !== undefined) employee.notes = notes;
    employee.updatedAt = new Date().toISOString();

    // Sync corresponding user account if exists
    const user = db.users.find((u) => u.employeeId === employee.id);
    if (user) {
      user.name = `${employee.firstName} ${employee.lastName}`;
      user.email = employee.email;
      user.role = employee.role;
      user.avatar = employee.avatar;
      user.status = employee.status === "Inactive" ? "Inactive" : "Active";
    }

    // Refresh department employee counts
    db.departments.forEach((d) => {
      d.employeeCount = db.employees.filter((e) => e.departmentId === d.id).length;
    });

    // Audit logs
    if (role && role !== oldRole) {
      await logAuditEvent({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        userEmail: req.user!.email,
        action: "EMPLOYEE_ROLE_CHANGED",
        resource: "Employee",
        resourceId: employee.id,
        details: `Updated role for ${employee.firstName} ${employee.lastName} from "${oldRole}" to "${role}".`,
        ipAddress: req.ip || "127.0.0.1"
      });
    }

    if (status && status !== oldStatus) {
      await logAuditEvent({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        userEmail: req.user!.email,
        action: "EMPLOYEE_STATUS_CHANGED",
        resource: "Employee",
        resourceId: employee.id,
        details: `Updated status for ${employee.firstName} ${employee.lastName} from "${oldStatus}" to "${status}".`,
        ipAddress: req.ip || "127.0.0.1"
      });
    }

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "EMPLOYEE_UPDATED",
      resource: "Employee",
      resourceId: employee.id,
      details: `Updated profile details for employee ${employee.firstName} ${employee.lastName} (${employee.employeeId}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    await saveDb();

    return res.json({
      success: true,
      message: "Employee profile updated successfully.",
      data: employee
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/employees/:id/status - Quick activate / deactivate / status toggle
router.patch("/:id/status", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const { status } = req.body;

    if (!status || !["Active", "Inactive", "On Leave", "Probation"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status ('Active', 'Inactive', 'On Leave', 'Probation') is required." });
    }

    const employee = db.employees.find((e) => e.id === id || e.employeeId === id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const oldStatus = employee.status;
    employee.status = status;
    employee.updatedAt = new Date().toISOString();

    // Sync user login status
    const user = db.users.find((u) => u.employeeId === employee.id);
    if (user) {
      user.status = status === "Inactive" ? "Inactive" : "Active";
    }

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "EMPLOYEE_STATUS_CHANGED",
      resource: "Employee",
      resourceId: employee.id,
      details: `Changed status of ${employee.firstName} ${employee.lastName} (${employee.employeeId}) from ${oldStatus} to ${status}.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    await saveDb();

    return res.json({
      success: true,
      message: `Employee status changed to ${status}.`,
      data: employee
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/employees/bulk-import - Bulk import employees from CSV data
router.post("/bulk-import", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const { employees: importedList } = req.body;

    if (!Array.isArray(importedList) || importedList.length === 0) {
      return res.status(400).json({ success: false, message: "A non-empty list of employees to import is required." });
    }

    const db = getDb();
    const successful: IEmployee[] = [];
    const errors: { row: number; email: string; name: string; error: string }[] = [];

    const defaultPasswordHash = bcrypt.hashSync("Employee@123", 10);

    for (let i = 0; i < importedList.length; i++) {
      const item = importedList[i];
      const rowNum = i + 1;

      if (!item.firstName || !item.lastName || !item.email) {
        errors.push({
          row: rowNum,
          email: item.email || "N/A",
          name: `${item.firstName || ""} ${item.lastName || ""}`.trim() || "N/A",
          error: "Missing required First Name, Last Name, or Email."
        });
        continue;
      }

      const cleanEmail = item.email.trim().toLowerCase();

      // Check duplicate email
      const emailExists = db.employees.some((e) => e.email.toLowerCase() === cleanEmail) || successful.some((e) => e.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        errors.push({
          row: rowNum,
          email: cleanEmail,
          name: `${item.firstName} ${item.lastName}`,
          error: `Email ${cleanEmail} is already registered.`
        });
        continue;
      }

      // Department matching
      let dept = db.departments.find(
        (d) =>
          d.id === item.departmentId ||
          d.name.toLowerCase() === (item.department || item.departmentName || "").toLowerCase() ||
          d.code.toLowerCase() === (item.departmentCode || "").toLowerCase()
      );
      if (!dept) {
        dept = db.departments[0];
      }

      // Generate or validate ID
      let empId = item.employeeId ? item.employeeId.trim().toUpperCase() : "";
      if (empId) {
        const idTaken = db.employees.some((e) => e.employeeId.toUpperCase() === empId) || successful.some((e) => e.employeeId.toUpperCase() === empId);
        if (idTaken) {
          empId = `EMP-${db.employees.length + successful.length + 101}`;
        }
      } else {
        empId = `EMP-${db.employees.length + successful.length + 101}`;
      }

      const newId = `emp-${Date.now()}-${i}`;
      const newEmp: IEmployee = {
        id: newId,
        employeeId: empId,
        firstName: item.firstName.trim(),
        lastName: item.lastName.trim(),
        email: cleanEmail,
        phone: item.phone || "+1 (555) 000-0000",
        gender: ["Male", "Female", "Other"].includes(item.gender) ? item.gender : "Other",
        dob: item.dob || "1994-01-01",
        address: item.address || "Corporate Park",
        city: item.city || "San Francisco",
        state: item.state || "CA",
        country: item.country || "United States",
        departmentId: dept.id,
        departmentName: dept.name,
        position: item.position || item.designation || "Associate",
        role: ["Super Admin", "HR Admin", "Manager", "Employee"].includes(item.role) ? item.role : "Employee",
        joiningDate: item.joiningDate || new Date().toISOString().split("T")[0],
        employmentType: ["Full-Time", "Part-Time", "Contract", "Internship"].includes(item.employmentType) ? item.employmentType : "Full-Time",
        managerId: null,
        managerName: null,
        salary: Number(item.salary) || 65000,
        status: ["Active", "Inactive", "On Leave", "Probation"].includes(item.status) ? item.status : "Active",
        emergencyContact: {
          name: item.emergencyContactName || "Emergency Contact",
          relationship: item.emergencyContactRelationship || "Family",
          phone: item.emergencyContactPhone || item.phone || "+1 (555) 000-0000"
        },
        avatar: item.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        notes: item.notes || "Imported via CSV bulk tool",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.employees.push(newEmp);
      successful.push(newEmp);

      // Create leave balance
      db.leaveBalances[newId] = {
        employeeId: newId,
        casualLeave: { total: 12, used: 0 },
        sickLeave: { total: 10, used: 0 },
        earnedLeave: { total: 15, used: 0 },
        emergencyLeave: { total: 5, used: 0 },
        maternityLeave: { total: 90, used: 0 },
        paternityLeave: { total: 14, used: 0 },
        unpaidLeave: { total: 30, used: 0 }
      };

      // Create user login
      db.users.push({
        id: `user-${Date.now()}-${i}`,
        email: cleanEmail,
        passwordHash: defaultPasswordHash,
        role: newEmp.role,
        employeeId: newId,
        name: `${newEmp.firstName} ${newEmp.lastName}`,
        avatar: newEmp.avatar,
        status: newEmp.status === "Inactive" ? "Inactive" : "Active",
        createdAt: new Date().toISOString()
      });
    }

    // Refresh department counts
    db.departments.forEach((d) => {
      d.employeeCount = db.employees.filter((e) => e.departmentId === d.id).length;
    });

    if (successful.length > 0) {
      await logAuditEvent({
        userId: req.user!.id,
        userName: req.user!.name,
        userRole: req.user!.role,
        userEmail: req.user!.email,
        action: "EMPLOYEES_BULK_IMPORTED",
        resource: "Employee",
        details: `Bulk imported ${successful.length} employee records with ${errors.length} errors/skipped.`,
        ipAddress: req.ip || "127.0.0.1"
      });
      await saveDb();
    }

    return res.json({
      success: true,
      message: `Successfully imported ${successful.length} employees.${errors.length > 0 ? ` ${errors.length} rows encountered issues.` : ""}`,
      importedCount: successful.length,
      errorsCount: errors.length,
      errors,
      data: successful
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const index = db.employees.findIndex((e) => e.id === id || e.employeeId === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const removed = db.employees.splice(index, 1)[0];

    // Remove user account
    const uIndex = db.users.findIndex((u) => u.employeeId === removed.id);
    if (uIndex !== -1) {
      db.users.splice(uIndex, 1);
    }

    // Refresh department employee count
    db.departments.forEach((d) => {
      d.employeeCount = db.employees.filter((e) => e.departmentId === d.id).length;
    });

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "EMPLOYEE_DELETED",
      resource: "Employee",
      resourceId: removed.id,
      details: `Permanently removed employee ${removed.firstName} ${removed.lastName} (${removed.employeeId}) from database.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    await saveDb();

    return res.json({
      success: true,
      message: `Employee ${removed.firstName} ${removed.lastName} (${removed.employeeId}) removed successfully.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

