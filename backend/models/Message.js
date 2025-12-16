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
      // ✅ AJOUT DE 'story_reply'
      enum: [
        "text",
        "image",
        "file",
        "audio",
        "voice",
        "video",
        "call",
        "story_reply",
      ],
      default: "text",
    },

    // ... (Tes champs existants fileUrl, voiceUrl, etc. restent ici) ...
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

    // ✅ NOUVEAUX CHAMPS POUR RÉPONSE STORY
    storyReply: {
      statusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
      storyUrl: { type: String }, // Copie de l'image/vidéo
      storyType: { type: String }, // 'image', 'video', 'text'
      storyText: { type: String }, // Contenu du texte original
    },

    callDetails: {
      duration: { type: Number, default: 0 },
      status: { type: String, enum: ["missed", "ended"], default: "ended" },
      callType: { type: String, enum: ["audio", "video"], default: "video" },
    },

    status: {
      type: String,
      enum: ["sent", "delivered", "read", "scheduled"],
      default: "sent",
    },
    // ... (Reste des champs programmés, replyTo, etc.) ...
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
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

messageSchema.index({ "reactions.userId": 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
