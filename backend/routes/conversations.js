// backend/routes/conversations.js
const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");

// Create conversation (members: array of userIds)
router.post("/", async (req, res) => {
  try {
    const { members = [], type = "private", adminId } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "members array required" });
    }
    const conv = new Conversation({ members, type, adminId });
    const saved = await conv.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get conversation by id
router.get("/:id", async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id).lean();
    if (!conv) return res.status(404).json({ error: "Not found" });
    return res.json(conv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

// Get all conversations
router.get("/", async (req, res) => {
  try {
    const convs = await Conversation.find().lean(); // récupère toutes les conversations
    return res.json(convs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});
