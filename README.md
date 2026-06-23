# FreelanceHub 🚀

A full-stack freelance marketplace where clients post projects, freelancers bid and get hired, and both parties chat, share files, track payments, and get notified — all in one place.

---

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend (Live App)** | [https://authentic-beauty-production-e914.up.railway.app](https://authentic-beauty-production-e914.up.railway.app) |
| **Backend API** | [https://freelancer-web-app-production.up.railway.app](https://freelancer-web-app-production.up.railway.app) |
| **Database** | MongoDB Atlas (Cloud) |
| **Repository** | [github.com/Shreyash0895/Freelancer-Web-App](https://github.com/Shreyash0895/Freelancer-Web-App) |

> 👉 Try it now: sign up as a **Client** to post a project, or as a **Freelancer** to start bidding.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 🏠 Public landing page with live activity ticker | ✅ |
| 🔐 JWT Authentication (Client / Freelancer roles) | ✅ |
| 📋 Post, browse, search and filter projects | ✅ |
| 💰 Bidding system with accept/reject | ✅ |
| 💬 Private chat per project (auto-unlocks on bid acceptance) | ✅ |
| 🌐 Global public chat room | ✅ |
| 💳 Stripe payment processing | ✅ |
| 📧 Email notifications (Nodemailer) | ✅ |
| 🔔 In-app notification bell with live unread badge | ✅ |
| 📎 File attachments via Cloudinary | ✅ |
| 📊 Analytics dashboard (earnings, spending, charts) | ✅ |
| 🧾 PDF invoice generation and download | ✅ |
| 👤 Profile management | ✅ |
| ⭐ Reviews and ratings (backend ready) | 🔧 In progress |
| 📱 Mobile responsive polish | 🔧 In progress |

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite 5 | UI framework and build tool |
| React Router v6 | Routing |
| Axios | API calls with JWT interceptor |
| Socket.io Client | Real-time private/global chat |
| Stripe.js | Payment UI |
| Recharts | Analytics charts |
| jsPDF + autoTable | PDF invoice generation |
| Framer Motion | Animations |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API |
| MongoDB Atlas + Mongoose | Database |
| Socket.io | Real-time WebSocket server with room-based auth |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Stripe | Payment gateway |
| Nodemailer | Transactional emails |
| Cloudinary + Multer | File storage |
| Joi | Request validation |
| Helmet + express-rate-limit | Security |

### Infrastructure
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database |
| Railway | Hosting — frontend + backend, auto-deploy on push |
| Cloudinary | File and image storage |
| Gmail SMTP | Email delivery |
| GitHub | Version control and CI/CD |

---

## 📁 Project Structure

```
freelancer-app/
├── .gitignore
├── README.md
│
├── backend/
│   ├── server.js              # Express + Socket.io + all routes
│   ├── package.json
│   ├── .env                   # Environment variables (never commit)
│   └── .gitignore
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── api.js                 # Axios instance with JWT interceptor
    │   ├── components/
    │   │   ├── Sidebar.jsx            # Navigation sidebar
    │   │   ├── NotificationBell.jsx   # Live notification bell with badge
    │   │   ├── ProtectedRoute.jsx     # Auth guard
    │   │   └── FileUpload.jsx         # Drag-drop upload + file list
    │   ├── pages/
    │   │   ├── LandingPage.jsx        # Public homepage with live ticker
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx             # Role pre-select via ?role= param
    │   │   ├── Dashboard.jsx
    │   │   ├── Projects.jsx
    │   │   ├── Chat.jsx               # Private per-project + global chat
    │   │   ├── Payments.jsx           # Stripe checkout
    │   │   ├── Analytics.jsx          # Charts (client + freelancer views)
    │   │   ├── Invoice.jsx            # PDF invoice generation
    │   │   └── Profile.jsx
    │   ├── styles/
    │   │   ├── global.css
    │   │   ├── auth.css
    │   │   └── dashboard.css
    │   ├── utils/
    │   │   └── toast.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    ├── vite.config.js
    └── .gitignore
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free)
- Stripe account (free, test mode)
- Cloudinary account (free)
- Gmail account with App Password

### 1. Clone the repository

```bash
git clone https://github.com/Shreyash0895/Freelancer-Web-App.git
cd Freelancer-Web-App
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```bash
JWT_SECRET=your_super_secret_key_here
MONGO_URI=mongodb://username:password@host:27017/freelancer-app?ssl=true&replicaSet=...
PORT=5001

STRIPE_SECRET=sk_test_your_stripe_secret_key

EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_16_char_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```

Backend runs on: `http://localhost:5001`

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:5001
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key
```

Start frontend:
```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create account and send welcome email |
| POST | `/login` | Login, returns JWT |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | Paginated, searchable, filterable |
| GET | `/projects/:id` | Single project with attachments |
| POST | `/projects` | Create project (client only) |
| POST | `/projects/:id/complete` | Mark completed |

### Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bid` | Submit a bid and email client |
| GET | `/bids/:projectId` | List bids for a project |
| POST | `/accept-bid` | Accept bid, unlock private chat, email freelancer |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects/:id/upload` | Upload file via Cloudinary |
| DELETE | `/projects/:id/files/:fileIndex` | Delete a file |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/my-chats` | List all my conversations |
| GET | `/messages/:room` | Message history (auth-checked per room) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-payment` | Create Stripe payment intent |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reviews` | Submit review (client only) |
| GET | `/reviews/:freelancerEmail` | Get reviews for a freelancer |
| GET | `/reviews/check/:projectId` | Check if review exists |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | My notifications + unread count |
| PUT | `/notifications/read` | Mark all as read |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | My profile |
| PUT | `/profile` | Update my profile |
| GET | `/profile/:email` | Public profile with reviews |

### Socket.io Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `sendMessage` | Client → Server | Send a message (room-scoped) |
| `receiveMessage` | Server → Client | New message in current room |
| `chatHistory` | Server → Client | Initial history on join |
| `authError` | Server → Client | Unauthorized room access attempt |

---

## 📧 Email Notifications

Emails are sent automatically when:

| Trigger | Recipient | Subject |
|---------|-----------|---------|
| Account created | New user | Welcome to FreelanceHub 🚀 |
| Bid placed | Client | New bid on your project 💰 |
| Bid accepted | Freelancer | Your bid was accepted 🎉 |
| File uploaded | Other party | New file uploaded 📎 |

---

## 🔔 In-app Notifications

In-app notifications appear in the sidebar bell for:

| Trigger | Recipient |
|---------|-----------|
| New bid received | Client |
| Bid accepted | Freelancer |
| File uploaded | Other party |
| Payment received | Freelancer |
| Review received | Freelancer |

The bell polls every 30 seconds, shows a live badge count, and marks all as read on open.

---

## 🌍 Deployment (Railway)

### Backend Service
| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Start Command | `node server.js` |
| Variables | `JWT_SECRET`, `MONGO_URI`, `STRIPE_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `FRONTEND_URL` |

### Frontend Service
| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Start Command | `npm run preview` |
| Variables | `VITE_API_URL`, `VITE_STRIPE_PUBLIC_KEY` |

### Auto-deploy
Every push to `main` redeploys both services automatically:
```bash
git add .
git commit -m "your changes"
git push
# Railway redeploys in ~2-3 minutes
```

---

## 💳 Stripe Test Cards

| Card Number | Scenario |
|-------------|---------|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Payment declined |
| `4000 0025 0000 3155` | Requires authentication |

Any future expiry date and any 3-digit CVC.

---

## 🔒 Security

- ✅ Passwords hashed with bcryptjs (salt rounds: 10)
- ✅ JWT tokens expire in 1 day
- ✅ Auth rate limiting — 20 requests per 15 minutes
- ✅ General rate limiting — 100 requests per minute
- ✅ Helmet security headers
- ✅ CORS restricted to known frontend origins
- ✅ Private chat rooms verified server-side on both REST and Socket.io
- ✅ File uploads restricted to project participants, 10MB limit
- ✅ Owner-only bid acceptance, duplicate and self-bid prevention
- ✅ Secrets never committed (.gitignore + history scrubbed)

---

## 🛣️ Roadmap

- [x] Public landing page with live activity ticker
- [x] Email notifications (Nodemailer)
- [x] In-app notification bell with live badge
- [x] Analytics dashboard
- [x] PDF invoice generation
- [x] File attachments (Cloudinary)
- [x] Private chat per project
- [ ] Reviews and ratings UI
- [ ] Mobile responsive polish
- [ ] Dark and light mode toggle
- [ ] Freelancer public profile page
- [ ] Forgot password flow
- [ ] Project categories and tags filter UI
- [ ] Admin dashboard
- [ ] Escrow payment system

---

## 🖥️ Pages Overview

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with live ticker |
| `/login` | Public | Login form |
| `/signup` | Public | Role-based signup |
| `/dashboard` | Auth | Stats and recent projects |
| `/projects` | Auth | Browse, post, bid on projects |
| `/chat` | Auth | Private + global messaging |
| `/payments` | Auth | Stripe payment processing |
| `/analytics` | Auth | Earnings and spending charts |
| `/invoice` | Auth | PDF invoice download |
| `/profile` | Auth | Edit profile info |

---

## 👨‍💻 Author

**Shreyash Jokare**
GitHub: [@Shreyash0895](https://github.com/Shreyash0895)



> Built with ❤️ using React, Node.js, MongoDB Atlas, Stripe, Cloudinary, Nodemailer, and Railway.