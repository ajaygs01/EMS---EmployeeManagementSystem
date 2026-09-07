import { Router } from "express";
import { getDb, saveDb, ITask, IDatabaseSchema, IEmployee } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

const VALID_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const VALID_STATUSES = ["Todo", "In Progress", "Completed", "Overdue"] as const;

/**
 * Helper to resolve an assignee by employee ID, employee code, user ID, or email.
 */
function resolveAssignee(db: IDatabaseSchema, assigneeId: string): IEmployee | null {
  if (!assigneeId || typeof assigneeId !== "string") return null;
  const cleanId = assigneeId.trim();

  // 1. Direct employee ID match (e.g. "emp-1")
  let employee = db.employees.find((e) => e.id === cleanId);
  if (employee) return employee;

  // 2. Employee code match (e.g. "EMP-001")
  employee = db.employees.find((e) => e.employeeId && e.employeeId.toLowerCase() === cleanId.toLowerCase());
  if (employee) return employee;

  // 3. User ID match (e.g. "user-6") -> find linked employee
  const user = db.users.find((u) => u.id === cleanId);
  if (user) {
    if (user.employeeId) {
      employee = db.employees.find((e) => e.id === user.employeeId || e.employeeId === user.employeeId);
      if (employee) return employee;
    }
    if (user.email) {
      employee = db.employees.find((e) => e.email.toLowerCase() === user.email.toLowerCase());
      if (employee) return employee;
    }
  }

  // 4. Email match
  employee = db.employees.find((e) => e.email && e.email.toLowerCase() === cleanId.toLowerCase());
  if (employee) return employee;

  return null;
}

// GET /api/tasks - List tasks with comprehensive filtering and RBAC
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    let tasks = [...db.tasks];

    const { status, priority, employeeId, department, departmentId, search } = req.query;

    // RBAC: Employees strictly see only tasks assigned to their employeeId
    if (user.role === "Employee") {
      tasks = tasks.filter((t) => t.assignedEmployeeId === user.employeeId);
    } else if (employeeId && employeeId !== "all" && typeof employeeId === "string") {
      const targetEmp = resolveAssignee(db, employeeId);
      const targetId = targetEmp ? targetEmp.id : employeeId.trim();
      tasks = tasks.filter((t) => t.assignedEmployeeId === targetId);
    }

    // Status filter
    if (status && status !== "all" && typeof status === "string") {
      tasks = tasks.filter((t) => t.status.toLowerCase() === status.trim().toLowerCase());
    }

    // Priority filter
    if (priority && priority !== "all" && typeof priority === "string") {
      tasks = tasks.filter((t) => t.priority.toLowerCase() === priority.trim().toLowerCase());
    }

    // Department filter (by department name or departmentId)
    const deptParam = (departmentId || department) as string | undefined;
    if (deptParam && deptParam !== "all" && typeof deptParam === "string" && deptParam.trim() !== "") {
      const cleanDept = deptParam.trim();
      const matchedDept = db.departments.find(
        (d) => d.id === cleanDept || d.name.toLowerCase() === cleanDept.toLowerCase()
      );
      const targetDeptName = (matchedDept ? matchedDept.name : cleanDept).toLowerCase();
      tasks = tasks.filter((t) => (t.departmentName || "").toLowerCase() === targetDeptName);
    }

    // Text Search filter (title, description, assignee, department, creator)
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      tasks = tasks.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.assignedEmployeeName && t.assignedEmployeeName.toLowerCase().includes(q)) ||
          (t.departmentName && t.departmentName.toLowerCase().includes(q)) ||
          (t.assignedBy && t.assignedBy.toLowerCase().includes(q))
      );
    }

    // Sort newest created first
    tasks.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return res.json({ success: true, data: tasks, total: tasks.length });
  } catch (error: any) {
    console.error("[Tasks API Error] GET /api/tasks:", error.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to retrieve tasks." });
  }
});

// GET /api/tasks/:id - Get a single task by ID
router.get("/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const id = req.params.id;

    const task = db.tasks.find((t) => t.id === id || (t as any)._id === id);
    if (!task) {
      console.warn(`[Tasks API] GET /api/tasks/${id} - Task not found`);
      return res.status(404).json({ success: false, message: `Task not found with ID: ${id}` });
    }

    // RBAC check: Employees can only view their own tasks
    if (user.role === "Employee" && task.assignedEmployeeId !== user.employeeId) {
      console.warn(`[Tasks API] Forbidden: Employee ${user.employeeId} attempted to access task ${id} assigned to ${task.assignedEmployeeId}`);
      return res.status(403).json({ success: false, message: "Access denied. You do not have permission to view this task." });
    }

    return res.json({ success: true, data: task });
  } catch (error: any) {
    console.error(`[Tasks API Error] GET /api/tasks/${req.params.id}:`, error.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to retrieve task details." });
  }
});

// POST /api/tasks - Create and assign a new Task
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const {
      title,
      description,
      assignedEmployeeId,
      assigneeId,
      employeeId,
      priority = "Medium",
      startDate,
      dueDate,
      status = "Todo",
      progressPercent = 0
    } = req.body;

    // Validate required fields
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "Task title is required." });
    }

    const rawAssignee = assignedEmployeeId || assigneeId || employeeId;
    if (!rawAssignee || typeof rawAssignee !== "string" || !rawAssignee.trim()) {
      return res.status(400).json({ success: false, message: "Assigned employee is required." });
    }

    if (!dueDate || typeof dueDate !== "string" || !dueDate.trim()) {
      return res.status(400).json({ success: false, message: "Due date is required." });
    }

    // Resolve assignee with clear validation
    const employee = resolveAssignee(db, rawAssignee);
    if (!employee) {
      console.warn(`[Tasks API] Assignee resolution failed for input: "${rawAssignee}"`);
      return res.status(400).json({
        success: false,
        message: `Invalid assignee: No active employee or user found matching "${rawAssignee}".`
      });
    }

    // Validate priority
    const cleanPriority = VALID_PRIORITIES.includes(priority) ? priority : "Medium";

    // Validate status
    const cleanStatus = VALID_STATUSES.includes(status) ? status : "Todo";

    // Calculate progressPercent
    let cleanProgress = typeof progressPercent === "number" ? Math.min(100, Math.max(0, progressPercent)) : 0;
    if (cleanStatus === "Completed") {
      cleanProgress = 100;
    } else if (cleanProgress === 100 && cleanStatus !== "Completed") {
      cleanProgress = 99; // Prevent complete status conflict unless marked Completed
    }

    const newTask: ITask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: (description || "").toString().trim(),
      assignedEmployeeId: employee.id,
      assignedEmployeeName: `${employee.firstName} ${employee.lastName}`,
      assignedBy: req.user!.name,
      departmentName: employee.departmentName,
      priority: cleanPriority,
      startDate: startDate && typeof startDate === "string" ? startDate.trim() : new Date().toISOString().split("T")[0],
      dueDate: dueDate.trim(),
      status: cleanStatus,
      progressPercent: cleanProgress,
      createdAt: new Date().toISOString()
    };

    db.tasks.unshift(newTask);

    // Notify assigned employee if user account exists
    const targetUser = db.users.find((u) => u.employeeId === employee.id || (employee.email && u.email.toLowerCase() === employee.email.toLowerCase()));
    if (targetUser) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: targetUser.id,
        title: "New Task Assigned",
        message: `You were assigned task '${newTask.title}' by ${req.user!.name}.`,
        type: "task",
        read: false,
        link: "/tasks",
        createdAt: new Date().toISOString()
      });
    }

    await saveDb();
    console.log(`[Tasks API] Task created: "${newTask.title}" (ID: ${newTask.id}) assigned to ${employee.firstName} ${employee.lastName} (${employee.id})`);

    return res.status(201).json({ success: true, message: "Task created successfully.", data: newTask });
  } catch (error: any) {
    console.error("[Tasks API Error] POST /api/tasks:", error.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create task." });
  }
});

// PUT /api/tasks/:id/status - Update task status and progress
router.put("/:id/status", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const id = req.params.id;

    const task = db.tasks.find((t) => t.id === id || (t as any)._id === id);
    if (!task) {
      console.warn(`[Tasks API] PUT /api/tasks/${id}/status - Task not found`);
      return res.status(404).json({ success: false, message: `Task not found with ID: ${id}` });
    }

    // Authorization: Super Admin, HR Admin, Manager, OR the assigned employee
    const isPrivileged = ["Super Admin", "HR Admin", "Manager"].includes(user.role);
    if (!isPrivileged && task.assignedEmployeeId !== user.employeeId) {
      console.warn(`[Tasks API] Forbidden: User ${user.id} (${user.role}) attempted to update status for task ${id} assigned to ${task.assignedEmployeeId}`);
      return res.status(403).json({ success: false, message: "You can only update the status of tasks assigned to you." });
    }

    const { status, progressPercent } = req.body;

    if (status) {
      if (VALID_STATUSES.includes(status)) {
        task.status = status;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status "${status}". Allowed: ${VALID_STATUSES.join(", ")}`
        });
      }
    }

    if (progressPercent !== undefined) {
      task.progressPercent = Math.min(100, Math.max(0, Number(progressPercent) || 0));
      if (task.progressPercent === 100 && task.status !== "Completed") {
        task.status = "Completed";
      }
    }

    if (task.status === "Completed") {
      task.progressPercent = 100;
    }

    await saveDb();
    console.log(`[Tasks API] Task ${task.id} status updated to "${task.status}" (${task.progressPercent}%) by ${user.name}`);

    return res.json({ success: true, message: "Task status updated.", data: task });
  } catch (error: any) {
    console.error(`[Tasks API Error] PUT /api/tasks/${req.params.id}/status:`, error.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update task status." });
  }
});

// PUT /api/tasks/:id - Full update of task details
router.put("/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const id = req.params.id;

    const task = db.tasks.find((t) => t.id === id || (t as any)._id === id);
    if (!task) {
      console.warn(`[Tasks API] PUT /api/tasks/${id} - Task not found`);
      return res.status(404).json({ success: false, message: `Task not found with ID: ${id}` });
    }

    const isPrivileged = ["Super Admin", "HR Admin", "Manager"].includes(user.role);

    // If regular employee: allow updating only their assigned task (status, progress, description)
    if (!isPrivileged) {
      if (user.role === "Employee" && task.assignedEmployeeId === user.employeeId) {
        const { status, progressPercent, description } = req.body;
        if (status && VALID_STATUSES.includes(status)) task.status = status;
        if (progressPercent !== undefined) {
          task.progressPercent = Math.min(100, Math.max(0, Number(progressPercent) || 0));
        }
        if (description !== undefined) task.description = String(description).trim();
        if (task.status === "Completed") task.progressPercent = 100;
        await saveDb();
        return res.json({ success: true, message: "Task updated successfully.", data: task });
      }
      return res.status(403).json({ success: false, message: "Access denied. You do not have permission to modify this task." });
    }

    // Privileged role update: allow updating all fields
    const {
      title,
      description,
      assignedEmployeeId,
      assigneeId,
      employeeId,
      priority,
      startDate,
      dueDate,
      status,
      progressPercent
    } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, message: "Task title cannot be empty." });
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = String(description).trim();
    }

    if (priority !== undefined) {
      if (VALID_PRIORITIES.includes(priority)) {
        task.priority = priority;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid priority "${priority}". Allowed: ${VALID_PRIORITIES.join(", ")}`
        });
      }
    }

    if (startDate !== undefined) {
      task.startDate = startDate;
    }

    if (dueDate !== undefined) {
      if (!dueDate || !dueDate.trim()) {
        return res.status(400).json({ success: false, message: "Due date cannot be empty." });
      }
      task.dueDate = dueDate.trim();
    }

    if (status !== undefined) {
      if (VALID_STATUSES.includes(status)) {
        task.status = status;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status "${status}". Allowed: ${VALID_STATUSES.join(", ")}`
        });
      }
    }

    if (progressPercent !== undefined) {
      task.progressPercent = Math.min(100, Math.max(0, Number(progressPercent) || 0));
    }

    // Check assignee change
    const targetAssigneeInput = assignedEmployeeId || assigneeId || employeeId;
    if (targetAssigneeInput && targetAssigneeInput !== task.assignedEmployeeId) {
      const resolvedEmployee = resolveAssignee(db, targetAssigneeInput);
      if (!resolvedEmployee) {
        console.warn(`[Tasks API] Assignee change rejected for ID: "${targetAssigneeInput}"`);
        return res.status(400).json({
          success: false,
          message: `Invalid assignee: No active employee or user found matching "${targetAssigneeInput}".`
        });
      }
      task.assignedEmployeeId = resolvedEmployee.id;
      task.assignedEmployeeName = `${resolvedEmployee.firstName} ${resolvedEmployee.lastName}`;
      task.departmentName = resolvedEmployee.departmentName;
    }

    if (task.status === "Completed") {
      task.progressPercent = 100;
    } else if (task.progressPercent === 100) {
      task.status = "Completed";
    }

    await saveDb();
    console.log(`[Tasks API] Task ${task.id} fully updated by ${user.name} (${user.role})`);

    return res.json({ success: true, message: "Task updated successfully.", data: task });
  } catch (error: any) {
    console.error(`[Tasks API Error] PUT /api/tasks/${req.params.id}:`, error.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update task." });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const id = req.params.id;

    const index = db.tasks.findIndex((t) => t.id === id || (t as any)._id === id);
    if (index === -1) {
      console.warn(`[Tasks API] DELETE /api/tasks/${id} - Task not found`);
      return res.status(404).json({ success: false, message: `Task not found with ID: ${id}` });
    }

    const [deletedTask] = db.tasks.splice(index, 1);
    await saveDb();

    console.log(`[Tasks API] Task deleted: "${deletedTask.title}" (ID: ${deletedTask.id}) by ${user.name} (${user.role})`);

    return res.json({ success: true, message: "Task deleted successfully.", deletedId: id });
  } catch (error: any) {
    console.error(`[Tasks API Error] DELETE /api/tasks/${req.params.id}:`, error.message || error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete task." });
  }
});

export default router;
