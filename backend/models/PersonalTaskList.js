const mongoose = require("mongoose");

const personalTaskListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    icon: {
      type: String,
      default: "📋",
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    order: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Index pour performance
personalTaskListSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model("PersonalTaskList", personalTaskListSchema);
