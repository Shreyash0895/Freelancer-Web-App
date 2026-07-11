const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const mongoose   = require("mongoose");
const cors       = require("cors");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const Joi        = require("joi");
const nodemailer = require("nodemailer");
require("dotenv").config();

//AI Proposal Generator
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/ai/generate-proposal", authMiddleware, async (req, res) => {
  try {
    const { projectTitle, projectDescription, budget, freelancerSkills } = req.body;
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Write a professional freelancer bid proposal for this project:
Project: ${projectTitle}
Description: ${projectDescription}
Budget: $${budget}
My skills: ${freelancerSkills}

Write 3-4 sentences. Be confident, specific, and professional. No generic phrases.`
      }]
    });
    res.json({ proposal: message.content[0].text });
  } catch (err) {
    res.status(500).json({ message: "AI generation failed" });
  }
});

// ── Cloudinary + Multer ──
let cloudinary, multer, CloudinaryStorage;
try {
  cloudinary      = require("cloudinary").v2;
  multer          = require("multer");
  const pkg       = require("multer-storage-cloudinary");
  CloudinaryStorage = pkg.CloudinaryStorage;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("Cloudinary configured");
} catch {
  console.log(" Cloudinary not installed");
}

// ── Optional Stripe ──
let stripe;
try {
  stripe = require("stripe")(process.env.STRIPE_SECRET || "");
} catch {
  console.log("⚠  Stripe not installed — payments disabled");
}

//  APP INIT
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL || "https://authentic-beauty-production-e914.up.railway.app",
  ],
  credentials: true,
}));
app.use(express.json());

//  ENV
const PORT       = process.env.PORT      || 5001;
const MONGO_URI  = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/freelancer-app";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(" JWT_SECRET not set — refusing to start.");
  process.exit(1);
}

//  MULTER + CLOUDINARY UPLOAD
let upload;
if (cloudinary && multer && CloudinaryStorage) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:          "freelancehub",
      resource_type:   "auto",
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx", "zip", "txt", "mp4"],
      public_id:       `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`,
    }),
  });
  upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
} else {
  upload = { single: () => (req, res, next) => next() };
}

//  EMAIL SETUP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((err) => {
    if (err) console.log("Email not configured:", err.message);
    else     console.log("Email service ready");
  });
}

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    await transporter.sendMail({ from: `"FreelanceHub" <${process.env.EMAIL_USER}>`, to, subject, html });
    console.log(" Email sent to:", to);
  } catch (err) { console.error("Email error:", err.message); }
};

const emailTemplates = {
  welcome: (name) => ({
    subject: "Welcome to FreelanceHub! 🚀",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#07080f;color:#f0f0ff;padding:40px;border-radius:16px"><h1 style="color:#a78bfa">Welcome to FreelanceHub!</h1><p style="color:#9098c0">Hi ${name}, your account is ready.</p><a href="${process.env.FRONTEND_URL}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#a78bfa);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">Go to FreelanceHub →</a></div>`,
  }),
  bidReceived: (clientName, projectTitle, freelancerEmail, amount) => ({
    subject: `New bid on "${projectTitle}" 💰`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#07080f;color:#f0f0ff;padding:40px;border-radius:16px"><h1 style="color:#a78bfa">New Bid Received!</h1><p style="color:#9098c0">Hi ${clientName}, you received a $${amount} bid from ${freelancerEmail} on "${projectTitle}".</p><a href="${process.env.FRONTEND_URL}/projects" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#a78bfa);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">View Bids →</a></div>`,
  }),
  bidAccepted: (freelancerName, projectTitle) => ({
    subject: `Your bid was accepted! 🎉`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#07080f;color:#f0f0ff;padding:40px;border-radius:16px"><h1 style="color:#34d399">Congratulations! 🎉</h1><p style="color:#9098c0">Hi ${freelancerName}, your bid on "${projectTitle}" was accepted! You can now chat privately with the client.</p><a href="${process.env.FRONTEND_URL}/chat" style="display:inline-block;background:linear-gradient(135deg,#34d399,#059669);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">Open Chat →</a></div>`,
  }),
  fileUploaded: (recipientName, projectTitle, uploaderEmail, fileName) => ({
    subject: `New file uploaded to "${projectTitle}" 📎`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#07080f;color:#f0f0ff;padding:40px;border-radius:16px"><h1 style="color:#22d3ee">New File Uploaded! 📎</h1><p style="color:#9098c0">Hi ${recipientName}, ${uploaderEmail} uploaded a file to "${projectTitle}".</p><p style="color:#9098c0">File: <strong style="color:#f0f0ff">${fileName}</strong></p><a href="${process.env.FRONTEND_URL}/projects" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#0891b2);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600">View Files →</a></div>`,
  }),
};

//  RATE LIMITING
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: "Too many attempts. Try again in 15 minutes." } });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, message: { message: "Too many requests. Please slow down." } });
app.use("/projects", generalLimiter);
app.use("/bids",     generalLimiter);

//  DB CONNECT
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
  .then(() => console.log(" MongoDB connected"))
  .catch(err => { console.error(" DB Error:", err.message); process.exit(1); });

//  MODELS
const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ["client", "freelancer"] },
  phone: { type: String, default: "" },
  skills: { type: String, default: "" },
  experience: { type: String, default: "" },
  bio: { type: String, default: "" },
}, { timestamps: true });

//Project Schema
const ProjectSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  budget: { type: Number, min: 1 },
  category: { type: String, default: "General" },
  createdBy: { type: String },
  assigned: { type: Boolean, default: false },
  assignedFreelancer: { type: String, default: null },
  completed: { type: Boolean, default: false },
  attachments: [{
    url: String, originalName: String, uploadedBy: String,
    type: { type: String, enum: ["project_file", "submitted_work"] },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

ProjectSchema.index({ createdBy: 1, assigned: 1 });

const BidSchema = new mongoose.Schema({
  projectId: { type: String },
  freelancerEmail: { type: String },
  amount: { type: Number, min: 1 },
  message: { type: String, default: "" },
}, { timestamps: true });

BidSchema.index({ projectId: 1 });

// Message — room is either "global" or "project_<projectId>"
const MessageSchema = new mongoose.Schema({
  sender: { type: String },
  text: { type: String },
  room: { type: String, default: "global", index: true },
}, { timestamps: true });

MessageSchema.index({ room: 1, createdAt: -1 });

const ReviewSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  clientEmail: { type: String, required: true },
  freelancerEmail: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: "" },
}, { timestamps: true });

ReviewSchema.index({ freelancerEmail: 1 });
ReviewSchema.index({ projectId: 1 }, { unique: true });

const NotificationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  type: { type: String },
  message: { type: String },
  read: { type: Boolean, default: false },
  link: { type: String, default: "/dashboard" },
}, { timestamps: true });

NotificationSchema.index({ userEmail: 1, read: 1 });

const User         = mongoose.model("User",         UserSchema);
const Project      = mongoose.model("Project",      ProjectSchema);
const Bid          = mongoose.model("Bid",          BidSchema);
const Message      = mongoose.model("Message",      MessageSchema);
const Review       = mongoose.model("Review",       ReviewSchema);
const Notification = mongoose.model("Notification", NotificationSchema);

//  AUTH MIDDLEWARE
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

// Check if a user is allowed to access a given chat room
async function canAccessRoom(userEmail, room) {
  if (room === "global") return true;
  if (!room.startsWith("project_")) return false;
  const projectId = room.replace("project_", "");
  const project = await Project.findById(projectId).catch(() => null);
  if (!project) return false;
  return project.createdBy === userEmail || project.assignedFreelancer === userEmail;
}

//  VALIDATION
const schemas = {
  signup:    Joi.object({ name: Joi.string().min(2).max(50).required(), email: Joi.string().email().required(), password: Joi.string().min(6).max(100).required(), role: Joi.string().valid("client","freelancer").required() }),
  login:     Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() }),
  project:   Joi.object({ title: Joi.string().min(3).max(100).required(), description: Joi.string().min(10).max(2000).required(), budget: Joi.number().min(1).max(1000000).required(), category: Joi.string().max(50).optional() }),
  bid:       Joi.object({ projectId: Joi.string().required(), amount: Joi.number().min(1).max(1000000).required(), message: Joi.string().max(1000).allow("").optional() }),
  acceptBid: Joi.object({ projectId: Joi.string().required(), freelancerEmail: Joi.string().email().required() }),
  profile:   Joi.object({ name: Joi.string().min(2).max(50).optional(), phone: Joi.string().max(20).allow("").optional(), skills: Joi.string().max(200).allow("").optional(), experience: Joi.string().max(100).allow("").optional(), bio: Joi.string().max(500).allow("").optional() }),
  review:    Joi.object({ projectId: Joi.string().required(), rating: Joi.number().min(1).max(5).required(), comment: Joi.string().max(500).allow("").optional() }),
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ message: error.details.map(d => d.message).join(", ") });
  next();
};

const createNotification = async (userEmail, type, message, link = "/dashboard") => {
  try { await Notification.create({ userEmail, type, message, link }); }
  catch (err) { console.error("Notification error:", err.message); }
};

//  AUTH ROUTES
app.post("/signup", authLimiter, validate(schemas.signup), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: "Email already registered" });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email: email.toLowerCase(), password: hashed, role });
    await sendEmail({ to: email, ...emailTemplates.welcome(name) });
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed." });
  }
});

app.post("/login", authLimiter, validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "No account found with this email" });
    if (!await bcrypt.compare(password, user.password))
      return res.status(400).json({ message: "Incorrect password" });
    const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed." });
  }
});

app.post("/ai/estimate-project", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Estimate this freelance project. Reply ONLY as JSON:
{
  "timeline": "X-Y weeks",
  "budgetMin": number,
  "budgetMax": number,
  "complexity": "Low|Medium|High",
  "tips": ["tip1", "tip2", "tip3"]
}

Project: ${title}
Description: ${description}`
      }]
    });
    const raw = message.content[0].text;
    const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(json);
  } catch (err) {
    res.status(500).json({ message: "Estimation failed" });
  }
});

//video meet
app.post("/meetings/create", authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only client or freelancer can create meeting
    const isParticipant =
      project.createdBy === req.user.email ||
      project.assignedFreelancer === req.user.email;
    if (!isParticipant)
      return res.status(403).json({ message: "Not authorized" });

    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `freelancehub-${projectId}`,
        properties: {
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
          enable_chat: true,
          enable_screenshare: true,
        },
      }),
    });

    const room = await response.json();

    // Notify the other party
    const notifyEmail =
      project.createdBy === req.user.email
        ? project.assignedFreelancer
        : project.createdBy;

    if (notifyEmail) {
      await createNotification(
        notifyEmail,
        "meeting",
        `${req.user.email} started a video meeting for "${project.title}"`,
        "/chat"
      );
    }

    res.json({ url: room.url, name: room.name });
  } catch (err) {
    console.error("Meeting error:", err);
    res.status(500).json({ message: "Failed to create meeting" });
  }
});

//  PROFILE ROUTES
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch { res.status(500).json({ message: "Failed to fetch profile" }); }
});

app.put("/profile", authMiddleware, validate(schemas.profile), async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate({ email: req.user.email }, { $set: req.body }, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Profile updated", user: updated });
  } catch { res.status(500).json({ message: "Failed to update profile" }); }
});

app.get("/profile/:email", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const reviews  = await Review.find({ freelancerEmail: req.params.email }).sort({ createdAt: -1 });
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    res.json({ ...user.toObject(), reviews, avgRating });
  } catch { res.status(500).json({ message: "Failed to fetch profile" }); }
});

//  PROJECT ROUTES
app.post("/projects", authMiddleware, validate(schemas.project), async (req, res) => {
  try {
    const { title, description, budget, category } = req.body;
    const project = await Project.create({ title, description, budget: Number(budget), category: category || "General", createdBy: req.user.email });
    res.status(201).json(project);
  } catch { res.status(500).json({ message: "Failed to create project" }); }
});

app.get("/projects", async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const filter = {};
    if (req.query.assigned === "true")  filter.assigned = true;
    if (req.query.assigned === "false") filter.assigned = false;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.$or = [{ title: { $regex: req.query.search, $options: "i" } }, { description: { $regex: req.query.search, $options: "i" } }];
    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Project.countDocuments(filter),
    ]);
    res.json({ projects, pagination: { page, limit, total, pages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
  } catch { res.status(500).json({ message: "Failed to fetch projects" }); }
});

app.get("/projects/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch { res.status(500).json({ message: "Failed to fetch project" }); }
});

app.post("/projects/:id/complete", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.createdBy !== req.user.email) return res.status(403).json({ message: "Not authorized" });
    await Project.findByIdAndUpdate(req.params.id, { completed: true });
    res.json({ message: "Project marked as completed" });
  } catch { res.status(500).json({ message: "Failed to complete project" }); }
});

//  FILE UPLOAD ROUTES
app.post("/projects/:id/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const isClient     = project.createdBy === req.user.email;
    const isFreelancer = project.assignedFreelancer === req.user.email;
    if (!isClient && !isFreelancer) return res.status(403).json({ message: "Not authorized to upload to this project" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileData = {
      url: req.file.path || req.file.secure_url,
      originalName: req.file.originalname,
      uploadedBy: req.user.email,
      type: isFreelancer ? "submitted_work" : "project_file",
    };
    await Project.findByIdAndUpdate(req.params.id, { $push: { attachments: fileData } });

    const notifyEmail = isClient ? project.assignedFreelancer : project.createdBy;
    if (notifyEmail) {
      await createNotification(notifyEmail, "file", `New file uploaded to "${project.title}" by ${req.user.email}`, "/projects");
      const recipient = await User.findOne({ email: notifyEmail });
      if (recipient) await sendEmail({ to: notifyEmail, ...emailTemplates.fileUploaded(recipient.name || recipient.email, project.title, req.user.email, req.file.originalname) });
    }
    res.json({ message: "File uploaded successfully", file: fileData });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Failed to upload file" });
  }
});

app.delete("/projects/:id/files/:fileIndex", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const fileIndex = parseInt(req.params.fileIndex);
    const file = project.attachments[fileIndex];
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.uploadedBy !== req.user.email) return res.status(403).json({ message: "Not authorized to delete this file" });
    project.attachments.splice(fileIndex, 1);
    await project.save();
    res.json({ message: "File deleted successfully" });
  } catch { res.status(500).json({ message: "Failed to delete file" }); }
});

//  BID ROUTES
app.post("/bid", authMiddleware, validate(schemas.bid), async (req, res) => {
  try {
    const { projectId, amount, message } = req.body;
    const project = await Project.findById(projectId);
    if (!project)                              return res.status(404).json({ message: "Project not found" });
    if (project.createdBy === req.user.email)  return res.status(400).json({ message: "Cannot bid on your own project" });
    if (project.assigned)                      return res.status(400).json({ message: "Project already assigned" });
    if (await Bid.findOne({ projectId, freelancerEmail: req.user.email }))
      return res.status(400).json({ message: "Already placed a bid" });

    const bid = await Bid.create({ projectId, amount: Number(amount), message, freelancerEmail: req.user.email });
    const client = await User.findOne({ email: project.createdBy });
    await createNotification(project.createdBy, "bid", `New bid of $${amount} on "${project.title}"`, "/projects");
    if (client) await sendEmail({ to: client.email, ...emailTemplates.bidReceived(client.name || client.email, project.title, req.user.email, amount) });
    res.status(201).json(bid);
  } catch (err) { console.error("Bid error:", err); res.status(500).json({ message: "Failed to submit bid" }); }
});

app.get("/bids/:projectId", authMiddleware, async (req, res) => {
  try {
    const bids = await Bid.find({ projectId: req.params.projectId }).sort({ createdAt: -1 });
    res.json(bids);
  } catch { res.status(500).json({ message: "Failed to fetch bids" }); }
});

app.post("/accept-bid", authMiddleware, validate(schemas.acceptBid), async (req, res) => {
  try {
    const { projectId, freelancerEmail } = req.body;
    const project = await Project.findById(projectId);
    if (!project)                              return res.status(404).json({ message: "Project not found" });
    if (project.createdBy !== req.user.email)  return res.status(403).json({ message: "Not authorized" });
    if (project.assigned)                      return res.status(400).json({ message: "Already assigned" });

    await Project.findByIdAndUpdate(projectId, { assigned: true, assignedFreelancer: freelancerEmail });

    const freelancer = await User.findOne({ email: freelancerEmail });
    await createNotification(freelancerEmail, "accepted", `Your bid on "${project.title}" was accepted! 🎉 Private chat is now open.`, "/chat");
    if (freelancer) await sendEmail({ to: freelancerEmail, ...emailTemplates.bidAccepted(freelancer.name || freelancer.email, project.title) });

    res.json({ message: "Bid accepted successfully" });
  } catch (err) { console.error("Accept bid error:", err); res.status(500).json({ message: "Failed to accept bid" }); }
});

//  PAYMENT ROUTE
app.post("/create-payment", authMiddleware, async (req, res) => {
  if (!stripe) return res.status(500).json({ message: "Stripe not configured" });
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ message: "Invalid amount" });
    const paymentIntent = await stripe.paymentIntents.create({ amount: Number(amount), currency: "usd" });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) { console.error("Payment error:", err); res.status(500).json({ message: "Payment failed" }); }
});

//  NOTIFICATIONS
app.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userEmail: req.user.email }).sort({ createdAt: -1 }).limit(20);
    const unreadCount   = await Notification.countDocuments({ userEmail: req.user.email, read: false });
    res.json({ notifications, unreadCount });
  } catch { res.status(500).json({ message: "Failed to fetch notifications" }); }
});

app.put("/notifications/read", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userEmail: req.user.email, read: false }, { $set: { read: true } });
    res.json({ message: "All marked as read" });
  } catch { res.status(500).json({ message: "Failed to mark notifications" }); }
});

//  REVIEWS
app.post("/reviews", authMiddleware, validate(schemas.review), async (req, res) => {
  try {
    const { projectId, rating, comment } = req.body;
    const project = await Project.findById(projectId);
    if (!project)                              return res.status(404).json({ message: "Project not found" });
    if (project.createdBy !== req.user.email)  return res.status(403).json({ message: "Only client can review" });
    if (!project.assigned)                     return res.status(400).json({ message: "Cannot review unassigned project" });
    if (await Review.findOne({ projectId }))   return res.status(400).json({ message: "Review already submitted" });

    const review = await Review.create({ projectId, clientEmail: req.user.email, freelancerEmail: project.assignedFreelancer, rating, comment });
    await createNotification(project.assignedFreelancer, "review", `You received a ${rating}⭐ review on "${project.title}"`, "/profile");
    res.status(201).json(review);
  } catch (err) { console.error("Review error:", err); res.status(500).json({ message: "Failed to submit review" }); }
});

app.get("/reviews/:freelancerEmail", async (req, res) => {
  try {
    const reviews   = await Review.find({ freelancerEmail: req.params.freelancerEmail }).sort({ createdAt: -1 });
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    res.json({ reviews, avgRating, total: reviews.length });
  } catch { res.status(500).json({ message: "Failed to fetch reviews" }); }
});

app.get("/reviews/check/:projectId", authMiddleware, async (req, res) => {
  try {
    const review = await Review.findOne({ projectId: req.params.projectId });
    res.json({ hasReview: !!review, review });
  } catch { res.status(500).json({ message: "Failed to check review" }); }
});

//  CHAT ROUTES — Private per Project + Global

// Get list of my conversations (global + each assigned project)
app.get("/my-chats", authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const projects = await Project.find({
      assigned: true,
      $or: [{ createdBy: email }, { assignedFreelancer: email }],
    }).sort({ updatedAt: -1 });

    const chats = await Promise.all(projects.map(async (p) => {
      const room = `project_${p._id}`;
      const lastMsg = await Message.findOne({ room }).sort({ createdAt: -1 });
      const otherParty = p.createdBy === email ? p.assignedFreelancer : p.createdBy;
      return {
        room,
        projectId: p._id,
        projectTitle: p.title,
        otherParty,
        lastMessage: lastMsg ? lastMsg.text : null,
        lastMessageAt: lastMsg ? lastMsg.createdAt : p.createdAt,
      };
    }));

    chats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json(chats);
  } catch (err) {
    console.error("My chats error:", err);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

app.get("/messages/:room", authMiddleware, async (req, res) => {
  try {
    const allowed = await canAccessRoom(req.user.email, req.params.room);
    if (!allowed) return res.status(403).json({ message: "Not authorized to view this chat" });

    const messages = await Message.find({ room: req.params.room }).sort({ createdAt: -1 }).limit(100).lean();
    res.json(messages.reverse());
  } catch { res.status(500).json({ message: "Failed to fetch messages" }); }
});

//  SOCKET.IO — Private rooms with JWT auth
io.on("connection", async (socket) => {
  console.log("🔌 Client connected:", socket.id);

  const room  = socket.handshake.query.room  || "global";
  const token = socket.handshake.query.token || "";

  let userEmail = null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userEmail = decoded.email;
  } catch {
    // Allow global chat without token (backward compatible), block private rooms
  }

  // Authorize private project rooms
  if (room.startsWith("project_")) {
    if (!userEmail) {
      socket.emit("authError", "Authentication required for private chat");
      socket.disconnect();
      return;
    }
    const allowed = await canAccessRoom(userEmail, room);
    if (!allowed) {
      socket.emit("authError", "Not authorized to access this chat");
      socket.disconnect();
      return;
    }
  }

  socket.join(room);

  try {
    const history = await Message.find({ room }).sort({ createdAt: -1 }).limit(100).lean();
    socket.emit("chatHistory", history.reverse());
  } catch (err) { console.error("History error:", err); }

  socket.on("sendMessage", async (data) => {
    try {
      const saved = await Message.create({ sender: data.sender || userEmail || "Anonymous", text: data.text, room });
      socket.to(room).emit("receiveMessage", {
        _id: saved._id, sender: saved.sender, text: saved.text, room: saved.room, createdAt: saved.createdAt,
      });
    } catch (err) { console.error("Message error:", err); }
  });

  socket.on("disconnect", () => console.log(" Disconnected:", socket.id));
});

//  START
server.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));