const express = require("express");
const router = express.Router();
const Task = require("../models/Tache");
const auth = require("../middleware/authMiddleware");

// --- 1. ROUTES STATIQUES (Sans paramètres variables) ---

// @route   GET /api/tache/today
router.get("/today", auth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // ✅ On s'assure que req.user.id existe
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Utilisateur non identifié" });
    }

    const tasks = await Task.find({
      userId: req.user.id,
      startTime: { $gte: start, $lte: end },
    }).sort({ startTime: 1 });

    res.json(tasks);
  } catch (err) {
    console.error("Erreur Backend /today:", err); // ✅ Pour voir l'erreur dans le terminal
    res.status(500).json({ message: err.message });
  }
});
// --- 2. ROUTES SEMI-STATIQUES (Préfixées) ---

// @route   GET /api/tache/list/:listId
// ✅ Important : Le préfixe "/list/" évite la confusion avec "/:id"
router.get("/list/:listId", auth, async (req, res) => {
  try {
    const tasks = await Task.find({
      listId: req.params.listId,
      userId: req.user.id,
    }).sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 3. ROUTES GÉNÉRIQUES ---

// @route   POST /api/tache
router.post("/", auth, async (req, res) => {
  try {
    const { text, description, listId, priority, startTime } = req.body;
    const task = await Task.create({
      text,
      description,
      listId,
      priority,
      startTime,
      userId: req.user.id,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 4. ROUTES AVEC ID (Toujours à la fin !) ---

// @route   PUT /api/tache/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/tache/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!task) return res.status(404).json({ message: "Tâche non trouvée" });
    res.json({ message: "Task supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
