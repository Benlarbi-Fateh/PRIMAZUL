const express = require("express");
const router = express.Router();
const { addContact } = require("../controllers/contactController");

// AVANT : router.post("/add", auth, addContact);
// MAINTENANT : pas de middleware auth
router.post("/add", addContact);

module.exports = router;
