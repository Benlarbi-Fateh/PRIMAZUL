const PersonalTask = require("../models/PersonalTask");
const PersonalTaskList = require("../models/PersonalTaskList");

// =================== LISTES ===================

// GET /personal-tasks/lists
exports.getLists = async (req, res) => {
  try {
    const userId = req.user._id;

    let lists = await PersonalTaskList.find({ userId })
      .sort({ order: 1 })
      .lean();

    // Si pas de liste, créer une liste par défaut
    if (lists.length === 0) {
      const defaultList = await PersonalTaskList.create({
        userId,
        title: "Ma Liste",
        icon: "📋",
        color: "#3B82F6",
        isDefault: true,
        order: 0,
      });
      lists = [defaultList.toObject()];
    }

    // Ajouter le compteur de tâches pour chaque liste
    const listsWithCount = await Promise.all(
      lists.map(async (list) => {
        const taskCount = await PersonalTask.countDocuments({
          listId: list._id,
          completed: false,
        });
        return { ...list, taskCount };
      }),
    );

    res.json({ success: true, lists: listsWithCount });
  } catch (error) {
    console.error("GET LISTS ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /personal-tasks/lists
exports.createList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, icon, color } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Titre requis" });
    }

    // Obtenir le prochain ordre
    const lastList = await PersonalTaskList.findOne({ userId }).sort({
      order: -1,
    });
    const order = lastList ? lastList.order + 1 : 0;

    const list = await PersonalTaskList.create({
      userId,
      title: title.trim(),
      icon: icon || "📋",
      color: color || "#3B82F6",
      order,
    });

    res
      .status(201)
      .json({ success: true, list: { ...list.toObject(), taskCount: 0 } });
  } catch (error) {
    console.error("CREATE LIST ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// PATCH /personal-tasks/lists/:listId
exports.updateList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listId } = req.params;
    const updates = req.body;

    const list = await PersonalTaskList.findOneAndUpdate(
      { _id: listId, userId },
      updates,
      { new: true },
    );

    if (!list) {
      return res.status(404).json({ message: "Liste introuvable" });
    }

    res.json({ success: true, list });
  } catch (error) {
    console.error("UPDATE LIST ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// DELETE /personal-tasks/lists/:listId
exports.deleteList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listId } = req.params;

    // Vérifier si c'est la liste par défaut
    const list = await PersonalTaskList.findOne({ _id: listId, userId });
    if (!list) {
      return res.status(404).json({ message: "Liste introuvable" });
    }

    if (list.isDefault) {
      return res
        .status(400)
        .json({ message: "Impossible de supprimer la liste par défaut" });
    }

    // Supprimer toutes les tâches de cette liste
    await PersonalTask.deleteMany({ listId });

    // Supprimer la liste
    await PersonalTaskList.findByIdAndDelete(listId);

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE LIST ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// =================== TÂCHES ===================

// GET /personal-tasks
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listId, completed } = req.query;

    const query = { userId };

    if (listId) {
      query.listId = listId;
    }

    if (completed !== undefined) {
      query.completed = completed === "true";
    }

    const tasks = await PersonalTask.find(query)
      .populate("listId", "title icon color")
      .sort({ completed: 1, order: 1, createdAt: -1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /personal-tasks/today
exports.getTodayTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await PersonalTask.find({
      userId,
      completed: false,
      dueDate: { $gte: today, $lt: tomorrow },
    })
      .populate("listId", "title icon color")
      .sort({ priority: -1, dueDate: 1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("GET TODAY TASKS ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /personal-tasks/upcoming
exports.getUpcomingTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + parseInt(days));

    const tasks = await PersonalTask.find({
      userId,
      completed: false,
      dueDate: { $gte: today, $lte: endDate },
    })
      .populate("listId", "title icon color")
      .sort({ dueDate: 1, priority: -1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("GET UPCOMING TASKS ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /personal-tasks/starred
exports.getStarredTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    const tasks = await PersonalTask.find({
      userId,
      isStarred: true,
      completed: false,
    })
      .populate("listId", "title icon color")
      .sort({ dueDate: 1, priority: -1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("GET STARRED TASKS ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /personal-tasks/overdue
exports.getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await PersonalTask.find({
      userId,
      completed: false,
      dueDate: { $lt: today },
    })
      .populate("listId", "title icon color")
      .sort({ dueDate: 1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (error) {
    console.error("GET OVERDUE TASKS ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /personal-tasks
exports.createTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listId, title, description, priority, dueDate, isStarred } =
      req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Titre requis" });
    }

    // Vérifier que la liste existe
    let targetListId = listId;

    if (!targetListId) {
      // Utiliser la liste par défaut
      let defaultList = await PersonalTaskList.findOne({
        userId,
        isDefault: true,
      });

      if (!defaultList) {
        defaultList = await PersonalTaskList.create({
          userId,
          title: "Ma Liste",
          icon: "📋",
          color: "#3B82F6",
          isDefault: true,
          order: 0,
        });
      }

      targetListId = defaultList._id;
    }

    // Obtenir le prochain ordre
    const lastTask = await PersonalTask.findOne({ listId: targetListId }).sort({
      order: -1,
    });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await PersonalTask.create({
      userId,
      listId: targetListId,
      title: title.trim(),
      description: description?.trim() || "",
      priority: priority || "normal",
      dueDate: dueDate || null,
      isStarred: isStarred || false,
      order,
    });

    const populatedTask = await PersonalTask.findById(task._id)
      .populate("listId", "title icon color")
      .lean();

    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// GET /personal-tasks/:taskId
exports.getTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    const task = await PersonalTask.findOne({ _id: taskId, userId })
      .populate("listId", "title icon color")
      .lean();

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error("GET TASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// PATCH /personal-tasks/:taskId
exports.updateTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    const updates = req.body;

    // Si on marque comme terminé, ajouter la date
    if (updates.completed === true) {
      updates.completedAt = new Date();
    } else if (updates.completed === false) {
      updates.completedAt = null;
    }

    const task = await PersonalTask.findOneAndUpdate(
      { _id: taskId, userId },
      updates,
      { new: true },
    ).populate("listId", "title icon color");

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// DELETE /personal-tasks/:taskId
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    const task = await PersonalTask.findOneAndDelete({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /personal-tasks/:taskId/complete
exports.completeTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    const task = await PersonalTask.findOneAndUpdate(
      { _id: taskId, userId },
      { completed: true, completedAt: new Date() },
      { new: true },
    ).populate("listId", "title icon color");

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error("COMPLETE TASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// POST /personal-tasks/:taskId/reopen
exports.reopenTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;

    const task = await PersonalTask.findOneAndUpdate(
      { _id: taskId, userId },
      { completed: false, completedAt: null },
      { new: true },
    ).populate("listId", "title icon color");

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    res.json({ success: true, task });
  } catch (error) {
    console.error("REOPEN TASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// =================== SOUS-TÂCHES ===================

// POST /personal-tasks/:taskId/subtasks
exports.addSubtask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Texte requis" });
    }

    const task = await PersonalTask.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    task.subtasks.push({ text: text.trim(), completed: false });
    await task.save();

    const newSubtask = task.subtasks[task.subtasks.length - 1];

    res.status(201).json({ success: true, subtask: newSubtask });
  } catch (error) {
    console.error("ADD SUBTASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// PATCH /personal-tasks/:taskId/subtasks/:subtaskId
exports.updateSubtask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId, subtaskId } = req.params;
    const { text, completed } = req.body;

    const task = await PersonalTask.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
      return res.status(404).json({ message: "Sous-tâche introuvable" });
    }

    if (text !== undefined) subtask.text = text;
    if (completed !== undefined) subtask.completed = completed;

    await task.save();

    res.json({ success: true, subtask });
  } catch (error) {
    console.error("UPDATE SUBTASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// DELETE /personal-tasks/:taskId/subtasks/:subtaskId
exports.deleteSubtask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId, subtaskId } = req.params;

    const task = await PersonalTask.findOneAndUpdate(
      { _id: taskId, userId },
      { $pull: { subtasks: { _id: subtaskId } } },
      { new: true },
    );

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE SUBTASK ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// =================== STATISTIQUES ===================

// GET /personal-tasks/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, completed, pending, overdue, starred] = await Promise.all([
      PersonalTask.countDocuments({ userId }),
      PersonalTask.countDocuments({ userId, completed: true }),
      PersonalTask.countDocuments({ userId, completed: false }),
      PersonalTask.countDocuments({
        userId,
        completed: false,
        dueDate: { $lt: today },
      }),
      PersonalTask.countDocuments({
        userId,
        isStarred: true,
        completed: false,
      }),
    ]);

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        overdue,
        starred,
        completionRate,
      },
    });
  } catch (error) {
    console.error("GET STATS ERROR:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
