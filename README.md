# FreelanceHub 🚀

A full-stack freelancer marketplace where **clients post projects** and **freelancers bid on them** — built with React, Node.js, Express, MongoDB, and Socket.io.

![FreelanceHub](https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80&auto=format&fit=crop)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Pages & Components](#pages--components)
- [Screenshots](#screenshots)
- [Known Issues](#known-issues)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Overview

FreelanceHub is a modern freelancer marketplace web application that enables:

- **Clients** to sign up, post projects with budgets, review incoming bids, and accept the best freelancer for the job.
- **Freelancers** to browse open projects, submit competitive bids with cover messages, and communicate via real-time chat.
- **Both roles** to track project status, manage payments, and maintain their profiles — all from a clean dark-themed dashboard.

---

## Features

### Authentication
- ✅ JWT-based secure login and signup
- ✅ bcrypt password hashing (10 salt rounds)
- ✅ Role-based access — **Client** or **Freelancer**
- ✅ Protected routes (unauthenticated users redirected to login)
- ✅ Auto logout on token expiry (401 interceptor)

### Projects
- ✅ Clients can post projects with title, description, and budget
- ✅ All users can browse the full project listing
- ✅ Projects show assigned/open status with badges
- ✅ Clients can manage and assign projects from the dashboard

### Bidding System
- ✅ Freelancers can place bids with a price and cover message
- ✅ Clients can view all bids per project
- ✅ Clients can accept a bid — project is marked as assigned
- ✅ Only the project owner can accept bids (server-side check)

### Real-time Chat
- ✅ Socket.io powered live messaging
- ✅ Messages display sender name and timestamp
- ✅ Connection status indicator (online/offline)
- ✅ Auto-scroll to latest message

### Payments
- ✅ Lists all assigned projects as payment transactions
- ✅ Shows paid/pending status per project
- ✅ Stripe payment intent integration (optional)
- ✅ Payment summary cards (total, paid, pending)

### Profile
- ✅ Editable profile fields (name, phone, skills, experience, bio)
- ✅ Dynamic avatar with initials
- ✅ Profile data persisted in localStorage

### UI/UX
- ✅ Stunning split-screen auth pages with Unsplash background images
- ✅ Fully dark-themed design system
- ✅ Toast notification system (success / error / info)
- ✅ Loading spinners on all async actions
- ✅ Responsive sidebar navigation
- ✅ Hover animations and smooth transitions

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool & dev server |
| React Router DOM | 6.x | Client-side routing |
| Axios | 1.x | HTTP requests to backend |
| Socket.io Client | 4.x | Real-time chat |
| Framer Motion | 11.x | Animations |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.x | Web framework |
| MongoDB | 7.x | Database |
| Mongoose | 8.x | ODM for MongoDB |
| Socket.io | 4.x | Real-time WebSocket server |
| bcrypt | 5.x | Password hashing |
| jsonwebtoken | 9.x | JWT auth tokens |
| dotenv | 16.x | Environment variable management |
| cors | 2.x | Cross-origin resource sharing |
| Stripe *(optional)* | 14.x | Payment processing |

---

## Project Structure

```
freelancer-app/
│
├── backend/
│   ├── server.js              # Express app, routes, Socket.io, DB connection
│   ├── package.json           # Backend dependencies and scripts
│   └── .env                   # Environment variables (never commit this!)
│
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js         # Axios instance with JWT interceptor
│   │   │
│   │   ├── components/
│   │   │   ├── Sidebar.jsx    # Navigation sidebar used across all pages
│   │   │   └── ProtectedRoute.jsx  # Auth guard for private routes
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Login page with background image
│   │   │   ├── Signup.jsx     # Signup page with role selection
│   │   │   ├── Dashboard.jsx  # Main dashboard with stats & recent projects
│   │   │   ├── Projects.jsx   # Project listing, post project, bid modals
│   │   │   ├── Chat.jsx       # Real-time Socket.io chat
│   │   │   ├── Profile.jsx    # Editable user profile
│   │   │   └── Payments.jsx   # Payment tracking and Stripe integration
│   │   │
│   │   ├── styles/
│   │   │   └── global.css     # Global design tokens, toast styles, layout
│   │   │
│   │   ├── utils/
│   │   │   └── toast.js       # Custom toast notification system
│   │   │
│   │   ├── App.jsx            # Root component with all routes
│   │   └── main.jsx           # React DOM entry point
│   │
│   ├── index.html             # HTML entry point
│   ├── vite.config.js         # Vite configuration
│   └── package.json           # Frontend dependencies and scripts
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`
- npm v9 or higher

Verify your installations:
```bash
node --version   # should be v18+
npm --version    # should be v9+
mongod --version # should be v6+
```

---

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Shreyash0895/Freelancer-Web-App.git
cd Freelancer-Web-App
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

---

### Environment Variables

Create a `.env` file inside the `backend/` folder:

```bash
cd backend
cp .env.example .env
```

Then open `.env` and fill in the values:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/freelancer-app
JWT_SECRET=your_super_secret_jwt_key_change_this
STRIPE_SECRET=sk_test_your_stripe_key_here
```

> ⚠️ **Important:** Never commit your `.env` file. It is already listed in `.gitignore`.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5001) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret key for signing JWT tokens |
| `STRIPE_SECRET` | No | Stripe secret key for payments |

---

### Running the App

**Start MongoDB** (if not running as a service):
```bash
mongod
```

**Start the backend** (in a new terminal):
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5001
```

**Start the frontend** (in another terminal):
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**Open your browser at:** [http://localhost:5173](http://localhost:5173)

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/signup` | ❌ | Register a new user |
| `POST` | `/login`  | ❌ | Login and receive JWT token |

**POST /signup — Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "client"
}
```

**POST /login — Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "role": "client",
  "name": "John Doe"
}
```

---

### Projects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/projects`  | ❌ | Get all projects |
| `POST` | `/projects`  | ✅ | Create a new project |

**POST /projects — Request body:**
```json
{
  "title": "Build a React Dashboard",
  "description": "Need a clean admin dashboard with charts.",
  "budget": 500
}
```

---

### Bidding

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/bid`               | ✅ | Submit a bid on a project |
| `GET`  | `/bids/:projectId`   | ❌ | Get all bids for a project |
| `POST` | `/accept-bid`        | ✅ | Accept a bid (client only) |

**POST /bid — Request body:**
```json
{
  "projectId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "amount": 450,
  "message": "I have 3 years of React experience."
}
```

---

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/create-payment` | ✅ | Create Stripe payment intent |

**POST /create-payment — Request body:**
```json
{
  "amount": 45000
}
```
> Amount is in **paise** (Indian currency). ₹450 = `45000`.

---

## Pages & Components

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Login | `/` | Public | Sign in with email & password |
| Signup | `/signup` | Public | Create client or freelancer account |
| Dashboard | `/dashboard` | Private | Stats overview and recent projects |
| Projects | `/projects` | Private | Browse, post, bid on projects |
| Chat | `/chat` | Private | Real-time Socket.io messaging |
| Payments | `/payments` | Private | Track payment transactions |
| Profile | `/profile` | Private | Edit personal information |

---

## Known Issues

- 🔸 Chat history is not persisted — messages are lost on page refresh (no DB storage for messages yet)
- 🔸 Profile data is stored in `localStorage`, not in MongoDB
- 🔸 No email verification on signup
- 🔸 Stripe integration requires additional `@stripe/stripe-js` setup on the frontend for full payment flow

---

## Future Improvements

- [ ] Persist chat messages in MongoDB
- [ ] Email verification on signup
- [ ] Password reset via email
- [ ] Notifications system (new bids, accepted bids)
- [ ] File/image upload for project attachments
- [ ] Freelancer ratings and reviews
- [ ] Admin panel for platform management
- [ ] Mobile responsive design improvements
- [ ] Docker setup for easy deployment
- [ ] Deploy to Vercel (frontend) + Railway (backend)

---

## Author

**Shreyash Jokare**

- GitHub: [@Shreyash0895](https://github.com/Shreyash0895)
- Project: [Freelancer-Web-App](https://github.com/Shreyash0895/Freelancer-Web-App)

---

> Built with ❤️ using React + Node.js + MongoDB
