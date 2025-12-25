const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// POST créer une tâche
router.post("/", async (req, res) => {
  try {
    const { text, listId } = req.body;
    if (!text || !listId) {
      return res.status(400).json({ message: "Text et listId requis" });
    }
    const task = await Task.create({ text, listId });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET tâches d'une liste
router.get("/list/:listId", async (req, res) => {
  try {
    const tasks = await Task.find({ listId: req.params.listId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE tâche
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE tâche
router.delete("/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task supprimée" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
