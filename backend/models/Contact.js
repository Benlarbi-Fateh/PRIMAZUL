const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  isFavorite: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now },
}, { timestamps: true });

  // ✅ NOUVEAU FORMAT - Stocker userId + date de suppression
  deletedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: Date.now }
  }],

module.exports = mongoose.model("Contact", contactSchema);
