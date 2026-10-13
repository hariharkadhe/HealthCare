# Medicare Pro — Hospital Reception & Appointment Management System

**Medicare Pro** is a production-grade, full-stack hospital appointment management system built specifically for hospital reception desks, outpatient clinics, and triage receptionists using the **MERN** stack (MongoDB, Express, React, Node.js, TypeScript).

When walk-in patients arrive at the hospital, reception staff can search or register patients, choose medical departments and clinicians, view real-time doctor availability, book appointments, generate sequential waiting queue tokens, print official token receipts, and monitor the live outpatient queue.

---

## 🚀 Key Highlights & Architecture

- **True Concurrency-Safe Scheduling Engine**:
  - Calculates dynamic time slots based on doctor working hours (e.g., 09:00 - 17:00), consultation duration (15m, 20m, 30m), morning/lunch breaks (e.g., 11:00-11:30, 13:00-14:00), and schedule exceptions (leave, holidays, emergency blocks).
  - Enforces database-level partial unique compound indexes on active reservations (`{ doctorId: 1, appointmentDate: 1, startTime: 1 }` where `status != 'Cancelled'`) to eliminate double-booking race conditions.
  - Excludes past slots automatically when viewing current-day availability.
- **Reception Desk Multi-Step Guided Booking**:
  - Step 1: Select patient or register new walk-in with duplicate phone warning.
  - Step 2: Department & doctor filtering.
  - Step 3: Date & visual slot selector.
  - Step 4: Review, confirm, and immediate printable receipt popup.
- **Patient Arrival & Queue Engine**:
  - 1-click arrival check-in with sequential daily token generation (`T-01`, `T-02`, ...).
  - Real-time estimated wait time calculation.
  - Status transitions: `Scheduled` ➔ `Checked In` ➔ `In Consultation` ➔ `Completed`.
  - Public TV Monitor display with patient privacy masking (e.g., `Ramesh S.`).
- **Complete Role-Based Permissions (RBAC)**:
  - **Receptionist**: Patient registration, booking, reschedule, cancel, check-in, token receipt printing.
  - **Administrator**: Clinician management, working hours, break schedules, exception blocks, audit logs, hospital settings.
  - **Doctor**: Room consultation queue, status transitions, personal schedule.
- **Zero-Config Database**:
  - Supports MongoDB Atlas, local MongoDB, and embedded `MongoMemoryServer` fallback for development and automated testing out of the box.

---

## 🔑 Demo Staff Login Accounts

The database comes pre-seeded with realistic hospital departments, doctors, appointments, and credentials:

| Role | Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@medicarepro.com` | `Admin@123` | Full clinical admin, doctors, audit logs |
| **Receptionist** | `receptionist@medicarepro.com` | `Reception@123` | Walk-in bookings, check-in, queue tokens |
| **Doctor (Cardiology)** | `doctor.sharma@medicarepro.com` | `Doctor@123` | Dr. Ananya Sharma's clinic room queue |
| **Doctor (Gen. Medicine)** | `doctor.patel@medicarepro.com` | `Doctor@123` | Dr. Rajesh Patel's clinic room queue |

*(Login page includes 1-click autofill buttons for each account)*

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- **React 18** with **Vite** & **TypeScript**
- **Tailwind CSS** (Custom medical theme with navy, sky blue, and teal accents)
- **FullCalendar** (Daily, weekly, and monthly schedule view)
- **Lucide React** icons
- **React Hook Form** + **Zod** validation
- **React Router Dom v6**

### Backend (`server/`)
- **Node.js** & **Express** with **TypeScript**
- **MongoDB** & **Mongoose ODM**
- **JWT** (HTTP-only secure cookies & Bearer tokens)
- **Bcryptjs** (password hashing)
- **Helmet** (HTTP security headers)
- **Express-Rate-Limit** (DDoS & brute-force protection)
- **Vitest** + **Supertest** (automated test suite)

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js v18+ (tested on Node.js v24)
- npm v9+

### 2. Installation
From the root directory:
```bash
npm run install:all
```
*(Or run `npm install` inside both `server/` and `client/`)*

### 3. Running Automated Tests
The repository includes a complete automated test suite verifying slot calculations, double-booking prevention, role-based security, and REST APIs:
```bash
npm run test:server
```

### 4. Running the Application Locally
In two separate terminals:

**Terminal 1 — Backend Server (Port 5000):**
```bash
npm run server
```

**Terminal 2 — Frontend Client (Port 5173):**
```bash
npm run client
```

Now open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🖥️ Application Pages

1. `/login` — Secure staff authentication with 1-click demo logins.
2. `/dashboard` — Real MongoDB reception desk KPIs, today's appointments table, waiting queue overview.
3. `/check-in` — Walk-in arrival check-in desk, scans appointment ID and issues queue token.
4. `/appointments/book` — 4-step guided booking wizard with real-time slot selection and instant receipt modal.
5. `/queue` — Live staff queue management desk with call-to-room and visit completion actions.
6. `/queue/display` — Fullscreen waiting room monitor with privacy-masked patient names.
7. `/patients` — Patient directory with ID search and pagination.
8. `/patients/register` — Patient registration with duplicate phone validation.
9. `/patients/:id` — Patient medical profile with complete appointment history.
10. `/appointments` — Searchable, filterable appointment master table with reschedule & cancellation modals.
11. `/doctors` — Doctor directory with specialties, fees, and slot durations.
12. `/doctors/:id/schedule` — Doctor weekly hours, breaks, and exception blocks (leave, holidays, emergency blocks).
13. `/calendar` — FullCalendar interactive schedule view.
14. `/departments` — Hospital department directory.
15. `/users` *(Admin)* — Staff user accounts and role assignments.
16. `/audit-logs` *(Admin)* — Immutable system audit trail.
17. `/settings` *(Admin)* — Hospital information and receipt customization.

---

## 🐳 Docker Deployment

To run the entire stack with Docker & MongoDB:
```bash
docker-compose up --build
```
The client will be accessible at [http://localhost:5173](http://localhost:5173) and the backend API at [http://localhost:5000](http://localhost:5000).
