const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  // 🆕 NOUVEAU : Compteur de messages non lus par participant
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);