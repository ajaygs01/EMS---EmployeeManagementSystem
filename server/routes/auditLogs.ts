import { Router } from "express";
import { getDb } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/audit-logs - Retrieve enterprise system audit trails (Admin / HR only)
router.get("/", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const { action, resource, search, limit = 100, page = 1 } = req.query;
    const db = getDb();
    let logs = db.auditLogs || [];

    // Filter by action
    if (action && typeof action === "string") {
      logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
    }

    // Filter by resource
    if (resource && typeof resource === "string") {
      logs = logs.filter((l) => l.resource.toLowerCase() === resource.toLowerCase());
    }

    // Filter by keyword search (userName, userEmail, details, resource)
    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.userEmail.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          (l.ipAddress && l.ipAddress.includes(q))
      );
    }

    // Sort newest first
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalCount = logs.length;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedLogs = logs.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      data: paginatedLogs,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch audit logs" });
  }
});

export default router;
