// ================== IMPORTS ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// OPTIONAL: Stripe (only if installed)
let stripe;
try {
  stripe = require("stripe")(process.env.STRIPE_SECRET || "");
} catch {
  console.log("⚠ Stripe not installed (skipping payments)");
}

// ================== APP INIT ==================
const app = express();
app.use(cors());
app.use(express.json());

// ================== ENV ==================
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/freelancer-app";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// ================== DB CONNECT ==================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB Error:", err));

// ================== MODELS ==================
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String
});

const ProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  budget: Number,
  createdBy: String,
  assigned: { type: Boolean, default: false },
  assignedFreelancer: String
});

const BidSchema = new mongoose.Schema({
  projectId: String,
  freelancerEmail: String,
  amount: Number
});

const User = mongoose.model("User", UserSchema);
const Project = mongoose.model("Project", ProjectSchema);
const Bid = mongoose.model("Bid", BidSchema);

// ================== AUTH MIDDLEWARE ==================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ================== AUTH ROUTES ==================

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role
    });

    res.json({ message: "Signup success" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

// ================== PROJECT ROUTES ==================

// CREATE PROJECT
app.post("/projects", authMiddleware, async (req, res) => {
  const project = await Project.create({
    ...req.body,
    createdBy: req.user.email
  });
  res.json(project);
});

// GET PROJECTS
app.get("/projects", async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

// ================== BIDDING ==================

// CREATE BID
app.post("/bid", authMiddleware, async (req, res) => {
  const bid = await Bid.create({
    ...req.body,
    freelancerEmail: req.user.email
  });
  res.json(bid);
});

// GET BIDS
app.get("/bids/:projectId", async (req, res) => {
  const bids = await Bid.find({ projectId: req.params.projectId });
  res.json(bids);
});

// ACCEPT BID
app.post("/accept-bid", authMiddleware, async (req, res) => {
  const { projectId, freelancerEmail } = req.body;

  await Project.findByIdAndUpdate(projectId, {
    assigned: true,
    assignedFreelancer: freelancerEmail
  });

  res.json({ message: "Bid accepted" });
});

// ================== PAYMENT (SAFE) ==================
app.post("/create-payment", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: "Stripe not configured" });
  }

  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr"
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: "Payment failed" });
  }
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});