const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    // Propriétaire du contact
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true // Index pour des requêtes rapides
    },
    
    // L'utilisateur ajouté en tant que contact
    contact: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    
    // Nom personnalisé (optionnel, sinon on utilise le nom du User)
    customName: { 
      type: String, 
      trim: true 
    },
    
    // Conversation associée
    conversation: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Conversation'
    },
    
    // Favori ou non
    isFavorite: { 
      type: Boolean, 
      default: false 
    },
    
    // Bloqué ou non
    isBlocked: { 
      type: Boolean, 
      default: false 
    },
    
    // Date d'ajout
    addedAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true 
  }
);

// Index composé pour éviter les doublons (un user ne peut pas ajouter 2x le même contact)
contactSchema.index({ owner: 1, contact: 1 }, { unique: true });

// Méthode pour récupérer les informations complètes du contact
contactSchema.methods.getContactInfo = async function() {
  await this.populate('contact', 'name email profilePicture status isOnline');
  return this;
};

module.exports = mongoose.model('Contact', contactSchema);