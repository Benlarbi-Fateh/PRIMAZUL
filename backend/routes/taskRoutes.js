// routes/taskRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const taskController = require("../controllers/taskController");

// Tasks
router.get("/conversations/:id/tasks", authMiddleware, taskController.getTasks);
router.post(
  "/conversations/:id/tasks",
  authMiddleware,
  taskController.createTask,
);

router.patch("/tasks/:id", authMiddleware, taskController.updateTask);
router.delete("/tasks/:id", authMiddleware, taskController.deleteTask);

// ✅ Route spécifique pour changer le statut (drag & drop)
router.post("/tasks/:id/status", authMiddleware, taskController.changeStatus);

// Comments
router.post("/tasks/:id/comments", authMiddleware, taskController.addComment);

// Projects
router.get(
  "/conversations/:id/projects",
  authMiddleware,
  taskController.getProjects,
);
router.post(
  "/conversations/:id/projects",
  authMiddleware,
  taskController.createProject,
);
router.delete(
  "/conversations/:conversationId/projects/:projectId",
  authMiddleware,
  taskController.deleteProject,
);

module.exports = router;
