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
    pinnedMessageId: {
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

// Tri des membres pour éviter les doublons
ConversationSchema.pre("save", function (next) {
  if (this.members && this.members.length > 1) {
    this.members.sort();
  }
  next();
});

// Index pour recherche rapide
ConversationSchema.index({ members: 1, createdAt: -1 });

// Empêcher doublons dans les conversations privées
ConversationSchema.index(
  { members: 1 },
  { unique: true, partialFilterExpression: { type: "private" } }
);

export default mongoose.model("Conversation", ConversationSchema);
