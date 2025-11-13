const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "" },
    status: { type: String, default: "Hey there! I'm using WhatsApp" },
    isOnline: { type: Boolean, default: false },
    
    // 🆕 CHAMPS POUR LA DOUBLE AUTHENTIFICATION
    isVerified: { type: Boolean, default: false }, // Compte vérifié ou non
    verificationCode: { type: String }, // Code de vérification
    verificationCodeExpiry: { type: Date }, // Expiration du code (10 min)
    verificationCodeType: { 
      type: String, 
      enum: ['registration', 'login'], 
      default: 'registration' 
    }, // Type de vérification
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);