
// const mongoose = require("mongoose");

//   const contactSchema = new mongoose.Schema({
//   owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   contact: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
//   isFavorite: { type: Boolean, default: false },
//   isBlocked: { type: Boolean, default: false },
//   addedAt: { type: Date, default: Date.now },
// }, { timestamps: true });

//module.exports = mongoose.model("Contact", contactSchema);


const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    // Propriétaire du contact
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',  // pointer
      required: true, // obligatoire 
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



module.exports = mongoose.model("Contact", contactSchema);
