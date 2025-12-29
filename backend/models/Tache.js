const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // ✅ Vérifiez que userId est bien là
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskList",
      required: true,
    },
    text: { type: String, required: true },
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    startTime: { type: Date },
    endTime: { type: Date },
    isAllDay: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
