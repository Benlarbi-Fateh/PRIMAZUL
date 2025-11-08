import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    ],
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    pinnedMessageId: { // ancien "messageId"
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

// Index pour recherche rapide
ConversationSchema.index({ members: 1, createdAt: -1 });

// Empêcher doublons dans les conversations privées
ConversationSchema.index(
  { members: 1 },
  { unique: true, partialFilterExpression: { type: "private" } }
);

export default mongoose.model("Conversation", ConversationSchema);
