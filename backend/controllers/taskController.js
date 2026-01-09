const mongoose = require("mongoose");
const Task = require("../models/Task");
const Conversation = require("../models/Conversation");

// ================= GET TASKS =================
exports.getTasksByConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "ID conversation invalide" });
    }

    const tasks = await Task.find({ conversationId })
      .populate("createdBy", "name avatar")
      .populate("assignees", "name avatar")
      .populate("responsible", "name avatar")
      .sort({ createdAt: 1 });

    res.json({ tasks });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);
    res.status(500).json({ message: "Erreur récupération tâches" });
  }
};

// ================= CREATE TASK =================
exports.createTask = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    const participantIds = conversation.participants.map(p => p.toString());

    const {
      title,
      description,
      priority,
      dueDate,
      status,
      projectId,
      important,
      assignees,
      responsible,
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ message: "Titre requis" });

    if (!priority)
      return res.status(400).json({ message: "Priorité requise" });

    if (!dueDate)
      return res.status(400).json({ message: "Date limite requise" });

    if (!assignees.map(a => a.toString()).includes(responsible.toString())) {
  return res.status(400).json({
    message: "Le responsable doit être parmi les assignés",
  });
}

    if (!responsible)
      return res.status(400).json({ message: "Responsable requis" });

    if (!assignees.includes(responsible)) {
      return res.status(400).json({
        message: "Le responsable doit être parmi les assignés",
      });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      priority,
      dueDate: new Date(dueDate),
      status: status || "todo",
      important: !!important,
      assignees,
      responsible,
      conversationId,
      createdBy: userId,
      projectId: projectId || null,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name avatar")
      .populate("assignees", "name avatar")
      .populate("responsible", "name avatar")

    res.status(201).json({ task: populatedTask });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur création tâche" });
  }
};

// ================= UPDATE TASK =================
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const update = req.body;

    console.log("📥 Mise à jour reçue :", update);

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "ID tâche invalide" });
    }

    // ✅ FIX : Nettoyer assignees si présent
    if (update.assignees) {
      update.assignees = update.assignees.map(a => {
        // Si c'est un objet, extraire l'_id
        if (typeof a === "object" && a._id) {
          return mongoose.Types.ObjectId(a._id);
        }
        // Sinon convertir en ObjectId
        return mongoose.Types.ObjectId(a);
      });

      // ✅ Retirer les doublons
      update.assignees = [...new Set(update.assignees.map(id => id.toString()))]
        .map(id => mongoose.Types.ObjectId(id));

      console.log("✅ Assignés nettoyés :", update.assignees);
    }

    // ✅ Convertir responsible si présent
    if (update.responsible) {
      update.responsible = mongoose.Types.ObjectId(
        typeof update.responsible === "object" 
          ? update.responsible._id 
          : update.responsible
      );
    }

    const task = await Task.findByIdAndUpdate(taskId, update, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name avatar")
      .populate("assignees", "name avatar")
      .populate("responsible", "name avatar");
      
    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    console.log("✅ Tâche mise à jour :", task);

    res.json({ task });
  } catch (error) {
    console.error("❌ UPDATE TASK ERROR:", error);
    res.status(500).json({ 
      message: "Erreur mise à jour tâche",
      error: error.message 
    });
  }
};

// ================= DELETE TASK =================
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "ID tâche invalide" });
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur suppression tâche" });
  }
};

// ================= ADD COMMENT (✅ CORRIGÉ) =================
exports.addComment = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "ID tâche invalide" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ message: "Commentaire requis" });
    }

    const user = req.user;

    if (!user || !user._id || !user.name) {
      return res.status(400).json({ message: "Utilisateur invalide" });
    }

    //   Créer un objet author complet avec id ET name
    const comment = {
      text: text.trim(),
      author: {
        id: user._id,      
        name: user.name,   
      },
      createdAt: new Date(),
    };

    console.log("📤 Commentaire à ajouter :", comment);

    // Ajouter le commentaire
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $push: { comments: comment } },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    console.log("✅ Commentaire ajouté :", updatedTask.comments.at(-1));

    // Retourner le dernier commentaire ajouté
    res.status(201).json({
      comment: updatedTask.comments.at(-1),
    });
  } catch (error) {
    console.error("❌ ADD COMMENT ERROR:", error);
    res.status(500).json({ 
      message: "Erreur ajout commentaire",
      error: error.message 
    });
  }
};