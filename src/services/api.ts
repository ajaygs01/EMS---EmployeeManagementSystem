const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("ems_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>)
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  let data: any;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = { success: false, message: `Invalid JSON response from server (${response.status})` };
    }
  } else {
    // Non-JSON response (e.g. HTML error page or fallback)
    const text = await response.text();
    const cleanSnippet = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
    throw new Error(
      cleanSnippet || `Server error (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(data?.message || "An error occurred during network request.");
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<any>("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (data: { name: string; email: string; password: string; role: string; departmentName?: string; position?: string }) =>
    request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request<any>("/auth/me"),
  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    request<any>("/auth/change-password", { method: "POST", body: JSON.stringify(passwords) }),
  forgotPassword: (email: string) =>
    request<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    request<any>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => request<any>("/dashboard/stats"),

  // Employees
  getEmployees: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    });
    return request<any>(`/employees?${searchParams.toString()}`);
  },
  getEmployee: (id: string) => request<any>(`/employees/${id}`),
  createEmployee: (data: any) => request<any>("/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) => request<any>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateEmployeeStatus: (id: string, status: string) => request<any>(`/employees/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  bulkImportEmployees: (employees: any[]) => request<any>("/employees/bulk-import", { method: "POST", body: JSON.stringify({ employees }) }),
  deleteEmployee: (id: string) => request<any>(`/employees/${id}`, { method: "DELETE" }),

  // Departments
  getDepartments: () => request<any>("/departments"),
  getDepartmentEmployees: (id: string) => request<any>(`/departments/${id}/employees`),
  createDepartment: (data: any) => request<any>("/departments", { method: "POST", body: JSON.stringify(data) }),
  updateDepartment: (id: string, data: any) => request<any>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDepartment: (id: string) => request<any>(`/departments/${id}`, { method: "DELETE" }),

  // Designations
  getDesignations: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") searchParams.append(key, String(val));
    });
    return request<any>(`/designations?${searchParams.toString()}`);
  },
  getDesignation: (id: string) => request<any>(`/designations/${id}`),
  createDesignation: (data: any) => request<any>("/designations", { method: "POST", body: JSON.stringify(data) }),
  updateDesignation: (id: string, data: any) => request<any>(`/designations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDesignation: (id: string) => request<any>(`/designations/${id}`, { method: "DELETE" }),

  // Attendance
  getAttendance: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, String(val));
    });
    return request<any>(`/attendance?${searchParams.toString()}`);
  },
  getTodayAttendanceStatus: (date?: string) => request<any>(`/attendance/today-status${date ? `?date=${date}` : ""}`),
  checkIn: (data?: any) => request<any>("/attendance/check-in", { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  checkOut: (data?: any) => request<any>("/attendance/check-out", { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  resetTodayAttendance: (employeeId?: string) => request<any>("/attendance/reset-today", { method: "POST", body: JSON.stringify({ employeeId }) }),
  getAttendanceMonthlyTrends: (params: { year?: number; department?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.year) searchParams.append("year", String(params.year));
    if (params.department) searchParams.append("department", params.department);
    return request<any>(`/attendance/monthly-trends?${searchParams.toString()}`);
  },
  createAttendanceManual: (data: any) => request<any>("/attendance/manual", { method: "POST", body: JSON.stringify(data) }),
  updateAttendance: (id: string, data: any) => request<any>(`/attendance/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Leaves
  getLeaves: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") searchParams.append(key, String(val));
    });
    return request<any>(`/leaves?${searchParams.toString()}`);
  },
  getAllLeaveBalances: () => request<any>("/leaves/balances"),
  getLeaveBalances: (employeeId: string) => request<any>(`/leaves/balances/${employeeId}`),
  updateLeaveBalance: (employeeId: string, data: any) => request<any>(`/leaves/balances/${employeeId}`, { method: "PUT", body: JSON.stringify(data) }),
  applyLeave: (data: any) => request<any>("/leaves", { method: "POST", body: JSON.stringify(data) }),
  approveLeave: (id: string, remarks?: string) => request<any>(`/leaves/${id}/approve`, { method: "PUT", body: JSON.stringify({ remarks }) }),
  rejectLeave: (id: string, remarks?: string) => request<any>(`/leaves/${id}/reject`, { method: "PUT", body: JSON.stringify({ remarks }) }),
  cancelLeave: (id: string) => request<any>(`/leaves/${id}/cancel`, { method: "PUT" }),
  deleteLeave: (id: string) => request<any>(`/leaves/${id}`, { method: "DELETE" }),

  // Payroll
  getPayrolls: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, String(val));
    });
    return request<any>(`/payroll?${searchParams.toString()}`);
  },
  getPayslip: (id: string) => request<any>(`/payroll/${id}`),
  createPayroll: (data: any) => request<any>("/payroll", { method: "POST", body: JSON.stringify(data) }),
  updatePayroll: (id: string, data: any) => request<any>(`/payroll/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePayroll: (id: string) => request<any>(`/payroll/${id}`, { method: "DELETE" }),

  // Performance
  getPerformances: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, String(val));
    });
    return request<any>(`/performance?${searchParams.toString()}`);
  },
  getEmployeePerformance: (employeeId: string) => request<any>(`/performance/employee/${employeeId}`),
  createPerformance: (data: any) => request<any>("/performance", { method: "POST", body: JSON.stringify(data) }),
  updatePerformance: (id: string, data: any) => request<any>(`/performance/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Tasks
  getTasks: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, String(val));
    });
    return request<any>(`/tasks?${searchParams.toString()}`);
  },
  getTask: (id: string) => request<any>(`/tasks/${id}`),
  createTask: (data: any) => request<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTaskStatus: (id: string, status: string, progressPercent?: number) =>
    request<any>(`/tasks/${id}/status`, { method: "PUT", body: JSON.stringify({ status, progressPercent }) }),
  updateTask: (id: string, data: any) => request<any>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<any>(`/tasks/${id}`, { method: "DELETE" }),

  // Announcements
  getAnnouncements: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, String(val));
    });
    return request<any>(`/announcements?${searchParams.toString()}`);
  },
  createAnnouncement: (data: any) => request<any>("/announcements", { method: "POST", body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) => request<any>(`/announcements/${id}`, { method: "DELETE" }),

  // Documents
  getDocuments: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, String(val));
    });
    return request<any>(`/documents?${searchParams.toString()}`);
  },
  uploadDocument: (formData: FormData) => request<any>("/documents/upload", { method: "POST", body: formData }),
  deleteDocument: (id: string) => request<any>(`/documents/${id}`, { method: "DELETE" }),

  // Notifications
  getNotifications: async () => {
    const token = getToken();
    if (!token) {
      return { success: true, data: [], unreadCount: 0 };
    }
    try {
      return await request<any>("/notifications");
    } catch {
      return { success: true, data: [], unreadCount: 0 };
    }
  },
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request<any>("/notifications/read-all", { method: "PUT" }),
  deleteNotification: (id: string) => request<any>(`/notifications/${id}`, { method: "DELETE" }),

  // Reports
  getReportsSummary: () => request<any>("/reports/summary"),
  getReportExportUrl: (type: string) => `${API_BASE}/reports/export/${type}`,

  // AI Assistant
  aiChat: (message: string, conversationHistory: any[] = []) =>
    request<any>("/ai/chat", { method: "POST", body: JSON.stringify({ message, conversationHistory }) }),
  aiEmployeeSummary: (employeeId: string) =>
    request<any>("/ai/employee-summary", { method: "POST", body: JSON.stringify({ employeeId }) }),
  aiJobDescription: (dataOrTitle: any, departmentName?: string, experienceLevel?: string, keySkills?: string) => {
    const payload =
      typeof dataOrTitle === "string"
        ? { jobTitle: dataOrTitle, departmentName, experienceLevel, keySkills }
        : dataOrTitle;
    return request<any>("/ai/job-description", { method: "POST", body: JSON.stringify(payload) });
  },
  aiPolicyDraft: (policyTopic: string, guidelines?: string) =>
    request<any>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        message: `Draft a formal corporate policy document on the subject: "${policyTopic}". Specific guidelines to incorporate: "${guidelines || 'Standard industry best practices'}". Format the policy with: 1. Purpose & Scope, 2. Eligibility & Application, 3. Employee Responsibilities & Guidelines, 4. Enforcement & Exceptions.`
      })
    }).then((res) => ({ success: res.success, policyDraft: res.reply })),
  aiInterviewQuestions: (data: any) => request<any>("/ai/interview-questions", { method: "POST", body: JSON.stringify(data) }),
  aiAnnouncement: (data: any) => request<any>("/ai/announcement", { method: "POST", body: JSON.stringify(data) }),
  aiHrReport: (data: any) => request<any>("/ai/hr-report", { method: "POST", body: JSON.stringify(data) }),

  // Settings
  getSettings: () => request<any>("/settings"),
  updateSettings: (data: any) => request<any>("/settings", { method: "PUT", body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) searchParams.append(key, String(val));
    });
    return request<any>(`/audit-logs?${searchParams.toString()}`);
  },

  // Holidays & Calendar Events
  getHolidays: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") searchParams.append(key, String(val));
    });
    return request<any>(`/holidays?${searchParams.toString()}`);
  },
  getCalendarEvents: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") searchParams.append(key, String(val));
    });
    return request<any>(`/holidays/calendar-events?${searchParams.toString()}`);
  },
  createHoliday: (data: any) => request<any>("/holidays", { method: "POST", body: JSON.stringify(data) }),
  updateHoliday: (id: string, data: any) => request<any>(`/holidays/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHoliday: (id: string) => request<any>(`/holidays/${id}`, { method: "DELETE" }),

  // User Management (Super Admin)
  getUsers: (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") searchParams.append(key, String(val));
    });
    return request<any>(`/users?${searchParams.toString()}`);
  },
  createUser: (data: any) => request<any>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request<any>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  resetUserPassword: (id: string, newPassword: string) =>
    request<any>(`/users/${id}/reset-password`, { method: "PUT", body: JSON.stringify({ newPassword }) }),
  toggleUserStatus: (id: string) => request<any>(`/users/${id}/toggle-status`, { method: "PUT" }),
  deleteUser: (id: string) => request<any>(`/users/${id}`, { method: "DELETE" }),

  // Search
  searchGlobal: (query: string) => request<any>(`/search?q=${encodeURIComponent(query)}`)
};
