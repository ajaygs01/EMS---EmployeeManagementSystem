import { Router } from "express";
import { getDb, saveDb, IPerformance } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/performance
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    let records = [...db.performances];

    const { employeeId, period, department } = req.query;

    if (user.role === "Employee") {
      records = records.filter((p) => p.employeeId === user.employeeId);
    } else if (employeeId && employeeId !== "all") {
      records = records.filter((p) => p.employeeId === employeeId);
    }

    if (period && period !== "all") {
      records = records.filter((p) => p.reviewPeriod.toLowerCase() === (period as string).toLowerCase());
    }
    if (department && department !== "all") {
      records = records.filter((p) => p.departmentName.toLowerCase() === (department as string).toLowerCase());
    }

    records.sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));

    return res.json({ success: true, data: records, total: records.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/performance/employee/:employeeId
router.get("/employee/:employeeId", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = req.user!;
    const employeeId = req.params.employeeId;

    if (user.role === "Employee" && employeeId !== user.employeeId) {
      return res.status(403).json({ success: false, message: "Unauthorized to view this performance file." });
    }

    const records = db.performances.filter((p) => p.employeeId === employeeId);
    return res.json({ success: true, data: records });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/performance - Create Performance Review
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const {
      employeeId,
      reviewPeriod,
      productivityScore = 4,
      qualityScore = 4,
      teamworkScore = 4,
      communicationScore = 4,
      leadershipScore = 4,
      strengths,
      areasForImprovement,
      managerComments
    } = req.body;

    if (!employeeId || !reviewPeriod) {
      return res.status(400).json({ success: false, message: "Employee and review period are required." });
    }

    const employee = db.employees.find((e) => e.id === employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const prod = Number(productivityScore) || 3;
    const qual = Number(qualityScore) || 3;
    const team = Number(teamworkScore) || 3;
    const comm = Number(communicationScore) || 3;
    const lead = Number(leadershipScore) || 3;

    // Automatic calculation of overall score (1.0 to 5.0)
    const overall = Number(((prod + qual + team + comm + lead) / 5).toFixed(1));

    let ratingLevel: "Excellent" | "Very Good" | "Good" | "Needs Improvement" | "Poor" = "Good";
    if (overall >= 4.5) ratingLevel = "Excellent";
    else if (overall >= 4.0) ratingLevel = "Very Good";
    else if (overall >= 3.0) ratingLevel = "Good";
    else if (overall >= 2.0) ratingLevel = "Needs Improvement";
    else ratingLevel = "Poor";

    const newReview: IPerformance = {
      id: `perf-${Date.now()}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      departmentName: employee.departmentName,
      reviewerId: req.user!.employeeId || req.user!.id,
      reviewerName: req.user!.name,
      reviewPeriod,
      reviewDate: new Date().toISOString().split("T")[0],
      productivityScore: prod,
      qualityScore: qual,
      teamworkScore: team,
      communicationScore: comm,
      leadershipScore: lead,
      overallScore: overall,
      ratingLevel,
      strengths: strengths || "Demonstrates strong work ethic and collaboration.",
      areasForImprovement: areasForImprovement || "Continue expanding domain knowledge.",
      managerComments: managerComments || "Valuable contributor to team initiatives.",
      createdAt: new Date().toISOString()
    };

    db.performances.unshift(newReview);

    // Notify employee
    const targetUser = db.users.find((u) => u.employeeId === employee.id);
    if (targetUser) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: targetUser.id,
        title: "Performance Review Published",
        message: `Your ${reviewPeriod} performance evaluation was published (${overall}/5.0 - ${ratingLevel}).`,
        type: "performance",
        read: false,
        link: "/performance",
        createdAt: new Date().toISOString()
      });
    }

    await saveDb();

    return res.status(201).json({ success: true, message: "Performance review created successfully.", data: newReview });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/performance/:id
router.put("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const review = db.performances.find((p) => p.id === id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Performance review not found." });
    }

    const {
      reviewPeriod,
      productivityScore,
      qualityScore,
      teamworkScore,
      communicationScore,
      leadershipScore,
      strengths,
      areasForImprovement,
      managerComments
    } = req.body;

    if (reviewPeriod) review.reviewPeriod = reviewPeriod;
    if (productivityScore !== undefined) review.productivityScore = Number(productivityScore);
    if (qualityScore !== undefined) review.qualityScore = Number(qualityScore);
    if (teamworkScore !== undefined) review.teamworkScore = Number(teamworkScore);
    if (communicationScore !== undefined) review.communicationScore = Number(communicationScore);
    if (leadershipScore !== undefined) review.leadershipScore = Number(leadershipScore);

    // Recalculate
    const overall = Number(
      ((review.productivityScore + review.qualityScore + review.teamworkScore + review.communicationScore + review.leadershipScore) / 5).toFixed(1)
    );
    review.overallScore = overall;
    if (overall >= 4.5) review.ratingLevel = "Excellent";
    else if (overall >= 4.0) review.ratingLevel = "Very Good";
    else if (overall >= 3.0) review.ratingLevel = "Good";
    else if (overall >= 2.0) review.ratingLevel = "Needs Improvement";
    else review.ratingLevel = "Poor";

    if (strengths !== undefined) review.strengths = strengths;
    if (areasForImprovement !== undefined) review.areasForImprovement = areasForImprovement;
    if (managerComments !== undefined) review.managerComments = managerComments;

    await saveDb();

    return res.json({ success: true, message: "Performance review updated.", data: review });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
