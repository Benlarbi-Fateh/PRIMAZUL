const mongoose = require('mongoose');

// 🆕 Schéma pour les réactions
const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true }
}, { _id: false, timestamps: true });

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file', 'audio', 'voice'],
    default: 'text' 
  },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  voiceUrl: { type: String, default: '' },
  voiceDuration: { type: Number, default: 0 },
  cloudinaryId: { type: String, default: '' },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  
  // 🆕 RÉACTIONS
  reactions: [reactionSchema]
  
}, { timestamps: true });

// 🆕 Index pour optimiser les requêtes sur les réactions
messageSchema.index({ 'reactions.userId': 1 });

module.exports = mongoose.model('Message', messageSchema);