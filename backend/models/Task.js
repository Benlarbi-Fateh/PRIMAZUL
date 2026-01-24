const mongoose = require("mongoose");

// Schéma pour l'historique des modifications
const historyEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["created", "updated", "statusChanged", "assigned", "commented"],
      required: true,
    },
    field: String, // Champ modifié (pour "updated")
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Schéma pour les commentaires
const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// Schéma pour les sous-tâches
const subtaskSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Schéma principal des tâches
const taskSchema = new mongoose.Schema(
  {
    // Informations de base
    title: {
      type: String,
      required: [true, "Le titre est requis"],
      trim: true,
      maxlength: [200, "Le titre ne peut pas dépasser 200 caractères"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "La description ne peut pas dépasser 2000 caractères"],
      default: "",
    },

    // Statut et priorité
    status: {
      type: String,
      enum: ["todo", "inProgress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "urgent"],
      default: "normal",
    },

    // Dates
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // Relations
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    // Utilisateurs
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Watchers = personnes qui reçoivent les notifications
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Contenu
    subtasks: [subtaskSchema],
    comments: [commentSchema],

    // Métadonnées
    tags: [{ type: String, trim: true }],
    isImportant: { type: Boolean, default: false },

    // Historique des modifications
    history: [historyEntrySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index composés pour les performances
taskSchema.index({ conversationId: 1, status: 1 });
taskSchema.index({ conversationId: 1, projectId: 1 });
taskSchema.index({ conversationId: 1, dueDate: 1 });
taskSchema.index({ assignees: 1, status: 1 });

// Virtuals
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === "done") return false;
  return new Date(this.dueDate) < new Date();
});

taskSchema.virtual("subtaskProgress").get(function () {
  if (!this.subtasks || this.subtasks.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const completed = this.subtasks.filter((s) => s.completed).length;
  const total = this.subtasks.length;
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
});

// Middleware pre-save pour ajouter l'historique
taskSchema.pre("save", function (next) {
  if (this.isNew) {
    this.history.push({
      action: "created",
      performedBy: this.createdBy,
    });

    // Le créateur est automatiquement watcher
    if (!this.watchers.includes(this.createdBy)) {
      this.watchers.push(this.createdBy);
    }
  }

  // Marquer completedAt quand le statut passe à "done"
  if (
    this.isModified("status") &&
    this.status === "done" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }

  // Réinitialiser completedAt si on rouvre la tâche
  if (this.isModified("status") && this.status !== "done") {
    this.completedAt = null;
  }

  next();
});

// Méthode pour ajouter à l'historique
taskSchema.methods.addToHistory = function (
  action,
  field,
  oldValue,
  newValue,
  userId,
) {
  this.history.push({
    action,
    field,
    oldValue,
    newValue,
    performedBy: userId,
  });
};

// Méthode statique pour obtenir les statistiques
taskSchema.statics.getStats = async function (
  conversationId,
  projectId = null,
) {
  const match = { conversationId: new mongoose.Types.ObjectId(conversationId) };
  if (projectId) {
    match.projectId = new mongoose.Types.ObjectId(projectId);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    todo: 0,
    inProgress: 0,
    done: 0,
    total: 0,
    overdue: 0,
  };

  stats.forEach((s) => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  // Compter les tâches en retard
  const overdueCount = await this.countDocuments({
    ...match,
    status: { $ne: "done" },
    dueDate: { $lt: new Date() },
  });

  result.overdue = overdueCount;
  result.progress =
    result.total > 0 ? Math.round((result.done / result.total) * 100) : 0;

  return result;
};

module.exports = mongoose.model("Task", taskSchema);
