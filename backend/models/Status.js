// backend/models/Status.js
const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
    content: {
      type: String,
      default: "",
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    // Style pour les statuts texte
    textStyle: {
      backgroundColor: { type: String, default: "from-purple-600 to-blue-600" },
      textColor: { type: String, default: "#ffffff" },
      fontSize: { type: String, default: "text-2xl" },
    },
    // Vues avec réactions intégrées
    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
        reaction: {
          type: String,
          enum: ["❤️", "😂", "😮", "😢", "😡", "🔥", "👏", "👍", null],
          default: null,
        },
        replyMessage: {
          type: String,
          default: null,
        },
      },
    ],
    // Résumé des réactions pour affichage rapide
    reactionsSummary: {
      "❤️": { type: Number, default: 0 },
      "😂": { type: Number, default: 0 },
      "😮": { type: Number, default: 0 },
      "😢": { type: Number, default: 0 },
      "😡": { type: Number, default: 0 },
      "🔥": { type: Number, default: 0 },
      "👏": { type: Number, default: 0 },
      "👍": { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    // Expiration après 24h
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Index pour performance et expiration auto
statusSchema.index({ userId: 1, createdAt: -1 });
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
statusSchema.index({ "views.userId": 1 });

// Méthode pour marquer comme vu
statusSchema.methods.markAsViewed = async function (viewerId) {
  const existingView = this.views.find(
    (v) => v.userId && v.userId.toString() === viewerId.toString()
  );

  if (!existingView) {
    this.views.push({ userId: viewerId, viewedAt: new Date() });
    return this.save();
  }
  return this;
};

// Méthode pour ajouter/mettre à jour une réaction
statusSchema.methods.addReaction = async function (userId, reaction) {
  const existingView = this.views.find(
    (v) => v.userId && v.userId.toString() === userId.toString()
  );

  if (existingView) {
    // Retirer l'ancienne réaction du compteur
    if (
      existingView.reaction &&
      this.reactionsSummary[existingView.reaction] > 0
    ) {
      this.reactionsSummary[existingView.reaction]--;
      this.reactionsSummary.total--;
    }

    // Ajouter la nouvelle réaction
    existingView.reaction = reaction;
    if (reaction) {
      this.reactionsSummary[reaction] =
        (this.reactionsSummary[reaction] || 0) + 1;
      this.reactionsSummary.total++;
    }
  } else {
    this.views.push({ userId, viewedAt: new Date(), reaction });
    if (reaction) {
      this.reactionsSummary[reaction] =
        (this.reactionsSummary[reaction] || 0) + 1;
      this.reactionsSummary.total++;
    }
  }

  return this.save();
};

// Méthode pour ajouter une réponse
statusSchema.methods.addReply = async function (userId, message) {
  const existingView = this.views.find(
    (v) => v.userId && v.userId.toString() === userId.toString()
  );

  if (existingView) {
    existingView.replyMessage = message;
  } else {
    this.views.push({ userId, viewedAt: new Date(), replyMessage: message });
  }

  this.repliesCount = (this.repliesCount || 0) + 1;
  return this.save();
};

module.exports = mongoose.model("Status", statusSchema);
