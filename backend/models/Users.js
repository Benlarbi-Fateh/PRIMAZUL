import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, 
              required: true },
  phoneNumber: { type: String },
  email: { type: String, 
            required: true, 
            unique: true },
  password: { type: String, 
            required: true },
  profilePicture: { type: String, 
            default: "" },
  lastSeen: { type: Date, 
            default: Date.now },
  isOnline: { type: Boolean, 
            default: false },
  statusMessage: { type: String, 
            default: "Disponible" },
  dateInscription: { type: Date, 
            default: Date.now } 
});

// Avant de sauvegarder l’utilisateur, hasher le mot de passe
userSchema.pre("save", async function(next) 
{
  if (!this.isModified("password")) return next();
  const bcrypt = await import("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("Users", userSchema);
