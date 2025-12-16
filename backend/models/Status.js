// backend/models/Status.js
const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: {
    type: String,
    enum: ["text", "image", "video"],
    default: "image",
  },

  content: { type: String, default: "" }, // Texte ou légende
  mediaUrl: { type: String, default: "" }, // URL du fichier

  viewers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      viewedAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

// ✅ Index TTL : Suppression auto après 24h (86400s)
statusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("Status", statusSchema);
