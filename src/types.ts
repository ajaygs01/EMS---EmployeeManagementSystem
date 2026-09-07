export type UserRole = "Super Admin" | "HR Admin" | "Manager" | "Employee";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  employeeId: string;
  department?: string;
  position?: string;
  phone?: string;
  status?: string;
}

export interface Employee {
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
  role: UserRole;
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
  related?: {
    attendance: AttendanceRecord[];
    leaves: LeaveRequest[];
    leaveBalance: LeaveBalance | null;
    payrolls: PayrollRecord[];
    performances: PerformanceReview[];
    tasks: Task[];
    documents: DocumentItem[];
  };
}

export interface Department {
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

export interface Designation {
  id: string;
  designationId: string;
  title: string;
  departmentId: string;
  departmentName: string;
  description: string;
  minSalary: number;
  maxSalary: number;
  status: "Active" | "Inactive";
  employeeCount?: number;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string;
  type: "National" | "Regional" | "Corporate";
  applicableLocation: string;
  status: "Active" | "Upcoming" | "Completed";
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  category: "holiday" | "birthday" | "anniversary" | "leave" | "event";
  description?: string;
  color: string;
  metadata?: any;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId: string;
  avatar: string;
  status: "Active" | "Inactive";
  createdAt: string;
  lastLogin?: string;
  employee?: {
    id: string;
    employeeId: string;
    departmentName: string;
    position: string;
    phone: string;
  } | null;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Leave";
  notes?: string;
  createdAt: string;
}

export interface LeaveRequest {
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

export interface LeaveBalance {
  employeeId: string;
  casualLeave: { total: number; used: number };
  sickLeave: { total: number; used: number };
  earnedLeave: { total: number; used: number };
  emergencyLeave: { total: number; used: number };
  maternityLeave: { total: number; used: number };
  paternityLeave: { total: number; used: number };
  unpaidLeave: { total: number; used: number };
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  month: string;
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
  company?: CompanySettings;
  employeeDetails?: Employee | null;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  reviewerId: string;
  reviewerName: string;
  reviewPeriod: string;
  reviewDate: string;
  productivityScore: number;
  qualityScore: number;
  teamworkScore: number;
  communicationScore: number;
  leadershipScore: number;
  overallScore: number;
  ratingLevel: "Excellent" | "Very Good" | "Good" | "Needs Improvement" | "Poor";
  strengths: string;
  areasForImprovement: string;
  managerComments: string;
  createdAt: string;
}

export interface Task {
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

export interface Announcement {
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

export interface DocumentItem {
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

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "leave" | "task" | "payroll" | "performance" | "announcement" | "system";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  totalDepartments: number;
  todayPresentCount: number;
  todayLateCount: number;
  pendingLeavesCount: number;
  monthlyPayrollCost: number;
  departmentDistribution: { name: string; value: number }[];
}

export interface CompanySettings {
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

export interface AuditLogItem {
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
