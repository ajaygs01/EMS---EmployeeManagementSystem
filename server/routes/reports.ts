import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/reports/summary
router.get("/summary", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();

    // 1. Employee stats
    const totalEmployees = db.employees.length;
    const activeEmployees = db.employees.filter((e) => e.status === "Active").length;
    const onLeaveEmployees = db.employees.filter((e) => e.status === "On Leave").length;
    const probationEmployees = db.employees.filter((e) => e.status === "Probation").length;

    // 2. Attendance stats (all-time or last 30 days)
    const totalAttendanceLogs = db.attendance.length;
    const presentCount = db.attendance.filter((a) => a.status === "Present").length;
    const lateCount = db.attendance.filter((a) => a.status === "Late").length;
    const absentCount = db.attendance.filter((a) => a.status === "Absent").length;
    const halfDayCount = db.attendance.filter((a) => a.status === "Half Day").length;
    const overallAttendanceRate = totalAttendanceLogs > 0 ? Math.round(((presentCount + lateCount) / totalAttendanceLogs) * 100) : 0;

    // 3. Leave stats
    const totalLeaves = db.leaves.length;
    const approvedLeaves = db.leaves.filter((l) => l.status === "Approved").length;
    const pendingLeaves = db.leaves.filter((l) => l.status === "Pending").length;
    const rejectedLeaves = db.leaves.filter((l) => l.status === "Rejected").length;

    // 4. Payroll stats
    const latestMonth = "2026-07";
    const monthlyPayrolls = db.payrolls.filter((p) => p.month === latestMonth);
    const totalGross = monthlyPayrolls.reduce((sum, p) => sum + p.grossSalary, 0);
    const totalNet = monthlyPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalTax = monthlyPayrolls.reduce((sum, p) => sum + p.tax, 0);
    const totalDeductions = monthlyPayrolls.reduce((sum, p) => sum + p.deductions, 0);

    // 5. Performance stats
    const performances = db.performances;
    const avgScore =
      performances.length > 0 ? Number((performances.reduce((acc, p) => acc + p.overallScore, 0) / performances.length).toFixed(2)) : 0;
    const topPerformers = [...performances].sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);
    const needsImprovement = performances.filter((p) => p.overallScore < 3.5);

    return res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          onLeave: onLeaveEmployees,
          probation: probationEmployees,
          departments: db.departments.map((d) => ({
            name: d.name,
            code: d.code,
            count: db.employees.filter((e) => e.departmentId === d.id).length
          }))
        },
        attendance: {
          totalLogs: totalAttendanceLogs,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          halfDay: halfDayCount,
          ratePercent: overallAttendanceRate
        },
        leave: {
          total: totalLeaves,
          approved: approvedLeaves,
          pending: pendingLeaves,
          rejected: rejectedLeaves
        },
        payroll: {
          month: latestMonth,
          totalGross,
          totalNet,
          totalTax,
          totalDeductions,
          employeeCount: monthlyPayrolls.length
        },
        performance: {
          averageScore: avgScore,
          topPerformers,
          needsImprovementCount: needsImprovement.length
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/export/:type - Export CSV
router.get("/export/:type", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const type = req.params.type;
    let csv = "";
    let filename = `ems_${type}_report_${Date.now()}.csv`;

    if (type === "employees") {
      csv = "Employee ID,First Name,Last Name,Email,Phone,Department,Position,Role,Status,Salary,Joining Date\n";
      db.employees.forEach((e) => {
        csv += `"${e.employeeId}","${e.firstName}","${e.lastName}","${e.email}","${e.phone}","${e.departmentName}","${e.position}","${e.role}","${e.status}",${e.salary},"${e.joiningDate}"\n`;
      });
    } else if (type === "attendance") {
      csv = "Date,Employee ID,Employee Name,Department,Check-In,Check-Out,Working Hours,Status,Notes\n";
      db.attendance.forEach((a) => {
        csv += `"${a.date}","${a.employeeId}","${a.employeeName}","${a.departmentName}","${a.checkIn || ""}","${a.checkOut || ""}",${a.workingHours},"${a.status}","${a.notes || ""}"\n`;
      });
    } else if (type === "leaves") {
      csv = "Employee Name,Department,Leave Type,Start Date,End Date,Total Days,Reason,Status,Applied Date,Reviewed By\n";
      db.leaves.forEach((l) => {
        csv += `"${l.employeeName}","${l.departmentName}","${l.leaveType}","${l.startDate}","${l.endDate}",${l.totalDays},"${l.reason.replace(/"/g, '""')}","${l.status}","${l.appliedDate}","${l.reviewedBy || ""}"\n`;
      });
    } else if (type === "payroll") {
      csv = "Month,Employee ID,Employee Name,Department,Designation,Basic,Allowances,Bonus,Overtime,Gross Salary,Deductions,Tax,Net Salary,Status\n";
      db.payrolls.forEach((p) => {
        csv += `"${p.month}","${p.employeeId}","${p.employeeName}","${p.departmentName}","${p.designation}",${p.basicSalary},${p.allowances},${p.bonus},${p.overtime},${p.grossSalary},${p.deductions},${p.tax},${p.netSalary},"${p.status}"\n`;
      });
    } else if (type === "performance") {
      csv = "Employee Name,Department,Review Period,Productivity,Quality,Teamwork,Communication,Leadership,Overall Score,Rating Level,Reviewer\n";
      db.performances.forEach((p) => {
        csv += `"${p.employeeName}","${p.departmentName}","${p.reviewPeriod}",${p.productivityScore},${p.qualityScore},${p.teamworkScore},${p.communicationScore},${p.leadershipScore},${p.overallScore},"${p.ratingLevel}","${p.reviewerName}"\n`;
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid report export type." });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
