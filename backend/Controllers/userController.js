const Users = require("../models/Users");

// 📌 Récupérer un utilisateur par ID
exports.getUser = async (req, res) => {
  try {
    const user = await Users.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.json(user);
  } catch (err) {
    console.error("Erreur getUser :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Récupérer le dernier utilisateur ajouté
exports.getLastUser = async (req, res) => {
  try {
    const user = await Users.findOne().sort({ _id: -1 }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }
    res.json(user);
  } catch (err) {
    console.error("Erreur getLastUser :", err);
    res.status(500).json({ message: err.message });
  }
};

// 📌 Mettre à jour un utilisateur /:id
exports.updateUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, phoneNumber, profilePicture, statusMessage } = req.body;

    const user = await Users.findByIdAndUpdate(
      userId,
      { username, email, phoneNumber, profilePicture, statusMessage },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Erreur updateUserById :", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};
