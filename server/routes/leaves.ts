import { Router } from "express";
import { getDb, saveDb, ILeave, ILeaveBalance } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Helper to find or init employee balance
function getOrCreateLeaveBalance(empId: string): ILeaveBalance {
  const db = getDb();
  if (db.leaveBalances[empId]) {
    return db.leaveBalances[empId];
  }
  // Try finding by internal id vs employee code
  const emp = db.employees.find((e) => e.id === empId || e.employeeId === empId);
  const actualId = emp ? emp.id : empId;

  if (!db.leaveBalances[actualId]) {
    db.leaveBalances[actualId] = {
      employeeId: actualId,
      casualLeave: { total: 12, used: 0 },
      sickLeave: { total: 10, used: 0 },
      earnedLeave: { total: 15, used: 0 },
      emergencyLeave: { total: 5, used: 0 },
      maternityLeave: { total: 90, used: 0 },
      paternityLeave: { total: 14, used: 0 },
      unpaidLeave: { total: 30, used: 0 }
    };
  }
  return db.leaveBalances[actualId];
}

// GET /api/leaves - List leaves with filtering & role protection
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    let leaves = [...db.leaves];

    const { status, leaveType, department, employeeId, search } = req.query;

    if (user.role === "Employee") {
      leaves = leaves.filter((l) => l.employeeId === user.employeeId);
    } else if (employeeId && employeeId !== "all") {
      leaves = leaves.filter((l) => l.employeeId === employeeId);
    }

    if (status && status !== "all") {
      leaves = leaves.filter((l) => l.status.toLowerCase() === (status as string).toLowerCase());
    }
    if (leaveType && leaveType !== "all") {
      leaves = leaves.filter((l) => l.leaveType.toLowerCase() === (leaveType as string).toLowerCase());
    }
    if (department && department !== "all") {
      leaves = leaves.filter((l) => l.departmentName.toLowerCase() === (department as string).toLowerCase());
    }
    if (search) {
      const q = (search as string).toLowerCase();
      leaves = leaves.filter((l) =>
        l.employeeName.toLowerCase().includes(q) ||
        l.departmentName.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q)
      );
    }

    // Sort newest appliedDate first
    leaves.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));

    return res.json({ success: true, data: leaves, total: leaves.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leaves/balances - List all employee leave balances (for Admins / Managers)
router.get("/balances", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const list = db.employees.map((emp) => {
      const balance = getOrCreateLeaveBalance(emp.id);
      return {
        ...balance,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        departmentName: emp.departmentName,
        position: emp.position,
        avatar: emp.avatar
      };
    });
    return res.json({ success: true, data: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leaves/balances/:employeeId
router.get("/balances/:employeeId", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const targetParam = req.params.employeeId;
    const emp = db.employees.find((e) => e.id === targetParam || e.employeeId === targetParam);
    const targetId = emp ? emp.id : targetParam;
    const balance = getOrCreateLeaveBalance(targetId);
    return res.json({ success: true, data: balance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leaves/balances/:employeeId - Update / Adjust leave quota (Admin / HR)
router.put("/balances/:employeeId", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const targetParam = req.params.employeeId;
    const emp = db.employees.find((e) => e.id === targetParam || e.employeeId === targetParam);
    const targetId = emp ? emp.id : targetParam;
    
    const balance = getOrCreateLeaveBalance(targetId);
    const { casualLeave, sickLeave, earnedLeave, emergencyLeave, maternityLeave, paternityLeave, unpaidLeave } = req.body;

    if (casualLeave) balance.casualLeave = { ...balance.casualLeave, ...casualLeave };
    if (sickLeave) balance.sickLeave = { ...balance.sickLeave, ...sickLeave };
    if (earnedLeave) balance.earnedLeave = { ...balance.earnedLeave, ...earnedLeave };
    if (emergencyLeave) balance.emergencyLeave = { ...balance.emergencyLeave, ...emergencyLeave };
    if (maternityLeave) balance.maternityLeave = { ...balance.maternityLeave, ...maternityLeave };
    if (paternityLeave) balance.paternityLeave = { ...balance.paternityLeave, ...paternityLeave };
    if (unpaidLeave) balance.unpaidLeave = { ...balance.unpaidLeave, ...unpaidLeave };

    db.leaveBalances[targetId] = balance;
    await saveDb();

    return res.json({ success: true, message: "Leave quota balances updated successfully.", data: balance });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leaves - Apply for leave
router.post("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const { employeeId, leaveType, startDate, endDate, reason, documentUrl } = req.body;

    const targetEmpId = user.role === "Employee" ? user.employeeId : employeeId || user.employeeId;
    const employee = db.employees.find((e) => e.id === targetEmpId || e.employeeId === targetEmpId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee record not found." });
    }

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "Leave type, start date, end date, and reason are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ success: false, message: "End date cannot be prior to start date." });
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance availability
    const balance = getOrCreateLeaveBalance(employee.id);
    let categoryBalance: { total: number; used: number } | null = null;

    if (leaveType === "Casual Leave") categoryBalance = balance.casualLeave;
    else if (leaveType === "Sick Leave") categoryBalance = balance.sickLeave;
    else if (leaveType === "Earned Leave") categoryBalance = balance.earnedLeave;
    else if (leaveType === "Emergency Leave") categoryBalance = balance.emergencyLeave;
    else if (leaveType === "Maternity Leave") categoryBalance = balance.maternityLeave;
    else if (leaveType === "Paternity Leave") categoryBalance = balance.paternityLeave;
    else if (leaveType === "Unpaid Leave") categoryBalance = balance.unpaidLeave;

    const remaining = categoryBalance ? (categoryBalance.total - categoryBalance.used) : 999;
    if (remaining < totalDays && leaveType !== "Unpaid Leave") {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. You have ${remaining} day(s) remaining for ${leaveType}, but requested ${totalDays} day(s).`
      });
    }

    const newLeave: ILeave = {
      id: `leave-${Date.now()}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      departmentName: employee.departmentName,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
      documentUrl,
      status: "Pending",
      appliedDate: new Date().toISOString()
    };

    db.leaves.unshift(newLeave);

    // Create notifications for HR and managers
    const managers = db.users.filter((u) => u.role === "Manager" || u.role === "HR Admin" || u.role === "Super Admin");
    managers.forEach((mgr) => {
      db.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: mgr.id,
        title: "New Leave Application",
        message: `${newLeave.employeeName} submitted a ${leaveType} request for ${totalDays} day(s).`,
        type: "leave",
        read: false,
        link: "/leave",
        createdAt: new Date().toISOString()
      });
    });

    await saveDb();

    return res.status(201).json({
      success: true,
      message: `Leave application for ${totalDays} day(s) submitted successfully.`,
      data: newLeave
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leaves/:id/approve
router.put("/:id/approve", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const leave = db.leaves.find((l) => l.id === id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    const wasAlreadyApproved = leave.status === "Approved";
    const { remarks } = req.body;
    leave.status = "Approved";
    leave.reviewedBy = req.user!.name;
    leave.reviewRemarks = remarks || "Approved as requested.";
    leave.reviewedAt = new Date().toISOString();

    // Update leave balance if not already deducted
    if (!wasAlreadyApproved) {
      const balance = getOrCreateLeaveBalance(leave.employeeId);
      if (leave.leaveType === "Casual Leave") balance.casualLeave.used += leave.totalDays;
      else if (leave.leaveType === "Sick Leave") balance.sickLeave.used += leave.totalDays;
      else if (leave.leaveType === "Earned Leave") balance.earnedLeave.used += leave.totalDays;
      else if (leave.leaveType === "Emergency Leave") balance.emergencyLeave.used += leave.totalDays;
      else if (leave.leaveType === "Maternity Leave") balance.maternityLeave.used += leave.totalDays;
      else if (leave.leaveType === "Paternity Leave") balance.paternityLeave.used += leave.totalDays;
      else if (leave.leaveType === "Unpaid Leave") balance.unpaidLeave.used += leave.totalDays;
      db.leaveBalances[leave.employeeId] = balance;
    }

    // Notify employee
    const targetUser = db.users.find((u) => u.employeeId === leave.employeeId);
    if (targetUser) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: targetUser.id,
        title: "Leave Request Approved",
        message: `Your ${leave.leaveType} for ${leave.startDate} to ${leave.endDate} has been approved by ${req.user!.name}.`,
        type: "leave",
        read: false,
        link: "/leave",
        createdAt: new Date().toISOString()
      });
    }

    // Add Audit Log
    db.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "LEAVE_APPROVED",
      resource: "LeaveRequest",
      resourceId: leave.id,
      details: `Approved ${leave.leaveType} (${leave.totalDays} days) for ${leave.employeeName}.`,
      timestamp: new Date().toISOString()
    });

    await saveDb();

    return res.json({ success: true, message: "Leave request approved successfully.", data: leave });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leaves/:id/reject
router.put("/:id/reject", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const leave = db.leaves.find((l) => l.id === id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    const wasApproved = leave.status === "Approved";
    const { remarks } = req.body;
    leave.status = "Rejected";
    leave.reviewedBy = req.user!.name;
    leave.reviewRemarks = remarks || "Declined due to operational coverage requirements.";
    leave.reviewedAt = new Date().toISOString();

    // If it was previously approved, refund balance
    if (wasApproved) {
      const balance = getOrCreateLeaveBalance(leave.employeeId);
      if (leave.leaveType === "Casual Leave") balance.casualLeave.used = Math.max(0, balance.casualLeave.used - leave.totalDays);
      else if (leave.leaveType === "Sick Leave") balance.sickLeave.used = Math.max(0, balance.sickLeave.used - leave.totalDays);
      else if (leave.leaveType === "Earned Leave") balance.earnedLeave.used = Math.max(0, balance.earnedLeave.used - leave.totalDays);
      else if (leave.leaveType === "Emergency Leave") balance.emergencyLeave.used = Math.max(0, balance.emergencyLeave.used - leave.totalDays);
      else if (leave.leaveType === "Maternity Leave") balance.maternityLeave.used = Math.max(0, balance.maternityLeave.used - leave.totalDays);
      else if (leave.leaveType === "Paternity Leave") balance.paternityLeave.used = Math.max(0, balance.paternityLeave.used - leave.totalDays);
      else if (leave.leaveType === "Unpaid Leave") balance.unpaidLeave.used = Math.max(0, balance.unpaidLeave.used - leave.totalDays);
      db.leaveBalances[leave.employeeId] = balance;
    }

    // Notify employee
    const targetUser = db.users.find((u) => u.employeeId === leave.employeeId);
    if (targetUser) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: targetUser.id,
        title: "Leave Request Rejected",
        message: `Your ${leave.leaveType} request was rejected. Remarks: ${leave.reviewRemarks}`,
        type: "leave",
        read: false,
        link: "/leave",
        createdAt: new Date().toISOString()
      });
    }

    await saveDb();

    return res.json({ success: true, message: "Leave request rejected.", data: leave });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leaves/:id/cancel
router.put("/:id/cancel", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const leave = db.leaves.find((l) => l.id === id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    if (req.user!.role === "Employee" && leave.employeeId !== req.user!.employeeId) {
      return res.status(403).json({ success: false, message: "Unauthorized to cancel this leave." });
    }

    const wasApproved = leave.status === "Approved";
    leave.status = "Cancelled";

    // If it was previously approved, refund balance
    if (wasApproved) {
      const balance = getOrCreateLeaveBalance(leave.employeeId);
      if (leave.leaveType === "Casual Leave") balance.casualLeave.used = Math.max(0, balance.casualLeave.used - leave.totalDays);
      else if (leave.leaveType === "Sick Leave") balance.sickLeave.used = Math.max(0, balance.sickLeave.used - leave.totalDays);
      else if (leave.leaveType === "Earned Leave") balance.earnedLeave.used = Math.max(0, balance.earnedLeave.used - leave.totalDays);
      else if (leave.leaveType === "Emergency Leave") balance.emergencyLeave.used = Math.max(0, balance.emergencyLeave.used - leave.totalDays);
      else if (leave.leaveType === "Maternity Leave") balance.maternityLeave.used = Math.max(0, balance.maternityLeave.used - leave.totalDays);
      else if (leave.leaveType === "Paternity Leave") balance.paternityLeave.used = Math.max(0, balance.paternityLeave.used - leave.totalDays);
      else if (leave.leaveType === "Unpaid Leave") balance.unpaidLeave.used = Math.max(0, balance.unpaidLeave.used - leave.totalDays);
      db.leaveBalances[leave.employeeId] = balance;
    }

    await saveDb();

    return res.json({ success: true, message: "Leave request cancelled.", data: leave });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/leaves/:id
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const index = db.leaves.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Leave request not found." });
    }

    const leave = db.leaves[index];
    if (leave.status === "Approved") {
      const balance = getOrCreateLeaveBalance(leave.employeeId);
      if (leave.leaveType === "Casual Leave") balance.casualLeave.used = Math.max(0, balance.casualLeave.used - leave.totalDays);
      else if (leave.leaveType === "Sick Leave") balance.sickLeave.used = Math.max(0, balance.sickLeave.used - leave.totalDays);
      else if (leave.leaveType === "Earned Leave") balance.earnedLeave.used = Math.max(0, balance.earnedLeave.used - leave.totalDays);
      else if (leave.leaveType === "Emergency Leave") balance.emergencyLeave.used = Math.max(0, balance.emergencyLeave.used - leave.totalDays);
      else if (leave.leaveType === "Maternity Leave") balance.maternityLeave.used = Math.max(0, balance.maternityLeave.used - leave.totalDays);
      else if (leave.leaveType === "Paternity Leave") balance.paternityLeave.used = Math.max(0, balance.paternityLeave.used - leave.totalDays);
      else if (leave.leaveType === "Unpaid Leave") balance.unpaidLeave.used = Math.max(0, balance.unpaidLeave.used - leave.totalDays);
      db.leaveBalances[leave.employeeId] = balance;
    }

    db.leaves.splice(index, 1);
    await saveDb();

    return res.json({ success: true, message: "Leave request deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
