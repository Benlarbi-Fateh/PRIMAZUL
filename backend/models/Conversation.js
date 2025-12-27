// models/Conversation.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const conversationSchema = new Schema({
  // Participants (toujours au moins 2 en 1-1, plus en groupe)
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],

  // Dernier message (pour l’aperçu dans la sidebar)
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },

  // ============================
  //   CHAMPS POUR LES GROUPES
  // ============================
  isGroup: { type: Boolean, default: false },
   // ✅ AJOUT ICI
    groupType: {
      type: String,
      enum: ["chat", "work"],
      default: "chat", // Par défaut, c'est un groupe de discussion normal
    },
  groupName: { type: String, default: '' },
  groupImage: { type: String, default: '' },

  // Créateur du groupe
  groupAdmin: { type: Schema.Types.ObjectId, ref: 'User' },

  // Autres admins
  groupAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  // Historique des actions de groupe
  groupHistory: [{
    action: {
      type: String,
      enum: [
        'member_added',
        'member_removed',
        'member_left',
        'admin_added',
        'admin_removed',
        'info_updated'
      ],
      required: true
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    details: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // ============================
  //   SUPPRESSION SOFT (vider)
  // ============================
  // Qui a vidé la conversation et quand (pour ce user)
  deletedBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: Date.now }
  }],

  // ============================
  //   ARCHIVAGE
  // ============================
  // Qui a archivé la conversation et quand
  archivedBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: { type: Date, default: Date.now }
  }],

  // ============================
  //   SILENCE / MUTE
  // ============================
  mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],

  // ============================
  //   COMPTEURS NON-LUS (optionnel)
  // ============================
  unreadCount: {
    type: Map,
    of: Number,
    default: () => ({})
  }

}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);