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
  { _id: false, timestamps: true },
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

    // ✅ CORRECTION ICI : Ajout de 'call' dans l'enum
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

    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },

    voiceUrl: { type: String, default: "" },
    voiceDuration: { type: Number, default: 0 },

    videoDuration: { type: Number, default: 0 },
    videoThumbnail: { type: String, default: "" },

    cloudinaryId: { type: String, default: "" },

    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["sent", "delivered", "read", "scheduled"],
      default: "sent",
    },

    isScheduled: { type: Boolean, default: false },
    scheduledFor: { type: Date, default: null },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isSent: { type: Boolean, default: true },

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

    storyReply: {
      statusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
      storyType: { type: String },
      storyUrl: { type: String },
      storyText: { type: String },
      storyExpiresAt: { type: Date },
      deleted: { type: Boolean, default: false },
    },

    // ✅ Structure complète pour les appels
    callDetails: {
      callId: String,
      callType: { type: String, enum: ["audio", "video"] },
      status: {
        type: String,
        enum: ["initiated", "ongoing", "ended", "missed", "declined"],
        default: "initiated",
      },
      initiator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      isGroup: { type: Boolean, default: false },
      startedAt: Date,
      endedAt: Date,
      duration: Number,
      participants: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: String,
          profilePicture: String,
          joinedAt: Date,
          leftAt: Date,
          status: String,
        },
      ],
      answeredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      missedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],

    reactions: [reactionSchema],

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

// Indexes
messageSchema.index({ "reactions.userId": 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ deletedFor: 1 });
messageSchema.index({ "storyReply.statusId": 1 });

module.exports = mongoose.model("Message", messageSchema);
