import { Router } from "express";
import { getDb, saveDb, IHoliday, logAuditEvent } from "../db.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/holidays - List holidays
router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    let holidays = [...(db.holidays || [])];
    const { type, year, search } = req.query;

    if (type && type !== "all") {
      holidays = holidays.filter((h) => h.type.toLowerCase() === (type as string).toLowerCase());
    }

    if (year) {
      holidays = holidays.filter((h) => h.date.startsWith(year as string));
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      holidays = holidays.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.applicableLocation.toLowerCase().includes(q)
      );
    }

    // Sort by date ascending
    holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return res.json({
      success: true,
      data: holidays,
      total: holidays.length
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/holidays/calendar-events - Aggregated company events
router.get("/calendar-events", verifyToken, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const { year = "2026", month } = req.query; // YYYY, MM (01-12)

    const events: Array<{
      id: string;
      title: string;
      date: string;
      endDate?: string;
      category: "holiday" | "birthday" | "anniversary" | "leave" | "event";
      description?: string;
      color: string;
      metadata?: any;
    }> = [];

    // 1. Company Holidays
    (db.holidays || []).forEach((h) => {
      events.push({
        id: `event-hol-${h.id}`,
        title: h.name,
        date: h.date,
        category: "holiday",
        description: `${h.type} Holiday • ${h.applicableLocation}: ${h.description}`,
        color: "amber",
        metadata: h
      });
    });

    // 2. Employee Birthdays (projected to requested year)
    db.employees.forEach((emp) => {
      if (emp.dob && emp.status === "Active") {
        const parts = emp.dob.split("-");
        if (parts.length === 3) {
          const bdayThisYear = `${year}-${parts[1]}-${parts[2]}`;
          events.push({
            id: `event-bday-${emp.id}`,
            title: `🎂 ${emp.firstName} ${emp.lastName}'s Birthday`,
            date: bdayThisYear,
            category: "birthday",
            description: `${emp.position} (${emp.departmentName}) celebrates their birthday!`,
            color: "purple",
            metadata: { employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, avatar: emp.avatar }
          });
        }
      }
    });

    // 3. Work Anniversaries (projected to requested year)
    db.employees.forEach((emp) => {
      if (emp.joiningDate && emp.status === "Active") {
        const parts = emp.joiningDate.split("-");
        if (parts.length === 3) {
          const joinYear = parseInt(parts[0], 10);
          const currentYearNum = parseInt(year as string, 10);
          const yearsAtCompany = currentYearNum - joinYear;
          if (yearsAtCompany > 0) {
            const anniThisYear = `${year}-${parts[1]}-${parts[2]}`;
            events.push({
              id: `event-anni-${emp.id}`,
              title: `🎖️ ${emp.firstName} ${emp.lastName}'s ${yearsAtCompany} Year Work Anniversary`,
              date: anniThisYear,
              category: "anniversary",
              description: `Celebrating ${yearsAtCompany} year(s) of dedicated service at BharatCorp!`,
              color: "blue",
              metadata: { employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, years: yearsAtCompany }
            });
          }
        }
      }
    });

    // 4. Approved Leaves
    db.leaves
      .filter((l) => l.status === "Approved")
      .forEach((l) => {
        events.push({
          id: `event-leave-${l.id}`,
          title: `🌴 ${l.employeeName} on Leave (${l.leaveType})`,
          date: l.startDate,
          endDate: l.endDate,
          category: "leave",
          description: `Approved ${l.leaveType} (${l.totalDays} day${l.totalDays > 1 ? "s" : ""})`,
          color: "emerald",
          metadata: l
        });
      });

    // 5. Company Announcements / Events
    db.announcements.forEach((a) => {
      events.push({
        id: `event-ann-${a.id}`,
        title: `📢 ${a.title}`,
        date: a.date,
        category: "event",
        description: a.description,
        color: "indigo",
        metadata: a
      });
    });

    return res.json({
      success: true,
      data: events,
      total: events.length
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/holidays - Add holiday
router.post("/", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const { name, date, description, type = "Corporate", applicableLocation = "Pan India", status = "Upcoming" } = req.body;

    if (!name || !date) {
      return res.status(400).json({ success: false, message: "Holiday name and date (YYYY-MM-DD) are required." });
    }

    const db = getDb();
    if (!db.holidays) db.holidays = [];

    const newHoliday: IHoliday = {
      id: `hol-${Date.now()}`,
      name: name.trim(),
      date,
      description: description || `${name} holiday observed.`,
      type: type as any,
      applicableLocation: applicableLocation || "Pan India",
      status: status as any,
      createdAt: new Date().toISOString()
    };

    db.holidays.push(newHoliday);
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "HOLIDAY_CREATED",
      resource: "Holiday",
      resourceId: newHoliday.id,
      details: `Added company holiday "${newHoliday.name}" for ${newHoliday.date}.`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.status(201).json({
      success: true,
      message: "Holiday added successfully.",
      data: newHoliday
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/holidays/:id - Edit holiday
router.put("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const { name, date, description, type, applicableLocation, status } = req.body;
    const db = getDb();
    if (!db.holidays) db.holidays = [];

    const index = db.holidays.findIndex((h) => h.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Holiday not found." });
    }

    const current = db.holidays[index];
    db.holidays[index] = {
      ...current,
      name: name ? name.trim() : current.name,
      date: date || current.date,
      description: description !== undefined ? description : current.description,
      type: type || current.type,
      applicableLocation: applicableLocation || current.applicableLocation,
      status: status || current.status
    };

    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "HOLIDAY_UPDATED",
      resource: "Holiday",
      resourceId: current.id,
      details: `Updated holiday "${db.holidays[index].name}".`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({
      success: true,
      message: "Holiday updated successfully.",
      data: db.holidays[index]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/holidays/:id
router.delete("/:id", verifyToken, authorizeRoles("Super Admin", "HR Admin"), async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    if (!db.holidays) db.holidays = [];

    const index = db.holidays.findIndex((h) => h.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Holiday not found." });
    }

    const removed = db.holidays[index];
    db.holidays.splice(index, 1);
    await saveDb();

    await logAuditEvent({
      userId: req.user!.id,
      userName: req.user!.name,
      userRole: req.user!.role,
      userEmail: req.user!.email,
      action: "HOLIDAY_DELETED",
      resource: "Holiday",
      resourceId: removed.id,
      details: `Deleted holiday "${removed.name}" (${removed.date}).`,
      ipAddress: req.ip || "127.0.0.1"
    });

    return res.json({ success: true, message: `Holiday "${removed.name}" deleted successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
