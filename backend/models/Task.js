const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskList" },
  text: String,
  completed: { type: Boolean, default: false },
});

module.exports = mongoose.model("Task", taskSchema);
