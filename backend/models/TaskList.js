const mongoose = require("mongoose");

const taskListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
});

module.exports = mongoose.model("TaskList", taskListSchema);
