const express = require("express");
const router = express.Router();
const userController = require("../Controllers/userController");
const upload = require("../middleware/upload"); // multer

// Routes avec logique séparée
router.get("/", userController.getUser);
router.put("/", upload.single("profilePicture"), userController.updateUser);

module.exports = router;
