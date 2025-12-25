const express = require("express");
const router = express.Router();
const TaskList = require("../models/TaskList");
const auth = require("../middleware/authMiddleware");

// GET toutes les listes ou par catégorie
router.get("/", async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  if (category) filter.category = category
  const lists = await TaskList.find(filter);
  res.json(lists);
});

router.post("/", auth, async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) return res.status(400).json({ error: "Title et category requis" });

    const list = await TaskList.create({
      userId: req.user.id, // récupéré depuis le middleware auth
      title,
      category,
    });

    res.status(201).json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création liste" });
  }
});


module.exports = router;
