const mongoose = require("mongoose");

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
    //////////////////////////////////
    // ⭐ TYPES DE MESSAGES (avec les appels)
    type: {
      type: String,
      enum: [
        "text",
        "image",
        "file",
        "audio",
        "voice",
        "call", // 🆕 pour l’historique d’appels
      ],
      default: "text",
    },
    //////////////////////////////////

    fileUrl: { type: String, default: "" },
    fileName: { type: String, default: "" },
    fileSize: { type: Number, default: 0 },

    // 🆕 NOUVEAUX CHAMPS POUR LES MESSAGES VOCAUX
    voiceUrl: { type: String, default: "" },
    voiceDuration: { type: Number, default: 0 }, // Durée en secondes
    cloudinaryId: { type: String, default: "" }, // Pour pouvoir supprimer le fichier si besoin

    ////appel////////////////////////////
    callType: {
      type: String,
      enum: ["audio", "video", null],
      default: null,
    },

    callStatus: {
      type: String,
      enum: ["missed", "ended", null],
      default: null,
    },

    callDuration: {
      type: Number, // en secondes
      default: 0,
    },
    ////////////////////////////////
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
