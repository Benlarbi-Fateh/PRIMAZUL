const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    default: '' 
  },
  type: { 
    type: String, 
    enum: ['text', 'image', 'file', 'audio', 'voice', 'story_reply', 'story_reaction'], // 🆕 Ajout 'story_reaction'
    default: 'text' 
  },
  
  // 🆕 CHAMPS POUR LA RÉPONSE À UNE STORY
  isStoryReply: { 
    type: Boolean, 
    default: false 
  },
  isStoryReaction: { // 🆕 NOUVEAU CHAMP POUR LES RÉACTIONS
    type: Boolean,
    default: false
  },
  storyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Status' 
  },
  storyType: {
    type: String,
    enum: ['text', 'image', 'video', null],
    default: null
  },
  storyPreview: {
    type: String,
    default: ''
  },
  storyReactionType: { // 🆕 Type de réaction (like, love, etc.)
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry', 'fire', 'clap', null],
    default: null
  },
  
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  voiceUrl: { type: String, default: '' },
  voiceDuration: { type: Number, default: 0 },
  cloudinaryId: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read'], 
    default: 'sent' 
  }
}, { 
  timestamps: true 
});

// Index pour optimiser les recherches
messageSchema.index({ storyId: 1, createdAt: -1 });
messageSchema.index({ isStoryReply: 1, conversationId: 1 });
messageSchema.index({ isStoryReaction: 1, conversationId: 1 });

// Middleware pour populate automatique
messageSchema.pre('find', function() {
  if (this.isStoryReply || this.isStoryReaction) {
    this.populate('sender', 'name profilePicture')
        .populate('storyId', 'type content mediaUrl userId');
  } else {
    this.populate('sender', 'name profilePicture');
  }
});

messageSchema.pre('findOne', function() {
  if (this.isStoryReply || this.isStoryReaction) {
    this.populate('sender', 'name profilePicture')
        .populate('storyId', 'type content mediaUrl userId');
  } else {
    this.populate('sender', 'name profilePicture');
  }
});

module.exports = mongoose.model('Message', messageSchema);