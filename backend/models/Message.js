const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema
({
senderId: { type: mongoose.Schema.Types.ObjectId, 
              ref: "Users", 
              required: true },
conversationId: { type: mongoose.Schema.Types.ObjectId, 
                  ref: "Conversation", 
                  required: true },
  content: { type: String, 
                  required: true },
timeSend: { type: Date, 
              default: Date.now },
timeView: { type: Date },
type: { type: String, 
        enum: ["text", "call"], 
        default: "text" },
status: { type: String, 
        enum: ["read", "noRead"], 
        default: "noRead" },
deleteMessage: { type: String, 
        enum: ["pour moi", "pour tout le monde"], 
        default: "pour moi" },
mediaType: { type: String, 
        enum: ["audio", "video", "fichier", "image"], 
        default: "text" }
});
// Index pour retrouver rapidement les messages par conversation
messageSchema.index({ conversationId: 1, timeSend: 1 });
module.exports = mongoose.model("Message", messageSchema);
