const mongoose = require("mongoose");
const Task = require("../models/Task");

// GET /conversations/:id/tasks
exports.getTasksByConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "ID conversation invalide" });
    }

    const tasks = await Task.find({ conversationId })
      .populate("createdBy", "name")
      .sort({ createdAt: 1 });

    res.json({ tasks });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);
    res.status(500).json({ message: "Erreur récupération tâches" });
  }
};

// POST /conversations/:id/tasks
// POST /conversations/:id/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, dueDate, projectId } = req.body;
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Titre requis" });
    }

    const task = await Task.create({
      title: title.trim(),
      conversationId: id,
      createdBy: req.user._id,
      status: "todo",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: projectId || null, 
    });

    const populatedTask = await task.populate("createdBy", "name");

    res.status(201).json({ task: populatedTask });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur création tâche" });
  }
};



// PATCH /tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "ID tâche invalide" });

    const task = await Task.findByIdAndUpdate(taskId, req.body, { new: true })
      .populate("createdBy", "name");

    res.json({ task });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur mise à jour tâche" });
  }
};

// DELETE /tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "ID tâche invalide" });

    await Task.findByIdAndDelete(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur suppression tâche" });
  }
};
