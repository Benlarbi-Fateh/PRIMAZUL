import mongoose from "mongoose";

const BlockedContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, // utilisateur qui bloque
  blockedId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, // utilisateur bloqué
  blockDate: { type: Date, default: Date.now } // date du blocage
});

export default mongoose.model("BlockedContact", BlockedContactSchema);
