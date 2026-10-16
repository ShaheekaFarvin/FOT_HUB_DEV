# FOT Student Hub 

A full-stack web portal built to digitize student services for the **Faculty of Technology, Rajarata University of Sri Lanka (RUSL)**. It brings elections, announcements, complaints, lost & found, and an AI assistant into one role-based platform for students and faculty administrators.



## Features

- **Authentication** — OTP-verified registration and password reset, JWT-based login (campus email only: `@tec.rjt.ac.lk`)

- **Role-based access** — Student, Super Admin, Hostel Warden, Union Member, and Librarian roles, each scoped to their own permissions

- **Elections** — Department-based voting eligibility, per-position candidates, one-vote-per-position enforcement, live results

- **Complaints** — Public/private visibility, targeted routing to the right admin type, status tracking and replies

- **Lost & Found** — Post, browse, filter by category, and manage lost/found items with images

- **Announcements** — Filterable, searchable, pinned notices from faculty administration

- **Notifications** — In-app notification center with unread counts

- **FOT Buddy** — AI chat assistant (powered by Google Gemini) that answers student questions about the faculty

- **Admin Dashboard** — Stats overview, user management, activity log, and registration configuration (super admin only)

- **Dark / Light theme** toggle across the entire app



## Tech Stack

**Frontend:** React 18, React Router, Tailwind CSS, Axios, lucide-react
**Backend:** Node.js, Express, MongoDB (Mongoose)
**Auth:** JWT, bcryptjs
**File uploads:** Multer
**Email (OTP):** Nodemailer (SMTP)
**AI:** Google Gemini API (`@google/genai`)



## Project Structure


FOT-HUB/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route logic (auth, admin, elections, students, AI chat)
│   ├── middleware/      # Auth, role-based access, file upload
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── utils/           # Mailer, complaint visibility helpers
│   ├── uploads/         # User-uploaded images
│   ├── seed.js          # Sample data seeder
│   └── server.js        # App entry point
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Shared UI (Sidebar, Layout, FotBuddy, etc.)
        ├── context/      # Auth, Theme, Notification, Toast, Election contexts
        ├── pages/
        │   ├── admin/    # Admin dashboard & management pages
        │   └── student/  # Student-facing pages
        └── services/     # API client (axios)

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)

- MongoDB running locally or a MongoDB Atlas connection string

- A Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/apikey)) — for the FOT Buddy AI chat feature

- (Optional) SMTP credentials for real email delivery — without them, OTPs print to the backend console for development

### 1. Clone and install dependencies

cd backend
npm install

cd frontend
npm install


### 2. Configure environment variables

Create `backend/.env`:

env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fot-student-hub
JWT_SECRET=change_this_to_a_long_random_string

#  Email / SMTP (for OTP) 

# Gmail example: enable "App Password" in Google Account → Security
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI Chat (FOT Buddy)
GEMINI_API_KEY=your-gemini-api-key-here


> If `SMTP_USER` / `SMTP_PASS` are left as placeholders, OTPs are printed to the backend console instead of emailed — useful for local development.

### 3. Seed sample data (optional but recommended)


cd backend
npm run seed          # insert sample data (skips if already present)
npm run seed:fresh    # wipe collections first, then seed


### 4. Run the app

In two separate terminals:


# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend
npm start


The frontend is pre-configured to proxy API requests to `http://localhost:5000`.



## User Roles & Access

| Role            | Access                                                              |
|-----------------|----------------------------------------------------------------------|
| Student         | Elections (voting), Announcements, Complaints, Lost & Found, Profile |
| Super Admin     | Full access — Elections management, Users, Activity Log, Reg. Config |
| Hostel Warden   | Announcements + Complaints only                                      |
| Union Member    | Announcements + Complaints only                                      |
| Librarian       | Announcements + Complaints only                                      |


## Notes

- Only `@tec.rjt.ac.lk` campus email addresses can register as students.
- Uploaded images are served from `backend/uploads/` and are intentionally **not** git-ignored, so they persist across clones.
- The FOT Buddy AI endpoint requires a valid login (JWT) to prevent unauthenticated API usage.


## About

Developed for the Faculty of Technology, Rajarata University of Sri Lanka — a full-featured student services platform covering authentication, elections, complaints, lost & found, announcements, and an AI assistant.