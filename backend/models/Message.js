const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'voice', 'video'], // 🆕 Ajout de 'voice'
    default: 'text'
  },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
 
  // 🆕 NOUVEAUX CHAMPS POUR LES MESSAGES VOCAUX
  voiceUrl: { type: String, default: '' },
  voiceDuration: { type: Number, default: 0 }, // Durée en secondes
  cloudinaryId: { type: String, default: '' }, // Pour pouvoir supprimer le fichier si besoin
 
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
}, { timestamps: true });


module.exports = mongoose.model('Message', messageSchema);