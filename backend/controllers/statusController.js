// backend/controllers/statusController.js
const Status = require("../models/Status");
const Contact = require("../models/Contact");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const fs = require("fs");
const path = require("path");

// ============================================
// 📝 CRÉER UN STATUT
// ============================================
exports.createStatus = async (req, res) => {
  try {
    console.log("📝 ====== CRÉATION STATUT ======");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("User:", req.user);

    const { type, content, textStyle } = req.body;
    const userId = req.user._id || req.user.id || req.user.userId;

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    let statusData = {
      userId,
      type: type || "text",
      content: content || "",
      reactionsSummary: {
        "❤️": 0,
        "😂": 0,
        "😮": 0,
        "😢": 0,
        "😡": 0,
        "🔥": 0,
        "👏": 0,
        "👍": 0,
        total: 0,
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    if (type === "text" && textStyle) {
      statusData.textStyle = textStyle;
    }

    if (req.file) {
      statusData.mediaUrl = `/uploads/status/${req.file.filename}`;
    }

    const status = await Status.create(statusData);
    await status.populate("userId", "name username profilePicture");

    console.log("✅ Statut créé:", status._id);

    res.status(201).json({ success: true, status });
  } catch (error) {
    console.error("❌ Erreur création statut:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

// ============================================
// 📊 RÉCUPÉRER TOUS LES STATUTS
// ============================================
exports.getAllStatuses = async (req, res) => {
  try {
    console.log("📊 ====== GET ALL STATUSES ======");

    const userId = req.user._id || req.user.id || req.user.userId;
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    // Récupérer les contacts (avec gestion d'erreur si Contact n'existe pas)
    let contactIds = [];
    try {
      const contacts = await Contact.find({
        owner: userId,
        isBlocked: { $ne: true },
      }).select("contact");
      contactIds = contacts.map((c) => c.contact);
      console.log("Contacts trouvés:", contactIds.length);
    } catch (contactError) {
      console.log("⚠️ Pas de modèle Contact ou erreur:", contactError.message);
    }

    const allUserIds = [...contactIds, userId];

    // Récupérer les statuts non expirés
    const statuses = await Status.find({
      userId: { $in: allUserIds },
      expiresAt: { $gt: new Date() },
    })
      .populate("userId", "name username profilePicture")
      .populate("views.userId", "name profilePicture")
      .sort({ createdAt: -1 });

    console.log("Statuts trouvés:", statuses.length);

    // Transformer pour ajouter 'user' (compatibilité frontend)
    const transformedStatuses = statuses.map((status) => {
      const obj = status.toObject();
      obj.user = obj.userId; // Ajouter 'user' qui pointe vers userId
      return obj;
    });

    // Séparer mes statuts
    const myStatuses = transformedStatuses.filter(
      (s) => s.user && s.user._id && s.user._id.toString() === userId.toString()
    );

    // Grouper les statuts des amis
    const friendsStatusesMap = {};
    transformedStatuses.forEach((status) => {
      if (!status.user || !status.user._id) return;

      const ownerId = status.user._id.toString();

      if (ownerId !== userId.toString()) {
        if (!friendsStatusesMap[ownerId]) {
          friendsStatusesMap[ownerId] = {
            user: status.user,
            statuses: [],
            hasUnviewed: false,
            latestAt: null,
          };
        }

        friendsStatusesMap[ownerId].statuses.push(status);

        // Vérifier si non vu
        const hasViewed = status.views?.some(
          (v) =>
            v.userId &&
            v.userId._id &&
            v.userId._id.toString() === userId.toString()
        );
        if (!hasViewed) {
          friendsStatusesMap[ownerId].hasUnviewed = true;
        }

        if (
          !friendsStatusesMap[ownerId].latestAt ||
          new Date(status.createdAt) >
            new Date(friendsStatusesMap[ownerId].latestAt)
        ) {
          friendsStatusesMap[ownerId].latestAt = status.createdAt;
        }
      }
    });

    const friendsStatuses = Object.values(friendsStatusesMap).sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return new Date(b.latestAt) - new Date(a.latestAt);
    });

    console.log("✅ Résultat:", {
      myStatuses: myStatuses.length,
      friendsStatuses: friendsStatuses.length,
    });

    res.json({
      success: true,
      myStatuses,
      friendsStatuses,
      totalMy: myStatuses.length,
      totalFriends: friendsStatuses.length,
    });
  } catch (error) {
    console.error("❌ Erreur getAllStatuses:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

// ============================================
// 👁️ MARQUER COMME VU
// ============================================
exports.markAsViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    const status = await Status.findById(id);
    if (!status) {
      return res.status(404).json({ error: "Statut introuvable" });
    }

    if (status.userId.toString() === userId.toString()) {
      return res.json({ success: true, message: "Propre statut" });
    }

    const alreadyViewed = status.views.some(
      (v) => v.userId && v.userId.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      status.views.push({ userId, viewedAt: new Date() });
      await status.save();
      console.log(`👁️ Statut ${id} vu par ${userId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur markAsViewed:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// 🎭 RÉAGIR À UN STATUT
// ============================================
exports.reactToStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;
    const userId = req.user._id || req.user.id || req.user.userId;

    const status = await Status.findById(id).populate("userId", "name");
    if (!status) {
      return res.status(404).json({ error: "Statut introuvable" });
    }

    const statusOwnerId = status.userId._id.toString();

    if (statusOwnerId === userId.toString()) {
      return res
        .status(400)
        .json({ error: "Vous ne pouvez pas réagir à votre propre statut" });
    }

    // Mettre à jour ou ajouter la réaction
    const existingView = status.views.find(
      (v) => v.userId && v.userId.toString() === userId.toString()
    );

    if (existingView) {
      if (
        existingView.reaction &&
        status.reactionsSummary[existingView.reaction] > 0
      ) {
        status.reactionsSummary[existingView.reaction]--;
        status.reactionsSummary.total--;
      }
      existingView.reaction = reaction;
    } else {
      status.views.push({ userId, viewedAt: new Date(), reaction });
    }

    if (reaction) {
      status.reactionsSummary[reaction] =
        (status.reactionsSummary[reaction] || 0) + 1;
      status.reactionsSummary.total++;
    }

    await status.save();

    // Créer un message dans le chat
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, statusOwnerId] },
      isGroup: false,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, statusOwnerId],
        isGroup: false,
      });
    }

    const reactionMessage = await Message.create({
      conversationId: conversation._id,
      sender: userId,
      type: "story_reaction",
      content: `A réagi ${reaction} à votre story`,
      storyReply: {
        statusId: status._id,
        storyType: status.type,
        storyPreview:
          status.type === "text"
            ? status.content?.substring(0, 50)
            : status.mediaUrl,
        reaction: reaction,
      },
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: reactionMessage._id,
      updatedAt: Date.now(),
    });

    const io = req.app.get("io");
    if (io) {
      await reactionMessage.populate("sender", "name profilePicture");
      io.to(conversation._id.toString()).emit(
        "receive-message",
        reactionMessage
      );
      io.to(statusOwnerId).emit("status-reaction", {
        statusId: status._id,
        reaction,
        from: req.user.name,
      });
    }

    console.log(`🎭 Réaction ${reaction} sur statut ${id}`);

    res.json({
      success: true,
      reaction,
      conversationId: conversation._id,
      reactionsSummary: status.reactionsSummary,
    });
  } catch (error) {
    console.error("❌ Erreur reactToStatus:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// 💬 RÉPONDRE À UN STATUT
// ============================================
exports.replyToStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user._id || req.user.id || req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message requis" });
    }

    const status = await Status.findById(id).populate("userId", "name");
    if (!status) {
      return res.status(404).json({ error: "Statut introuvable" });
    }

    const statusOwnerId = status.userId._id.toString();

    // Ajouter la réponse au statut
    const existingView = status.views.find(
      (v) => v.userId && v.userId.toString() === userId.toString()
    );

    if (existingView) {
      existingView.replyMessage = message.trim();
    } else {
      status.views.push({
        userId,
        viewedAt: new Date(),
        replyMessage: message.trim(),
      });
    }

    status.repliesCount = (status.repliesCount || 0) + 1;
    await status.save();

    // Créer un message dans le chat
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, statusOwnerId] },
      isGroup: false,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, statusOwnerId],
        isGroup: false,
      });
    }

    const replyMessageDoc = await Message.create({
      conversationId: conversation._id,
      sender: userId,
      type: "story_reply",
      content: message.trim(),
      storyReply: {
        statusId: status._id,
        storyType: status.type,
        storyPreview:
          status.type === "text"
            ? status.content?.substring(0, 50)
            : status.mediaUrl,
      },
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: replyMessageDoc._id,
      updatedAt: Date.now(),
    });

    const io = req.app.get("io");
    if (io) {
      await replyMessageDoc.populate("sender", "name profilePicture");
      io.to(conversation._id.toString()).emit(
        "receive-message",
        replyMessageDoc
      );
    }

    console.log(`💬 Réponse sur statut ${id}`);

    res.json({
      success: true,
      conversationId: conversation._id,
      message: replyMessageDoc,
    });
  } catch (error) {
    console.error("❌ Erreur replyToStatus:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// 📊 OBTENIR LES VUES D'UN STATUT
// ============================================
exports.getStatusViews = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    const status = await Status.findById(id).populate(
      "views.userId",
      "name profilePicture"
    );

    if (!status) {
      return res.status(404).json({ error: "Statut introuvable" });
    }

    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const allViews = status.views || [];
    const viewsOnly = allViews.filter((v) => !v.reaction && !v.replyMessage);
    const reactions = allViews.filter((v) => v.reaction);
    const replies = allViews.filter((v) => v.replyMessage);

    res.json({
      success: true,
      totalViews: allViews.length,
      views: viewsOnly,
      reactions,
      replies,
      reactionsSummary: status.reactionsSummary,
    });
  } catch (error) {
    console.error("❌ Erreur getStatusViews:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// 🗑️ SUPPRIMER UN STATUT
// ============================================
exports.deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    const status = await Status.findById(id);
    if (!status) {
      return res.status(404).json({ error: "Statut introuvable" });
    }

    if (status.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    if (status.mediaUrl && !status.mediaUrl.startsWith("http")) {
      const filePath = path.join(__dirname, "..", status.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Fichier supprimé: ${filePath}`);
      }
    }

    await Status.findByIdAndDelete(id);
    console.log(`✅ Statut ${id} supprimé`);

    res.json({ success: true, message: "Statut supprimé" });
  } catch (error) {
    console.error("❌ Erreur deleteStatus:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
