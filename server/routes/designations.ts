import { Router } from "express";
import { getDb, saveDb, IDesignation, logAuditEvent } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/designations - List all designations with search & filters
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    let designations = [...(db.designations || [])];

    const { departmentId, status, search } = req.query;

    if (departmentId && departmentId !== "all") {
      designations = designations.filter((d) => d.departmentId === departmentId || d.departmentName.toLowerCase() === (departmentId as string).toLowerCase());
    }

    if (status && status !== "all") {
      designations = designations.filter((d) => d.status.toLowerCase() === (status as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      designations = designations.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.designationId.toLowerCase().includes(q) ||
          d.departmentName.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }

    // Attach active employee count for each designation
    const designationsWithStats = designations.map((desig) => {
      const assignedCount = db.employees.filter(
        (e) => e.position.toLowerCase() === desig.title.toLowerCase() || e.position.toLowerCase().includes(desig.title.toLowerCase())
      ).length;
      return {
        ...desig,
        employeeCount: assignedCount
      };
    });

    return res.json({
      success: true,
      data: designationsWithStats,
      total: designationsWithStats.length
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/designations/:id
router.get("/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const designation = (db.designations || []).find((d) => d.id === req.params.id || d.designationId === req.params.id);
    if (!designation) {
      return res.status(404).json({ success: false, message: "Designation not found." });
    }
    const employees = db.employees.filter((e) => e.position.toLowerCase() === designation.title.toLowerCase());
    return res.json({
      success: true,
      data: {
        ...designation,
        employees
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/designations - Create new designation
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const { designationId, title, departmentId, description, minSalary, maxSalary, status = "Active" } = req.body;

    if (!title || !departmentId) {
      return res.status(400).json({ success: false, message: "Designation title and department are required." });
    }

    const db = getDb();
    if (!db.designations) db.designations = [];

    // Find Department
    const dept = db.departments.find((d) => d.id === departmentId || d.name.toLowerCase() === departmentId.toLowerCase());
    if (!dept) {
      return res.status(400).json({ success: false, message: "Specified department does not exist." });
    }

    // Auto-generate ID if needed
    let finalId = designationId ? designationId.trim().toUpperCase() : "";
    if (finalId) {
      const existing = db.designations.find((d) => d.designationId.toUpperCase() === finalId);
      if (existing) {
        return res.status(400).json({ success: false, message: `Designation ID "${finalId}" is already taken.` });
      }
    } else {
      const maxNum = db.designations.reduce((max, d) => {
        const match = d.designationId.match(/DESIG-?(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          return num > max ? num : max;
        }
        return max;
      }, 100);
      finalId = `DESIG-${maxNum + 1}`;
    }

    const newDesignation: IDesignation = {
      id: `desig-${Date.now()}`,
      designationId: finalId,
      title: title.trim(),
      departmentId: dept.id,
      departmentName: dept.name,
      description: description || `Role responsible for ${title} deliverables within ${dept.name}.`,
      minSalary: Number(minSalary) || 600000,
      maxSalary: Number(maxSalary) || 1200000,
      status: status || "Active",
      createdAt: new Date().toISOString()
    };

    db.designations.push(newDesignation);
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "DESIGNATION_CREATED",
      resource: "Designation",
      resourceId: newDesignation.id,
      details: `Created job designation "${newDesignation.title}" in ${dept.name}.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.status(201).json({
      success: true,
      message: "Designation created successfully.",
      data: newDesignation
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/designations/:id - Update designation
router.put("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const { title, departmentId, description, minSalary, maxSalary, status } = req.body;
    const db = getDb();
    if (!db.designations) db.designations = [];

    const index = db.designations.findIndex((d) => d.id === req.params.id || d.designationId === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Designation not found." });
    }

    const current = db.designations[index];

    let deptName = current.departmentName;
    let deptId = current.departmentId;
    if (departmentId && departmentId !== current.departmentId) {
      const dept = db.departments.find((d) => d.id === departmentId || d.name.toLowerCase() === departmentId.toLowerCase());
      if (dept) {
        deptId = dept.id;
        deptName = dept.name;
      }
    }

    db.designations[index] = {
      ...current,
      title: title ? title.trim() : current.title,
      departmentId: deptId,
      departmentName: deptName,
      description: description !== undefined ? description : current.description,
      minSalary: minSalary !== undefined ? Number(minSalary) : current.minSalary,
      maxSalary: maxSalary !== undefined ? Number(maxSalary) : current.maxSalary,
      status: status || current.status
    };

    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "DESIGNATION_UPDATED",
      resource: "Designation",
      resourceId: current.id,
      details: `Updated designation "${db.designations[index].title}".`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({
      success: true,
      message: "Designation updated successfully.",
      data: db.designations[index]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/designations/:id
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    if (!db.designations) db.designations = [];

    const desig = db.designations.find((d) => d.id === req.params.id || d.designationId === req.params.id);
    if (!desig) {
      return res.status(404).json({ success: false, message: "Designation not found." });
    }

    // Check if employees are assigned to this position
    const assigned = db.employees.filter((e) => e.position.toLowerCase() === desig.title.toLowerCase());
    if (assigned.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete designation "${desig.title}" because ${assigned.length} employee(s) are currently assigned. Deactivate the designation instead.`
      });
    }

    db.designations = db.designations.filter((d) => d.id !== desig.id);
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "DESIGNATION_DELETED",
      resource: "Designation",
      resourceId: desig.id,
      details: `Deleted designation "${desig.title}" (${desig.designationId}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({ success: true, message: `Designation "${desig.title}" removed successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
