import { Router } from "express";
import { getDb, saveDb, IDepartment } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/departments
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    // Update live employee counts
    const departments = db.departments.map((dept) => {
      const count = db.employees.filter((e) => e.departmentId === dept.id).length;
      return {
        ...dept,
        employeeCount: count
      };
    });
    return res.json({ success: true, data: departments });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/departments/:id/employees
router.get("/:id/employees", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const department = db.departments.find((d) => d.id === id || d.code.toLowerCase() === id.toLowerCase());
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }
    const employees = db.employees.filter((e) => e.departmentId === department.id);
    return res.json({ success: true, department, employees });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/departments
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const { name, code, description, managerId, budget = 100000, location = "Main Headquarters" } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Department name and code are required." });
    }

    const db = getDb();
    const existing = db.departments.find(
      (d) => d.name.toLowerCase() === name.toLowerCase().trim() || d.code.toLowerCase() === code.toLowerCase().trim()
    );
    if (existing) {
      return res.status(400).json({ success: false, message: "Department with this name or code already exists." });
    }

    let managerName: string | null = null;
    if (managerId) {
      const mgr = db.employees.find((e) => e.id === managerId);
      if (mgr) managerName = `${mgr.firstName} ${mgr.lastName}`;
    }

    const newDept: IDepartment = {
      id: `dept-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || "",
      managerId: managerId || null,
      managerName,
      employeeCount: 0,
      status: "Active",
      budget: Number(budget) || 100000,
      location: location || "Main Headquarters",
      createdAt: new Date().toISOString()
    };

    db.departments.push(newDept);
    await saveDb();

    return res.status(201).json({ success: true, message: "Department created successfully.", data: newDept });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/departments/:id
router.put("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const dept = db.departments.find((d) => d.id === id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    const { name, code, description, managerId, budget, location, status } = req.body;

    if (name) dept.name = name.trim();
    if (code) dept.code = code.trim().toUpperCase();
    if (description !== undefined) dept.description = description;
    if (budget !== undefined) dept.budget = Number(budget);
    if (location) dept.location = location;
    if (status) dept.status = status;

    if (managerId !== undefined) {
      dept.managerId = managerId;
      if (managerId) {
        const mgr = db.employees.find((e) => e.id === managerId);
        dept.managerName = mgr ? `${mgr.firstName} ${mgr.lastName}` : null;
      } else {
        dept.managerName = null;
      }
    }

    // Sync department name into employees
    if (name) {
      db.employees.forEach((emp) => {
        if (emp.departmentId === dept.id) {
          emp.departmentName = dept.name;
        }
      });
    }

    await saveDb();

    return res.json({ success: true, message: "Department updated successfully.", data: dept });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/departments/:id
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const index = db.departments.findIndex((d) => d.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    const deptEmployees = db.employees.filter((e) => e.departmentId === id);
    if (deptEmployees.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department with ${deptEmployees.length} assigned employees. Reassign employees first.`
      });
    }

    const removed = db.departments.splice(index, 1)[0];
    await saveDb();

    return res.json({ success: true, message: `Department '${removed.name}' deleted successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
