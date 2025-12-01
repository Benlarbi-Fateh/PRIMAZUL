const mongoose = require('mongoose');

// Schéma pour les réactions
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
    enum: ['text', 'image', 'file', 'audio', 'voice', 'video'], // ✅ Ajout de 'video'
    default: 'text' 
  },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  
  // Pour les messages vocaux
  voiceUrl: { type: String, default: '' },
  voiceDuration: { type: Number, default: 0 },
  
  // ✅ NOUVEAU : Pour les vidéos
  videoDuration: { type: Number, default: 0 }, // Durée de la vidéo en secondes
  videoThumbnail: { type: String, default: '' }, // URL de la miniature (optionnel)
  
  cloudinaryId: { type: String, default: '' },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  
  // Réactions
  reactions: [reactionSchema]
  
}, { timestamps: true });

// Index pour optimiser les requêtes
messageSchema.index({ 'reactions.userId': 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);