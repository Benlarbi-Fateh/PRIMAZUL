const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, default: "" },
    type: {
      type: String,
      enum: ["text", "image", "file", "audio", "voice", "video", "call"],
      default: "text",
    },
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },

    // Pour les messages vocaux
    voiceUrl: { type: String, default: "" },
    voiceDuration: { type: Number, default: 0 },

    // Pour les vidéos
    videoDuration: { type: Number, default: 0 },
    videoThumbnail: { type: String, default: "" },

    cloudinaryId: { type: String, default: "" },

    // Champs pour la modification
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    // Champs pour la traduction
    translations: [
      {
        lang: String,
        content: String,
        translatedAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ["sent", "delivered", "read", "scheduled"],
      default: "sent",
    },

    // Messages programmés
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isSent: {
      type: Boolean,
      default: true,
    },

    // Réponse à un message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    replyToContent: {
      type: String,
      default: null,
    },
    replyToSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    callDetails: {
      duration: { type: Number, default: 0 },
      status: { type: String, enum: ["missed", "ended"], default: "ended" },
      callType: { type: String, enum: ["audio", "video"], default: "video" },
    },

    // Réactions
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

// Index pour optimiser les requêtes
messageSchema.index({ "reactions.userId": 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
