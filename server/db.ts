import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Db } from "mongodb";
import {
  connectToDatabase,
  getMongoDb,
  isMongoConnected,
  getDatabaseStatus
} from "./mongodb.js";

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  role: "Super Admin" | "HR Admin" | "Manager" | "Employee";
  employeeId: string;
  name: string;
  avatar: string;
  status: "Active" | "Inactive";
  createdAt: string;
  lastLogin?: string;
}

export interface IEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  address: string;
  city: string;
  state: string;
  country: string;
  departmentId: string;
  departmentName: string;
  position: string;
  role: "Super Admin" | "HR Admin" | "Manager" | "Employee";
  joiningDate: string;
  employmentType: "Full-Time" | "Part-Time" | "Contract" | "Internship";
  managerId: string | null;
  managerName: string | null;
  salary: number;
  status: "Active" | "Inactive" | "On Leave" | "Probation";
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  avatar: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDepartment {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId: string | null;
  managerName: string | null;
  employeeCount: number;
  status: "Active" | "Inactive";
  budget: number;
  location: string;
  createdAt: string;
}

export interface IDesignation {
  id: string;
  designationId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  description: string;
  minSalary: number;
  maxSalary: number;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface IHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: "National" | "Regional" | "Corporate";
  applicableLocation: string;
  status: "Active" | "Upcoming" | "Completed";
  createdAt: string;
}

export interface IAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:mm:ss
  checkOut: string | null; // HH:mm:ss
  workingHours: number; // in hours
  status: "Present" | "Absent" | "Late" | "Half Day" | "Leave";
  notes?: string;
  createdAt: string;
}

export interface ILeave {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: "Casual Leave" | "Sick Leave" | "Earned Leave" | "Emergency Leave" | "Maternity Leave" | "Paternity Leave" | "Unpaid Leave";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  documentUrl?: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
  reviewedBy?: string;
  reviewRemarks?: string;
  reviewedAt?: string;
}

export interface ILeaveBalance {
  employeeId: string;
  casualLeave: { total: number; used: number };
  sickLeave: { total: number; used: number };
  earnedLeave: { total: number; used: number };
  emergencyLeave: { total: number; used: number };
  maternityLeave: { total: number; used: number };
  paternityLeave: { total: number; used: number };
  unpaidLeave: { total: number; used: number };
}

export interface IPayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  month: string; // e.g. "2026-07" or "August 2026"
  basicSalary: number;
  allowances: number;
  bonus: number;
  overtime: number;
  deductions: number;
  tax: number;
  grossSalary: number;
  netSalary: number;
  status: "Pending" | "Processing" | "Paid";
  paymentDate?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface IPerformance {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  reviewerId: string;
  reviewerName: string;
  reviewPeriod: string;
  reviewDate: string;
  productivityScore: number; // 1-5
  qualityScore: number; // 1-5
  teamworkScore: number; // 1-5
  communicationScore: number; // 1-5
  leadershipScore: number; // 1-5
  overallScore: number; // calculated 1.0 - 5.0
  ratingLevel: "Excellent" | "Very Good" | "Good" | "Needs Improvement" | "Poor";
  strengths: string;
  areasForImprovement: string;
  managerComments: string;
  createdAt: string;
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  assignedBy: string;
  departmentName: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  startDate: string;
  dueDate: string;
  status: "Todo" | "In Progress" | "Completed" | "Overdue";
  progressPercent: number;
  createdAt: string;
}

export interface IAnnouncement {
  id: string;
  title: string;
  description: string;
  category: "General" | "HR" | "Events" | "Holiday" | "Policy" | "Emergency";
  date: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  authorName: string;
  authorRole: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface IDocument {
  id: string;
  name: string;
  type: "Resume" | "ID proof" | "Certificates" | "Offer letter" | "Experience letter" | "Payslips" | "Policy" | "Other";
  employeeId: string;
  employeeName: string;
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  fileUrl: string;
  createdAt: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "leave" | "task" | "payroll" | "performance" | "announcement" | "system";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface IAuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  metadata?: any;
  timestamp: string;
}

export interface ICompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
  workStartTime: string;
  workEndTime: string;
  halfDayHours: number;
}

export interface IDatabaseSchema {
  users: IUser[];
  employees: IEmployee[];
  departments: IDepartment[];
  designations: IDesignation[];
  holidays: IHoliday[];
  attendance: IAttendance[];
  leaves: ILeave[];
  leaveBalances: Record<string, ILeaveBalance>;
  payrolls: IPayroll[];
  performances: IPerformance[];
  tasks: ITask[];
  announcements: IAnnouncement[];
  documents: IDocument[];
  notifications: INotification[];
  auditLogs: IAuditLog[];
  settings: ICompanySettings;
}

const DATA_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DATA_DIR, "ems_database.json");

let dbMemory: IDatabaseSchema | null = null;
const collectionSignatures: Record<string, string> = {};

function computeSignature(data: any): string {
  if (!data) return "";
  try {
    const str = JSON.stringify(data);
    return crypto.createHash("md5").update(str).digest("hex");
  } catch {
    return String(Date.now());
  }
}

function updateAllSignatures(schema: IDatabaseSchema): void {
  collectionSignatures["users"] = computeSignature(schema.users);
  collectionSignatures["employees"] = computeSignature(schema.employees);
  collectionSignatures["departments"] = computeSignature(schema.departments);
  collectionSignatures["designations"] = computeSignature(schema.designations);
  collectionSignatures["holidays"] = computeSignature(schema.holidays);
  collectionSignatures["attendance"] = computeSignature(schema.attendance);
  collectionSignatures["leaves"] = computeSignature(schema.leaves);
  collectionSignatures["leaveBalances"] = computeSignature(schema.leaveBalances);
  collectionSignatures["payrolls"] = computeSignature(schema.payrolls);
  collectionSignatures["performances"] = computeSignature(schema.performances);
  collectionSignatures["tasks"] = computeSignature(schema.tasks);
  collectionSignatures["announcements"] = computeSignature(schema.announcements);
  collectionSignatures["documents"] = computeSignature(schema.documents);
  collectionSignatures["notifications"] = computeSignature(schema.notifications);
  collectionSignatures["auditLogs"] = computeSignature(schema.auditLogs);
  collectionSignatures["settings"] = computeSignature(schema.settings);
}

export function getDb(): IDatabaseSchema {
  if (!dbMemory) {
    throw new Error("Database not initialized! Call initDatabase() first.");
  }
  return dbMemory;
}

export async function logAuditEvent(entry: {
  userId?: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress?: string;
  metadata?: any;
}): Promise<void> {
  try {
    const db = getDb();
    if (!db.auditLogs) {
      db.auditLogs = [];
    }
    const log: IAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: entry.userId || "system",
      userName: entry.userName || "System / Automated",
      userRole: entry.userRole || "System",
      userEmail: entry.userEmail || "system@ems.internal",
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details,
      ipAddress: entry.ipAddress || "127.0.0.1",
      metadata: entry.metadata,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(log);
    // Keep max 500 logs
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
    await saveDb("auditLogs");
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

/**
 * Synchronizes an array collection with MongoDB Atlas.
 */
async function syncArrayCollection<T extends { id: string }>(
  db: Db,
  collectionName: string,
  items: T[]
): Promise<void> {
  const col = db.collection(collectionName);
  if (!items || items.length === 0) {
    await col.deleteMany({});
    return;
  }
  const ops = items.map((item) => ({
    replaceOne: {
      filter: { $or: [{ id: item.id }, { _id: item.id as any }] },
      replacement: { ...item, _id: item.id as any, id: item.id },
      upsert: true
    }
  }));
  await col.bulkWrite(ops, { ordered: false });

  // Remove deleted records safely matching both id and _id
  const currentIds = items.map((i) => i.id);
  await col.deleteMany({
    $and: [
      { id: { $nin: currentIds } },
      { _id: { $nin: currentIds as any } }
    ]
  });
}

/**
 * Synchronizes leaveBalances dictionary with MongoDB Atlas.
 */
async function syncLeaveBalances(
  db: Db,
  leaveBalances: Record<string, ILeaveBalance>
): Promise<void> {
  const col = db.collection("leaveBalances");
  const balances = Object.entries(leaveBalances || {})
    .map(([key, b]) => {
      const empId = (b.employeeId || key)?.trim();
      return {
        ...b,
        employeeId: empId,
        _id: empId as any
      };
    })
    .filter((b) => !!b.employeeId && typeof b.employeeId === "string");

  if (balances.length === 0) return;
  const ops = balances.map((b) => ({
    replaceOne: {
      filter: { employeeId: b.employeeId },
      replacement: { ...b, _id: b.employeeId as any },
      upsert: true
    }
  }));
  await col.bulkWrite(ops, { ordered: false });
}

/**
 * Synchronizes company settings with MongoDB Atlas.
 */
async function syncSettings(
  db: Db,
  settings: ICompanySettings
): Promise<void> {
  const col = db.collection("settings");
  await col.replaceOne(
    { _id: "companySettings" as any },
    { _id: "companySettings" as any, ...settings },
    { upsert: true }
  );
}

/**
 * Synchronizes modified collections to MongoDB Atlas.
 * Never writes production data to server/data/ems_database.json.
 */
export async function saveDb(targetCollection?: keyof IDatabaseSchema): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const mongoDb = getMongoDb();
  const isConnected = isMongoConnected();

  if (isProduction && (!mongoDb || !isConnected)) {
    throw new Error(
      "Database persistence error: MongoDB is unavailable in production mode. Writes cannot be accepted into temporary memory."
    );
  }

  if (!dbMemory) return;
  if (mongoDb && isMongoConnected()) {
    try {
      const syncMap: Record<string, () => Promise<void>> = {
        users: async () => {
          await syncArrayCollection(mongoDb, "users", dbMemory!.users);
          collectionSignatures["users"] = computeSignature(dbMemory!.users);
        },
        employees: async () => {
          await syncArrayCollection(mongoDb, "employees", dbMemory!.employees);
          collectionSignatures["employees"] = computeSignature(dbMemory!.employees);
        },
        departments: async () => {
          await syncArrayCollection(mongoDb, "departments", dbMemory!.departments);
          collectionSignatures["departments"] = computeSignature(dbMemory!.departments);
        },
        designations: async () => {
          await syncArrayCollection(mongoDb, "designations", dbMemory!.designations);
          collectionSignatures["designations"] = computeSignature(dbMemory!.designations);
        },
        holidays: async () => {
          await syncArrayCollection(mongoDb, "holidays", dbMemory!.holidays);
          collectionSignatures["holidays"] = computeSignature(dbMemory!.holidays);
        },
        attendance: async () => {
          await syncArrayCollection(mongoDb, "attendance", dbMemory!.attendance);
          collectionSignatures["attendance"] = computeSignature(dbMemory!.attendance);
        },
        leaves: async () => {
          await syncArrayCollection(mongoDb, "leaves", dbMemory!.leaves);
          collectionSignatures["leaves"] = computeSignature(dbMemory!.leaves);
        },
        leaveBalances: async () => {
          await syncLeaveBalances(mongoDb, dbMemory!.leaveBalances);
          collectionSignatures["leaveBalances"] = computeSignature(dbMemory!.leaveBalances);
        },
        payrolls: async () => {
          await syncArrayCollection(mongoDb, "payrolls", dbMemory!.payrolls);
          collectionSignatures["payrolls"] = computeSignature(dbMemory!.payrolls);
        },
        performances: async () => {
          await syncArrayCollection(mongoDb, "performances", dbMemory!.performances);
          collectionSignatures["performances"] = computeSignature(dbMemory!.performances);
        },
        tasks: async () => {
          await syncArrayCollection(mongoDb, "tasks", dbMemory!.tasks);
          collectionSignatures["tasks"] = computeSignature(dbMemory!.tasks);
        },
        announcements: async () => {
          await syncArrayCollection(mongoDb, "announcements", dbMemory!.announcements);
          collectionSignatures["announcements"] = computeSignature(dbMemory!.announcements);
        },
        documents: async () => {
          await syncArrayCollection(mongoDb, "documents", dbMemory!.documents);
          collectionSignatures["documents"] = computeSignature(dbMemory!.documents);
        },
        notifications: async () => {
          await syncArrayCollection(mongoDb, "notifications", dbMemory!.notifications);
          collectionSignatures["notifications"] = computeSignature(dbMemory!.notifications);
        },
        auditLogs: async () => {
          await syncArrayCollection(mongoDb, "auditLogs", dbMemory!.auditLogs);
          collectionSignatures["auditLogs"] = computeSignature(dbMemory!.auditLogs);
        },
        settings: async () => {
          await syncSettings(mongoDb, dbMemory!.settings);
          collectionSignatures["settings"] = computeSignature(dbMemory!.settings);
        }
      };

      if (targetCollection && syncMap[targetCollection]) {
        await syncMap[targetCollection]();
        return;
      }

      // Check all collections and only synchronize those that changed
      const pending: Promise<void>[] = [];
      for (const [colName, syncFn] of Object.entries(syncMap)) {
        const currentSig = computeSignature((dbMemory as any)[colName]);
        if (currentSig !== collectionSignatures[colName]) {
          pending.push(syncFn());
        }
      }

      if (pending.length > 0) {
        await Promise.all(pending);
      }
    } catch (err: any) {
      console.error("[MongoDB Save Error] Failed to persist changes to MongoDB Atlas:", err.message);
      throw new Error(`Database persistence failure: Failed to persist changes to MongoDB Atlas (${err.message})`);
    }
  } else {
    // MongoDB is NOT connected or unavailable
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Database persistence error: MongoDB is unavailable in production. Writes cannot be accepted into temporary memory."
      );
    }
    // In-memory fallback mode: changes are kept in memory for local development/testing only
    updateAllSignatures(dbMemory);
  }
}

/**
 * Normalizes an in-memory or loaded database schema to ensure referential
 * integrity and guarantee every employee has a valid leave balance record.
 */
export function normalizeDatabaseSchema(schema: IDatabaseSchema): void {
  if (!schema) return;

  const validEmployeeIds = new Set(schema.employees.map((e) => e.id));
  const validEmployeeCodes = new Map(schema.employees.filter((e) => e.employeeId).map((e) => [e.employeeId, e.id]));

  if (!schema.leaveBalances || typeof schema.leaveBalances !== "object") {
    schema.leaveBalances = {};
  }

  const cleanBalances: Record<string, ILeaveBalance> = {};
  const seenEmployeeIds = new Set<string>();

  // 1. Process and sanitize existing leave balances
  for (const [key, raw] of Object.entries(schema.leaveBalances)) {
    let resolvedId = raw.employeeId?.trim();
    if (!resolvedId) {
      if (validEmployeeIds.has(key)) {
        resolvedId = key;
      } else if (validEmployeeCodes.has(key)) {
        resolvedId = validEmployeeCodes.get(key);
      }
    } else if (!validEmployeeIds.has(resolvedId) && validEmployeeCodes.has(resolvedId)) {
      resolvedId = validEmployeeCodes.get(resolvedId);
    }

    // Must strictly reference a valid existing employee
    if (!resolvedId || !validEmployeeIds.has(resolvedId) || seenEmployeeIds.has(resolvedId)) {
      continue;
    }

    seenEmployeeIds.add(resolvedId);
    cleanBalances[resolvedId] = {
      employeeId: resolvedId,
      casualLeave: raw.casualLeave || { total: 12, used: 0 },
      sickLeave: raw.sickLeave || { total: 10, used: 0 },
      earnedLeave: raw.earnedLeave || { total: 15, used: 0 },
      emergencyLeave: raw.emergencyLeave || { total: 5, used: 0 },
      maternityLeave: raw.maternityLeave || { total: 90, used: 0 },
      paternityLeave: raw.paternityLeave || { total: 14, used: 0 },
      unpaidLeave: raw.unpaidLeave || { total: 30, used: 0 }
    };
  }

  // 2. Ensure EVERY employee in employees list has a leave balance
  for (const emp of schema.employees) {
    if (!seenEmployeeIds.has(emp.id)) {
      seenEmployeeIds.add(emp.id);
      cleanBalances[emp.id] = {
        employeeId: emp.id,
        casualLeave: { total: 12, used: 0 },
        sickLeave: { total: 10, used: 0 },
        earnedLeave: { total: 15, used: 0 },
        emergencyLeave: { total: 5, used: 0 },
        maternityLeave: { total: 90, used: 0 },
        paternityLeave: { total: 14, used: 0 },
        unpaidLeave: { total: 30, used: 0 }
      };
    }
  }

  schema.leaveBalances = cleanBalances;

  // 3. Process and sanitize tasks to ensure data consistency
  if (Array.isArray(schema.tasks)) {
    const validEmployeesMap = new Map(schema.employees.map((e) => [e.id, e]));
    schema.tasks = schema.tasks.map((t: any) => {
      const emp = validEmployeesMap.get(t.assignedEmployeeId);
      const id = String(t.id || t._id || `task-${Date.now()}`);
      return {
        id,
        title: String(t.title || "Untitled Task").trim(),
        description: String(t.description || ""),
        assignedEmployeeId: String(t.assignedEmployeeId || (emp ? emp.id : "")),
        assignedEmployeeName: emp ? `${emp.firstName} ${emp.lastName}` : String(t.assignedEmployeeName || "Unassigned"),
        assignedBy: String(t.assignedBy || "Super Admin"),
        departmentName: emp ? emp.departmentName : String(t.departmentName || "General"),
        priority: (["Low", "Medium", "High", "Critical"].includes(t.priority) ? t.priority : "Medium") as any,
        startDate: String(t.startDate || new Date().toISOString().split("T")[0]),
        dueDate: String(t.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]),
        status: (["Todo", "In Progress", "Completed", "Overdue"].includes(t.status) ? t.status : "Todo") as any,
        progressPercent: typeof t.progressPercent === "number" ? Math.min(100, Math.max(0, t.progressPercent)) : (t.status === "Completed" ? 100 : 0),
        createdAt: String(t.createdAt || new Date().toISOString())
      };
    });
  } else {
    schema.tasks = [];
  }
}

/**
 * Creates recommended enterprise indexes on MongoDB collections.
 * Uses a partial unique index on leaveBalances to prevent duplicate-key errors.
 */
async function ensureMongoIndexes(db: Db): Promise<void> {
  try {
    // Check if leaveBalances has a legacy index without partialFilterExpression
    try {
      const existingIndexes = await db.collection("leaveBalances").indexes();
      const legacyEmpIdx = existingIndexes.find(
        (idx) => idx.name === "employeeId_1" && (!idx.partialFilterExpression || typeof idx.partialFilterExpression !== "object")
      );
      if (legacyEmpIdx) {
        console.log("[MongoDB Indexes] Upgrading leaveBalances index to partialFilterExpression...");
        await db.collection("leaveBalances").dropIndex("employeeId_1");
      }
    } catch {
      // Collection may not exist yet, continue
    }

    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true, background: true }),
      db.collection("users").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("employees").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("employees").createIndex({ employeeId: 1 }, { background: true }),
      db.collection("employees").createIndex({ email: 1 }, { background: true }),
      db.collection("employees").createIndex({ departmentId: 1 }, { background: true }),
      db.collection("departments").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("departments").createIndex({ code: 1 }, { background: true }),
      db.collection("designations").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("holidays").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("holidays").createIndex({ date: 1 }, { background: true }),
      db.collection("attendance").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("attendance").createIndex({ employeeId: 1, date: 1 }, { background: true }),
      db.collection("leaves").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("leaves").createIndex({ employeeId: 1 }, { background: true }),
      // Redesigned partial unique index: permits null/absent if optional, but enforces uniqueness for string employeeIds
      db.collection("leaveBalances").createIndex(
        { employeeId: 1 },
        {
          unique: true,
          partialFilterExpression: { employeeId: { $type: "string" } },
          background: true
        }
      ),
      db.collection("payrolls").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("payrolls").createIndex({ employeeId: 1, month: 1 }, { background: true }),
      db.collection("performances").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("tasks").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("tasks").createIndex({ assignedEmployeeId: 1 }, { background: true }),
      db.collection("announcements").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("documents").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("notifications").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("notifications").createIndex({ userId: 1, read: 1 }, { background: true }),
      db.collection("auditLogs").createIndex({ id: 1 }, { unique: true, background: true }),
      db.collection("auditLogs").createIndex({ timestamp: -1 }, { background: true })
    ]);
  } catch (idxErr: any) {
    console.warn("[MongoDB Index Warning] Non-fatal index creation warning:", idxErr.message);
  }
}

/**
 * Checks deterministically whether the MongoDB database requires initial seeding.
 * A database is considered non-empty if primary entities (users or employees) exist.
 */
async function isDatabaseEmpty(db: Db): Promise<boolean> {
  const [usersCount, employeesCount] = await Promise.all([
    db.collection("users").countDocuments({}, { limit: 1 }),
    db.collection("employees").countDocuments({}, { limit: 1 })
  ]);
  return usersCount === 0 && employeesCount === 0;
}

/**
 * Loads all 16 collections from MongoDB Atlas into memory without overwriting.
 * Automatically self-heals missing leave balances for existing employees if any.
 */
async function loadFromMongo(db: Db): Promise<IDatabaseSchema> {
  const [
    users,
    employees,
    departments,
    designations,
    holidays,
    attendance,
    leaves,
    leaveBalanceDocs,
    payrolls,
    performances,
    tasks,
    announcements,
    documents,
    notifications,
    auditLogs,
    settingsDoc
  ] = await Promise.all([
    db.collection<IUser>("users").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IEmployee>("employees").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IDepartment>("departments").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IDesignation>("designations").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IHoliday>("holidays").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IAttendance>("attendance").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<ILeave>("leaves").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<ILeaveBalance>("leaveBalances").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IPayroll>("payrolls").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IPerformance>("performances").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<any>("tasks").find({}).toArray(),
    db.collection<IAnnouncement>("announcements").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IDocument>("documents").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<INotification>("notifications").find({}, { projection: { _id: 0 } }).toArray(),
    db.collection<IAuditLog>("auditLogs").find({}, { projection: { _id: 0 } }).sort({ timestamp: -1 }).limit(500).toArray(),
    db.collection<ICompanySettings>("settings").findOne({ _id: "companySettings" as any }, { projection: { _id: 0 } })
  ]);

  const leaveBalances: Record<string, ILeaveBalance> = {};
  for (const b of leaveBalanceDocs) {
    if (b.employeeId && typeof b.employeeId === "string") {
      leaveBalances[b.employeeId] = b;
    }
  }

  const defaultSettings: ICompanySettings = {
    companyName: "Bharat Enterprise Technologies Ltd.",
    tagline: "Empowering Modern Indian Workplaces",
    address: "Prestige Cyber Towers, 6th Floor, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103",
    contactEmail: "admin@bharatcorp.in",
    contactPhone: "+91 80 4123 4567",
    currency: "INR",
    currencySymbol: "₹",
    taxRatePercent: 18,
    workStartTime: "09:00",
    workEndTime: "18:00",
    halfDayHours: 4.5
  };

  const loadedSchema: IDatabaseSchema = {
    users,
    employees,
    departments,
    designations: designations.length > 0 ? designations : generateDefaultDesignations(),
    holidays: holidays.length > 0 ? holidays : generateDefaultHolidays(),
    attendance,
    leaves,
    leaveBalances,
    payrolls,
    performances,
    tasks,
    announcements,
    documents,
    notifications,
    auditLogs,
    settings: (settingsDoc as unknown as ICompanySettings) || defaultSettings
  };

  // Self-heal and normalize schema
  normalizeDatabaseSchema(loadedSchema);

  // If any employees had missing leave balances in MongoDB, safely persist their defaults
  const missingEmployeeBalances = employees.filter((e) => !leaveBalanceDocs.some((b) => b.employeeId === e.id));
  if (missingEmployeeBalances.length > 0) {
    console.info(`[MongoDB Atlas] Initializing ${missingEmployeeBalances.length} missing employee leave balances in database...`);
    await idempotentSeedLeaveBalances(db, loadedSchema.leaveBalances, employees);
  }

  return loadedSchema;
}

/**
 * Idempotently seeds an array collection using $setOnInsert.
 * Will NOT duplicate records or overwrite existing records.
 */
async function idempotentSeedArrayCollection<T extends { id: string }>(
  db: Db,
  collectionName: string,
  items: T[]
): Promise<void> {
  if (!items || items.length === 0) return;
  const col = db.collection(collectionName);
  const ops = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id as any },
      update: { $setOnInsert: { ...item, _id: item.id as any } },
      upsert: true
    }
  }));
  await col.bulkWrite(ops, { ordered: false });
}

/**
 * Idempotently seeds leaveBalances referencing only valid existing employees.
 * Guarantees that no records with employeeId: null are ever seeded.
 */
async function idempotentSeedLeaveBalances(
  db: Db,
  leaveBalances: Record<string, ILeaveBalance>,
  employees: IEmployee[]
): Promise<void> {
  const col = db.collection("leaveBalances");
  const validEmployeeIds = new Set(employees.map((e) => e.id));
  const balancesToSeed: Array<ILeaveBalance & { _id: string }> = [];
  const seenEmpIds = new Set<string>();

  for (const [key, raw] of Object.entries(leaveBalances || {})) {
    const empId = raw.employeeId?.trim() || key.trim();
    if (!empId || !validEmployeeIds.has(empId) || seenEmpIds.has(empId)) continue;
    seenEmpIds.add(empId);

    balancesToSeed.push({
      _id: empId,
      employeeId: empId,
      casualLeave: raw.casualLeave || { total: 12, used: 0 },
      sickLeave: raw.sickLeave || { total: 10, used: 0 },
      earnedLeave: raw.earnedLeave || { total: 15, used: 0 },
      emergencyLeave: raw.emergencyLeave || { total: 5, used: 0 },
      maternityLeave: raw.maternityLeave || { total: 90, used: 0 },
      paternityLeave: raw.paternityLeave || { total: 14, used: 0 },
      unpaidLeave: raw.unpaidLeave || { total: 30, used: 0 }
    });
  }

  for (const emp of employees) {
    if (!seenEmpIds.has(emp.id)) {
      seenEmpIds.add(emp.id);
      balancesToSeed.push({
        _id: emp.id,
        employeeId: emp.id,
        casualLeave: { total: 12, used: 0 },
        sickLeave: { total: 10, used: 0 },
        earnedLeave: { total: 15, used: 0 },
        emergencyLeave: { total: 5, used: 0 },
        maternityLeave: { total: 90, used: 0 },
        paternityLeave: { total: 14, used: 0 },
        unpaidLeave: { total: 30, used: 0 }
      });
    }
  }

  if (balancesToSeed.length === 0) return;

  const ops = balancesToSeed.map((b) => ({
    updateOne: {
      filter: { employeeId: b.employeeId },
      update: { $setOnInsert: { ...b, _id: b.employeeId as any } },
      upsert: true
    }
  }));
  await col.bulkWrite(ops, { ordered: false });
}

/**
 * Seeds initial demo data directly into MongoDB Atlas.
 * Fully idempotent: safe to run multiple times without throwing E11000 duplicate key errors
 * or overwriting existing data.
 */
async function seedToMongo(db: Db, data: IDatabaseSchema): Promise<void> {
  // Normalize schema to guarantee zero null employeeIds and complete referential integrity
  normalizeDatabaseSchema(data);

  await Promise.all([
    idempotentSeedArrayCollection(db, "users", data.users),
    idempotentSeedArrayCollection(db, "employees", data.employees),
    idempotentSeedArrayCollection(db, "departments", data.departments),
    idempotentSeedArrayCollection(db, "designations", data.designations),
    idempotentSeedArrayCollection(db, "holidays", data.holidays),
    idempotentSeedArrayCollection(db, "attendance", data.attendance),
    idempotentSeedArrayCollection(db, "leaves", data.leaves),
    idempotentSeedLeaveBalances(db, data.leaveBalances, data.employees),
    idempotentSeedArrayCollection(db, "payrolls", data.payrolls),
    idempotentSeedArrayCollection(db, "performances", data.performances),
    idempotentSeedArrayCollection(db, "tasks", data.tasks),
    idempotentSeedArrayCollection(db, "announcements", data.announcements),
    idempotentSeedArrayCollection(db, "documents", data.documents),
    idempotentSeedArrayCollection(db, "notifications", data.notifications),
    idempotentSeedArrayCollection(db, "auditLogs", data.auditLogs),
    db.collection("settings").updateOne(
      { _id: "companySettings" as any },
      { $setOnInsert: { _id: "companySettings" as any, ...data.settings } },
      { upsert: true }
    )
  ]);
}

/**
 * Initializes the database connection and loads data into memory.
 * - When MongoDB is connected, initializes indexes and seeds or loads data into MongoDB.
 * - When MongoDB is connected, NEVER falls back to in-memory mode if initialization fails.
 * - In production (NODE_ENV=production), strictly halts on database failure.
 * - In local development, in-memory fallback is allowed ONLY when MongoDB is genuinely unavailable.
 */
export async function initDatabase(): Promise<void> {
  const { connected, db, error } = await connectToDatabase();

  if (connected && db) {
    try {
      await ensureMongoIndexes(db);

      const isEmpty = await isDatabaseEmpty(db);

      if (!isEmpty) {
        console.log(`[MongoDB Atlas] Found existing enterprise database in "${db.databaseName}". Loading collections...`);
        dbMemory = await loadFromMongo(db);
        updateAllSignatures(dbMemory);
        console.log(
          `[MongoDB Atlas] Successfully loaded production database: ${dbMemory.employees.length} employees, ${dbMemory.users.length} users across 16 collections.`
        );
        return;
      }

      console.log(`[MongoDB Atlas] Database "${db.databaseName}" is empty. Seeding initial enterprise collections into MongoDB Atlas...`);
      // If local seed file exists, use its rich 132-employee data to seed Atlas, otherwise generate fresh
      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, "utf-8");
          dbMemory = JSON.parse(raw);
          if (!dbMemory!.designations || dbMemory!.designations.length === 0) {
            dbMemory!.designations = generateDefaultDesignations();
          }
          if (!dbMemory!.holidays || dbMemory!.holidays.length === 0) {
            dbMemory!.holidays = generateDefaultHolidays();
          }
        } catch {
          dbMemory = await generateSeedData();
        }
      } else {
        dbMemory = await generateSeedData();
      }

      // Ensure zero null employeeIds and complete referential integrity before seeding
      normalizeDatabaseSchema(dbMemory!);

      await seedToMongo(db, dbMemory!);
      updateAllSignatures(dbMemory!);
      console.log(`[MongoDB Atlas] Initial seeding into "${db.databaseName}" completed successfully.`);
      return;
    } catch (mongoErr: any) {
      console.error(`[MongoDB Atlas] Error initializing database "${db.databaseName}":`, mongoErr.message);
      // Requirement 8 & 10: When MongoDB is connected, DO NOT silently fall back to in-memory mode!
      throw new Error(`MongoDB initialization failed for database "${db.databaseName}": ${mongoErr.message}`);
    }
  }

  // Handle failure to connect (connected === false)
  if (process.env.NODE_ENV === "production") {
    const uri = process.env.MONGODB_URI?.trim();
    const isUriConfigured = !!(uri && (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")));
    const errorDetails = error || (!isUriConfigured
      ? "MONGODB_URI environment variable is missing or invalid."
      : "MongoDB connection could not be established.");
    const fullMsg = `[Production Database Error] Production deployment requires a live MongoDB connection: ${errorDetails} In-memory fallback is strictly disabled in production to prevent data loss.`;
    console.error(fullMsg);
    throw new Error(fullMsg);
  }

  // Graceful fallback for local development/testing ONLY when MongoDB is genuinely unavailable
  const displayReason = error?.includes("SSL alert number 80")
    ? "Atlas requires Network Access IP Whitelist (0.0.0.0/0)"
    : (error || "MONGODB_URI not configured");
  console.info(
    `[Database Notice] Active mode: in-memory fallback (${displayReason}). Changes are transient and MongoDB persistent storage is inactive. This mode is restricted to local development/testing.`
  );

  if (!dbMemory) {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        dbMemory = JSON.parse(raw);
      } catch {
        dbMemory = await generateSeedData();
      }
    } else {
      dbMemory = await generateSeedData();
    }
    if (dbMemory) {
      normalizeDatabaseSchema(dbMemory);
      updateAllSignatures(dbMemory);
    }
  }
}

async function generateSeedData(): Promise<IDatabaseSchema> {
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin@123";
  const hrPassword = process.env.DEMO_HR_PASSWORD || "HR@123";
  const managerPassword = process.env.DEMO_MANAGER_PASSWORD || "Manager@123";
  const employeePassword = process.env.DEMO_EMPLOYEE_PASSWORD || "Employee@123";

  const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
  const hrPasswordHash = bcrypt.hashSync(hrPassword, 10);
  const managerPasswordHash = bcrypt.hashSync(managerPassword, 10);
  const employeePasswordHash = bcrypt.hashSync(employeePassword, 10);

  const departments: IDepartment[] = [
    {
      id: "dept-1",
      name: "Human Resources",
      code: "HR",
      description: "Oversees employee relations, talent acquisition, payroll, PF/ESI compliance, and organizational development.",
      managerId: "emp-2",
      managerName: "Priya Patel",
      employeeCount: 3,
      status: "Active",
      budget: 1800000,
      location: "Tower 2, Floor 4, Bengaluru Tech Park",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "dept-2",
      name: "Information Technology",
      code: "IT",
      description: "Manages software engineering, cloud infrastructure, AI services, and cybersecurity systems.",
      managerId: "emp-4",
      managerName: "Rajesh Kumar",
      employeeCount: 5,
      status: "Active",
      budget: 5200000,
      location: "Tower 1, Floor 6, Bengaluru Tech Park",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "dept-3",
      name: "Finance & Accounts",
      code: "FIN",
      description: "Handles financial planning, auditing, GST & TDS compliance, payroll processing, and budget forecasts.",
      managerId: "emp-5",
      managerName: "Neha Gupta",
      employeeCount: 2,
      status: "Active",
      budget: 2400000,
      location: "Tower 2, Floor 3, Bengaluru Tech Park",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "dept-4",
      name: "Marketing & Growth",
      code: "MKT",
      description: "Drives brand visibility, growth campaigns, customer research, digital advertising, and enterprise PR.",
      managerId: "emp-4",
      managerName: "Rajesh Kumar",
      employeeCount: 2,
      status: "Active",
      budget: 3100000,
      location: "Cyber City, Phase 2, Gurugram",
      createdAt: "2024-02-01T08:00:00.000Z"
    },
    {
      id: "dept-5",
      name: "Sales & Enterprise Partnerships",
      code: "SALES",
      description: "Directs client acquisition, enterprise solution sales, client relations, and revenue operations across India.",
      managerId: "emp-1",
      managerName: "Aarav Sharma",
      employeeCount: 2,
      status: "Active",
      budget: 4500000,
      location: "Bandra Kurla Complex (BKC), Mumbai",
      createdAt: "2024-02-01T08:00:00.000Z"
    },
    {
      id: "dept-6",
      name: "Operations & Logistics",
      code: "OPS",
      description: "Ensures operational excellence, procurement, facilities management, and pan-India vendor coordination.",
      managerId: "emp-1",
      managerName: "Aarav Sharma",
      employeeCount: 2,
      status: "Active",
      budget: 2000000,
      location: "HITEC City, Hyderabad",
      createdAt: "2024-02-15T08:00:00.000Z"
    }
  ];

  const employees: IEmployee[] = [
    {
      id: "emp-1",
      employeeId: "EMP-1001",
      firstName: "Aarav",
      lastName: "Sharma",
      email: "admin@example.com",
      phone: "+91 98201 45678",
      gender: "Male",
      dob: "1985-04-12",
      address: "Flat 802, Prestige Palms, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      departmentId: "dept-1",
      departmentName: "Human Resources",
      position: "Managing Director & Super Admin",
      role: "Super Admin",
      joiningDate: "2022-01-10",
      employmentType: "Full-Time",
      managerId: null,
      managerName: null,
      salary: 3600000, // 36 LPA
      status: "Active",
      emergencyContact: {
        name: "Meera Sharma",
        relationship: "Spouse",
        phone: "+91 98201 98765"
      },
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      notes: "Company Super Administrator and Managing Director.",
      createdAt: "2022-01-10T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-2",
      employeeId: "EMP-1002",
      firstName: "Priya",
      lastName: "Patel",
      email: "hr@example.com",
      phone: "+91 98450 12345",
      gender: "Female",
      dob: "1990-09-23",
      address: "42 Coral Heights, HSR Layout Sector 2",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      departmentId: "dept-1",
      departmentName: "Human Resources",
      position: "Senior HR Director",
      role: "HR Admin",
      joiningDate: "2022-06-15",
      employmentType: "Full-Time",
      managerId: "emp-1",
      managerName: "Aarav Sharma",
      salary: 2200000, // 22 LPA
      status: "Active",
      emergencyContact: {
        name: "Kunal Patel",
        relationship: "Brother",
        phone: "+91 98450 67890"
      },
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      notes: "Lead HR Administrator managing payroll, PF/TDS, talent acquisition, and organizational policies.",
      createdAt: "2022-06-15T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-3",
      employeeId: "EMP-1003",
      firstName: "Ananya",
      lastName: "Iyer",
      email: "hr2@example.com",
      phone: "+91 97110 54321",
      gender: "Female",
      dob: "1993-02-18",
      address: "B-304, Godrej Woods, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      departmentId: "dept-1",
      departmentName: "Human Resources",
      position: "HR & Talent Specialist",
      role: "HR Admin",
      joiningDate: "2023-03-01",
      employmentType: "Full-Time",
      managerId: "emp-2",
      managerName: "Priya Patel",
      salary: 1100000, // 11 LPA
      status: "Active",
      emergencyContact: {
        name: "S. K. Iyer",
        relationship: "Father",
        phone: "+91 97110 99887"
      },
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      notes: "Specializes in talent onboarding, campus hiring, and employee wellbeing initiatives.",
      createdAt: "2023-03-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-4",
      employeeId: "EMP-1004",
      firstName: "Rajesh",
      lastName: "Kumar",
      email: "manager@example.com",
      phone: "+91 99800 23456",
      gender: "Male",
      dob: "1988-11-05",
      address: "15 Palm Meadows, Marathahalli",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      position: "Engineering & IT Manager",
      role: "Manager",
      joiningDate: "2022-09-01",
      employmentType: "Full-Time",
      managerId: "emp-1",
      managerName: "Aarav Sharma",
      salary: 2800000, // 28 LPA
      status: "Active",
      emergencyContact: {
        name: "Sunita Kumar",
        relationship: "Spouse",
        phone: "+91 99800 65432"
      },
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      notes: "Engineering team manager leading microservices, web apps, and DevOps.",
      createdAt: "2022-09-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-5",
      employeeId: "EMP-1005",
      firstName: "Neha",
      lastName: "Gupta",
      email: "manager2@example.com",
      phone: "+91 98100 87654",
      gender: "Female",
      dob: "1987-07-30",
      address: "Tower 5, DLF Phase 5",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      departmentId: "dept-3",
      departmentName: "Finance & Accounts",
      position: "Finance Controller & Manager",
      role: "Manager",
      joiningDate: "2023-01-15",
      employmentType: "Full-Time",
      managerId: "emp-1",
      managerName: "Aarav Sharma",
      salary: 2400000, // 24 LPA
      status: "Active",
      emergencyContact: {
        name: "Manish Gupta",
        relationship: "Spouse",
        phone: "+91 98100 11223"
      },
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
      notes: "Directs fiscal reporting, statutory audit, GST filings, and departmental budgets.",
      createdAt: "2023-01-15T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-6",
      employeeId: "EMP-1006",
      firstName: "Vikram",
      lastName: "Malhotra",
      email: "employee@example.com",
      phone: "+91 99000 34567",
      gender: "Male",
      dob: "1994-06-14",
      address: "12 Green Glen Layout, Bellandur",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      position: "Senior Full Stack Engineer",
      role: "Employee",
      joiningDate: "2023-04-10",
      employmentType: "Full-Time",
      managerId: "emp-4",
      managerName: "Rajesh Kumar",
      salary: 1800000, // 18 LPA
      status: "Active",
      emergencyContact: {
        name: "Pooja Malhotra",
        relationship: "Sister",
        phone: "+91 99000 76543"
      },
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      notes: "Core developer for React, Node.js, and high-performance microservices.",
      createdAt: "2023-04-10T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-7",
      employeeId: "EMP-1007",
      firstName: "Sneha",
      lastName: "Reddy",
      email: "sneha.reddy@example.com",
      phone: "+91 98490 67890",
      gender: "Female",
      dob: "1996-10-08",
      address: "704 Cyber Towers enclave, Madhapur",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      position: "Frontend UI/UX Developer",
      role: "Employee",
      joiningDate: "2023-08-01",
      employmentType: "Full-Time",
      managerId: "emp-4",
      managerName: "Rajesh Kumar",
      salary: 1400000, // 14 LPA
      status: "Active",
      emergencyContact: {
        name: "Venkat Reddy",
        relationship: "Father",
        phone: "+91 98490 12340"
      },
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      notes: "Designs accessible, intuitive modern user interfaces, Tailwind design systems, and mobile layouts.",
      createdAt: "2023-08-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-8",
      employeeId: "EMP-1008",
      firstName: "Rohan",
      lastName: "Verma",
      email: "rohan.verma@example.com",
      phone: "+91 98230 45678",
      gender: "Male",
      dob: "1992-12-03",
      address: "Flat 302, Rohan Viti, Baner",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      position: "DevOps & Cloud Architect",
      role: "Employee",
      joiningDate: "2023-11-15",
      employmentType: "Full-Time",
      managerId: "emp-4",
      managerName: "Rajesh Kumar",
      salary: 1650000, // 16.5 LPA
      status: "Active",
      emergencyContact: {
        name: "Kavita Verma",
        relationship: "Mother",
        phone: "+91 98230 87654"
      },
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      notes: "Maintains AWS/GCP cloud environments, Docker containers, CI/CD pipelines, and server security.",
      createdAt: "2023-11-15T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-9",
      employeeId: "EMP-1009",
      firstName: "Pooja",
      lastName: "Mehta",
      email: "pooja.mehta@example.com",
      phone: "+91 98200 98765",
      gender: "Female",
      dob: "1995-03-27",
      address: "101 Sea View Apartments, Worli",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      departmentId: "dept-4",
      departmentName: "Marketing & Growth",
      position: "Growth Marketing Lead",
      role: "Employee",
      joiningDate: "2024-01-08",
      employmentType: "Full-Time",
      managerId: "emp-4",
      managerName: "Rajesh Kumar",
      salary: 1350000, // 13.5 LPA
      status: "Active",
      emergencyContact: {
        name: "Sanjay Mehta",
        relationship: "Spouse",
        phone: "+91 98200 54321"
      },
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
      notes: "Specializes in digital campaigns, enterprise SaaS acquisition channels, and funnel analytics.",
      createdAt: "2024-01-08T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-10",
      employeeId: "EMP-1010",
      firstName: "Amit",
      lastName: "Joshi",
      email: "amit.joshi@example.com",
      phone: "+91 98900 12345",
      gender: "Male",
      dob: "1997-08-19",
      address: "502 Kothrud Greens",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      departmentId: "dept-4",
      departmentName: "Marketing & Growth",
      position: "Content & Brand Strategist",
      role: "Employee",
      joiningDate: "2024-02-20",
      employmentType: "Full-Time",
      managerId: "emp-4",
      managerName: "Rajesh Kumar",
      salary: 950000, // 9.5 LPA
      status: "On Leave",
      emergencyContact: {
        name: "Asha Joshi",
        relationship: "Mother",
        phone: "+91 98900 98765"
      },
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      notes: "Creates corporate publications, press releases, tech blogs, and multimedia marketing content.",
      createdAt: "2024-02-20T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-11",
      employeeId: "EMP-1011",
      firstName: "Deepa",
      lastName: "Nair",
      email: "deepa.nair@example.com",
      phone: "+91 98470 56789",
      gender: "Female",
      dob: "1991-05-11",
      address: "302 Marine Drive residency, Kochi",
      city: "Kochi",
      state: "Kerala",
      country: "India",
      departmentId: "dept-5",
      departmentName: "Sales & Enterprise Partnerships",
      position: "Enterprise Account Executive",
      role: "Employee",
      joiningDate: "2024-03-01",
      employmentType: "Full-Time",
      managerId: "emp-1",
      managerName: "Aarav Sharma",
      salary: 1550000, // 15.5 LPA
      status: "Active",
      emergencyContact: {
        name: "Ramesh Nair",
        relationship: "Father",
        phone: "+91 98470 98765"
      },
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
      notes: "Top recurring enterprise sales closer across BFSI and IT enterprise accounts.",
      createdAt: "2024-03-01T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "emp-12",
      employeeId: "EMP-1012",
      firstName: "Karthik",
      lastName: "Sundaram",
      email: "karthik.sundaram@example.com",
      phone: "+91 98400 65432",
      gender: "Male",
      dob: "1998-01-22",
      address: "14 Anna Nagar Main Road",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      departmentId: "dept-6",
      departmentName: "Operations & Logistics",
      position: "Operations Analyst",
      role: "Employee",
      joiningDate: "2024-05-15",
      employmentType: "Full-Time",
      managerId: "emp-1",
      managerName: "Aarav Sharma",
      salary: 800000, // 8 LPA
      status: "Probation",
      emergencyContact: {
        name: "Lakshmi Sundaram",
        relationship: "Mother",
        phone: "+91 98400 12345"
      },
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
      notes: "Focuses on IT asset management, vendor contracts, and facilities coordination.",
      createdAt: "2024-05-15T09:00:00.000Z",
      updatedAt: "2026-08-01T09:00:00.000Z"
    }
  ];

  const users: IUser[] = [
    {
      id: "user-1",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "Super Admin",
      employeeId: "emp-1",
      name: "Aarav Sharma",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      createdAt: "2022-01-10T09:00:00.000Z"
    },
    {
      id: "user-2",
      email: "hr@example.com",
      passwordHash: hrPasswordHash,
      role: "HR Admin",
      employeeId: "emp-2",
      name: "Priya Patel",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      createdAt: "2022-06-15T09:00:00.000Z"
    },
    {
      id: "user-3",
      email: "hr2@example.com",
      passwordHash: hrPasswordHash,
      role: "HR Admin",
      employeeId: "emp-3",
      name: "Ananya Iyer",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      createdAt: "2023-03-01T09:00:00.000Z"
    },
    {
      id: "user-4",
      email: "manager@example.com",
      passwordHash: managerPasswordHash,
      role: "Manager",
      employeeId: "emp-4",
      name: "Rajesh Kumar",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      createdAt: "2022-09-01T09:00:00.000Z"
    },
    {
      id: "user-5",
      email: "manager2@example.com",
      passwordHash: managerPasswordHash,
      role: "Manager",
      employeeId: "emp-5",
      name: "Neha Gupta",
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      createdAt: "2023-01-15T09:00:00.000Z"
    },
    {
      id: "user-6",
      email: "employee@example.com",
      passwordHash: employeePasswordHash,
      role: "Employee",
      employeeId: "emp-6",
      name: "Vikram Malhotra",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      createdAt: "2023-04-10T09:00:00.000Z"
    }
  ];

  // Leave Balances for each employee
  const leaveBalances: Record<string, ILeaveBalance> = {};
  employees.forEach((emp) => {
    leaveBalances[emp.id] = {
      employeeId: emp.id,
      casualLeave: { total: 12, used: Math.floor(Math.random() * 4) },
      sickLeave: { total: 10, used: Math.floor(Math.random() * 3) },
      earnedLeave: { total: 15, used: Math.floor(Math.random() * 5) },
      emergencyLeave: { total: 5, used: Math.floor(Math.random() * 2) },
      maternityLeave: { total: 90, used: 0 },
      paternityLeave: { total: 14, used: 0 },
      unpaidLeave: { total: 30, used: 0 }
    };
  });

  // Attendance Records for the last 14 days and today
  const attendance: IAttendance[] = [];
  const today = new Date();
  const dates: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  let attCounter = 1;
  dates.forEach((dateStr) => {
    employees.forEach((emp) => {
      // simulate realistic check in
      const isToday = dateStr === today.toISOString().split("T")[0];
      const isDaniel = emp.id === "emp-10"; // daniel is on leave
      if (isDaniel) {
        attendance.push({
          id: `att-${attCounter++}`,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          departmentName: emp.departmentName,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          workingHours: 0,
          status: "Leave",
          notes: "Approved Medical Leave",
          createdAt: `${dateStr}T09:00:00.000Z`
        });
        return;
      }

      const rand = Math.random();
      let status: "Present" | "Absent" | "Late" | "Half Day" | "Leave" = "Present";
      let checkIn = "08:55:00";
      let checkOut = "17:30:00";
      let hours = 8.5;

      if (isToday) {
        // Today's check-in
        checkIn = "08:52:15";
        checkOut = null;
        hours = 0;
        status = "Present";
      } else if (rand < 0.82) {
        status = "Present";
        checkIn = "08:50:00";
        checkOut = "17:35:00";
        hours = 8.75;
      } else if (rand < 0.90) {
        status = "Late";
        checkIn = "09:45:00";
        checkOut = "18:00:00";
        hours = 8.25;
      } else if (rand < 0.95) {
        status = "Half Day";
        checkIn = "09:00:00";
        checkOut = "13:00:00";
        hours = 4.0;
      } else {
        status = "Absent";
        checkIn = null;
        checkOut = null;
        hours = 0;
      }

      attendance.push({
        id: `att-${attCounter++}`,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        departmentName: emp.departmentName,
        date: dateStr,
        checkIn,
        checkOut,
        workingHours: hours,
        status,
        notes: status === "Late" ? "Traffic delay" : status === "Half Day" ? "Doctor appointment" : undefined,
        createdAt: `${dateStr}T08:50:00.000Z`
      });
    });
  });

  const leaves: ILeave[] = [
    {
      id: "leave-1",
      employeeId: "emp-6",
      employeeName: "Vikram Malhotra",
      departmentName: "Information Technology",
      leaveType: "Casual Leave",
      startDate: "2026-08-20",
      endDate: "2026-08-22",
      totalDays: 3,
      reason: "Family function and travel to hometown in Jaipur.",
      status: "Pending",
      appliedDate: "2026-08-12T14:30:00.000Z"
    },
    {
      id: "leave-2",
      employeeId: "emp-7",
      employeeName: "Sneha Reddy",
      departmentName: "Information Technology",
      leaveType: "Sick Leave",
      startDate: "2026-08-04",
      endDate: "2026-08-05",
      totalDays: 2,
      reason: "Viral flu and seasonal fever.",
      status: "Approved",
      appliedDate: "2026-08-03T10:00:00.000Z",
      reviewedBy: "Rajesh Kumar",
      reviewRemarks: "Take care and get well soon.",
      reviewedAt: "2026-08-03T11:15:00.000Z"
    },
    {
      id: "leave-3",
      employeeId: "emp-10",
      employeeName: "Amit Joshi",
      departmentName: "Marketing & Growth",
      leaveType: "Earned Leave",
      startDate: "2026-08-10",
      endDate: "2026-08-18",
      totalDays: 7,
      reason: "Annual planned vacation with family.",
      status: "Approved",
      appliedDate: "2026-07-28T09:15:00.000Z",
      reviewedBy: "Priya Patel",
      reviewRemarks: "Approved as scheduled.",
      reviewedAt: "2026-07-29T10:00:00.000Z"
    },
    {
      id: "leave-4",
      employeeId: "emp-8",
      employeeName: "Rohan Verma",
      departmentName: "Information Technology",
      leaveType: "Emergency Leave",
      startDate: "2026-07-15",
      endDate: "2026-07-16",
      totalDays: 2,
      reason: "Home emergency and medical checkup for parent.",
      status: "Approved",
      appliedDate: "2026-07-15T07:45:00.000Z",
      reviewedBy: "Rajesh Kumar",
      reviewRemarks: "Approved emergency leave.",
      reviewedAt: "2026-07-15T08:30:00.000Z"
    },
    {
      id: "leave-5",
      employeeId: "emp-12",
      employeeName: "Karthik Sundaram",
      departmentName: "Operations & Logistics",
      leaveType: "Casual Leave",
      startDate: "2026-08-25",
      endDate: "2026-08-26",
      totalDays: 2,
      reason: "Personal work at regional passport seva kendra.",
      status: "Pending",
      appliedDate: "2026-08-13T16:20:00.000Z"
    }
  ];

  // Payrolls for recent months
  const payrolls: IPayroll[] = [];
  let payCounter = 1;
  const months = ["2026-07", "2026-06", "2026-05"];
  months.forEach((monthStr) => {
    employees.forEach((emp) => {
      const basic = Math.round((emp.salary * 0.5) / 12);
      const hra = Math.round((emp.salary * 0.25) / 12);
      const specialAllowances = Math.round((emp.salary * 0.25) / 12);
      const allowances = hra + specialAllowances;
      const bonus = monthStr === "2026-07" && emp.role === "Manager" ? 25000 : 0;
      const overtime = emp.role === "Employee" ? 8500 : 0;
      const gross = basic + allowances + bonus + overtime;
      const pfDeduction = Math.round(basic * 0.12); // Standard Indian PF (12% of basic)
      const profTax = 200; // Standard Indian Professional Tax (PT)
      const tax = Math.round(gross * 0.10); // TDS Income Tax
      const deductions = pfDeduction + profTax;
      const net = gross - deductions - tax;

      payrolls.push({
        id: `pay-${payCounter++}`,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        departmentName: emp.departmentName,
        designation: emp.position,
        month: monthStr,
        basicSalary: basic,
        allowances,
        bonus,
        overtime,
        deductions,
        tax,
        grossSalary: gross,
        netSalary: net,
        status: "Paid",
        paymentDate: `${monthStr}-30`,
        paymentMethod: "NEFT / RTGS Bank Transfer",
        createdAt: `${monthStr}-28T10:00:00.000Z`
      });
    });
  });

  const performances: IPerformance[] = [
    {
      id: "perf-1",
      employeeId: "emp-6",
      employeeName: "Vikram Malhotra",
      departmentName: "Information Technology",
      reviewerId: "emp-4",
      reviewerName: "Rajesh Kumar",
      reviewPeriod: "Q2 2026",
      reviewDate: "2026-07-15",
      productivityScore: 5,
      qualityScore: 5,
      teamworkScore: 4,
      communicationScore: 4,
      leadershipScore: 4,
      overallScore: 4.4,
      ratingLevel: "Very Good",
      strengths: "Architectural foresight, high code quality, proactive problem solving, and timely delivery of core modules.",
      areasForImprovement: "Can expand technical documentation and mentor junior engineers more frequently.",
      managerComments: "Vikram consistently exceeds expectations on technical deliverables. Promoted to team lead consideration.",
      createdAt: "2026-07-15T14:00:00.000Z"
    },
    {
      id: "perf-2",
      employeeId: "emp-7",
      employeeName: "Sneha Reddy",
      departmentName: "Information Technology",
      reviewerId: "emp-4",
      reviewerName: "Rajesh Kumar",
      reviewPeriod: "Q2 2026",
      reviewDate: "2026-07-16",
      productivityScore: 4,
      qualityScore: 5,
      teamworkScore: 5,
      communicationScore: 5,
      leadershipScore: 4,
      overallScore: 4.6,
      ratingLevel: "Excellent",
      strengths: "Extraordinary attention to UI/UX detail, rapid prototyping, and cross-functional design collaboration.",
      areasForImprovement: "Deepen knowledge in server-side API performance and state orchestration.",
      managerComments: "Sneha's design components have radically improved our user satisfaction metrics.",
      createdAt: "2026-07-16T15:30:00.000Z"
    },
    {
      id: "perf-3",
      employeeId: "emp-11",
      employeeName: "Deepa Nair",
      departmentName: "Sales & Enterprise Partnerships",
      reviewerId: "emp-1",
      reviewerName: "Aarav Sharma",
      reviewPeriod: "Q2 2026",
      reviewDate: "2026-07-20",
      productivityScore: 5,
      qualityScore: 4,
      teamworkScore: 4,
      communicationScore: 5,
      leadershipScore: 5,
      overallScore: 4.6,
      ratingLevel: "Excellent",
      strengths: "Superb negotiation skills, rapid deal closing across Indian corporate sectors, customer empathy, and pipeline generation.",
      areasForImprovement: "Ensure CRM data logging is completed in real-time.",
      managerComments: "Deepa generated 38% of total enterprise quarterly revenue. Outstanding performance.",
      createdAt: "2026-07-20T11:00:00.000Z"
    },
    {
      id: "perf-4",
      employeeId: "emp-8",
      employeeName: "Rohan Verma",
      departmentName: "Information Technology",
      reviewerId: "emp-4",
      reviewerName: "Rajesh Kumar",
      reviewPeriod: "Q2 2026",
      reviewDate: "2026-07-18",
      productivityScore: 4,
      qualityScore: 4,
      teamworkScore: 4,
      communicationScore: 3,
      leadershipScore: 3,
      overallScore: 3.6,
      ratingLevel: "Good",
      strengths: "Reliable infrastructure uptime, quick incident resolution, automation scripting.",
      areasForImprovement: "Proactive communication during team standups and cross-team project planning.",
      managerComments: "Solid engineering backbone. Looking forward to continued growth in cross-team leadership.",
      createdAt: "2026-07-18T16:00:00.000Z"
    }
  ];

  const tasks: ITask[] = [
    {
      id: "task-1",
      title: "Implement Aadhaar & PAN KYC Integration",
      description: "Upgrade identity provider and document onboarding module to support verified Indian KYC workflows and SSO.",
      assignedEmployeeId: "emp-6",
      assignedEmployeeName: "Vikram Malhotra",
      assignedBy: "Rajesh Kumar",
      departmentName: "Information Technology",
      priority: "High",
      startDate: "2026-08-01",
      dueDate: "2026-08-18",
      status: "In Progress",
      progressPercent: 65,
      createdAt: "2026-08-01T09:00:00.000Z"
    },
    {
      id: "task-2",
      title: "Redesign Employee Onboarding & PF Portal",
      description: "Revamp the new hire wizard with interactive document checklists, Provident Fund nomination, and policy acknowledgments.",
      assignedEmployeeId: "emp-7",
      assignedEmployeeName: "Sneha Reddy",
      assignedBy: "Rajesh Kumar",
      departmentName: "Information Technology",
      priority: "Critical",
      startDate: "2026-08-05",
      dueDate: "2026-08-22",
      status: "In Progress",
      progressPercent: 80,
      createdAt: "2026-08-05T10:00:00.000Z"
    },
    {
      id: "task-3",
      title: "Q3 Statutory & GST Compliance Audit Prep",
      description: "Aggregate access logs, backup retention certificates, GST filings, and TDS returns for internal audit evaluators.",
      assignedEmployeeId: "emp-8",
      assignedEmployeeName: "Rohan Verma",
      assignedBy: "Rajesh Kumar",
      departmentName: "Information Technology",
      priority: "High",
      startDate: "2026-08-10",
      dueDate: "2026-08-30",
      status: "Todo",
      progressPercent: 20,
      createdAt: "2026-08-10T11:00:00.000Z"
    },
    {
      id: "task-4",
      title: "Publish Indian Enterprise Case Studies",
      description: "Finalize interviews with leading Indian tech enterprise clients highlighting productivity metrics and efficiency gains.",
      assignedEmployeeId: "emp-9",
      assignedEmployeeName: "Pooja Mehta",
      assignedBy: "Aarav Sharma",
      departmentName: "Marketing & Growth",
      priority: "Medium",
      startDate: "2026-07-20",
      dueDate: "2026-08-15",
      status: "Completed",
      progressPercent: 100,
      createdAt: "2026-07-20T09:30:00.000Z"
    },
    {
      id: "task-5",
      title: "Quarterly Health Insurance & Mediclaim Campaign",
      description: "Coordinate with cashless health insurance provider for open family floater policy enrollment and seminar.",
      assignedEmployeeId: "emp-3",
      assignedEmployeeName: "Ananya Iyer",
      assignedBy: "Priya Patel",
      departmentName: "Human Resources",
      priority: "Medium",
      startDate: "2026-08-08",
      dueDate: "2026-08-25",
      status: "In Progress",
      progressPercent: 45,
      createdAt: "2026-08-08T13:00:00.000Z"
    }
  ];

  const announcements: IAnnouncement[] = [
    {
      id: "ann-1",
      title: "Independence Day & Annual Tech Summit 2026",
      description: "We are thrilled to announce our 2026 Annual All-Hands & Tech Summit in Bengaluru from August 14-16. All team members from Mumbai, Delhi, Hyderabad, and Pune will have flight arrangements booked.",
      category: "Events",
      date: "2026-08-12",
      priority: "High",
      authorName: "Aarav Sharma",
      authorRole: "Super Admin",
      createdAt: "2026-08-12T09:00:00.000Z"
    },
    {
      id: "ann-2",
      title: "Updated Hybrid Work & Remote Allowance (₹15,000 / month)",
      description: "Effective September 1st, our monthly remote wellness and internet stipend has been revised to ₹15,000/month. Claims can be submitted under Document Management / Expense Claims.",
      category: "Policy",
      date: "2026-08-10",
      priority: "Medium",
      authorName: "Priya Patel",
      authorRole: "HR Admin",
      createdAt: "2026-08-10T10:30:00.000Z"
    },
    {
      id: "ann-3",
      title: "Independence Day (August 15) Holiday Notice",
      description: "Our offices nationwide will remain closed on Friday, August 15th in celebration of India's 80th Independence Day. Essential cloud on-call rotations have been scheduled.",
      category: "Holiday",
      date: "2026-08-08",
      priority: "Low",
      authorName: "Priya Patel",
      authorRole: "HR Admin",
      createdAt: "2026-08-08T11:00:00.000Z"
    },
    {
      id: "ann-4",
      title: "Cyber Security Alert: OTP & Phishing Awareness",
      description: "The IT security team is running simulated email awareness drills this month. Remember never to share OTPs, corporate passwords, or banking UPI credentials.",
      category: "Emergency",
      date: "2026-08-05",
      priority: "Urgent",
      authorName: "Rajesh Kumar",
      authorRole: "Manager",
      createdAt: "2026-08-05T08:45:00.000Z"
    }
  ];

  const documents: IDocument[] = [
    {
      id: "doc-1",
      name: "BharatCorp_Employee_Handbook_2026.pdf",
      type: "Policy",
      employeeId: "emp-1",
      employeeName: "Aarav Sharma",
      uploadedBy: "Priya Patel",
      uploadDate: "2026-01-10",
      fileSize: "3.4 MB",
      fileUrl: "#",
      createdAt: "2026-01-10T10:00:00.000Z"
    },
    {
      id: "doc-2",
      name: "Vikram_Malhotra_Offer_Letter.pdf",
      type: "Offer letter",
      employeeId: "emp-6",
      employeeName: "Vikram Malhotra",
      uploadedBy: "Priya Patel",
      uploadDate: "2023-04-01",
      fileSize: "1.2 MB",
      fileUrl: "#",
      createdAt: "2023-04-01T10:00:00.000Z"
    },
    {
      id: "doc-3",
      name: "Sneha_Reddy_UIUX_Certification.pdf",
      type: "Certificates",
      employeeId: "emp-7",
      employeeName: "Sneha Reddy",
      uploadedBy: "Sneha Reddy",
      uploadDate: "2023-08-15",
      fileSize: "840 KB",
      fileUrl: "#",
      createdAt: "2023-08-15T11:20:00.000Z"
    },
    {
      id: "doc-4",
      name: "Cloud_Disaster_Recovery_Plan.pdf",
      type: "Other",
      employeeId: "emp-4",
      employeeName: "Rajesh Kumar",
      uploadedBy: "Rajesh Kumar",
      uploadDate: "2026-06-20",
      fileSize: "4.8 MB",
      fileUrl: "#",
      createdAt: "2026-06-20T14:00:00.000Z"
    },
    {
      id: "doc-5",
      name: "July_2026_Corporate_Payroll_Ledger_INR.pdf",
      type: "Payslips",
      employeeId: "emp-2",
      employeeName: "Priya Patel",
      uploadedBy: "Priya Patel",
      uploadDate: "2026-07-31",
      fileSize: "2.1 MB",
      fileUrl: "#",
      createdAt: "2026-07-31T17:00:00.000Z"
    }
  ];

  const notifications: INotification[] = [
    {
      id: "notif-1",
      userId: "user-6",
      title: "New Task Assigned",
      message: "You have been assigned to 'Implement Aadhaar & PAN KYC Integration' with deadline Aug 18.",
      type: "task",
      read: false,
      link: "/tasks",
      createdAt: "2026-08-13T09:00:00.000Z"
    },
    {
      id: "notif-2",
      userId: "user-6",
      title: "Salary Credited (INR)",
      message: "Your July 2026 salary has been processed and credited to your registered HDFC bank account.",
      type: "payroll",
      read: true,
      link: "/payroll",
      createdAt: "2026-07-31T10:30:00.000Z"
    },
    {
      id: "notif-3",
      userId: "user-4",
      title: "Pending Leave Approval",
      message: "Vikram Malhotra submitted a casual leave request for Aug 20 - Aug 22 (3 days).",
      type: "leave",
      read: false,
      link: "/leave",
      createdAt: "2026-08-12T14:35:00.000Z"
    },
    {
      id: "notif-4",
      userId: "user-2",
      title: "Performance Appraisal Completed",
      message: "Rajesh Kumar submitted Q2 2026 performance reviews for the engineering team.",
      type: "performance",
      read: false,
      link: "/performance",
      createdAt: "2026-07-20T16:00:00.000Z"
    },
    {
      id: "notif-5",
      userId: "user-1",
      title: "New Announcement Published",
      message: "Independence Day & Annual Tech Summit 2026 notice has been published to all employees.",
      type: "announcement",
      read: true,
      link: "/announcements",
      createdAt: "2026-08-12T09:05:00.000Z"
    }
  ];

  const auditLogs: IAuditLog[] = [
    {
      id: "audit-1",
      userId: "user-1",
      userName: "Aarav Sharma",
      userRole: "Super Admin",
      userEmail: "admin@example.com",
      action: "LOGIN",
      resource: "Auth",
      details: "User logged into EMS Enterprise portal from Bengaluru (macOS / Chrome).",
      ipAddress: "103.21.124.50",
      timestamp: "2026-08-14T07:45:00.000Z"
    },
    {
      id: "audit-2",
      userId: "user-2",
      userName: "Priya Patel",
      userRole: "HR Admin",
      userEmail: "hr@example.com",
      action: "PROCESS_PAYROLL",
      resource: "Payroll",
      resourceId: "pay-2026-07",
      details: "Processed monthly payroll cycle for July 2026 with INR TDS & PF deductions for 12 employees.",
      ipAddress: "103.21.124.55",
      timestamp: "2026-07-31T09:30:00.000Z"
    },
    {
      id: "audit-3",
      userId: "user-4",
      userName: "Rajesh Kumar",
      userRole: "Manager",
      userEmail: "manager@example.com",
      action: "APPROVE_LEAVE",
      resource: "Leave",
      resourceId: "leave-1",
      details: "Reviewed 3-day Casual Leave request for Vikram Malhotra.",
      ipAddress: "103.21.124.62",
      timestamp: "2026-08-13T10:15:00.000Z"
    },
    {
      id: "audit-4",
      userId: "user-2",
      userName: "Priya Patel",
      userRole: "HR Admin",
      userEmail: "hr@example.com",
      action: "CREATE_EMPLOYEE",
      resource: "Employee",
      resourceId: "emp-12",
      details: "Onboarded new employee Karthik Sundaram as Operations Analyst.",
      ipAddress: "103.21.124.55",
      timestamp: "2026-06-01T08:30:00.000Z"
    },
    {
      id: "audit-5",
      userId: "user-1",
      userName: "Aarav Sharma",
      userRole: "Super Admin",
      userEmail: "admin@example.com",
      action: "SYSTEM_SETTING_UPDATE",
      resource: "Settings",
      details: "Updated corporate shift timings (09:30 - 18:30 IST) and INR currency baseline.",
      ipAddress: "103.21.124.50",
      timestamp: "2026-08-01T11:00:00.000Z"
    }
  ];

  const settings: ICompanySettings = {
    companyName: "BharatCorp Technologies India Pvt. Ltd.",
    tagline: "India's Smartest Enterprise Workforce Management Platform",
    address: "Tower B, Level 8, Global Tech Park, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103",
    contactEmail: "hr@bharatcorp-ems.in",
    contactPhone: "+91 (080) 6789-0100",
    currency: "INR",
    currencySymbol: "₹",
    taxRatePercent: 18,
    workStartTime: "09:30",
    workEndTime: "18:30",
    halfDayHours: 4.5
  };

  const designations = generateDefaultDesignations();
  const holidays = generateDefaultHolidays();

  return {
    users,
    employees,
    departments,
    designations,
    holidays,
    attendance,
    leaves,
    leaveBalances,
    payrolls,
    performances,
    tasks,
    announcements,
    documents,
    notifications,
    auditLogs,
    settings
  };
}

export function generateDefaultDesignations(): IDesignation[] {
  return [
    {
      id: "desig-1",
      designationId: "DESIG-101",
      title: "Managing Director & Super Admin",
      departmentId: "dept-1",
      departmentName: "Human Resources",
      description: "Executive organizational leadership, strategy, board relations, and nationwide company governance.",
      minSalary: 3000000,
      maxSalary: 5500000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-2",
      designationId: "DESIG-102",
      title: "Senior HR Director",
      departmentId: "dept-1",
      departmentName: "Human Resources",
      description: "Strategic talent acquisition, labor compliance, wage structures, and people operations.",
      minSalary: 1800000,
      maxSalary: 2800000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-3",
      designationId: "DESIG-103",
      title: "HR & Talent Specialist",
      departmentId: "dept-1",
      departmentName: "Human Resources",
      description: "Campus recruitment, candidate onboarding, employee engagement, and statutory filings.",
      minSalary: 800000,
      maxSalary: 1400000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-4",
      designationId: "DESIG-104",
      title: "Engineering & IT Manager",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      description: "Architectural oversight, engineering sprint delivery, cloud infrastructure, and technical mentoring.",
      minSalary: 2400000,
      maxSalary: 3600000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-5",
      designationId: "DESIG-105",
      title: "Senior Full-Stack Engineer",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      description: "Development of mission-critical web applications, secure APIs, and responsive microservices.",
      minSalary: 1500000,
      maxSalary: 2400000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-6",
      designationId: "DESIG-106",
      title: "Lead UI/UX Product Designer",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      description: "Design systems, user experience prototyping, usability testing, and brand visual guidelines.",
      minSalary: 1200000,
      maxSalary: 2000000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-7",
      designationId: "DESIG-107",
      title: "DevOps & Cloud Architect",
      departmentId: "dept-2",
      departmentName: "Information Technology",
      description: "Kubernetes orchestration, CI/CD automation, cloud cost optimization, and SOC2 compliance.",
      minSalary: 1600000,
      maxSalary: 2600000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-8",
      designationId: "DESIG-108",
      title: "Finance Controller & Manager",
      departmentId: "dept-3",
      departmentName: "Finance & Accounts",
      description: "Statutory audits, P&L reporting, taxation strategy, treasury, and departmental budget controls.",
      minSalary: 2000000,
      maxSalary: 3200000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-9",
      designationId: "DESIG-109",
      title: "Senior Tax & Payroll Accountant",
      departmentId: "dept-3",
      departmentName: "Finance & Accounts",
      description: "Monthly payroll processing, TDS returns, PF & ESIC remittances, and vendor invoice settlements.",
      minSalary: 900000,
      maxSalary: 1500000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-10",
      designationId: "DESIG-110",
      title: "Marketing & Growth Director",
      departmentId: "dept-4",
      departmentName: "Marketing & Growth",
      description: "Multi-channel demand generation, content strategy, brand partnerships, and customer analytics.",
      minSalary: 2200000,
      maxSalary: 3400000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-11",
      designationId: "DESIG-111",
      title: "Enterprise Sales Director",
      departmentId: "dept-5",
      departmentName: "Sales & Enterprise Partnerships",
      description: "B2B client acquisitions, contract negotiation, account expansion, and revenue management.",
      minSalary: 2400000,
      maxSalary: 3800000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    },
    {
      id: "desig-12",
      designationId: "DESIG-112",
      title: "Operations & Facilities Analyst",
      departmentId: "dept-6",
      departmentName: "Operations & Logistics",
      description: "IT asset logistics, workplace facilities, vendor service level agreements, and procurement.",
      minSalary: 700000,
      maxSalary: 1200000,
      status: "Active",
      createdAt: "2024-01-15T08:00:00.000Z"
    }
  ];
}

export function generateDefaultHolidays(): IHoliday[] {
  return [
    {
      id: "hol-1",
      name: "New Year's Day",
      date: "2026-01-01",
      description: "Global celebration marking the arrival of the new calendar year.",
      type: "Corporate",
      applicableLocation: "All Offices Pan-India",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-2",
      name: "Republic Day",
      date: "2026-01-26",
      description: "Honoring the enactment of the Constitution of India in 1950.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-3",
      name: "Maha Shivratri",
      date: "2026-02-15",
      description: "Hindu festival celebrating the cosmic dance of Shiva.",
      type: "Regional",
      applicableLocation: "Bengaluru & Mumbai Offices",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-4",
      name: "Holi (Festival of Colors)",
      date: "2026-03-04",
      description: "Vibrant spring festival symbolizing unity, joy, and the victory of good over evil.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-5",
      name: "Eid al-Fitr",
      date: "2026-03-21",
      description: "Islamic celebration marking the conclusion of Ramadan holy month.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-6",
      name: "Dr. B.R. Ambedkar Jayanti",
      date: "2026-04-14",
      description: "Commemoration of the architect of the Indian Constitution.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-7",
      name: "May Day / Labour Day",
      date: "2026-05-01",
      description: "International celebration honoring workers' rights and contributions.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-8",
      name: "Independence Day",
      date: "2026-08-15",
      description: "Commemorating 79 years of Indian freedom and democracy.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Completed",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-9",
      name: "Ganesh Chaturthi",
      date: "2026-09-14",
      description: "Celebration of the birth of Lord Ganesha, harbinger of wisdom and new beginnings.",
      type: "Regional",
      applicableLocation: "Mumbai & Pune Offices",
      status: "Upcoming",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-10",
      name: "Mahatma Gandhi Jayanti",
      date: "2026-10-02",
      description: "National holiday observing the birth anniversary of the Father of the Nation.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Upcoming",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-11",
      name: "Dussehra (Vijayadashami)",
      date: "2026-10-20",
      description: "Major Hindu festival celebrating the triumph of righteousness.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Upcoming",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-12",
      name: "Diwali (Deepavali)",
      date: "2026-11-08",
      description: "Festival of lights illuminating prosperity, harmony, and joy.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Upcoming",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-13",
      name: "Guru Nanak Jayanti",
      date: "2026-11-24",
      description: "Commemorating the birth of the founder of Sikhism.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Upcoming",
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "hol-14",
      name: "Christmas Day",
      date: "2026-12-25",
      description: "Celebration of Christmas with holiday cheer and goodwill.",
      type: "National",
      applicableLocation: "Pan India",
      status: "Upcoming",
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ];
}

export { getDatabaseStatus, isMongoConnected, getMongoDb };

