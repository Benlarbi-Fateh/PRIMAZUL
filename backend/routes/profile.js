import express from "express";
import User from "../models/Users.js";
import { verifyToken } from "../middleware/auth.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const router = express.Router();

router.get("/:id", async (req, res) => 
  {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
});

export default router;
