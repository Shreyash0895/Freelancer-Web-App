// ============================================================
//  test-connection.js — Run: node test-connection.js
// ============================================================

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

console.log("\n FreelanceHub - Connection Test\n");

if (!MONGO_URI) {
  console.log("MONGO_URI is missing from .env");
  process.exit(1);
}

const isSRV = MONGO_URI.startsWith("mongodb+srv://");
console.log("Type:", isSRV ? "SRV - may fail on restricted networks" : "Standard - recommended");
console.log("Connecting...\n");

async function run() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    console.log("MongoDB Atlas connected!");
    console.log("Host    :", mongoose.connection.host);
    console.log("Database:", mongoose.connection.name);
    console.log("\nYour backend is ready. Run: npm run dev\n");
    await mongoose.disconnect();
  } catch (err) {
    console.log("Connection failed:", err.message);
    if (isSRV) {
      console.log("\nYour network blocks SRV DNS.");
      console.log("Go to Atlas > Connect > Drivers > Node.js > Version 2.2.12 or later");
      console.log("Copy that string (starts with mongodb://) and use it as MONGO_URI in .env\n");
    } else {
      console.log("\nCheck: cluster not paused, 0.0.0.0/0 whitelisted, correct password\n");
    }
    process.exit(1);
  }
}

run();