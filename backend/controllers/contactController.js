// controllers/contactController.js
const Contact = require('../models/Contact');
const User = require('../models/User');

// 📌 Récupérer tous les contacts d'un utilisateur
exports.getMyContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const contacts = await Contact.find({ 
      owner: userId,
      isBlocked: false 
    })
      .populate('contact', 'name email profilePicture status isOnline')
      .sort({ isFavorite: -1, addedAt: -1 }); // Favoris en premier

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

// 📌 Ajouter un contact (utilisé automatiquement après acceptation d'invitation)
exports.addContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contactId } = req.body;

    // Vérifier que le contact existe
    const contactUser = await User.findById(contactId);
    if (!contactUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si le contact existe déjà
    const existingContact = await Contact.findOne({
      owner: userId,
      contact: contactId
    });

    if (existingContact) {
      return res.status(400).json({ error: 'Contact déjà ajouté' });
    }

    // Créer le contact pour les DEUX utilisateurs (relation réciproque)
    const contact1 = await Contact.create({
      owner: userId,
      contact: contactId
    });

    const contact2 = await Contact.create({
      owner: contactId,
      contact: userId
    });

    // Populate pour renvoyer les infos complètes
    await contact1.populate('contact', 'name email profilePicture status isOnline');

    res.status(201).json({
      success: true,
      contact: {
        _id: contact1._id,
        user: contact1.contact,
        customName: contact1.customName,
        isFavorite: contact1.isFavorite,
        addedAt: contact1.addedAt
      }
    });
  } catch (error) {
    console.error('Erreur addContact:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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