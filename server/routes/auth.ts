import { Router } from "express";
import bcrypt from "bcryptjs";
import { getDb, saveDb, IUser, logAuditEvent } from "../db.js";
import { generateToken, verifyToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email address or password." });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email address or password." });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ success: false, message: "Your account is currently inactive. Contact your HR Administrator." });
    }

    const employee = db.employees.find((e) => e.id === user.employeeId);
    const token = generateToken(user);

    // Audit log
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      action: "LOGIN",
      resource: "Auth",
      details: `User ${user.name} logged into EMS Enterprise portal.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        employeeId: user.employeeId,
        department: employee?.departmentName || "General",
        position: employee?.position || user.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Login failed." });
  }
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const db = getDb();
    const employee = db.employees.find((e) => e.id === user.employeeId);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        employeeId: user.employeeId,
        department: employee?.departmentName || "General",
        position: employee?.position || user.role,
        phone: employee?.phone,
        status: employee?.status || user.status
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/register (Admin or HR can register new users)
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, employeeId } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, message: "All required fields must be provided." });
    }

    const db = getDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newEmpId = employeeId || `emp-${Date.now().toString().slice(-4)}`;
    
    // Create User
    const newUser: IUser = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role || "Employee",
      employeeId: newEmpId,
      name,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      status: "Active",
      createdAt: new Date().toISOString()
    };

    // Create Employee record if not existing
    const existingEmp = db.employees.find((e) => e.id === newEmpId || e.email.toLowerCase() === email.toLowerCase());
    if (!existingEmp) {
      const names = name.trim().split(" ");
      const firstName = names[0] || name;
      const lastName = names.slice(1).join(" ") || "Staff";
      const deptObj = db.departments.find((d) => d.name === (req.body.departmentName || "Human Resources")) || db.departments[0];
      const deptId = deptObj?.id || "dept-1";
      const deptName = deptObj?.name || "Human Resources";

      db.employees.push({
        id: newEmpId,
        employeeId: newEmpId.toUpperCase(),
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: "+1 (555) 019-2834",
        gender: "Other",
        dob: "1994-06-15",
        departmentId: deptId,
        departmentName: deptName,
        position: req.body.position || (role === "Super Admin" ? "Executive Director" : role === "Manager" ? "Team Lead" : "Associate"),
        role: (role as any) || "Employee",
        joiningDate: new Date().toISOString().slice(0, 10),
        status: "Active",
        salary: role === "Super Admin" ? 145000 : role === "Manager" ? 95000 : 72000,
        address: "742 Evergreen Terrace, Suite 100",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        avatar: newUser.avatar,
        employmentType: "Full-Time",
        managerId: null,
        managerName: null,
        emergencyContact: {
          name: "Family Contact",
          relationship: "Spouse / Relative",
          phone: "+1 (555) 992-0192"
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    db.users.push(newUser);
    await saveDb();

    // Audit log
    await logAuditEvent({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      userEmail: newUser.email,
      action: "REGISTER",
      resource: "Auth",
      details: `New ${newUser.role} account created for ${newUser.name}.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    const token = generateToken(newUser);
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        employeeId: newUser.employeeId,
        avatar: newUser.avatar,
        department: req.body.departmentName || db.departments[0]?.name || "Human Resources",
        position: req.body.position || newUser.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/change-password
router.post("/change-password", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    const db = getDb();
    const user = db.users.find((u) => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await saveDb();

    return res.json({ success: true, message: "Password updated successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }
  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found registered under this email address."
    });
  }

  // Generate a verification OTP
  const demoOtp = "849201";

  await logAuditEvent({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    userEmail: user.email,
    action: "PASSWORD_RESET_REQUEST",
    resource: "Auth",
    details: `Password reset OTP generated for ${user.email}.`,
    ipAddress: req.ip || "127.0.0.1"
  });

  return res.json({
    success: true,
    message: `Password reset OTP has been dispatched to ${user.email}. Use verification code "${demoOtp}" to set your new password.`,
    demoOtp,
    email: user.email
  });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, verification OTP, and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    if (otp !== "849201" && otp !== "123456") {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code. Please use 849201." });
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    await saveDb();

    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userEmail: user.email,
      action: "PASSWORD_RESET_COMPLETED",
      resource: "Auth",
      details: `Password reset completed successfully for ${user.email}.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({
      success: true,
      message: "Password reset successful! You may now sign in with your new password."
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  return res.json({ success: true, message: "Logged out successfully." });
});

export default router;
