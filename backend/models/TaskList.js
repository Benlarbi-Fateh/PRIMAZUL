const mongoose = require("mongoose");

const taskListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
}, { timestamps: true });

// Export du modèle
module.exports = mongoose.model("TaskList", taskListSchema);
