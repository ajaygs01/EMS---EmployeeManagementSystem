import { Router } from "express";
import { getDb, saveDb } from "../db.js";
import { verifyToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/notifications
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const userId = req.user!.id;
    const notifications = db.notifications.filter((n) => n.userId === userId);
    const unreadCount = notifications.filter((n) => !n.read).length;

    notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return res.json({ success: true, data: notifications, unreadCount });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      await saveDb();
    }
    return res.json({ success: true, message: "Notification marked as read." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const userId = req.user!.id;
    db.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    await saveDb();
    return res.json({ success: true, message: "All notifications marked as read." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const index = db.notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      db.notifications.splice(index, 1);
      await saveDb();
    }
    return res.json({ success: true, message: "Notification removed." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
