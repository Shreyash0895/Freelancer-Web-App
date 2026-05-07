// ================== IMPORTS ==================
const express   = require("express");
const http      = require("http");
const { Server } = require("socket.io");
const mongoose  = require("mongoose");
const cors      = require("cors");
const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");
require("dotenv").config();

let stripe;
try {
  stripe = require("stripe")(process.env.STRIPE_SECRET || "");
} catch {
  console.log("⚠  Stripe not installed (skipping payments)");
}

// ================== APP INIT ==================
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

// ================== ENV ==================
const PORT      = process.env.PORT      || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/freelancer-app";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌  JWT_SECRET is not set in .env — refusing to start.");
  process.exit(1);
}

// ================== DB CONNECT ==================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ DB Error:", err); process.exit(1); });

// ================== MODELS ==================
const UserSchema = new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  role:     String,
});

const ProjectSchema = new mongoose.Schema({
  title:               String,
  description:         String,
  budget:              Number,
  createdBy:           String,
  assigned:            { type: Boolean, default: false },
  assignedFreelancer:  String,
}, { timestamps: true });

const BidSchema = new mongoose.Schema({
  projectId:       String,
  freelancerEmail: String,
  amount:          Number,
  message:         String,
}, { timestamps: true });

const User    = mongoose.model("User",    UserSchema);
const Project = mongoose.model("Project", ProjectSchema);
const Bid     = mongoose.model("Bid",     BidSchema);

// ================== AUTH MIDDLEWARE ==================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ================== AUTH ROUTES ==================

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role });
    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ================== PROJECT ROUTES ==================

// CREATE PROJECT
app.post("/projects", authMiddleware, async (req, res) => {
  try {
    const { title, description, budget } = req.body;
    if (!title || !budget)
      return res.status(400).json({ message: "Title and budget are required" });

    const project = await Project.create({
      title, description, budget: Number(budget),
      createdBy: req.user.email,
    });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// GET ALL PROJECTS
app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ================== BIDDING ==================

// CREATE BID
app.post("/bid", authMiddleware, async (req, res) => {
  try {
    const { projectId, amount, message } = req.body;
    if (!projectId || !amount)
      return res.status(400).json({ message: "Project and amount are required" });

    const bid = await Bid.create({
      projectId, amount: Number(amount), message,
      freelancerEmail: req.user.email,
    });
    res.json(bid);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit bid" });
  }
});

// GET BIDS FOR A PROJECT
app.get("/bids/:projectId", async (req, res) => {
  try {
    const bids = await Bid.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bids" });
  }
});

// ACCEPT BID
app.post("/accept-bid", authMiddleware, async (req, res) => {
  try {
    const { projectId, freelancerEmail } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.createdBy !== req.user.email)
      return res.status(403).json({ message: "Only the project owner can accept bids" });

    await Project.findByIdAndUpdate(projectId, {
      assigned: true,
      assignedFreelancer: freelancerEmail,
    });
    res.json({ message: "Bid accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to accept bid" });
  }
});

// ================== PAYMENT ==================
app.post("/create-payment", authMiddleware, async (req, res) => {
  if (!stripe) return res.status(500).json({ message: "Stripe not configured" });
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency: "inr",
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment failed" });
  }
});

// ================== SOCKET.IO — REAL-TIME CHAT ==================
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("sendMessage", (data) => {
    // Broadcast to all OTHER clients (sender already shows optimistically)
    socket.broadcast.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ================== START ==================
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});