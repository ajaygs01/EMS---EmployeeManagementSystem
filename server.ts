import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
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
  if (
    isInitialized &&
    (process.env.NODE_ENV !== "production" || isMongoConnected())
  ) {
    return;
  }

  if (!initPromise) {
    initPromise = initDatabase()
      .then(() => {
        isInitialized = true;
      })
      .catch((err) => {
        isInitialized = false;
        initPromise = null;
        throw err;
      });
  }

  return initPromise;
}

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(cors());

app.use(
  express.json({
    limit: "15mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !dbStatus.connected) {
    return res.status(503).json({
      status: "error",
      app: "EMS - Employee Management System",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      message:
        "Database connection unavailable in production. In-memory fallback is strictly disabled to prevent temporary writes and data loss.",
    });
  }

  return res.status(200).json({
    status: dbStatus.connected ? "ok" : "degraded",
    app: "EMS - Employee Management System",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// --------------------------------------------------
// Database Initialization Middleware
// --------------------------------------------------

app.use("/api", async (req, res, next) => {
  // Health endpoint does not require database initialization
  if (req.path === "/health") {
    return next();
  }

  const isProd = process.env.NODE_ENV === "production";

  try {
    await ensureDatabaseReady();

    // In production, MongoDB must be connected
    if (isProd && !isMongoConnected()) {
      return res.status(503).json({
        success: false,
        error: "DATABASE_UNAVAILABLE",
        message:
          "Production database connection is offline. In-memory fallback is disabled in production to avoid temporary writes and data loss.",
        database: getDatabaseStatus(),
      });
    }

    next();
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: isProd
        ? "PRODUCTION_DATABASE_ERROR"
        : "DATABASE_INITIALIZING",
      message: isProd
        ? `Production database error: ${
            err.message || "Database connection failed"
          }. In-memory fallback is disabled in production to prevent temporary writes.`
        : `Database initialization in progress: ${
            err.message || "Please retry shortly."
          }`,
      database: getDatabaseStatus(),
    });
  }
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------

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

// --------------------------------------------------
// API 404 Handler
// --------------------------------------------------

app.all("/api/*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("API Error:", err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      error:
        process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
);

// --------------------------------------------------
// Server Startup
// --------------------------------------------------

async function startServer() {
  try {
    await ensureDatabaseReady();
  } catch (err: any) {
    console.error(
      "[Server Startup Notice] Database initialization failed:",
      err.message
    );

    if (process.env.NODE_ENV === "production") {
      console.error(
        "[Production Safe Mode] Server running in fail-safe mode. Production writes and operations are halted until MongoDB connection is restored."
      );
    }
  }

  // ------------------------------------------------
  // Development
  // ------------------------------------------------
  // Vite is dynamically imported ONLY in development.
  // This prevents Vercel production functions from
  // loading Vite/Rollup and its platform-specific
  // native dependencies.
  // ------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // ------------------------------------------------
    // Production
    // ------------------------------------------------

    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ------------------------------------------------
  // Local Server
  // ------------------------------------------------

  // Vercel provides its own serverless runtime,
  // therefore app.listen() must NOT run on Vercel.

  if (!process.env.VERCEL && !process.env.TEST_ENV) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `EMS Server successfully running on http://localhost:${PORT}`
      );
    });
  }
}

// --------------------------------------------------
// Start only when running locally
// --------------------------------------------------

if (!process.env.VERCEL && !process.env.TEST_ENV) {
  startServer().catch((err) => {
    console.error("Failed to start EMS server:", err);
  });
}

// --------------------------------------------------
// Export Express App for Vercel
// --------------------------------------------------

export default app;