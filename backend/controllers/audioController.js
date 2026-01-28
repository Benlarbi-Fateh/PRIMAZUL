const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const cloudinary = require("../config/cloudinary");
const fs = require("fs").promises; // ✅ Utilisation de fs.promises

exports.sendVoiceMessage = async (req, res) => {
  try {
    console.log("🎤 Réception d'un message vocal");

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier audio fourni" });
    }

    const { conversationId, duration } = req.body;
    const senderId = req.user._id;

    // 🎤 Upload vers Cloudinary en tant qu'audio
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video", // Cloudinary utilise 'video' pour les audios
      folder: "whatsapp-clone/voice-messages",
      format: "mp3", // Conversion automatique en MP3
    });

    console.log("✅ Audio uploadé sur Cloudinary:", result.secure_url);

    // ✅ Suppression Asynchrone
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.warn("⚠️ Erreur suppression fichier vocal temp:", err.message);
    }

    // 💾 Créer le message en base de données
    const message = new Message({
      conversationId,
      sender: senderId,
      type: "voice",
      voiceUrl: result.secure_url,
      voiceDuration: parseInt(duration) || 0,
      cloudinaryId: result.public_id,
      content: "", // Pas de texte pour les messages vocaux
    });

    await message.save();
    await message.populate("sender", "name profilePicture");

    // 🔄 Mettre à jour la conversation
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message._id,
        updatedAt: Date.now(),
      },
      { new: true },
    )
      .populate("participants", "name email profilePicture isOnline lastSeen")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name" },
      });

    // 📡 ÉMETTRE VIA SOCKET
    const io = req.app.get("io");
    if (io) {
      // Envoyer le message à la conversation
      io.to(conversationId).emit("receive-message", message);

      // Mettre à jour la liste des conversations
      conversation.participants.forEach((participant) => {
        io.to(participant._id.toString()).emit(
          "conversation-updated",
          conversation,
        );
      });
    }

    res.status(201).json({
      success: true,
      message,
      voiceUrl: result.secure_url,
    });
  } catch (error) {
    console.error("❌ Erreur sendVoiceMessage:", error);

    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({ error: error.message });
  }
};
