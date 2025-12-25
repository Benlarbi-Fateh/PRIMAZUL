const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskList", required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
