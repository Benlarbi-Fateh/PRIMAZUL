const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  message: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

// Index pour éviter les doublons d'invitations
invitationSchema.index({ sender: 1, receiver: 1, status: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);