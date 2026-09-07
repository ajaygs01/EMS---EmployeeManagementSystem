import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb, saveDb, IUser, logAuditEvent } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Super Admin only for all user administration
router.use(verifyToken, authorizeRoles("Super Admin"));

// GET /api/users - List system users with employee links
router.get("/", async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const { search, role, status } = req.query;

    let users = [...db.users];

    if (role && role !== "all") {
      users = users.filter((u) => u.role.toLowerCase() === (role as string).toLowerCase());
    }

    if (status && status !== "all") {
      users = users.filter((u) => u.status.toLowerCase() === (status as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      );
    }

    // Enrich with employee profile details
    const enrichedUsers = users.map((u) => {
      const emp = db.employees.find((e) => e.id === u.employeeId || e.employeeId === u.employeeId);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        employeeId: u.employeeId,
        avatar: u.avatar,
        status: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin || "Recent Session",
        employee: emp
          ? {
              id: emp.id,
              employeeId: emp.employeeId,
              departmentName: emp.departmentName,
              position: emp.position,
              phone: emp.phone
            }
          : null
      };
    });

    return res.json({
      success: true,
      data: enrichedUsers,
      total: enrichedUsers.length
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/users - Create new system user
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, email, password, role, employeeId, status = "Active" } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "Name, email, initial password, and role are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const db = getDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: "A user with this email address already exists." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const finalEmpId = employeeId || `EMP-${Date.now().toString().slice(-4)}`;

    const newUser: IUser = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role as any,
      employeeId: finalEmpId,
      name: name.trim(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      status: status || "Active",
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "USER_CREATED",
      resource: "User",
      resourceId: newUser.id,
      details: `Created user "${newUser.name}" with role ${newUser.role} (${newUser.email}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.status(201).json({
      success: true,
      message: `User account created successfully for ${newUser.name}.`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        employeeId: newUser.employeeId,
        status: newUser.status,
        createdAt: newUser.createdAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/users/:id - Edit user role, status, email, name
router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const { name, email, role, status, employeeId } = req.body;
    const db = getDb();

    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (req.user!.id === user.id && status === "Inactive") {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own administrative account." });
    }

    if (email && email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const emailTaken = db.users.find((u) => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase().trim());
      if (emailTaken) {
        return res.status(400).json({ success: false, message: "Email is already taken by another account." });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (status) user.status = status;
    if (employeeId) user.employeeId = employeeId;

    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "USER_UPDATED",
      resource: "User",
      resourceId: user.id,
      details: `Updated user account details for "${user.name}" (${user.email}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({
      success: true,
      message: "User account updated successfully.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        employeeId: user.employeeId
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/users/:id/reset-password - Super Admin password reset
router.put("/:id/reset-password", async (req: AuthRequest, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "PASSWORD_RESET_ADMIN",
      resource: "User",
      resourceId: user.id,
      details: `Super Admin reset password for "${user.name}" (${user.email}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({
      success: true,
      message: `Password has been reset successfully for ${user.name}.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/users/:id/toggle-status - Activate / Deactivate
router.put("/:id/toggle-status", async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (req.user!.id === user.id) {
      return res.status(400).json({ success: false, message: "You cannot toggle your own active status." });
    }

    user.status = user.status === "Active" ? "Inactive" : "Active";
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: user.status === "Active" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      resource: "User",
      resourceId: user.id,
      details: `${user.status === "Active" ? "Activated" : "Deactivated"} account for "${user.name}" (${user.email}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({
      success: true,
      message: `User ${user.name} is now ${user.status}.`,
      status: user.status
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (req.user!.id === user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own administrative user account." });
    }

    db.users = db.users.filter((u) => u.id !== user.id);
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "USER_DELETED",
      resource: "User",
      resourceId: user.id,
      details: `Deleted user "${user.name}" (${user.email}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({ success: true, message: `User ${user.name} deleted successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
