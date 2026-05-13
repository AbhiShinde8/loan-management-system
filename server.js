const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 📦 Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🔗 Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// 📍 Request Logger
app.use((req, res, next) => {
  console.log(
    `📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`,
  );
  next();
});

// ✅ Basic Routes
app.get("/", (req, res) => {
  res.json({
    message: "🎉 Loan Management System API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date(),
  });
});

// 🎯 API Routes
console.log("📌 Mounting routes...");

const customerRoutes = require("./routes/customerRoutes");
const loanRoutes = require("./routes/loanRoutes");

app.use("/api/customer", customerRoutes);
app.use("/api/loan", loanRoutes);

console.log("✅ All routes mounted successfully");

// ❌ 404 Handler
app.use((req, res) => {
  console.log(`⚠️ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
    availableRoutes: {
      customer: "/api/customer",
      loan: "/api/loan",
    },
  });
});

// ⚠️ Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// 🚀 Server Start
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 LOAN MANAGEMENT SYSTEM API 🚀     ║
╚════════════════════════════════════════╝

  🌐 Server: http://localhost:${PORT}
  🗄️  Database: ✅ Connected
  📊 Environment: ${process.env.NODE_ENV}
  ⏰ Started: ${new Date().toLocaleString()}

  📌 Available Routes:
     - GET  /health
     - POST /api/customer/create
     - GET  /api/customer/list
     - POST /api/loan/disburse
     - GET  /api/loan/list

╔════════════════════════════════════════╗
  `);
});

// 🛑 Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("📛 SIGTERM received: closing server");
  server.close(() => {
    console.log("✅ Server closed");
    mongoose.connection.close();
  });
});

module.exports = app;
