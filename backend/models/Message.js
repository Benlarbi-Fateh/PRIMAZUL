// backend/models/Message.js
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
  { _id: false }
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
      enum: [
        "text",
        "image",
        "file",
        "audio",
        "voice",
        "video",
        "call",
        "story_reply",
        "story_reaction",
      ],
      default: "text",
    },

    // Fichiers
    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },
    voiceUrl: { type: String, default: "" },
    voiceDuration: { type: Number, default: 0 },
    videoDuration: { type: Number, default: 0 },
    videoThumbnail: { type: String, default: "" },
    cloudinaryId: { type: String, default: "" },

    // Édition
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    // Réponse Story
    storyReply: {
      statusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
      storyUrl: { type: String },
      storyType: { type: String },
      storyText: { type: String },
      reaction: { type: String },
    },

    // ✅ APPEL AMÉLIORÉ
    callDetails: {
      callId: { type: String }, // ID unique de l'appel
      callType: {
        type: String,
        enum: ["audio", "video"],
        default: "video",
      },
      status: {
        type: String,
        enum: [
          "initiated",
          "ringing",
          "ongoing",
          "ended",
          "missed",
          "declined",
          "no_answer",
          "busy",
        ],
        default: "initiated",
      },
      initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      participants: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: { type: String },
          profilePicture: { type: String },
          joinedAt: { type: Date },
          leftAt: { type: Date },
          duration: { type: Number, default: 0 }, // Durée individuelle
        },
      ],
      isGroup: { type: Boolean, default: false },
      groupName: { type: String },
      startedAt: { type: Date },
      endedAt: { type: Date },
      duration: { type: Number, default: 0 }, // Durée totale en secondes
      answeredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      missedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    // Statut du message
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "scheduled"],
      default: "sent",
    },

    // Programmation
    isScheduled: { type: Boolean, default: false },
    scheduledFor: { type: Date, default: null },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isSent: { type: Boolean, default: true },

    // Réponse
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    replyToContent: { type: String, default: null },
    replyToSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Réactions
    reactions: [reactionSchema],
    // 🆕 SUPPRESSION POUR UN UTILISATEUR
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ "callDetails.callId": 1 });
messageSchema.index({ "reactions.userId": 1 });

module.exports = mongoose.model("Message", messageSchema);
