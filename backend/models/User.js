const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Informations de base
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, default: "" },

    // Informations de profil étendues
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    bio: {
      type: String,
      default: "Hey there! I'm using PrimAzul 💬",
      maxlength: 150,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    // Statut et présence - ⚠️ CORRECTION : Enlever les doublons
    status: { type: String, default: "Hey there! I'm using PrimAzul" },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },

    // 🆕 AJOUT : Dernière connexion pour le 2FA temporisé
    lastLogin: {
      type: Date,
      default: Date.now,
    },

    // Paramètres de confidentialité
    privacySettings: {
      showOnlineStatus: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      showProfilePicture: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      showLastSeen: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      whoCanMessageMe: {
        type: String,
        enum: ["everyone", "contacts"],
        default: "everyone",
      },
    },

    // Statistiques utilisateur
    stats: {
      messagesCount: { type: Number, default: 0 },
      contactsCount: { type: Number, default: 0 },
      groupsCount: { type: Number, default: 0 },
    },

    // Préférences
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      language: {
        type: String,
        enum: ["fr", "en", "ar"],
        default: "fr",
      },
      notifications: {
        sound: { type: Boolean, default: true },
        desktop: { type: Boolean, default: true },
        messagePreview: { type: Boolean, default: true },
      },
    },

    // Double authentification
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiry: { type: Date },
    verificationCodeType: {
      type: String,
      enum: ["registration", "login", "password-reset", "change-password"],
      default: "registration",
    },

    // Réinitialisation mot de passe
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },

    // 🔥 Champs ajoutés pour changement d'email
    pendingEmail: { type: String },
    emailVerificationCode: { type: String },
    emailCodeExpires: { type: Date },
    
    // ⭐ AJOUTEZ CE CHAMP POUR LES STATUS
    statuses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status'
    }],
    
    // ⭐ AJOUTEZ CE CHAMP POUR LES AMIS/CONTACTS
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ name: "text" });

// ⭐ AJOUTEZ CES MÉTHODES UTILES
userSchema.methods.isContact = function(otherUserId) {
  return this.friends.some(friendId => 
    friendId.toString() === otherUserId.toString()
  );
};

userSchema.methods.addFriend = async function(friendId) {
  if (!this.friends.includes(friendId)) {
    this.friends.push(friendId);
    await this.save();
  }
};

userSchema.methods.removeFriend = async function(friendId) {
  this.friends = this.friends.filter(id => 
    id.toString() !== friendId.toString()
  );
  await this.save();
};

module.exports = mongoose.model("User", userSchema);