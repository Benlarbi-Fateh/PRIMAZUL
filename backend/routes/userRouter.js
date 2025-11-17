const express = require("express");
const router = express.Router();
const { getUsers, getUserById } = require("../controllers/userController");

// Route: GET /api/users
router.get("/", getUsers);

// Route: GET /api/users/:id
router.get("/:id", getUserById);

module.exports = router;