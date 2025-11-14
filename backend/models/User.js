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
      enum: ['registration', 'login', 'password-reset'], // 🆕 Ajouté password-reset
      default: 'registration' 
    }, // Type de vérification
    
    // 🆕 CHAMPS POUR LA RÉINITIALISATION DU MOT DE PASSE
    resetPasswordCode: { type: String }, // Code de réinitialisation
    resetPasswordExpires: { type: Date }, // Expiration du code (15 min)
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);