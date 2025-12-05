const mongoose = require('mongoose');

const deletedConversationSchema = new mongoose.Schema({
  originalConversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  
  // Conserver les infos du groupe si c'était un groupe
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, default: '' },
  groupImage: { type: String, default: '' },
  
  // Garder une trace des messages
  messageCount: { type: Number, default: 0 },
  
  deletedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DeletedConversation', deletedConversationSchema);