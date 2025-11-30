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


module.exports = mongoose.model('BlockedUser', blockedUserSchema);
