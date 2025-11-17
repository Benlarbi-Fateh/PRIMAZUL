const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phoneNumber: String,
  email: { type: String, unique: true },
  password: String,
  profilePicture: String,
  lastSeen: String,
  isOnline: Boolean,
  statusMessage: String,
  dateDinscription: String
});

module.exports = mongoose.model("user", userSchema);
