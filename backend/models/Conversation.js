const mongoose = require('mongoose');


const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
 
    
  // 🆕 NOUVEAUX CHAMPS POUR LES GROUPES
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, default: '' },
  groupImage: { type: String, default: '' },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Créateur du groupe
  groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],//plusieurs admin
  mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // qui a mis en silencieux
 

  // ✅ NOUVEAU FORMAT - Stocker userId + date de suppression
  deletedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: Date.now }
  }],

 
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, { timestamps: true });


module.exports = mongoose.model('Conversation', conversationSchema);
