const Contact = require("../models/Contacts");

exports.addContact = async (req, res) => {
  try {
    const { ownerId, contactUserId, nickname } = req.body;

    // Vérifie que tous les champs sont là
    if (!ownerId || !contactUserId) {
      return res.status(400).json({ message: "ownerId et contactUserId requis" });
    }

    // Crée le contact
    const contact = new Contact({
      ownerId,
      contactUserId,
      nickname: nickname || ""
    });

    await contact.save();
    res.status(201).json(contact);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Contact déjà ajouté" });
    }
    res.status(500).json({ message: err.message });
  }
};
