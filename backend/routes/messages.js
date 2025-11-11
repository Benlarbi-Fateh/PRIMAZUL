// backend/routes/messages.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const multer = require("multer");

// Configurer où et comment les fichiers seront sauvegardés
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // le dossier que tu as créé
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // nom unique pour chaque fichier
  },
});

const upload = multer({ storage });



// POST /api/messages
// body: { senderId, conversationId, content, type, mediaType }
router.post("/", async (req, res) => {
     console.log("Body reçu :", req.body);
  try {
    const { senderId, conversationId, content, type = "text", mediaType = "text" } = req.body;
    if (!senderId || !conversationId || !content) {
      return res.status(400).json({ error: "senderId, conversationId and content are required" });
    }
    const message = new Message({
      senderId,
      conversationId,
      content,
      type,
      mediaType,
      timeSend: Date.now(),
    });
    const saved = await message.save();
      console.log("Message sauvegardé :", saved); 

    // Mettre à jour la conversation (lastMessageId)
    await Conversation.findByIdAndUpdate(conversationId, { lastMessageId: saved._id });

    return res.status(201).json(saved);
  } catch (err) {
    console.error(err);
      console.error("Erreur serveur :", err); 
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/messages/:conversationId
// query: ?page=1&limit=50
router.get("/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "100", 10);
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ timeSend: 1 }) // tri asc (ancien -> récent)
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({ page, limit, messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


//Statut lu/non lu

router.put("/:id/read", async (req, res) => {
  try {
    const messageId = req.params.id;
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { status: "read", timeView: Date.now() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Message not found" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});



// Supprimer un msj moi mem au tous le monde 

router.delete("/:id", async (req, res) => {
  try {
    const messageId = req.params.id;
    const { typeDelete = "pour moi" } = req.body; // "pour moi" ou "pour tout le monde"

    if (typeDelete === "pour moi") {
      // on garde le message mais marque supprimé pour l'utilisateur
      const updated = await Message.findByIdAndUpdate(
        messageId,
        { deleteMessage: "pour moi" },
        { new: true }
      );
      return res.json(updated);
    } else if (typeDelete === "pour tout le monde") {
      const deleted = await Message.findByIdAndDelete(messageId);
      return res.json({ deleted });
    } else {
      return res.status(400).json({ error: "Type delete invalide" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});
// modifier un msj
router.put("/:id", async (req, res) => {
  try {
    const messageId = req.params.id;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { content },
      { new: true }
    );
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


// Envoyer un fichier / media
router.post("/media", upload.single("file"), async (req, res) => {
  try {
    const { senderId, conversationId, type } = req.body;
    if (!senderId || !conversationId) {
      return res.status(400).json({ error: "senderId and conversationId are required" });
    }

    const filePath = req.file.path; // chemin du fichier uploadé

    const message = new Message({
      senderId,
      conversationId,
      content: filePath,                   // on stocke le chemin du fichier
      type: type || "file",
      mediaType: req.file.mimetype.split("/")[0], // "image", "audio", "video"
    });

    const saved = await message.save();
    await Conversation.findByIdAndUpdate(conversationId, { lastMessageId: saved._id });

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
