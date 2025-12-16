// backend/controllers/statusController.js
const Status = require("../models/Status");
const Contact = require("../models/Contact");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const fs = require("fs");
const path = require("path");

// 1. Créer un statut
exports.createStatus = async (req, res) => {
  try {
    const { type, content } = req.body;
    let mediaUrl = "";

    const userId = req.user.userId || req.user.id || req.user._id;

    if (req.file) {
      mediaUrl = `/uploads/status/${req.file.filename}`;
    }

    const newStatus = await Status.create({
      user: userId,
      type,
      content,
      mediaUrl,
    });

    await newStatus.populate("user", "name profilePicture");
    res.status(201).json(newStatus);
  } catch (error) {
    console.error("Erreur création statut:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 2. Récupérer les statuts (Moi + Amis)
exports.getStatuses = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;

    // Récupérer les amis
    const contacts = await Contact.find({ owner: userId }).select("contact");
    const friendIds = contacts.map((c) => c.contact);
    friendIds.push(userId); // Ajouter soi-même

    const statuses = await Status.find({
      user: { $in: friendIds },
    })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (error) {
    console.error("Erreur get statuts:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 3. Répondre à un statut (Crée un message dans le chat)
exports.replyToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { message: text } = req.body; // Le front envoie { message: "..." }
    const userId = req.user.userId || req.user.id || req.user._id;

    const status = await Status.findById(statusId).populate("user");
    if (!status) return res.status(404).json({ error: "Statut introuvable" });

    const recipientId = status.user._id;

    // Trouver/Créer Conversation
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        participants: [userId, recipientId],
      });
    }

    // Créer Message Spécial
    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: userId,
      type: "story_reply",
      content: text,
      storyReply: {
        statusId: status._id,
        storyUrl: status.mediaUrl,
        storyType: status.type,
        storyText: status.content,
      },
    });

    // Mettre à jour conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: newMessage._id,
      updatedAt: Date.now(),
    });

    // Socket
    const io = req.app.get("io");
    if (io) {
      io.to(conversation._id.toString()).emit("new message", newMessage);
    }

    // ✅ IMPORTANT : On renvoie l'ID de la conversation pour la redirection
    res.status(201).json({ success: true, conversationId: conversation._id });
  } catch (error) {
    console.error("Erreur réponse:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 4. Supprimer un statut
exports.deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    const status = await Status.findById(id);
    if (!status) return res.status(404).json({ error: "Introuvable" });

    if (status.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    // Supprimer fichier
    if (status.mediaUrl && !status.mediaUrl.startsWith("http")) {
      const filePath = path.join(__dirname, "..", status.mediaUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Status.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
