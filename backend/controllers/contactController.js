// controllers/contactController.js
const Contact = require('../models/Contact');
const User = require('../models/User');
const mongoose = require("mongoose");

// 📌 Récupérer tous les contacts d'un utilisateur
exports.getMyContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const contacts = await Contact.find({ 
      owner: userId,
      isBlocked: false 
    })
      .populate('contact', 'name email profilePicture status isOnline')
      .sort({  addedAt: -1 }); // Favoris en premier

    res.json({
      success: true,
      contacts: contacts.map(c => ({
        _id: c._id,
        user: c.contact,
        customName: c.customName,
        notes: c.notes,
        isFavorite: c.isFavorite,
        addedAt: c.addedAt
      }))
    });
  } catch (error) {
    console.error('Erreur getMyContacts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


exports.addContact = async (req, res) => {
  try {
    const { owner, contact } = req.body;

    if (!owner || !contact)
      return res.status(400).json({ message: "owner and contact are required" });

    if (owner === contact)
      return res.status(400).json({ message: "You cannot add yourself" });

    // 1. Check users exist
    const ownerUser = await User.findById(owner);
    const contactUser = await User.findById(contact);

    if (!ownerUser || !contactUser)
      return res.status(404).json({ message: "User not found" });

    // 2. Check if already exist
    const alreadyExists = await Contact.findOne({ owner, contact });
    if (alreadyExists)
      return res.status(409).json({ message: "Contact already exists" });

    // 3. Create conversation ID
    const conversationId = new mongoose.Types.ObjectId();

    // 4. Save contact
    const newContact = new Contact({
      owner,
      contact,
      conversation: conversationId,
      isFavorite: false,
      isBlocked: false
    });

    const saved = await newContact.save();

    res.status(201).json({
      message: "Contact added",
      contact: saved
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// 📌 Supprimer un contact
exports.deleteContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    // Supprimer la relation dans les DEUX sens
    await Contact.deleteOne({ owner: userId, contact: contactId });
    await Contact.deleteOne({ owner: contactId, contact: userId });

    res.json({
      success: true,
      message: 'Contact supprimé'
    });
  } catch (error) {
    console.error('Erreur deleteContact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// 📌 Marquer un contact comme favori
exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    const contact = await Contact.findOne({
      owner: userId,
      contact: contactId
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    contact.isFavorite = !contact.isFavorite;
    await contact.save();

    await contact.populate('contact', 'name email profilePicture status isOnline');

    res.json({
      success: true,
      contact: {
        _id: contact._id,
        user: contact.contact,
        customName: contact.customName,
        isFavorite: contact.isFavorite,
        addedAt: contact.addedAt
      }
    });
  } catch (error) {
    console.error('Erreur toggleFavorite:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// 📌 Modifier le nom personnalisé d'un contact
exports.updateCustomName = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;
    const { customName } = req.body;

    const contact = await Contact.findOne({
      owner: userId,
      contact: contactId
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    contact.customName = customName || null;
    await contact.save();

    await contact.populate('contact', 'name email profilePicture status isOnline');

    res.json({
      success: true,
      contact: {
        _id: contact._id,
        user: contact.contact,
        customName: contact.customName,
        isFavorite: contact.isFavorite,
        addedAt: contact.addedAt
      }
    });
  } catch (error) {
    console.error('Erreur updateCustomName:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// 📌 Bloquer un contact
exports.blockContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.params;

    const contact = await Contact.findOne({
      owner: userId,
      contact: contactId
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    contact.isBlocked = true;
    await contact.save();

    res.json({
      success: true,
      message: 'Contact bloqué'
    });
  } catch (error) {
    console.error('Erreur blockContact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};