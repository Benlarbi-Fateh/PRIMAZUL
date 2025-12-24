const express = require("express");
const router = express.Router();
const TaskList = require("../models/TaskList");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, async (req, res) => {
  const lists = await TaskList.find({ userId: req.user.id });
  res.json(lists);
});

router.post("/", auth, async (req, res) => {
  const list = await TaskList.create({
    userId: req.user.id,
    title: req.body.title,
  });
  res.json(list);
});

module.exports = router;
