const User = require("../models/User");

// Récupérer le profil
const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status, // 🔥 AJOUT ICI
      profilePicture: user.profilePicture || ""
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Mettre à jour le profil
const updateUserProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    // 🔥 Mise à jour des champs
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.status = req.body.status || user.status; // 🔥 AJOUT IMPORTANT

    // 🔥 Mise à jour de la photo
    if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      status: updatedUser.status,
      profilePicture: updatedUser.profilePicture
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

module.exports = { getUserProfile, updateUserProfile };
