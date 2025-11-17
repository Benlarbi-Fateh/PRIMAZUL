// server/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { verifyToken } = require("./middleware/authMiddleware");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const app = express();

// Middleware CORS (version propre)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

// Default routes
app.get("/", (req, res) => {
  res.send("PrimAzul backend is running");
});

app.get("/api/ping", (req, res) => {
  res.json({ message: "Connexion OK ✅" });
});

// Connection to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
