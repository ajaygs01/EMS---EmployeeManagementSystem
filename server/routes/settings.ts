import { Router } from "express";
import { getDb, saveDb } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/settings
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    return res.json({ success: true, data: db.settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings - Update Company Settings
router.put("/", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const {
      companyName,
      tagline,
      address,
      contactEmail,
      contactPhone,
      currency,
      currencySymbol,
      taxRatePercent,
      workStartTime,
      workEndTime,
      halfDayHours
    } = req.body;

    if (companyName) db.settings.companyName = companyName;
    if (tagline !== undefined) db.settings.tagline = tagline;
    if (address !== undefined) db.settings.address = address;
    if (contactEmail) db.settings.contactEmail = contactEmail;
    if (contactPhone) db.settings.contactPhone = contactPhone;
    if (currency) db.settings.currency = currency;
    if (currencySymbol) db.settings.currencySymbol = currencySymbol;
    if (taxRatePercent !== undefined) db.settings.taxRatePercent = Number(taxRatePercent);
    if (workStartTime) db.settings.workStartTime = workStartTime;
    if (workEndTime) db.settings.workEndTime = workEndTime;
    if (halfDayHours !== undefined) db.settings.halfDayHours = Number(halfDayHours);

    await saveDb();

    return res.json({ success: true, message: "Company settings updated successfully.", data: db.settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
