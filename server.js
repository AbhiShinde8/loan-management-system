require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

console.log("\n" + "=".repeat(70));
console.log("📌 INITIALIZING SERVER");
console.log("=".repeat(70) + "\n");

// ==================== MIDDLEWARE ====================
console.log("⚙️  Setting up middleware...");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  next();
});

console.log("✅ Middleware setup complete\n");

// ==================== DATABASE CONNECTION ====================
console.log("🔌 Connecting to MongoDB...");

const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/loan-management";
console.log(`   URI: ${mongoURI}\n`);

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB connected successfully\n");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ==================== LOAD MODELS ====================
console.log("📦 Loading models...");

try {
  require("./models/Customer");
  require("./models/Loan");
  require("./models/EmiSchedule");
  require("./models/Payment");
  console.log("✅ All models loaded successfully\n");
} catch (error) {
  console.error("❌ Error loading models:", error.message);
  process.exit(1);
}

// ==================== LOAD ROUTES ====================
console.log("🔀 Loading routes...");

try {
  const customerRoutes = require("./routes/customerRoutes");
  const loanRoutes = require("./routes/loanRoutes");
  const paymentRoutes = require("./routes/paymentRoutes");

  app.use("/api/customer", customerRoutes);
  app.use("/api/loan", loanRoutes);
  app.use("/api/payment", paymentRoutes);

  console.log("✅ All routes loaded successfully\n");
} catch (error) {
  console.error("❌ Error loading routes:", error.message);
  process.exit(1);
}

// ==================== HEALTH CHECK ====================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=".repeat(70));
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("=".repeat(70));
  console.log(`📌 Server: http://localhost:${PORT}`);
  console.log(`📌 API: http://localhost:${PORT}/api`);
  console.log("=".repeat(70) + "\n");
});

module.exports = app;
