const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'voice', 'video'],
    default: 'text'
  },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
 
  // 🆕 NOUVEAUX CHAMPS POUR LES MESSAGES VOCAUX
  voiceUrl: { type: String, default: '' },
  voiceDuration: { type: Number, default: 0 },
  
  // ✅ NOUVEAU : Pour les vidéos
  videoDuration: { type: Number, default: 0 },
  videoThumbnail: { type: String, default: '' },
  
  cloudinaryId: { type: String, default: '' },

  // 🆕 CHAMPS POUR LA MODIFICATION
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  
  // 🆕 CHAMPS POUR LA TRADUCTION (optionnel)
  translations: [{
    lang: String,
    content: String,
    translatedAt: { type: Date, default: Date.now }
  }],
  
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  
  // Réactions
  reactions: [reactionSchema]
  
}, { timestamps: true });

// Index pour optimiser les requêtes
messageSchema.index({ 'reactions.userId': 1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);