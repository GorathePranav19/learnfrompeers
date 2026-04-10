# LearnFlow Pod (LFP) — Student Management System

A full-stack web application for managing a computer class pod — handling student admissions, attendance tracking, performance monitoring, and rankings.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Recharts, React Router 7 |
| **Backend** | Node.js, Express 4, Mongoose 8 |
| **Database** | MongoDB (with in-memory fallback for dev) |
| **Auth** | JWT (Bearer tokens) |

## Quick Start

### Prerequisites
- **Node.js** 18+
- **MongoDB** (optional — the app can run in-memory mode for development)

### 1. Clone & Install

```bash
git clone <repo-url>
cd lfp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

Key environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/lfp_pod` | MongoDB connection string |
| `JWT_SECRET` | — | **Change this!** Random 64+ char string |
| `USE_MEMORY_DB` | `true` | Set to `false` to use real MongoDB |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL for CORS |

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Seed Data (optional, for real MongoDB)

When `USE_MEMORY_DB=true`, data is auto-seeded on each restart.  
For persistent MongoDB, run the seed manually:

```bash
cd backend
npm run seed
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lfp.com` | `admin123` |
| Teacher | `teacher@lfp.com` | `teacher123` |
| Parent | `parent@lfp.com` | `parent123` |

## Features

- **Student Admissions** — Register new students with approval workflow
- **Attendance Tracking** — Daily attendance with present/absent/late status
- **Performance Monitoring** — Track typing speed (WPM) and accuracy over time
- **Rankings** — Composite scoring (speed + accuracy + attendance)
- **Analytics Dashboard** — Charts, course distribution, attendance trends
- **Role-based Access** — Admin, Teacher, Parent, Student roles
- **Responsive UI** — Works on desktop and mobile

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | — | Login |
| `POST` | `/api/auth/register` | Admin | Register a new user |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `GET` | `/api/students` | Yes | List students |
| `POST` | `/api/students` | Admin/Teacher | Create student |
| `GET` | `/api/students/:id` | Yes | Get student details |
| `PUT` | `/api/students/:id` | Admin | Update student |
| `DELETE` | `/api/students/:id` | Admin | Delete student + cascade |
| `PUT` | `/api/students/:id/approve` | Admin | Approve student |
| `POST` | `/api/attendance` | Admin/Teacher | Mark attendance |
| `GET` | `/api/attendance/daily/:date` | Yes | Get daily attendance |
| `GET` | `/api/attendance/student/:id` | Yes | Get student attendance |
| `GET` | `/api/attendance/summary` | Yes | Today's summary |
| `POST` | `/api/performance` | Admin/Teacher | Add performance record |
| `POST` | `/api/performance/bulk` | Admin/Teacher | Bulk add |
| `GET` | `/api/performance/:id` | Yes | Get student performance |
| `GET` | `/api/rankings` | Yes | Get all rankings |
| `GET` | `/api/analytics` | Admin/Teacher | Dashboard analytics |

## Project Structure

```
lfp/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── controllers/           # Route handlers
│   ├── middleware/
│   │   ├── auth.js            # JWT auth + role authorization
│   │   └── validate.js        # Input validation
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routes
│   ├── utils/seed.js          # Database seeder
│   └── server.js              # App entry point
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── context/           # React context (Auth)
│   │   ├── pages/             # Page components
│   │   ├── api.js             # Axios instance
│   │   └── App.jsx            # Router setup
│   └── index.html
└── README.md
```

## License

MIT
