const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, 
    ref: "Users", 
    required: true }, // le propriétaire du contact
  contactUserId: { type: mongoose.Schema.Types.ObjectId, 
    ref: "Users", 
    required: true }, // l'utilisateur contact
  nickname: { type: String, 
    default: "" }, // surnom donné au contact
  createdAt: { type: Date, default: Date.now }
});

// pour éviter les doublons (un contact ne peut pas apparaître deux fois pour le même owner)
ContactSchema.index({ ownerId: 1, contactUserId: 1 }, 
{ unique: true });

module.exports = mongoose.model("Contacts", ContactSchema);