// backend/models/Call.js
const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: String,
        profilePicture: String,
        joinedAt: Date,
        leftAt: Date,
        status: {
          type: String,
          enum: ["invited", "connected", "declined", "missed", "left"],
          default: "invited",
        },
      },
    ],
    type: {
      type: String,
      enum: ["audio", "video"],
      default: "video",
    },
    status: {
      type: String,
      enum: ["initiated", "ongoing", "ended", "missed", "rejected"],
      default: "initiated",
    },
    channelName: { type: String }, // Nom du channel Agora
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 }, // En secondes
    isGroup: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Call", callSchema);