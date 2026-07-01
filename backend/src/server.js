require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const personaRoutes = require("./routes/personaRoutes");
const generateRoutes = require("./routes/generateRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

// --- Middleware ---
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json({ limit: "1mb" }));

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running." });
});

// --- Routes ---
app.use("/api/personas", personaRoutes);
app.use("/api/generate", generateRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
