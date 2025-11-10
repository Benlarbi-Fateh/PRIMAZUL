const mongoose = require("mongoose");

const BlockedContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, 
  // utilisateur qui bloque
  blockedId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
   // utilisateur bloqué
  blockDate: { type: Date, default: Date.now } // date du blocage
});

module.exports = mongoose.model("Blocked_contacts", BlockedContactSchema);
