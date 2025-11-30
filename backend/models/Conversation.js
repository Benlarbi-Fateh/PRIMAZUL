const mongoose = require('mongoose');


const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
 
  // 🆕 NOUVEAUX CHAMPS POUR LES GROUPES
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, default: '' },
  groupImage: { type: String, default: '' },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Créateur du groupe
  groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],//plusieurs admin
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // qu'elle utilisateur a fait le delete
  mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // qui a mis en silencieux
 


  // AJOUTEZ CE CHAMP POUR LE THÈME
  theme: {
    type: Object,
    default: {
      id: 'default',
      primary: '#2563eb',
      bg: '',
      bubbleRadius: '14px',
      darkMode: false
    }
  },
 
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, { timestamps: true });


module.exports = mongoose.model('Conversation', conversationSchema);
