const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // utiliser bcrypt de manière cohérente

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  phoneNumber: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  statusMessage: { type: String, default: "Disponible" },
  dateInscription: { type: Date, default: Date.now }
});

// Hasher le mot de passe avant save
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("Users", userSchema);
