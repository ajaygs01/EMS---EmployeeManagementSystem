# EMS (Employee Management System) — Design System Master

## 1. Design System Overview & Archetype
- **System Name**: EMS Enterprise UI Design System
- **Archetype**: Professional Business / HR Enterprise SaaS
- **Visual Personality**: Precise, trustworthy, high-contrast, structured, and modern with warm/cool neutral balances.
- **Iconography**: Lucide React icons with standard 16px/20px/24px sizing. No emoji substitutes for functional UI controls.

---

## 2. Color Palette & Theming Tokens

### Light Theme (Default)
- **Canvas / Background**: `slate-100/70` (`#f1f5f9` with subtle opacity blending)
- **Surfaces & Cards**: `white` (`#ffffff`) with subtle `slate-200/80` borders
- **Primary Accent**: Indigo `indigo-600` (`#4f46e5`), hover `indigo-500` (`#6366f1`), active `indigo-700` (`#4338ca`)
- **Secondary Accent**: Violet / Purple `purple-600` (`#9333ea`)
- **Semantic Statuses**:
  - **Success / Active / Paid**: Emerald `emerald-600` / `emerald-50` background
  - **Warning / Pending / On Leave**: Amber `amber-600` / `amber-50` background
  - **Danger / Inactive / Rejected**: Rose `rose-600` / `rose-50` background
  - **Info / In Progress**: Sky `sky-600` / `sky-50` background
- **Text Primary**: `slate-900` (`#0f172a`)
- **Text Secondary**: `slate-600` (`#475569`)
- **Text Muted / Placeholder**: `slate-400` (`#94a3b8`)

### Dark Theme
- **Canvas / Background**: `slate-950` (`#020617`)
- **Surfaces & Cards**: `slate-900` (`#0f172a`) with `slate-800/80` borders
- **Text Primary**: `slate-100` (`#f1f5f9`)
- **Text Secondary**: `slate-400` (`#94a3b8`)
- **Borders & Dividers**: `slate-800` (`#1e293b`)

---

## 3. Typography & Hierarchy

| Scale | Class | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Page Title** | `text-2xl` (24px) | `font-black` (900) | `tracking-tight` | Top-level module headers |
| **Card Header / Section** | `text-base` / `text-lg` (16-18px) | `font-bold` (700) | `tracking-tight` | Widget headers, modal titles |
| **Body / Content** | `text-xs` / `text-sm` (12-14px) | `font-normal` (400) / `font-medium` (500) | Normal | Data tables, form descriptions, lists |
| **Subtext / Meta** | `text-[10px]` / `text-[11px]` | `font-semibold` (600) | `tracking-wide` | Timestamps, tags, role badges |

---

## 4. Spacing & Container Geometry
- **Outer Padding**: `p-4 sm:p-6 lg:p-8`
- **Card Border Radius**: `rounded-3xl` (24px) for major modules and modals; `rounded-2xl` (16px) for inner stat blocks; `rounded-xl` (12px) for form inputs and buttons.
- **Mathematical Corner Nesting**: `Inner Radius = Outer Radius - Padding` ensures harmonious visual balance.
- **Button Dimension Rule**: Horizontal padding is 2x vertical padding (e.g. `px-4 py-2`).

---

## 5. UI Components & Patterns

### A. Navigation & Sidebar
- Organized into 4 logical groups:
  1. **Main**: Dashboard, Employees, Departments, Attendance, Leaves, Payroll, Performance, Tasks
  2. **Communication**: Announcements, Notifications
  3. **Management & AI**: Documents, Reports & Analytics, Audit Logs, AI HR Suite
  4. **System**: Settings, Profile, Role Switcher
- Persistent role filtering (Super Admin, HR Admin, Manager, Employee).

### B. Data Tables & Filters
- Compact high-density data tables with `text-xs` sizing.
- Integrated search bar with instant debouncing.
- Multi-faceted status & department dropdown filters.
- Pagination controls with total count indicators.

### C. Stat Cards
- High-contrast visual metric presentation with contextual iconography, trend indicators (+/- %), and quick-action navigation.

### D. Modals & Overlays
- Centered backdrop overlay with subtle blur.
- Sticky modal header and footer with clear action buttons.
- Comprehensive form validation and loading spinners.

### E. AI Copilot Integration
- Dedicated AI HR Assistant interface.
- Role-scoped context injection (prevents non-admins from extracting restricted compensation data).
- Instant preset prompt chips for common HR workflows.
