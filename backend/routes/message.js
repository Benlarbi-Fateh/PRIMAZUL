const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const verifyToken = require("../middleware/auth");

// Envoyer un message
router.post("/", verifyToken, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const newMessage = await Message.create({
      conversationId,
      sender: req.user.id,
      text,
    });
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Récupérer messages d'une conversation
router.get("/:conversationId", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
