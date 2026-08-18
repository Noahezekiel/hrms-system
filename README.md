# Enterprise Staff Biometric Attendance & ID Card Management System

A complete, production-ready HRMS solution for managing employee biometric attendance (fingerprint and facial recognition), ID card generation with QR/barcode, and comprehensive workforce management.

## Features

- **Multi-Company & Multi-Branch** – Support for multiple organizations and locations.
- **Unlimited Employees, Departments, Positions** – Scalable structure.
- **Biometric Enrollment** – Fingerprint and facial recognition integration.
- **Daily Attendance** – Check In, Check Out, Break In, Break Out, Overtime tracking.
- **Leave & Holiday Management** – Leave requests, approvals, and holiday calendars.
- **Shift Management** – Flexible shift definitions and assignments.
- **ID Card Generation** – QR Code and Barcode enabled ID cards with download/print.
- **Real‑time Updates** – Live attendance events via Socket.IO.
- **Advanced Reporting** – Export to PDF and Excel with rich filters.
- **Role-Based Access Control** – Super Admin, Company Admin, HR Manager, Attendance Officer, Department Manager, Staff.
- **Audit Logs** – Track all critical actions.
- **Dark / Light Mode** – Fully responsive UI.
- **Cloudinary Integration** – Employee photo and document uploads.

## Technology Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Hook Form + Zod
- Zustand (state management)
- TanStack Query (data fetching)
- Axios
- Socket.IO Client
- Framer Motion

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication + Refresh Tokens
- Socket.IO
- Cloudinary
- Multer
- Nodemailer
- Bcrypt

## Project Structure

.
├── server/ # Backend (Express + Prisma)
│ ├── src/
│ │ ├── config/ # Configuration files
│ │ ├── controllers/ # Request handlers
│ │ ├── services/ # Business logic
│ │ ├── repositories/ # Data access layer
│ │ ├── routes/ # API route definitions
│ │ ├── middleware/ # Auth, validation, error handling
│ │ ├── validation/ # Zod schemas
│ │ ├── dto/ # Data Transfer Objects
│ │ ├── utils/ # Helpers (JWT, password, QR, barcode, PDF, Excel)
│ │ ├── sockets/ # Socket.IO event handlers
│ │ ├── types/ # Shared TypeScript types
│ │ ├── app.ts # Express app setup
│ │ └── index.ts # Server entry point
│ ├── prisma/
│ │ ├── schema.prisma # Database schema
│ │ └── seed.ts # Seed data
│ └── package.json
├── client/ # Frontend (Next.js)
│ ├── src/
│ │ ├── app/ # App Router pages
│ │ ├── components/ # Reusable UI components
│ │ ├── hooks/ # Custom React hooks
│ │ ├── lib/ # API client, socket, query client
│ │ ├── store/ # Zustand stores
│ │ ├── types/ # Shared types
│ │ ├── utils/ # Helpers
│ │ └── contexts/ # React contexts
│ └── package.json
├── docker-compose.yml # Docker setup for PostgreSQL + app
├── .env.example # Environment variables template
└── .gitignore

text

## Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Cloudinary account (for image uploads)
- SMTP server (for email notifications)

### Environment Variables

Copy `.env.example` to `.env` in both `server/` and `client/` directories and fill in the values.

#### Server `.env`
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/hrms
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
Client .env.local
env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
Database Setup
bash
# Navigate to server
cd server
# Install dependencies
npm install
# Run Prisma migrations
npx prisma migrate dev --name init
# Seed the database (creates default roles and admin user)
npm run seed
Running the Application
Development Mode
bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
The app will be available at:

Frontend: http://localhost:3000

Backend API: http://localhost:5000

Socket.IO: http://localhost:5000

Production Build
bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
npm start
Using Docker
bash
# Start all services (PostgreSQL + app containers)
docker-compose up -d

# Run migrations inside the server container
docker-compose exec server npx prisma migrate deploy
docker-compose exec server npm run seed
Default Admin Credentials
After seeding, you can log in with:

Email: admin@hrms.com

Password: Admin@123

Key Features Overview
Attendance Flow
Employee checks in via web/mobile using biometric or manual entry.

System records timestamp and optionally captures photo/fingerprint.

Breaks and overtime are tracked automatically based on shift rules.

Real-time events are broadcast to managers.

ID Card Generation
Each employee gets a unique ID with QR Code and Barcode.

Cards can be downloaded as PNG/PDF and printed.

QR code encodes employee ID and company info.

Reporting
Generate attendance summaries by employee, department, or branch.

Export to PDF or Excel with customizable date ranges.

Role Permissions
Super Admin: Full system access.

Company Admin: Manage company settings, branches, departments.

HR Manager: Manage employees, leave, attendance, reports.

Attendance Officer: Process attendance, handle check-ins/outs.

Department Manager: View team attendance and leave.

Staff: View own attendance, apply for leave.

Deployment
Production Checklist
Set NODE_ENV=production and use a strong JWT_SECRET.

Use a production PostgreSQL database (e.g., AWS RDS, Neon).

Configure Cloudinary for media storage.

Set up an SMTP service (SendGrid, AWS SES, etc.).

Use HTTPS in production.

Enable logging and monitoring.

Git Commands
bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo>
git push -u origin main
Build Commands (for CI/CD)
bash
# Backend build
cd server && npm run build

# Frontend build
cd client && npm run build
License
This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

 📸 Bonus: Staff Role Limitations
Feature	Admin	Staff
View all employees	✅	❌
View own employee	✅	✅
Check in/out for anyone	✅	❌ (only self)
View all attendance	✅	❌ (only own)
Submit leave	✅	✅
Approve leave	✅	❌
View reports	✅	❌
Manage users	✅	❌

