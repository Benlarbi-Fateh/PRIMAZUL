// controllers/taskController.js

const mongoose = require("mongoose");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Conversation = require("../models/Conversation");

// =================== HELPER SOCKET ===================

/**
 * Émettre un événement Socket.io à tous les membres de la conversation
 */
const emitToConversation = (req, conversationId, event, data) => {
  const io = req.app.get("io");

  if (!io) {
    console.error("❌ Socket.io non disponible dans le contrôleur!");
    return;
  }

  const room = `conversation:${conversationId}`;
  io.to(room).emit(event, data);
  console.log(`📡 Émis: ${event} → ${room}`);
};

/**
 * Vérifier si l'utilisateur est membre de la conversation
 */
const verifyMembership = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw { status: 404, message: "Conversation introuvable" };
  }

  const isMember = conversation.participants.some(
    (p) => p.toString() === userId.toString(),
  );

  if (!isMember) {
    throw {
      status: 403,
      message: "Vous n'êtes pas membre de cette conversation",
    };
  }

  return conversation;
};

/**
 * Peupler une tâche avec toutes les relations
 */
const populateTask = async (taskId) => {
  return Task.findById(taskId)
    .populate("createdBy", "name email profilePicture")
    .populate("assignees", "name email profilePicture")
    .populate("projectId", "name")
    .populate("comments.author", "name email profilePicture");
};

// =================== GET TASKS ===================

exports.getTasks = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    await verifyMembership(conversationId, userId);

    const tasks = await Task.find({ conversationId })
      .populate("createdBy", "name email profilePicture")
      .populate("assignees", "name email profilePicture")
      .populate("projectId", "name")
      .populate("comments.author", "name email profilePicture")
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("❌ GET TASKS ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur récupération tâches",
    });
  }
};

// =================== CREATE TASK ===================

exports.createTask = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await verifyMembership(conversationId, userId);

    const {
      title,
      description,
      priority = "normal",
      dueDate,
      status = "todo",
      projectId,
      assignees = [],
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Titre requis" });
    }

    // Valider les assignés
    const validAssignees = assignees.filter((a) =>
      conversation.participants.some((p) => p.toString() === a.toString()),
    );

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      status,
      projectId: projectId || null,
      assignees: validAssignees.length > 0 ? validAssignees : [userId],
      conversationId,
      createdBy: userId,
    });

    const populatedTask = await populateTask(task._id);

    // ✅ ÉMETTRE L'ÉVÉNEMENT SOCKET
    emitToConversation(req, conversationId, "task:created", {
      task: populatedTask,
    });

    console.log("✅ Tâche créée et émise:", populatedTask._id);

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    console.error("❌ CREATE TASK ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur création tâche",
    });
  }
};

// =================== UPDATE TASK ===================

exports.updateTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tâche introuvable" });
    }

    await verifyMembership(task.conversationId, userId);

    // Nettoyer les assignees si présent
    if (updates.assignees) {
      updates.assignees = [
        ...new Set(
          updates.assignees
            .map((a) =>
              typeof a === "object" ? a._id?.toString() : a?.toString(),
            )
            .filter(Boolean),
        ),
      ];
    }

    // Appliquer les mises à jour
    Object.assign(task, updates);
    await task.save();

    const populatedTask = await populateTask(task._id);

    // ✅ ÉMETTRE L'ÉVÉNEMENT SOCKET
    emitToConversation(req, task.conversationId.toString(), "task:updated", {
      task: populatedTask,
    });

    console.log("✅ Tâche mise à jour et émise:", populatedTask._id);

    res.json({ success: true, task: populatedTask });
  } catch (error) {
    console.error("❌ UPDATE TASK ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur mise à jour tâche",
    });
  }
};

// =================== CHANGE STATUS (pour drag & drop) ===================

exports.changeStatus = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!["todo", "inProgress", "done"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Statut invalide" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tâche introuvable" });
    }

    await verifyMembership(task.conversationId, userId);

    const oldStatus = task.status;
    task.status = status;

    if (status === "done" && !task.completedAt) {
      task.completedAt = new Date();
    } else if (status !== "done") {
      task.completedAt = null;
    }

    await task.save();

    const populatedTask = await populateTask(task._id);

    // ✅ ÉMETTRE L'ÉVÉNEMENT SOCKET SPÉCIFIQUE POUR LE STATUT
    emitToConversation(
      req,
      task.conversationId.toString(),
      "task:statusChanged",
      {
        task: populatedTask,
        oldStatus,
        newStatus: status,
      },
    );

    console.log(
      `✅ Statut changé: ${oldStatus} → ${status}`,
      populatedTask._id,
    );

    res.json({ success: true, task: populatedTask });
  } catch (error) {
    console.error("❌ CHANGE STATUS ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur changement statut",
    });
  }
};

// =================== DELETE TASK ===================

exports.deleteTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tâche introuvable" });
    }

    await verifyMembership(task.conversationId, userId);

    const conversationId = task.conversationId.toString();

    await Task.findByIdAndDelete(taskId);

    // ✅ ÉMETTRE L'ÉVÉNEMENT SOCKET
    emitToConversation(req, conversationId, "task:deleted", {
      taskId,
    });

    console.log("✅ Tâche supprimée et émise:", taskId);

    res.json({ success: true, message: "Tâche supprimée" });
  } catch (error) {
    console.error("❌ DELETE TASK ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur suppression tâche",
    });
  }
};

// =================== ADD COMMENT ===================

exports.addComment = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Commentaire requis" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Tâche introuvable" });
    }

    await verifyMembership(task.conversationId, userId);

    task.comments.push({
      text: text.trim(),
      author: userId,
    });

    await task.save();

    const populatedTask = await populateTask(task._id);
    const newComment =
      populatedTask.comments[populatedTask.comments.length - 1];

    // ✅ ÉMETTRE L'ÉVÉNEMENT SOCKET
    emitToConversation(req, task.conversationId.toString(), "task:commented", {
      taskId,
      comment: newComment,
      task: populatedTask,
    });

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error("❌ ADD COMMENT ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur ajout commentaire",
    });
  }
};

// =================== PROJECTS ===================

exports.getProjects = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    await verifyMembership(conversationId, userId);

    const projects = await Project.find({ conversationId }).sort({
      createdAt: -1,
    });

    // Ajouter le compteur de tâches
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({
          conversationId,
          projectId: project._id,
        });
        return { ...project.toObject(), taskCount };
      }),
    );

    res.json({ success: true, projects: projectsWithCounts });
  } catch (error) {
    console.error("❌ GET PROJECTS ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur récupération projets",
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    await verifyMembership(conversationId, userId);

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Nom requis" });
    }

    const project = await Project.create({
      name: name.trim(),
      conversationId,
    });

    // ✅ ÉMETTRE L'ÉVÉNEMENT SOCKET
    emitToConversation(req, conversationId, "project:created", {
      project: { ...project.toObject(), taskCount: 0 },
    });

    res.status(201).json({
      success: true,
      project: { ...project.toObject(), taskCount: 0 },
    });
  } catch (error) {
    console.error("❌ CREATE PROJECT ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur création projet",
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { conversationId, projectId } = req.params;
    const userId = req.user._id;

    await verifyMembership(conversationId, userId);

    const project = await Project.findOneAndDelete({
      _id: projectId,
      conversationId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Projet introuvable" });
    }

    // Supprimer les tâches du projet
    await Task.deleteMany({ conversationId, projectId });

    // ✅ ÉMETTRE L'ÉVÉNEMENT SOCKET
    emitToConversation(req, conversationId, "project:deleted", {
      projectId,
    });

    res.json({ success: true, message: "Projet supprimé" });
  } catch (error) {
    console.error("❌ DELETE PROJECT ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Erreur suppression projet",
    });
  }
};
