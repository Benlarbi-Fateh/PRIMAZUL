const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
  type: { type: String, 
    enum: ["private", "public"], 
    default: "private" },
  members: [{ type: mongoose.Schema.Types.ObjectId, 
    ref: "Users",
     required: true }],
  createdAt: { type: Date, 
    default: Date.now },
  lastMessageId: { type: mongoose.Schema.Types.ObjectId, 
    ref: "Message" },
  messageId: { type: mongoose.Schema.Types.ObjectId, 
    ref: "Message" }, // si tu veux stocker un message spécifique
  adminId: { type: mongoose.Schema.Types.ObjectId, 
    ref: "Users" }
});

// Index pour retrouver rapidement les conversations par membres
ConversationSchema.index({ members: 1, createdAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
