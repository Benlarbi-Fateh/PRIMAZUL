// backend/models/Task.js
const mongoose = require("mongoose");

// Schéma pour les commentaires DANS la tâche
const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 🆕 Ajout des mentions possibles
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const subtaskSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { _id: true },
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["todo", "inProgress", "done", "validated"], // 🆕 Ajout de 'validated'
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    dueDate: { type: Date, default: null },

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

    // 🆕 HIERARCHIE
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Créateur
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Chef de cette tâche
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Exécutants

    subtasks: [subtaskSchema],
    comments: [commentSchema], // 🆕 Chat interne à la tâche

    // Pour l'ordre d'affichage (Drag & Drop)
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
