const express = require("express");
const router = express.Router();
const Status = require("../models/Status");
const User = require("../models/User");
const Contact = require("../models/Contact");
const auth = require("../middleware/authMiddleware");

// 🆕 Créer un statut
router.post("/", auth, async (req, res) => {
  try {
    const { type, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Le contenu est requis" });
    }

    const status = new Status({
      userId: req.user.id,
      type: type || "text",
      content: content.trim()
    });

    await status.save();
    await status.populate("userId", "name profilePicture");

    res.status(201).json(status);
  } catch (error) {
    console.error("Erreur création statut:", error);
    res.status(500).json({ error: "Erreur lors de la création du statut" });
  }
});

// 🆕 Voir les statuts de mes contacts + mes statuts
router.get("/friends", auth, async (req, res) => {
  try {
    console.log('🔍 Récupération statuts pour user:', req.user.id);
    
    // 1. Récupérer mes contacts depuis le modèle Contact
    const myContacts = await Contact.find({ 
      owner: req.user.id,
      isBlocked: false // Exclure les contacts bloqués
    }).select('contact');
    
    console.log('👥 Mes contacts:', myContacts.length);

    // 2. IDs des personnes dont je peux voir les statuts
    const contactIds = myContacts.map(contact => contact.contact);
    const allowedUserIds = [req.user.id, ...contactIds]; // Moi + mes contacts

    console.log('🎯 IDs autorisés:', allowedUserIds);

    // 3. Récupérer les statuts non expirés
    const statuses = await Status.find({
      userId: { $in: allowedUserIds },
      expiresAt: { $gt: new Date() }
    })
    .populate("userId", "name profilePicture")
    .populate("views.userId", "name profilePicture")
    .sort({ createdAt: -1 });

    console.log('✅ Statuts trouvés:', statuses.length);
    
    res.json(statuses);
  } catch (error) {
    console.error("❌ Erreur récupération statuts:", error);
    res.status(500).json({ 
      error: "Erreur lors de la récupération des statuts",
      details: error.message 
    });
  }
});

// 🆕 Marquer un statut comme vu
router.post("/:id/view", auth, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    // Vérifier si l'utilisateur est autorisé à voir ce statut
    const isOwner = status.userId.toString() === req.user.id;
    const isContact = await Contact.exists({
      owner: status.userId,
      contact: req.user.id,
      isBlocked: false
    });

    if (!isOwner && !isContact) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const alreadyViewed = status.views.some(
      view => view.userId.toString() === req.user.id
    );

    if (!alreadyViewed) {
      status.views.push({
        userId: req.user.id,
        viewedAt: new Date()
      });
      await status.save();
    }

    res.json({ message: "Statut marqué comme vu" });
  } catch (error) {
    console.error("Erreur marquage vue:", error);
    res.status(500).json({ error: "Erreur lors du marquage du statut" });
  }
});

// 🆕 Récupérer les vues d'un statut (pour mes propres statuts)
router.get("/:id/views", auth, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id)
      .populate("views.userId", "name profilePicture");
    
    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    // Vérifier que l'utilisateur est le propriétaire du statut
    if (status.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.json({
      views: status.views,
      totalViews: status.views.length
    });
  } catch (error) {
    console.error("Erreur récupération vues:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des vues" });
  }
});

// 🆕 Récupérer mes propres statuts
router.get("/my-status", auth, async (req, res) => {
  try {
    const statuses = await Status.find({
      userId: req.user.id,
      expiresAt: { $gt: new Date() }
    })
    .populate("userId", "name profilePicture")
    .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (error) {
    console.error("Erreur récupération statuts:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des statuts" });
  }
});

// 🆕 Supprimer un statut
router.delete("/:id", auth, async (req, res) => {
  try {
    const status = await Status.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!status) {
      return res.status(404).json({ error: "Statut non trouvé" });
    }

    res.json({ message: "Statut supprimé avec succès" });
  } catch (error) {
    console.error("Erreur suppression statut:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du statut" });
  }
});

module.exports = router;