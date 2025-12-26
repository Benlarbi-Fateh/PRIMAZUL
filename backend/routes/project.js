const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");

const router = express.Router();

/* ================= GET PROJECTS ================= */
router.get("/conversations/:conversationId/projects", async (req, res) => {
  try {
    const projects = await Project.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });

    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch projects failed" });
  }
});

/* ================= CREATE PROJECT ================= */
router.post("/conversations/:conversationId/projects", async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      conversationId: req.params.conversationId,
    });

    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Create project failed" });
  }
});

/* ================= DELETE PROJECT ================= */
router.delete("/conversations/:conversationId/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1️⃣ Supprimer le projet
    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 2️⃣ Supprimer toutes les tâches liées à ce projet
    await Task.deleteMany({ projectId });

    res.status(200).json({ project: deletedProject });
  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    res.status(500).json({ error: "Delete project failed" });
  }
});


module.exports = router;
