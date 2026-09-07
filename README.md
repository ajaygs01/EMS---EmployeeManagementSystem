# 👨‍💼 Employee Management System (EMS)

> 🚀 A modern full-stack web application for managing employees, attendance, leave, tasks, payroll, departments, performance, and role-based access.

<p align="center">

  🌐 <strong>Live Application</strong><br>

  <a href="https://ems-employee-management-system-beryl.vercel.app">
    https://ems-employee-management-system-beryl.vercel.app
  </a>

</p>

---

## 📌 Table of Contents

- [📖 Overview](#-overview)
- [🎯 Objectives](#-objectives)
- [✨ Key Features](#-key-features)
- [👥 User Roles](#-user-roles)
- [📦 System Modules](#-system-modules)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [🔄 Application Workflow](#-application-workflow)
- [🗄️ Database](#️-database)
- [🔐 Authentication and Security](#-authentication-and-security)
- [📂 Project Structure](#-project-structure)
- [⚙️ Installation and Setup](#️-installation-and-setup)
- [🔑 Environment Variables](#-environment-variables)
- [▶️ Running the Project](#️-running-the-project)
- [🏗️ Production Build](#️-production-build)
- [🚀 Deployment](#-deployment)
- [🧪 Testing and Verification](#-testing-and-verification)
- [📸 Screenshots](#-screenshots)
- [🔮 Future Enhancements](#-future-enhancements)
- [🐛 Known Limitations](#-known-limitations)
- [🤝 Contributing](#-contributing)
- [🐛 Issues and Support](#-issues-and-support)
- [🔒 Security](#-security)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)
- [⭐ Support](#-support)

---

# 📖 Overview

The **Employee Management System (EMS)** is a full-stack web-based application designed to simplify and centralize employee and organizational management.

The system provides a structured platform where authorized users can manage employee information and perform important organizational operations through a modern and responsive web interface.

EMS supports different user roles such as:

- 👑 Administrator
- 👩‍💼 HR
- 👨‍💼 Manager
- 👨‍💻 Employee

Each role is provided with appropriate access based on its responsibilities through **Role-Based Access Control (RBAC)**.

The application uses **React and TypeScript** for the frontend, **Node.js and Express.js** for backend/API functionality, and **MongoDB Atlas** for persistent cloud database storage.

The project is deployed on **Vercel**, making the application accessible through a production URL.

---

# 🎯 Objectives

The main objectives of the Employee Management System are:

- 👥 Centralize employee information and records.
- 🔐 Provide secure authentication and authorization.
- 🛡️ Implement role-based access control.
- 🕒 Manage employee attendance.
- 🏖️ Manage employee leave requests.
- ✅ Create and manage employee tasks.
- 💰 Manage payroll-related information.
- 🏢 Organize employees according to departments.
- 📊 Provide useful dashboards and management information.
- 📈 Support employee performance-related information.
- ☁️ Store application data using a cloud database.
- 🚀 Provide a production-ready web deployment.
- ⚡ Provide a simple and user-friendly interface for different types of users.

---

# ✨ Key Features

## 👥 Employee Management

The system provides functionality for managing employee information.

Features include:

- 👤 Employee records
- ➕ Adding employees
- ✏️ Updating employee information
- 👁️ Viewing employee information
- 🏢 Department association
- 📋 Employee-related information management

---

## 🕒 Attendance Management

The attendance module helps organizations manage employee attendance information.

Features include:

- 🕒 Attendance records
- 📅 Attendance history
- 📊 Attendance-related information
- 👤 Employee attendance tracking

---

## 🏖️ Leave Management

Employees can manage their leave requests through the system.

Features include:

- 📝 Leave application
- 📋 Leave request tracking
- ✅ Leave approval
- ❌ Leave rejection
- 📊 Leave status
- 📅 Leave history

---

## ✅ Task Management

The task management module allows authorized users to create and assign tasks.

Features include:

- ➕ Create tasks
- 📝 Task details
- 👤 Assign tasks to employees
- 📌 Track task status
- 🔄 Update task information
- 💾 Persistent task storage

Task data is stored in the database and remains available after refreshing the application.

---

## 💰 Payroll Management

The payroll module provides payroll-related employee information.

Features include:

- 💰 Salary information
- 📋 Payroll records
- 👤 Employee payroll information
- 📊 Payroll-related management

---

## 🏢 Department Management

The system supports organizational department management.

Features include:

- 🏢 Department information
- 👥 Employee department association
- 📋 Department-related records
- 📊 Department organization

---

## 📈 Performance Management

The system provides performance-related employee information and management functionality.

---

## 📊 Dashboard

The dashboard provides users with a centralized overview of relevant information.

Depending on the user's role, the dashboard provides access to appropriate system functionality.

---

## 🔐 Role-Based Access Control

The application provides different levels of access based on user roles.

This helps ensure that users only access the functionality appropriate for their responsibilities.

---

# 👥 User Roles

The application supports multiple user roles.

| Role | Description |
|------|-------------|
| 👑 **Admin** | Provides administrative control over the system and access to major management functionality. |
| 👩‍💼 **HR** | Handles employee and HR-related operations. |
| 👨‍💼 **Manager** | Handles management and team/task-related operations. |
| 👨‍💻 **Employee** | Accesses employee-level functionality such as tasks, attendance and leave. |

### 🔑 Access Model

```text
                 🔐 LOGIN
                    │
                    ▼
             👤 AUTHENTICATED USER
                    │
                    ▼
              🛡️ ROLE CHECK
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
    👑 Admin     👩‍💼 HR      👨‍💼 Manager
                                │
                                ▼
                          👨‍💻 Employee
