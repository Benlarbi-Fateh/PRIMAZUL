const express = require("express");
const router = express.Router();
const TaskList = require("../models/TacheList");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, async (req, res) => {
  try {
    const { category } = req.query;
    // On filtre par catégorie ET par utilisateur connecté
    const filter = { userId: req.user.id };
    if (category) filter.category = category;

    const lists = await TaskList.find(filter);
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, category } = req.body;
    const list = await TaskList.create({
      userId: req.user.id,
      title,
      category,
    });
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: "Erreur création liste" });
  }
});

module.exports = router;
