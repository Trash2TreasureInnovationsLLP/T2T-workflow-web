# T2T-workflow-web

Official Internal Operations & Agile Work Management Platform for **Trash2Treasure Innovations LLP (T2T)**.

## 🚀 Overview
A production-grade SaaS-quality internal operations platform built to manage company members, projects, Agile execution (Sprints, Kanban), tasks, workload balancing, and organizational analytics.

### Key Features
- **Executive & Operations Dashboard**: Real-time KPIs, active sprint health scores, and organizational tracking.
- **Dynamic 3-Stage Work Overview**: Past completed deliverables, current active initiatives, and upcoming scheduled roadmap items.
- **Personal Workspace ("My Work")**: Daily queue, in-progress tasks, blocker reporting, and complete **Work History & Completed Deliverables** inspection.
- **Persistent Agile Kanban**: Real-time status transitions with drag-and-drop and database persistence.
- **Sprint Management**: Backlog refinement, sprint planning, and retrospectives.
- **Task Management**: Auto-generated sequential IDs (`T2T-1001`), story points, and task discussion threads.
- **8-Tier RBAC Authentication**: Strict role-based permissions (Super Admin/CEO, COO, CTO, CFO, CMO, CAO, Employee, Intern) with Bcrypt and HttpOnly JWT cookies.
- **Supabase Cloud Integration**: Integrated for cloud assets and file storage.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database / ORM**: Prisma ORM, SQLite / PostgreSQL
- **Cloud Storage**: Supabase Storage
- **Charts**: Recharts

## 📦 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and provide your database and Supabase credentials:
```bash
cp .env.example .env
```

### 3. Database Migration & Seed
```bash
npx prisma db push
node prisma/seed.js
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Automated E2E Verification
```bash
node scripts/verify-all.js
```

---
© 2026 Trash2Treasure Innovations LLP. All rights reserved.
