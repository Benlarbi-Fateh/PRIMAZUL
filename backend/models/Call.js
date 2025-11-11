const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema({
  callerId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, // utilisateur qui initie l'appel
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }, // utilisateur qui reçoit l'appel
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }], // tous les participants
  callType: { type: String, enum: ["audio", "video"], required: true }, // type d'appel
  callStatus: { type: String, enum: ["ended", "ongoing", "missed"], default: "ongoing" }, // statut de l'appel
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  duration: { type: Number, default: 0 } // durée en secondes ou minutes
});

module.exports = mongoose.model("Call", CallSchema);