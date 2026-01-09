const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const taskController = require("../controllers/taskController");

// Routes des tâches
router.get("/conversations/:id/tasks", authMiddleware, taskController.getTasksByConversation);
router.post("/conversations/:id/tasks", authMiddleware, taskController.createTask);
router.patch("/tasks/:id", authMiddleware, taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, taskController.deleteTask);
/* ================= COMMENTS ================= */
router.post(
  "/tasks/:id/comments",
  authMiddleware,
  taskController.addComment
);

module.exports = router;
