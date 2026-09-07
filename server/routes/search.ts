import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/search?q=keyword
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const q = ((req.query.q as string) || "").trim().toLowerCase();
    if (!q || q.length < 2) {
      return res.json({ success: true, results: { employees: [], departments: [], tasks: [], announcements: [], documents: [] } });
    }

    const db = getDb();
    const user = req.user!;

    // Search Employees
    const employees = db.employees
      .filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        title: `${e.firstName} ${e.lastName}`,
        subtitle: `${e.position} • ${e.departmentName}`,
        link: `/employees/${e.id}`,
        type: "Employee",
        avatar: e.avatar
      }));

    // Search Departments
    const departments = db.departments
      .filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      .slice(0, 4)
      .map((d) => ({
        id: d.id,
        title: d.name,
        subtitle: `${d.code} • ${d.employeeCount} Employees`,
        link: `/departments`,
        type: "Department"
      }));

    // Search Tasks
    let taskList = [...db.tasks];
    if (user.role === "Employee") {
      taskList = taskList.filter((t) => t.assignedEmployeeId === user.employeeId);
    }
    const tasks = taskList
      .filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.assignedEmployeeName.toLowerCase().includes(q))
      .slice(0, 4)
      .map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: `${t.priority} Priority • Status: ${t.status}`,
        link: `/tasks`,
        type: "Task"
      }));

    // Search Announcements
    const announcements = db.announcements
      .filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
      .slice(0, 4)
      .map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: `${a.category} • ${a.date}`,
        link: `/announcements`,
        type: "Announcement"
      }));

    // Search Documents
    let docList = [...db.documents];
    if (user.role === "Employee") {
      docList = docList.filter((d) => d.employeeId === user.employeeId || d.type === "Policy");
    }
    const documents = docList
      .filter((d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.employeeName.toLowerCase().includes(q))
      .slice(0, 4)
      .map((d) => ({
        id: d.id,
        title: d.name,
        subtitle: `${d.type} • ${d.fileSize}`,
        link: `/documents`,
        type: "Document"
      }));

    return res.json({
      success: true,
      query: q,
      results: {
        employees,
        departments,
        tasks,
        announcements,
        documents
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
