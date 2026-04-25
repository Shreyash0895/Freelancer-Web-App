const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

/* =======================
   DATABASE
======================= */
mongoose.connect("mongodb://127.0.0.1:27017/freelancerDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* =======================
   SCHEMAS
======================= */

// User
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
});
const User = mongoose.model("User", userSchema);

// Client (Project)
const clientSchema = new mongoose.Schema({
  company: String,
  domain: String,
  payment: String,
  description: String,
  requirements: String,
  deadline: String,
});
const Client = mongoose.model("Client", clientSchema);

// Freelancer
const freelancerSchema = new mongoose.Schema({
  branch: String,
  year: String,
  skills: String,
  resume: String,
  experience: String,
  hours: String,
});
const Freelancer = mongoose.model("Freelancer", freelancerSchema);

// Bid
const bidSchema = new mongoose.Schema({
  projectId: String,
  price: String,
  message: String,
});
const Bid = mongoose.model("Bid", bidSchema);

/* =======================
   AUTH ROUTES
======================= */

// Signup
const bcrypt = require("bcrypt");

app.post("/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.json({ message: "User registered" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
const bcrypt = require("bcrypt");

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    // 🔐 COMPARE PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    res.json({
      token: "dummy-token", // we will upgrade to JWT later
      role: user.role,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Post project
app.post("/client", async (req, res) => {
  const newClient = new Client(req.body);
  await newClient.save();

  res.json({ message: "Project saved" });
});

// Get all projects
app.get("/projects", async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});


app.post("/projects", async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();

    res.json({ message: "Project posted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Submit bid
app.post("/bid", async (req, res) => {
  const newBid = new Bid(req.body);
  await newBid.save();

  res.json({ message: "Bid submitted" });
});

// 🔥 GET BIDS FOR A PROJECT (THIS IS WHAT YOU ASKED)
app.get("/bids/:projectId", async (req, res) => {
  const bids = await Bid.find({ projectId: req.params.projectId });
  res.json(bids);
});

/* =======================
   ROOT (OPTIONAL)
======================= */

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* =======================
   SERVER
======================= */

app.listen(5001, () => {
  console.log("🚀 Server running on http://localhost:5001");
});

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  budget: String,
  skills: String,
});

const Project = mongoose.model("Project", projectSchema);