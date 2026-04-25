# Freelancer-Web-App
FreelanceHub is a full-stack freelancer marketplace web app where clients can post projects and freelancers can bid on them. It features secure authentication with hashed passwords, role-based dashboards, project management, and a real-time bidding system built using React, Node.js, Express, and MongoDB.

# 🚀 FreelanceHub

A full-stack freelancer marketplace web application where clients can post projects and freelancers can bid on them.

---

## 📌 Overview

**FreelanceHub** is a modern web platform inspired by apps like Upwork and Fiverr.
It enables seamless interaction between clients and freelancers through project posting, bidding, and role-based dashboards.

---

## ✨ Features

* 🔐 Secure Authentication (Password hashing using bcrypt)
* 👤 Role-Based Access (Client & Freelancer)
* 💼 Project Posting System (Clients)
* 📊 Dashboard for both roles
* 📝 Bidding System (Freelancers can place bids)
* 📥 View Bids (Clients can see all bids per project)
* 🎨 Premium UI with Tailwind CSS
* ⚡ RESTful API Integration

---

## 🛠️ Tech Stack

**Frontend:**

* React.js
* Tailwind CSS
* Axios
* React Router

**Backend:**

* Node.js
* Express.js
* MongoDB (Mongoose)
* bcrypt (for password hashing)

---

## 📂 Project Structure

```
freelancer-app/
│
├── frontend/          # React Frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/           # Node.js Backend
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```
git clone https://github.com/your-username/freelancehub.git
cd freelancehub
```

---

### 2️⃣ Setup Backend

```
cd backend
npm install
npm start
```

Backend runs on:

```
http://localhost:5001
```

---

### 3️⃣ Setup Frontend

```
cd frontend
npm install
npm start
```

Frontend runs on:

```
http://localhost:3000
```

---

## 🔐 Environment Setup (Optional)

You can create a `.env` file in the frontend:

```
REACT_APP_API_URL=http://localhost:5001
```

---

## 🚀 Usage

### 👤 Client

* Sign up as Client
* Post new projects
* View bids from freelancers

### 👨‍💻 Freelancer

* Sign up as Freelancer
* Browse available projects
* Submit bids with price & message

---

## 📸 Screenshots

> Add screenshots of:

* Landing Page
* Signup/Login UI
* Dashboard
* Project Listing
* Bidding System

---

## 🔮 Future Enhancements

* 💬 Real-time Chat (Socket.io)
* ⭐ Rating & Review System
* 📦 Payment Integration (Stripe)
* 🔔 Notifications System
* 📁 File Upload (Resumes/Attachments)
* 🔐 JWT-based Authentication (advanced)

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork this repo and submit a pull request.

---



---

## 👨‍💻 Author

**Shreyash Jokare**

---

## ⭐ Support

If you like this project, please ⭐ the repository!
