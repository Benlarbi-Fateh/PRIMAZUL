// backend/models/Status.js
const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["text", "image", "video"], 
      default: "text" 
    },
    content: { 
      type: String, 
      required: true 
    },
    views: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now }
    }],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures
    }
  },
  {
    timestamps: true
  }
);

// Supprime automatiquement après 24h
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Status", statusSchema);