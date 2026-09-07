import { Router } from "express";
import { getDb, saveDb, IAnnouncement } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/announcements
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    let announcements = [...db.announcements];

    const { category, priority } = req.query;

    if (category && category !== "all") {
      announcements = announcements.filter((a) => a.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (priority && priority !== "all") {
      announcements = announcements.filter((a) => a.priority.toLowerCase() === (priority as string).toLowerCase());
    }

    announcements.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

    return res.json({ success: true, data: announcements, total: announcements.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/announcements
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const { title, description, category = "General", priority = "Medium", attachmentUrl } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required." });
    }

    const newAnnouncement: IAnnouncement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      date: new Date().toISOString().split("T")[0],
      priority,
      authorName: req.user!.name,
      authorRole: req.user!.role,
      attachmentUrl,
      createdAt: new Date().toISOString()
    };

    db.announcements.unshift(newAnnouncement);

    // Create notifications for all active users
    db.users.forEach((u) => {
      if (u.id !== req.user!.id) {
        db.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: u.id,
          title: "New Announcement",
          message: `${newAnnouncement.title} (${category})`,
          type: "announcement",
          read: false,
          link: "/announcements",
          createdAt: new Date().toISOString()
        });
      }
    });

    await saveDb();

    return res.status(201).json({ success: true, message: "Announcement published successfully.", data: newAnnouncement });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/announcements/:id
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin", "Manager"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    const index = db.announcements.findIndex((a) => a.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Announcement not found." });
    }

    db.announcements.splice(index, 1);
    await saveDb();

    return res.json({ success: true, message: "Announcement removed." });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
