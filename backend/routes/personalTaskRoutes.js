const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/personalTaskController");

// =================== LISTES ===================
router.get("/lists", authMiddleware, controller.getLists);
router.post("/lists", authMiddleware, controller.createList);
router.patch("/lists/:listId", authMiddleware, controller.updateList);
router.delete("/lists/:listId", authMiddleware, controller.deleteList);

// =================== STATISTIQUES ===================
router.get("/stats", authMiddleware, controller.getStats);

// =================== VUES SPÉCIALES ===================
router.get("/today", authMiddleware, controller.getTodayTasks);
router.get("/upcoming", authMiddleware, controller.getUpcomingTasks);
router.get("/starred", authMiddleware, controller.getStarredTasks);
router.get("/overdue", authMiddleware, controller.getOverdueTasks);

// =================== TÂCHES ===================
router.get("/", authMiddleware, controller.getTasks);
router.post("/", authMiddleware, controller.createTask);
router.get("/:taskId", authMiddleware, controller.getTask);
router.patch("/:taskId", authMiddleware, controller.updateTask);
router.delete("/:taskId", authMiddleware, controller.deleteTask);

// Actions spécifiques
router.post("/:taskId/complete", authMiddleware, controller.completeTask);
router.post("/:taskId/reopen", authMiddleware, controller.reopenTask);

// =================== SOUS-TÂCHES ===================
router.post("/:taskId/subtasks", authMiddleware, controller.addSubtask);
router.patch(
  "/:taskId/subtasks/:subtaskId",
  authMiddleware,
  controller.updateSubtask,
);
router.delete(
  "/:taskId/subtasks/:subtaskId",
  authMiddleware,
  controller.deleteSubtask,
);

module.exports = router;
