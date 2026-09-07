import { Router } from "express";
import { getDb, saveDb, IPayroll } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/payroll
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    let records = [...db.payrolls];

    const { month, department, status, employeeId } = req.query;

    if (user.role === "Employee") {
      records = records.filter((p) => p.employeeId === user.employeeId);
    } else if (employeeId && employeeId !== "all") {
      records = records.filter((p) => p.employeeId === employeeId);
    }

    if (month && month !== "all") {
      records = records.filter((p) => p.month === month);
    }
    if (department && department !== "all") {
      records = records.filter((p) => p.departmentName.toLowerCase() === (department as string).toLowerCase());
    }
    if (status && status !== "all") {
      records = records.filter((p) => p.status.toLowerCase() === (status as string).toLowerCase());
    }

    records.sort((a, b) => b.month.localeCompare(a.month) || b.createdAt.localeCompare(a.createdAt));

    return res.json({ success: true, data: records, total: records.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/payroll/:id - Get detailed payslip
router.get("/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const id = req.params.id;
    const payroll = db.payrolls.find((p) => p.id === id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found." });
    }

    if (user.role === "Employee" && payroll.employeeId !== user.employeeId) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this payslip." });
    }

    const employee = db.employees.find((e) => e.id === payroll.employeeId);
    const settings = db.settings;

    return res.json({
      success: true,
      data: {
        ...payroll,
        company: settings,
        employeeDetails: employee || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payroll - Generate/Process payroll record
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const {
      employeeId,
      month,
      basicSalary,
      allowances = 0,
      bonus = 0,
      overtime = 0,
      deductions = 0,
      tax = 0,
      status = "Paid",
      paymentMethod = "Direct Bank Deposit"
    } = req.body;

    if (!employeeId || !month || basicSalary === undefined) {
      return res.status(400).json({ success: false, message: "Employee, month, and basic salary are required." });
    }

    const employee = db.employees.find((e) => e.id === employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Formulas:
    // Gross Salary = Basic Salary + Allowances + Bonus + Overtime
    // Net Salary = Gross Salary - Deductions - Tax
    const b = Number(basicSalary) || 0;
    const a = Number(allowances) || 0;
    const bo = Number(bonus) || 0;
    const ot = Number(overtime) || 0;
    const gross = b + a + bo + ot;

    const d = Number(deductions) || 0;
    const t = Number(tax) || 0;
    const net = gross - d - t;

    // Check if payroll already exists for this employee and month
    const existing = db.payrolls.find((p) => p.employeeId === employee.id && p.month === month);
    if (existing) {
      existing.basicSalary = b;
      existing.allowances = a;
      existing.bonus = bo;
      existing.overtime = ot;
      existing.deductions = d;
      existing.tax = t;
      existing.grossSalary = gross;
      existing.netSalary = net;
      existing.status = status;
      existing.paymentMethod = paymentMethod;
      existing.paymentDate = status === "Paid" ? new Date().toISOString().split("T")[0] : undefined;

      await saveDb();
      return res.json({ success: true, message: `Payroll record for ${employee.firstName} (${month}) updated.`, data: existing });
    }

    const newPayroll: IPayroll = {
      id: `pay-${Date.now()}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      departmentName: employee.departmentName,
      designation: employee.position,
      month,
      basicSalary: b,
      allowances: a,
      bonus: bo,
      overtime: ot,
      deductions: d,
      tax: t,
      grossSalary: gross,
      netSalary: net,
      status,
      paymentDate: status === "Paid" ? new Date().toISOString().split("T")[0] : undefined,
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    db.payrolls.unshift(newPayroll);

    // Notify employee
    const targetUser = db.users.find((u) => u.employeeId === employee.id);
    if (targetUser) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: targetUser.id,
        title: "Payslip Generated",
        message: `Your payslip for ${month} has been processed ($${net.toLocaleString()} Net).`,
        type: "payroll",
        read: false,
        link: `/payroll/${newPayroll.id}`,
        createdAt: new Date().toISOString()
      });
    }

    await saveDb();

    return res.status(201).json({ success: true, message: "Payroll created successfully.", data: newPayroll });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/payroll/:id - Update status / details
router.put("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const payroll = db.payrolls.find((p) => p.id === id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found." });
    }

    const { status, paymentMethod, paymentDate, bonus, overtime, deductions, tax } = req.body;

    if (bonus !== undefined) payroll.bonus = Number(bonus);
    if (overtime !== undefined) payroll.overtime = Number(overtime);
    if (deductions !== undefined) payroll.deductions = Number(deductions);
    if (tax !== undefined) payroll.tax = Number(tax);

    // Recalculate
    payroll.grossSalary = payroll.basicSalary + payroll.allowances + payroll.bonus + payroll.overtime;
    payroll.netSalary = payroll.grossSalary - payroll.deductions - payroll.tax;

    if (status) payroll.status = status;
    if (paymentMethod) payroll.paymentMethod = paymentMethod;
    if (paymentDate) payroll.paymentDate = paymentDate;

    await saveDb();

    return res.json({ success: true, message: "Payroll record updated.", data: payroll });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/payroll/:id
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const index = db.payrolls.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Payroll record not found." });
    }

    db.payrolls.splice(index, 1);
    await saveDb();

    return res.json({ success: true, message: "Payroll record deleted successfully." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
