const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    
  // 🆕 NOUVEAUX CHAMPS POUR LES GROUPES
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, default: '' },
  groupImage: { type: String, default: '' },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Créateur du groupe
  
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);