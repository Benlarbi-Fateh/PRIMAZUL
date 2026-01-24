// routes/projectRoutes.js
const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Conversation = require("../models/Conversation");
const authMiddleware = require("../middleware/authMiddleware"); // 🆕 AJOUTER

const router = express.Router();

/* ================= GET PROJECTS ================= */
router.get(
  "/conversations/:conversationId/projects",
  authMiddleware, // 🆕 AJOUTER
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user._id;

      // 🆕 Vérifier que la conversation existe
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation non trouvée" });
      }

      // 🆕 Vérifier que l'utilisateur fait partie du groupe
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId.toString(),
      );

      if (!isParticipant) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      const projects = await Project.find({ conversationId }).sort({
        createdAt: 1,
      });

      res.json({ success: true, projects });
    } catch (err) {
      console.error("❌ Erreur fetch projects:", err);
      res.status(500).json({ error: "Fetch projects failed" });
    }
  },
);

/* ================= CREATE PROJECT ================= */
router.post(
  "/conversations/:conversationId/projects",
  authMiddleware, // 🆕 AJOUTER
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user._id;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Le nom du projet est requis" });
      }

      // 🆕 Vérifier la conversation
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation non trouvée" });
      }

      if (!conversation.isGroup) {
        return res.status(400).json({
          error: "Les projets ne sont disponibles que pour les groupes",
        });
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId.toString(),
      );

      if (!isParticipant) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      const project = await Project.create({
        name: name.trim(),
        conversationId,
      });

      // 🆕 Émettre un événement Socket
      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit("project-created", {
            conversationId,
            project,
          });
        });
      }

      console.log("✅ Projet créé:", project._id);

      res.status(201).json({ success: true, project });
    } catch (err) {
      console.error("❌ Erreur create project:", err);
      res.status(400).json({ error: "Create project failed" });
    }
  },
);

/* ================= DELETE PROJECT ================= */
router.delete(
  "/conversations/:conversationId/projects/:projectId",
  authMiddleware, // 🆕 AJOUTER
  async (req, res) => {
    try {
      const { conversationId, projectId } = req.params;
      const userId = req.user._id;

      // 🆕 Vérifier les droits admin
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation non trouvée" });
      }

      const isAdmin =
        conversation.groupAdmin?.toString() === userId.toString() ||
        conversation.groupAdmins?.some(
          (a) => a.toString() === userId.toString(),
        );

      // 🆕 Permettre aussi au créateur du projet de le supprimer (optionnel)
      if (!isAdmin) {
        return res.status(403).json({
          error: "Seuls les admins peuvent supprimer un projet",
        });
      }

      // 1️⃣ Supprimer le projet
      const deletedProject = await Project.findByIdAndDelete(projectId);

      if (!deletedProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // 2️⃣ Supprimer toutes les tâches liées à ce projet
      await Task.deleteMany({ projectId });

      // 🆕 Émettre un événement Socket
      const io = req.app.get("io");
      if (io) {
        conversation.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit("project-deleted", {
            conversationId,
            projectId,
          });
        });
      }

      console.log("✅ Projet supprimé:", projectId);

      res.status(200).json({ success: true, project: deletedProject });
    } catch (err) {
      console.error("❌ DELETE PROJECT ERROR:", err);
      res.status(500).json({ error: "Delete project failed" });
    }
  },
);

module.exports = router;
