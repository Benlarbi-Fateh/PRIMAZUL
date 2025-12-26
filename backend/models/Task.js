const mongoose = require("mongoose");

/* ===== Comment Schema ===== */
const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);


/* ===== Task Schema ===== */
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: {
    type: String,
     default: "",
    trim: true,
    },
    comments: [commentSchema],


    conversationId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Conversation" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    assignees: [
     {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    },
    ],

    status: { type: String, enum: ["todo", "inProgress", "done"], default: "todo" },
    important: { type: Boolean, default: false },
    priority: {
         type: String,
     enum: ["low", "normal", "urgent"],
    default: "normal",
    },

    dueDate: { type: Date, default: null },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
