# FreelanceHub 🚀

A full-stack freelance marketplace where clients can post projects, freelancers can bid, and payments are processed securely via Stripe.

**Live Demo:** [https://authentic-beauty-production-e914.up.railway.app](https://authentic-beauty-production-e914.up.railway.app)

---

## ✨ Features

- 🔐 **Authentication** — JWT-based login & signup with role selection (Client / Freelancer)
- 📋 **Project Management** — Post, browse, search, and filter projects with pagination
- 💰 **Bidding System** — Freelancers bid on projects, clients accept the best bid
- 💬 **Real-time Chat** — Global live chat powered by Socket.io with message persistence
- 💳 **Stripe Payments** — Secure card payments with test mode support
- 👤 **Profile Management** — Edit name, bio, skills, experience saved to MongoDB
- 🛡️ **Security** — Helmet, rate limiting, bcryptjs password hashing, JWT auth middleware

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool |
| React Router v6 | Client-side routing |
| Axios | API calls with JWT interceptor |
| Socket.io Client | Real-time chat |
| Stripe.js | Payment processing |
| Framer Motion | Animations |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database |
| Socket.io | Real-time WebSocket server |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Stripe | Payment gateway |
| Joi | Request validation |
| Helmet + Rate Limit | Security |

### Infrastructure
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database |
| Railway | Backend + Frontend hosting |
| GitHub | Version control & CI/CD |

---

## 📁 Project Structure

```
freelancer-app/
├── backend/
│   ├── server.js           # Main server — Express + Socket.io
│   ├── package.json
│   ├── .env                # Environment variables (never commit)
│   └── .gitignore
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── api.js          # Axios instance with JWT interceptor
    │   ├── components/
    │   │   ├── Sidebar.jsx     # Navigation sidebar
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── BidForm.jsx
    │   │   └── BidList.jsx
    │   ├── pages/
    │   │   ├── Login.jsx       # Split-screen login
    │   │   ├── Signup.jsx      # Role-based signup
    │   │   ├── Dashboard.jsx   # Stats + recent projects
    │   │   ├── Projects.jsx    # Browse + post + bid
    │   │   ├── Chat.jsx        # Real-time messaging
    │   │   ├── Payments.jsx    # Stripe payment processing
    │   │   └── Profile.jsx     # Edit profile
    │   ├── styles/
    │   │   ├── global.css      # Design system + CSS variables
    │   │   ├── auth.css        # Auth page styles
    │   │   └── dashboard.css   # Dashboard styles
    │   ├── utils/
    │   │   └── toast.js        # Toast notification system
    │   ├── App.jsx             # Routes
    │   └── main.jsx            # Entry point
    ├── package.json
    ├── vite.config.js
    └── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free)
- Stripe account (free, test mode)

---

### 1. Clone the repository

```bash
git clone https://github.com/Shreyash0895/Freelancer-Web-App.git
cd Freelancer-Web-App
```

---

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
```

Start backend:
```bash
npm run dev
```

Backend runs on: `http://localhost:5001`

---

### 3. Setup Frontend

```bash
cd frontend
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

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create new account |
| POST | `/login` | Login and get JWT token |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | Get all projects (paginated, searchable) |
| POST | `/projects` | Create new project (client only) |

### Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bid` | Submit a bid |
| GET | `/bids/:projectId` | Get all bids for a project |
| POST | `/accept-bid` | Accept a bid (project owner only) |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get current user profile |
| PUT | `/profile` | Update profile |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-payment` | Create Stripe payment intent |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages/:room` | Get chat history |

### Socket.io Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `sendMessage` | Client → Server | Send a chat message |
| `receiveMessage` | Server → Client | Receive new message |
| `chatHistory` | Server → Client | Initial message history |

---

## 🌍 Deployment (Railway)

### Backend
| Setting | Value |
|---------|-------|
| Root Directory | `backend` |
| Start Command | `node server.js` |
| Variables | `JWT_SECRET`, `MONGO_URI`, `STRIPE_SECRET` |

### Frontend
| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Start Command | `npm run preview` |
| Variables | `VITE_API_URL`, `VITE_STRIPE_PUBLIC_KEY` |

### Auto-deploy
Every push to `main` branch automatically redeploys both services.

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

Use any future expiry date and any 3-digit CVC.

---

## 🔒 Security Features

- ✅ Passwords hashed with **bcryptjs**
- ✅ JWT tokens expire in **1 day**
- ✅ Auth rate limiting — **20 requests / 15 minutes**
- ✅ General rate limiting — **100 requests / minute**
- ✅ **Helmet** security headers
- ✅ **CORS** restricted to frontend URL
- ✅ Owner-only bid acceptance
- ✅ Duplicate bid prevention
- ✅ Self-bidding prevention
- ✅ Token auto-refresh on 401

---

## 📸 Screenshots

### Login Page
Split-screen design with background image and stats

### Dashboard
Role-based stats (client vs freelancer) with recent projects grid

### Projects
Search, filter, pagination with bid and post modals

### Chat
Real-time messaging with message history and online status

### Payments
Stripe card payment with transaction history table

---

## 🛣️ Roadmap

- [ ] Email notifications (Nodemailer)
- [ ] Private chat per project
- [ ] Reviews & ratings system
- [ ] Project categories & tags
- [ ] File attachments
- [ ] Escrow payment system
- [ ] PDF invoice generation
- [ ] Mobile app (React Native)

---

## 👨‍💻 Author

**Shreyash Jokare**
- GitHub: [@Shreyash0895](https://github.com/Shreyash0895)

---

## 📄 License

This project is licensed under the MIT License.

---

> Built with ❤️ using React, Node.js, MongoDB Atlas, and Railway
