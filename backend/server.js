// ============================================================
//  FreelanceHub — Production-Ready Backend Server
// ============================================================

const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const cors       = require("cors");
const bcrypt     = require("bcrypt");
const jwt        = require("jsonwebtoken");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const Joi        = require("joi");
require("dotenv").config();

let stripe;
try {
  stripe = require("stripe")(process.env.STRIPE_SECRET || "");
} catch {
  console.log("⚠  Stripe not installed — payments disabled");
}

// ============================================================
//  APP INIT
// ============================================================
const app    = express();
const server = http.createServer(app);

// ── Allowed frontend origins ──
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,        // e.g. https://freelancehub.vercel.app
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

// ── Trust proxy (required for Render / Railway) ──
app.set("trust proxy", 1);

// ── Security headers ──
app.use(helmet());

// ── CORS ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10kb" })); // Limit body size

// ============================================================
//  ENV VALIDATION
// ============================================================
const PORT       = process.env.PORT      || 5001;
const MONGO_URI  = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error("❌  MONGO_URI is not set in .env — refusing to start.");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("❌  JWT_SECRET is not set in .env — refusing to start.");
  process.exit(1);
}

// ============================================================
//  RATE LIMITING
// ============================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: "Too many requests. Please slow down." },
});

app.use("/login",  authLimiter);
app.use("/signup", authLimiter);
app.use("/projects", generalLimiter);
app.use("/bids",     generalLimiter);

// ============================================================
//  HEALTH CHECK (for Render uptime monitoring)
// ============================================================
app.get("/health", (req, res) => {
  res.json({
    status:    "ok",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    env:       process.env.NODE_ENV || "development",
  });
});

// ============================================================
//  DB CONNECT
// ============================================================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ DB Error:", err.message); process.exit(1); });

// ============================================================
//  MODELS WITH INDEXES
// ============================================================
const UserSchema = new mongoose.Schema({
  name:       { type: String, trim: true },
  email:      { type: String, unique: true, lowercase: true, trim: true },
  password:   { type: String },
  role:       { type: String, enum: ["client", "freelancer"] },
  phone:      { type: String, default: "" },
  skills:     { type: String, default: "" },
  experience: { type: String, default: "" },
  bio:        { type: String, default: "" },
}, { timestamps: true });
UserSchema.index({ email: 1 });

const ProjectSchema = new mongoose.Schema({
  title:              { type: String, trim: true },
  description:        { type: String, trim: true },
  budget:             { type: Number, min: 1 },
  createdBy:          { type: String, index: true },
  assigned:           { type: Boolean, default: false },
  assignedFreelancer: { type: String, default: null },
}, { timestamps: true });
ProjectSchema.index({ createdBy: 1, assigned: 1 });

const BidSchema = new mongoose.Schema({
  projectId:       { type: String, index: true },
  freelancerEmail: { type: String },
  amount:          { type: Number, min: 1 },
  message:         { type: String, default: "" },
}, { timestamps: true });
BidSchema.index({ projectId: 1 });

const MessageSchema = new mongoose.Schema({
  sender: { type: String },
  text:   { type: String },
  room:   { type: String, default: "global" },
}, { timestamps: true });
MessageSchema.index({ room: 1, createdAt: -1 });

const User    = mongoose.model("User",    UserSchema);
const Project = mongoose.model("Project", ProjectSchema);
const Bid     = mongoose.model("Bid",     BidSchema);
const Message = mongoose.model("Message", MessageSchema);

// ============================================================
//  AUTH MIDDLEWARE
// ============================================================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ============================================================
//  JOI VALIDATION SCHEMAS
// ============================================================
const schemas = {
  signup: Joi.object({
    name:     Joi.string().min(2).max(50).required(),
    email:    Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role:     Joi.string().valid("client", "freelancer").required(),
  }),
  login: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  project: Joi.object({
    title:       Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(2000).required(),
    budget:      Joi.number().min(1).max(1000000).required(),
  }),
  bid: Joi.object({
    projectId: Joi.string().required(),
    amount:    Joi.number().min(1).max(1000000).required(),
    message:   Joi.string().max(1000).allow("").optional(),
  }),
  acceptBid: Joi.object({
    projectId:       Joi.string().required(),
    freelancerEmail: Joi.string().email().required(),
  }),
  profile: Joi.object({
    name:       Joi.string().min(2).max(50).optional(),
    phone:      Joi.string().max(20).allow("").optional(),
    skills:     Joi.string().max(200).allow("").optional(),
    experience: Joi.string().max(100).allow("").optional(),
    bio:        Joi.string().max(500).allow("").optional(),
  }),
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message).join(", ");
    return res.status(400).json({ message: messages });
  }
  next();
};

// ============================================================
//  AUTH ROUTES
// ============================================================
app.post("/signup", validate(schemas.signup), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email: email.toLowerCase(), password: hashed, role });
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed. Please try again." });
  }
});

app.post("/login", validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "No account found with this email" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });
    const token = jwt.sign(
      { email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ============================================================
//  PROFILE ROUTES
// ============================================================
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

app.put("/profile", authMiddleware, validate(schemas.profile), async (req, res) => {
  try {
    const { name, phone, skills, experience, bio } = req.body;
    const updated = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { name, phone, skills, experience, bio } },
      { new: true }
    ).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated", user: updated });
  } catch {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ============================================================
//  PROJECT ROUTES
// ============================================================
app.post("/projects", authMiddleware, validate(schemas.project), async (req, res) => {
  try {
    const { title, description, budget } = req.body;
    const project = await Project.create({
      title, description, budget: Number(budget), createdBy: req.user.email,
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ message: "Failed to create project" });
  }
});

app.get("/projects", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const filter = {};
    if (req.query.assigned === "true")  filter.assigned = true;
    if (req.query.assigned === "false") filter.assigned = false;
    if (req.query.search) {
      filter.$or = [
        { title:       { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Project.countDocuments(filter),
    ]);
    res.json({
      projects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ============================================================
//  BIDDING ROUTES
// ============================================================
app.post("/bid", authMiddleware, validate(schemas.bid), async (req, res) => {
  try {
    const { projectId, amount, message } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.createdBy === req.user.email)
      return res.status(400).json({ message: "You cannot bid on your own project" });
    if (project.assigned)
      return res.status(400).json({ message: "This project is already assigned" });
    const existing = await Bid.findOne({ projectId, freelancerEmail: req.user.email });
    if (existing) return res.status(400).json({ message: "You have already bid on this project" });
    const bid = await Bid.create({ projectId, amount: Number(amount), message, freelancerEmail: req.user.email });
    res.status(201).json(bid);
  } catch {
    res.status(500).json({ message: "Failed to submit bid" });
  }
});

app.get("/bids/:projectId", async (req, res) => {
  try {
    const bids = await Bid.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch {
    res.status(500).json({ message: "Failed to fetch bids" });
  }
});

app.post("/accept-bid", authMiddleware, validate(schemas.acceptBid), async (req, res) => {
  try {
    const { projectId, freelancerEmail } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.createdBy !== req.user.email)
      return res.status(403).json({ message: "Only the project owner can accept bids" });
    if (project.assigned)
      return res.status(400).json({ message: "Project is already assigned" });
    await Project.findByIdAndUpdate(projectId, { assigned: true, assignedFreelancer: freelancerEmail });
    res.json({ message: "Bid accepted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to accept bid" });
  }
});

// ============================================================
//  PAYMENT ROUTE
// ============================================================
app.post("/create-payment", authMiddleware, async (req, res) => {
  if (!stripe) return res.status(500).json({ message: "Stripe not configured" });
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ message: "Invalid amount" });
    const paymentIntent = await stripe.paymentIntents.create({ amount: Number(amount), currency: "inr" });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch {
    res.status(500).json({ message: "Payment failed" });
  }
});

// ============================================================
//  CHAT ROUTES
// ============================================================
app.get("/messages/:room", async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json(messages.reverse());
  } catch {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// ============================================================
//  SOCKET.IO
// ============================================================
io.on("connection", async (socket) => {
  const room = socket.handshake.query.room || "global";
  socket.join(room);
  try {
    const history = await Message.find({ room }).sort({ createdAt: -1 }).limit(50).lean();
    socket.emit("chatHistory", history.reverse());
  } catch (err) {
    console.error("Chat history error:", err.message);
  }

  socket.on("sendMessage", async (data) => {
    try {
      const saved = await Message.create({ sender: data.sender || "Anonymous", text: data.text, room });
      socket.to(room).emit("receiveMessage", { _id: saved._id, sender: saved.sender, text: saved.text, room: saved.room, createdAt: saved.createdAt });
    } catch (err) {
      console.error("Message save error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ============================================================
//  GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

// ============================================================
//  START
// ============================================================
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
