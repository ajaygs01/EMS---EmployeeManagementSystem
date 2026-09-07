import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { initDatabase, getDatabaseStatus, isMongoConnected } from "./server/db.js";
import authRoutes from "./server/routes/auth.js";
import employeeRoutes from "./server/routes/employees.js";
import departmentRoutes from "./server/routes/departments.js";
import attendanceRoutes from "./server/routes/attendance.js";
import leaveRoutes from "./server/routes/leaves.js";
import payrollRoutes from "./server/routes/payroll.js";
import performanceRoutes from "./server/routes/performance.js";
import taskRoutes from "./server/routes/tasks.js";
import announcementRoutes from "./server/routes/announcements.js";
import documentRoutes from "./server/routes/documents.js";
import notificationRoutes from "./server/routes/notifications.js";
import reportRoutes from "./server/routes/reports.js";
import aiRoutes from "./server/routes/ai.js";
import settingRoutes from "./server/routes/settings.js";
import searchRoutes from "./server/routes/search.js";
import dashboardRoutes from "./server/routes/dashboard.js";
import auditLogRoutes from "./server/routes/auditLogs.js";
import designationRoutes from "./server/routes/designations.js";
import holidayRoutes from "./server/routes/holidays.js";
import userRoutes from "./server/routes/users.js";

dotenv.config();

const app = express();
const PORT = 3000;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<void> {
  if (isInitialized && (process.env.NODE_ENV !== "production" || isMongoConnected())) {
    return;
  }
  if (!initPromise) {
    initPromise = initDatabase()
      .then(() => {
        isInitialized = true;
      })
      .catch((err) => {
        isInitialized = false;
        initPromise = null; // Allow retry on subsequent requests
        throw err;
      });
  }
  return initPromise;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Diagnostic & Health Route
app.get("/api/health", (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !dbStatus.connected) {
    return res.status(503).json({
      status: "error",
      app: "EMS - Employee Management System",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      message: "Database connection unavailable in production. In-memory fallback is strictly disabled to prevent temporary writes and data loss."
    });
  }

  res.status(200).json({
    status: dbStatus.connected ? "ok" : "degraded",
    app: "EMS - Employee Management System",
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// Ensure database is initialized before serving any API route
app.use("/api", async (req, res, next) => {
  // Allow health checks to be evaluated directly
  if (req.path === "/health") {
    return next();
  }

  const isProd = process.env.NODE_ENV === "production";

  try {
    await ensureDatabaseReady();

    // In production, strictly enforce that MongoDB is connected
    if (isProd && !isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: "DATABASE_UNAVAILABLE",
        message: "Production database connection is offline. In-memory fallback is disabled in production to avoid temporary writes and data loss.",
        database: getDatabaseStatus()
      });
    }

    next();
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: isProd ? "PRODUCTION_DATABASE_ERROR" : "DATABASE_INITIALIZING",
      message: isProd
        ? `Production database error: ${err.message || "Database connection failed"}. In-memory fallback is disabled in production to prevent temporary writes.`
        : `Database initialization in progress: ${err.message || "Please retry shortly."}`,
      database: getDatabaseStatus()
    });
  }
});

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// Catch-all for any unhandled /api/* endpoint so it NEVER falls through to Vite HTML!
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

async function startServer() {
  try {
    await ensureDatabaseReady();
  } catch (err: any) {
    console.error("[Server Startup Notice] Database initialization failed:", err.message);
    if (process.env.NODE_ENV === "production") {
      console.error("[Production Safe Mode] Server running in fail-safe mode. Production writes and operations are halted until MongoDB connection is restored.");
    }
  }

  // Vite middleware for development / static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only bind port if not running in serverless Vercel function or test mode
  if (!process.env.VERCEL && !process.env.TEST_ENV) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`EMS Server successfully running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL && !process.env.TEST_ENV) {
  startServer().catch((err) => {
    console.error("Failed to start EMS server:", err);
  });
}

export default app;

