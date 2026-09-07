# EMS — Employee Management System

> **Smart Employee Management, Simplified.**

EMS Enterprise is a modern, full-stack human resource and workforce management platform built with React, TypeScript, Tailwind CSS, Express, and Google Gemini AI.

---

## 🌟 Key Modules & Features

### 1. 👥 Employee Lifecycle Management
- Complete employee directory with advanced filtering (Department, Status, Role, Designation) and real-time search.
- Multi-tab detailed Employee 360 profile covering:
  - Personal Information & Emergency Contacts
  - Job Position, Department & Reporting Manager Hierarchy
  - Real-time Attendance logs and Check-in/Check-out history
  - Leave ledger and balance overview
  - Compensation & Payroll history with printable payslips
  - 360 Performance Appraisals and ratings history
  - Delegated Tasks & Deliverables
  - Secure Document Vault
- Quick actions: Add new employee, Edit details, Status transitions (Active, Inactive, On Leave, Probation), and Delete with confirmation.

### 2. 🏢 Department Management
- Create, read, update, and manage departments with budget allocations, head of department assignments, and headcount tracking.

### 3. ⏱️ Attendance Tracking & Geo-Clock
- Interactive Clock-In / Clock-Out with automatic working hour calculations, overtime estimation, and late/half-day detection.
- Monthly attendance breakdown and CSV attendance log export.

### 4. 🏖️ Leave Management
- Leave categories: Casual Leave, Sick Leave, Earned Leave, Emergency Leave, Maternity Leave, Paternity Leave, and Unpaid Leave.
- Multi-level approval workflow with manager & HR approval, rejection reasons, and balance tracking.

### 5. 💰 Payroll & Payslips
- Salary calculation engine: Gross Pay = Basic Salary + Allowances + Bonus + Overtime; Net Pay = Gross Pay - Deductions - Tax.
- Printable, downloadable high-fidelity corporate payslips with itemized deductions and earnings.

### 6. 📈 360 Performance Management
- 5-factor rating system: Productivity, Quality, Teamwork, Communication, and Leadership.
- Strengths, growth opportunities, and executive managerial remarks.

### 7. ✅ Task & Milestone Delegation
- Priority management (Critical, High, Medium, Low) and lifecycle tracking (Todo, In Progress, Completed, Overdue).

### 8. 📢 Announcements & Bulletins
- Categorized company bulletins (HR, Policy, General, Holiday, Emergency) with priority tags.

### 9. 📁 Secure Document Vault
- Encrypted file uploads, categorization (Resume, ID Proof, Offer Letter, Experience Letter, Payslips, Tax Documents), size tracking, and downloads.

### 10. 🔔 Real-Time Notifications Hub
- Filtered alert stream for leave decisions, task assignments, payroll processing, and company updates.

### 11. 📊 Executive Reports & Analytics
- Multi-category reporting with custom filters, interactive visual charts, and instant CSV export across Employees, Attendance, Leaves, Payroll, Performance, and Tasks.

### 12. 🛡️ Enterprise Audit & Compliance Logs
- Immutable security audit logs tracking logins, data modifications, leave actions, and system setting changes with IP addresses and user timestamps.

### 13. 🤖 Gemini AI HR Suite (Server-Side)
- **AI HR Assistant**: Natural language querying with role-based data boundary protection.
- **AI Job Description Generator**: Tailored job specs by department and experience level.
- **AI Policy & Announcement Drafter**: Formats company notices and internal communications.
- **AI Candidate Interview Generator**: Role-specific behavioral and technical interview questions.
- **AI Performance Review Summarizer**: Summarizes employee appraisal history into growth roadmaps.

---

## 🔐 User Roles & Permissions

| Role | Permissions & Access Scope |
| :--- | :--- |
| **Super Admin** | Full access to all modules, system configurations, audit logs, and AI HR suite. |
| **HR Admin** | Full employee management, department allocation, attendance, leave approvals, payroll processing, and document management. |
| **Manager** | View department team members, track team attendance, approve/reject team leave requests, conduct performance reviews, assign tasks, and draft announcements. |
| **Employee** | Self-service portal: view personal profile, clock-in/out, apply for leaves, view payslips, track performance, update assigned tasks, and access AI assistant. |

---

## 🧪 Demo Credentials & Quick Switcher

Use the demo credentials or the instant Role Switcher located in the top navigation bar (credentials can also be customized via `DEMO_*_PASSWORD` environment variables):

| Role | Email | Default Password | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `Admin@123` | Full enterprise control, company settings & audit logs |
| **HR Admin** | `hr@example.com` | `HR@123` | Staff records, payroll, leaves & document management |
| **Manager** | `manager@example.com` | `Manager@123` | Team oversight, attendance tracking & performance reviews |
| **Employee** | `employee@example.com` | `Employee@123` | Self-service portal, check-in/out, leave requests & payslips |

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts, Framer Motion
- **Backend**: Node.js, Express, Multer (memory buffer storage), JSON Web Tokens (JWT), BCrypt.js
- **Database**: Production MongoDB Atlas integration with connection pooling, automatic initial seeding, change synchronization, and resilient local in-memory fallback
- **File Storage**: MongoDB Atlas binary document storage with direct streaming endpoints (no ephemeral disk reliance; Vercel-ready)
- **AI Engine**: Google GenAI SDK (`@google/genai`) using `gemini-2.5-flash`

---

## 🚀 Environment Setup & Production Deployment

1. Configure required environment variables in `.env` (refer to `.env.example`):
   ```env
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/ems_production?retryWrites=true&w=majority"
   JWT_SECRET="your_production_secure_jwt_secret"
   GEMINI_API_KEY="your_google_gemini_api_key_here"
   APP_URL="https://your-domain.com"
   ```

2. Automatic Database Seeding & Connection:
   - When `MONGODB_URI` is provided, the application connects using connection pooling (`maxPoolSize: 10`).
   - If the database is empty, it automatically seeds all 16 enterprise collections and creates optimal indexes.
   - If the database already has production data, existing data is preserved without overwriting.
   - All CRUD operations persist directly to MongoDB Atlas.
   - When `MONGODB_URI` is not set, the server runs in safe in-memory mode for local testing without writing production data to local JSON disk.

3. Build and Start:
   ```bash
   npm run build
   npm start
   ```

---

## 🔒 Security & Data Privacy
- **Server-Side API Proxying**: The Gemini API key is strictly maintained on the backend and never exposed to client browsers.
- **Strict Role-Based Middleware**: Every sensitive route is guarded by JWT authentication and granular role validation.
- **Audit Logging**: All write and authentication operations are logged to the compliance ledger.
