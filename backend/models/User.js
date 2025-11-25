const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "" },
    status: { type: String, default: "Hey there! I'm using WhatsApp" },
    isOnline: { type: Boolean, default: false },

    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiry: { type: Date },
    verificationCodeType: {
      type: String,
      enum: ["registration", "login", "password-reset"],
      default: "registration",
    },

    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },

    // 🔥 Champs ajoutés pour changement d’email
    pendingEmail: { type: String },
    emailVerificationCode: { type: String },
    emailCodeExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
