const mongoose = require("mongoose");

// Schéma pour les sous-tâches
const subtaskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true, timestamps: true },
);

// Schéma principal
const personalTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonalTaskList",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    subtasks: [subtaskSchema],
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Index pour les requêtes fréquentes
personalTaskSchema.index({ userId: 1, listId: 1, order: 1 });
personalTaskSchema.index({ userId: 1, completed: 1 });
personalTaskSchema.index({ userId: 1, dueDate: 1 });
personalTaskSchema.index({ userId: 1, isStarred: 1 });

module.exports = mongoose.model("PersonalTask", personalTaskSchema);
