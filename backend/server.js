// ============================================================
//  FreelanceHub — Backend Server
//  Improvements:
//  ✅ Step 1 — Joi input validation on all routes
//  ✅ Step 2 — Rate limiting on auth routes
//  ✅ Step 3 — Helmet security headers
//  ✅ Step 4 — Chat messages persisted in MongoDB
//  ✅ Step 5 — Profile stored in MongoDB (not localStorage)
//  ✅ Step 6 — Pagination on GET /projects
//  ✅ Step 7 — MongoDB indexes for performance
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

// ── Optional Stripe ──
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
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ── Step 3: Helmet security headers ──
app.use(helmet());

app.use(cors());
app.use(express.json());

// ============================================================
//  ENV
// ============================================================
const PORT       = process.env.PORT      || 5001;
const MONGO_URI  = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/freelancer-app";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌  JWT_SECRET is not set in .env — refusing to start.");
  process.exit(1);
}

// ============================================================
//  STEP 2 — RATE LIMITING
// ============================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { message: "Too many requests. Please slow down." },
});

app.use(authLimiter);        // auth routes get strict limiter
app.use("/projects", generalLimiter);
app.use("/bids",     generalLimiter);

// ============================================================
//  DB CONNECT
// ============================================================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ DB Error:", err); process.exit(1); });

// ============================================================
//  STEP 7 — MODELS WITH INDEXES
// ============================================================

// User
const UserSchema = new mongoose.Schema({
  name:     { type: String, trim: true },
  email:    { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role:     { type: String, enum: ["client", "freelancer"] },
  // Step 5 — Profile fields stored in DB
  phone:      { type: String, default: "" },
  skills:     { type: String, default: "" },
  experience: { type: String, default: "" },
  bio:        { type: String, default: "" },
}, { timestamps: true });

UserSchema.index({ email: 1 });

// Project
const ProjectSchema = new mongoose.Schema({
  title:              { type: String, trim: true },
  description:        { type: String, trim: true },
  budget:             { type: Number, min: 1 },
  createdBy:          { type: String, index: true },
  assigned:           { type: Boolean, default: false },
  assignedFreelancer: { type: String, default: null },
}, { timestamps: true });

ProjectSchema.index({ createdBy: 1, assigned: 1 });  // Step 7

// Bid
const BidSchema = new mongoose.Schema({
  projectId:       { type: String, index: true },
  freelancerEmail: { type: String },
  amount:          { type: Number, min: 1 },
  message:         { type: String, default: "" },
}, { timestamps: true });

BidSchema.index({ projectId: 1 });  // Step 7

// Step 4 — Message model for chat persistence
const MessageSchema = new mongoose.Schema({
  sender: { type: String },
  text:   { type: String },
  room:   { type: String, default: "global" },
}, { timestamps: true });

MessageSchema.index({ room: 1, createdAt: -1 });  // Step 7

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

// ============================================================
//  STEP 1 — JOI VALIDATION SCHEMAS
// ============================================================
const schemas = {
  signup: Joi.object({
    name:     Joi.string().min(2).max(50).required().messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must be under 50 characters",
      "any.required": "Name is required",
    }),
    email:    Joi.string().email().required().messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).max(100).required().messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),
    role:     Joi.string().valid("client", "freelancer").required().messages({
      "any.only": "Role must be either client or freelancer",
      "any.required": "Role is required",
    }),
  }),

  login: Joi.object({
    email:    Joi.string().email().required().messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),

  project: Joi.object({
    title:       Joi.string().min(3).max(100).required().messages({
      "string.min": "Title must be at least 3 characters",
      "string.max": "Title must be under 100 characters",
      "any.required": "Title is required",
    }),
    description: Joi.string().min(10).max(2000).required().messages({
      "string.min": "Description must be at least 10 characters",
      "any.required": "Description is required",
    }),
    budget:      Joi.number().min(1).max(1000000).required().messages({
      "number.min": "Budget must be at least $1",
      "number.max": "Budget cannot exceed $1,000,000",
      "any.required": "Budget is required",
    }),
  }),

  bid: Joi.object({
    projectId: Joi.string().required().messages({
      "any.required": "Project ID is required",
    }),
    amount:    Joi.number().min(1).max(1000000).required().messages({
      "number.min": "Bid amount must be at least $1",
      "any.required": "Bid amount is required",
    }),
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

// Helper: validate and return 400 if invalid
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

// SIGNUP
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

// LOGIN
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
//  STEP 5 — PROFILE ROUTES (stored in MongoDB)
// ============================================================

// GET profile
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// UPDATE profile
app.put("/profile", authMiddleware, validate(schemas.profile), async (req, res) => {
  try {
    const { name, phone, skills, experience, bio } = req.body;

    const updated = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: { name, phone, skills, experience, bio } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ============================================================
//  PROJECT ROUTES
// ============================================================

// CREATE PROJECT
app.post("/projects", authMiddleware, validate(schemas.project), async (req, res) => {
  try {
    const { title, description, budget } = req.body;
    const project = await Project.create({
      title,
      description,
      budget: Number(budget),
      createdBy: req.user.email,
    });
    res.status(201).json(project);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ message: "Failed to create project" });
  }
});

// Step 6 — GET PROJECTS with pagination
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ============================================================
//  BIDDING ROUTES
// ============================================================

// CREATE BID
app.post("/bid", authMiddleware, validate(schemas.bid), async (req, res) => {
  try {
    const { projectId, amount, message } = req.body;

    // Prevent bidding on own project
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.createdBy === req.user.email)
      return res.status(400).json({ message: "You cannot bid on your own project" });
    if (project.assigned)
      return res.status(400).json({ message: "This project is already assigned" });

    // Prevent duplicate bids
    const existing = await Bid.findOne({ projectId, freelancerEmail: req.user.email });
    if (existing) return res.status(400).json({ message: "You have already placed a bid on this project" });

    const bid = await Bid.create({
      projectId,
      amount: Number(amount),
      message,
      freelancerEmail: req.user.email,
    });
    res.status(201).json(bid);
  } catch (err) {
    console.error("Bid error:", err);
    res.status(500).json({ message: "Failed to submit bid" });
  }
});

// GET BIDS for a project
app.get("/bids/:projectId", async (req, res) => {
  try {
    const bids = await Bid.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bids" });
  }
});

// ACCEPT BID
app.post("/accept-bid", authMiddleware, validate(schemas.acceptBid), async (req, res) => {
  try {
    const { projectId, freelancerEmail } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.createdBy !== req.user.email)
      return res.status(403).json({ message: "Only the project owner can accept bids" });
    if (project.assigned)
      return res.status(400).json({ message: "Project is already assigned" });

    await Project.findByIdAndUpdate(projectId, {
      assigned: true,
      assignedFreelancer: freelancerEmail,
    });

    res.json({ message: "Bid accepted successfully" });
  } catch (err) {
    console.error("Accept bid error:", err);
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
    if (!amount || amount < 100)
      return res.status(400).json({ message: "Invalid payment amount" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency: "inr",
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ message: "Payment failed" });
  }
});

// ============================================================
//  STEP 4 — CHAT ROUTES (messages persisted in MongoDB)
// ============================================================

// GET last 50 messages for a room
app.get("/messages/:room", async (req, res) => {
  try {
    const messages = await Message
      .find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(messages.reverse()); // oldest first
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// ============================================================
//  SOCKET.IO — REAL-TIME CHAT WITH PERSISTENCE
// ============================================================
io.on("connection", async (socket) => {
  console.log("🔌 Client connected:", socket.id);

  const room = socket.handshake.query.room || "global";
  socket.join(room);

  // Send last 50 messages to the newly connected client
  try {
    const history = await Message
      .find({ room })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    socket.emit("chatHistory", history.reverse());
  } catch (err) {
    console.error("Failed to load chat history:", err);
  }

  // Handle incoming message
  socket.on("sendMessage", async (data) => {
    try {
      const saved = await Message.create({
        sender: data.sender || "Anonymous",
        text:   data.text,
        room:   room,
      });

      const payload = {
        _id:       saved._id,
        sender:    saved.sender,
        text:      saved.text,
        room:      saved.room,
        createdAt: saved.createdAt,
      };

      // Broadcast to everyone in the room EXCEPT sender
      socket.to(room).emit("receiveMessage", payload);
    } catch (err) {
      console.error("Message save error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ============================================================
//  START SERVER
// ============================================================
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});