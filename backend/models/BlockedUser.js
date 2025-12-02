// models/BlockedUser.js
const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Index pour optimiser les requêtes
blockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

// ✅ AJOUTEZ CES MÉTHODES :
// Méthode statique pour vérifier si un utilisateur en a bloqué un autre
blockedUserSchema.statics.isBlocked = async function(userId, blockedUserId) {
  const block = await this.findOne({
    userId: userId,
    blockedUserId: blockedUserId
  });
  return Boolean(block);
};

// Méthode statique pour vérifier les deux directions
blockedUserSchema.statics.getBlockStatus = async function(currentUserId, targetUserId) {
  const iBlocked = await this.findOne({
    userId: currentUserId,
    blockedUserId: targetUserId
  });
  
  const blockedMe = await this.findOne({
    userId: targetUserId,
    blockedUserId: currentUserId
  });
  
  return {
    iBlocked: Boolean(iBlocked),
    blockedMe: Boolean(blockedMe),
    isBlocked: Boolean(iBlocked || blockedMe)
  };
};

module.exports = mongoose.model('BlockedUser', blockedUserSchema);