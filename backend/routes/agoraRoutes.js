// backend/routes/agoraRoutes.js
const express = require("express");
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const auth = require("../middleware/authMiddleware");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { v4: uuidv4 } = require("uuid");

// Stocker les appels actifs en mémoire
const activeCallsMap = new Map();

// ============================================
// GÉNÉRER UN TOKEN AGORA
// ============================================
router.post("/token", auth, (req, res) => {
  try {
    const { channelName, uid ,isGroup} = req.body;
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const role = RtcRole.PUBLISHER;

    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    if (!channelName) {
      return res.status(400).json({ error: "Channel name is required" });
    }

    if (!appID || !appCertificate) {
      return res
        .status(500)
        .json({ error: "Agora credentials not configured" });
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      uid || 0,
      role,
      privilegeExpiredTs
    );

    console.log(`🎫 Token Agora généré pour channel: ${channelName}`);

    res.json({ token, channelName, uid , config: {
        mode: 'rtc',
        codec: 'vp8',
        isGroup: isGroup || false
      }});
  } catch (error) {
    console.error("❌ Erreur génération token:", error);
    res.status(500).json({ error: "Erreur génération token" });
  }
});

// ============================================
// INITIER UN APPEL
// ============================================
router.post("/calls/initiate", auth, async (req, res) => {
  try {
    const { conversationId, callType, isGroup, participants } = req.body;
    const initiatorId = req.user._id || req.user.id || req.user.userId;

    console.log("📞 Initiation appel:", { conversationId, callType, isGroup });

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId requis" });
    }

    const callId = uuidv4();

    // Préparer les participants
    const participantsList =
      participants?.map((p) => ({
        userId: p._id || p.userId || p.id,
        name: p.name,
        profilePicture: p.profilePicture,
      })) || [];

    // Créer le message d'appel
    const callMessage = await Message.create({
      conversationId,
      sender: initiatorId,
      type: "call",
      callDetails: {
        callId,
        callType: callType || "video",
        status: "initiated",
        initiator: initiatorId,
        isGroup: isGroup || false,
        startedAt: new Date(),
        participants: participantsList,
        answeredBy: [],
        missedBy: [],
        declinedBy: [],
        duration: 0,
      },
    });

    await callMessage.populate("sender", "name profilePicture");

    // Stocker l'appel actif
    activeCallsMap.set(callId, {
      messageId: callMessage._id,
      conversationId,
      initiator: initiatorId,
      startedAt: Date.now(),
      answeredAt: null,
      participants: new Map(),
      status: "initiated",
      isGroup: isGroup || false,
    });

    // Mettre à jour la conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: callMessage._id,
      updatedAt: Date.now(),
    });

    // Émettre via socket
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("receive-message", callMessage);
    }

    console.log(`✅ Appel créé: ${callId}`);

    res.status(201).json({
      success: true,
      callId,
      message: callMessage,
    });
  } catch (error) {
    console.error("❌ Erreur initiation appel:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// ============================================
// RÉPONDRE À UN APPEL
// ============================================
router.post("/calls/:callId/answer", auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    console.log(`✅ Réponse appel ${callId} par ${userId}`);

    const activeCall = activeCallsMap.get(callId);

    if (activeCall) {
      activeCall.participants.set(userId.toString(), {
        joinedAt: Date.now(),
        status: "connected",
      });

      if (activeCall.status === "initiated") {
        activeCall.status = "ongoing";
        activeCall.answeredAt = Date.now();
      }
    }

    // Mettre à jour le message
    await Message.findOneAndUpdate(
      { "callDetails.callId": callId },
      {
        "callDetails.status": "ongoing",
        $addToSet: { "callDetails.answeredBy": userId },
        $pull: { "callDetails.missedBy": userId },
      }
    );

    res.json({ success: true, callId });
  } catch (error) {
    console.error("❌ Erreur réponse appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// REFUSER UN APPEL
// ============================================
router.post("/calls/:callId/decline", auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    console.log(`❌ Refus appel ${callId} par ${userId}`);

    const activeCall = activeCallsMap.get(callId);

    await Message.findOneAndUpdate(
      { "callDetails.callId": callId },
      {
        $addToSet: { "callDetails.declinedBy": userId },
      }
    );

    // Si appel P2P, le marquer comme refusé
    if (activeCall && !activeCall.isGroup) {
      activeCall.status = "missed";

      await Message.findOneAndUpdate(
        { "callDetails.callId": callId },
        {
          "callDetails.status": "missed",
          "callDetails.endedAt": new Date(),
          "callDetails.duration": 0,
        }
      );

      //activeCallsMap.delete(callId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur refus appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// TERMINER UN APPEL
// ============================================
router.post("/calls/:callId/end", auth, async (req, res) => {
  try {
    const { callId } = req.params;

    console.log(`🛑 Fin appel ${callId}`);

    const existingMessage = await Message.findOne({
      "callDetails.callId": callId,
    });

    if (!existingMessage) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    // 🔐 PROTECTION ABSOLUE CONTRE DOUBLE FIN
    if (
      existingMessage.callDetails.status === "ended" ||
      existingMessage.callDetails.status === "missed"
    ) {
      console.log("⚠️ Appel déjà terminé, on ignore");
      return res.json({
        success: true,
        ignored: true,
        status: existingMessage.callDetails.status,
      });
    }

    let finalStatus = "missed";
    let duration = 0;

    // ✅ LOGIQUE CORRECTE
    if (existingMessage.callDetails.answeredBy.length > 0) {
      finalStatus = "ended";
      duration = Math.round(
        (Date.now() - new Date(existingMessage.callDetails.startedAt)) / 1000
      );
    }

    const message = await Message.findOneAndUpdate(
      { "callDetails.callId": callId },
      {
        "callDetails.status": finalStatus,
        "callDetails.endedAt": new Date(),
        "callDetails.duration": duration,
      },
      { new: true }
    );

    activeCallsMap.delete(callId);

    const io = req.app.get("io");
    if (io && message) {
      io.to(message.conversationId.toString()).emit("call-ended", {
        callId,
        duration,
        status: finalStatus,
      });
    }

    console.log(
      `✅ Appel ${callId} terminé - Durée: ${duration}s - Statut: ${finalStatus}`
    );

    res.json({ success: true, duration, status: finalStatus });
  } catch (error) {
    console.error("❌ Erreur fin appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// QUITTER UN APPEL (pour les appels de groupe)
// ============================================
router.post("/calls/:callId/leave", auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    console.log(`👋 ${userId} quitte l'appel ${callId}`);

    const activeCall = activeCallsMap.get(callId);

    if (activeCall) {
      const participant = activeCall.participants.get(userId.toString());
      if (participant) {
        participant.leftAt = Date.now();
        participant.status = "left";
      }

      // Vérifier s'il reste des participants actifs
      const remaining = Array.from(activeCall.participants.values()).filter(
        (p) => p.status === "connected"
      );

      // Si plus qu'un participant, terminer l'appel
      if (remaining.length <= 1) {
        const duration = activeCall.answeredAt
          ? Math.round((Date.now() - activeCall.answeredAt) / 1000)
          : 0;

        await Message.findOneAndUpdate(
          { "callDetails.callId": callId },
          {
            "callDetails.status": "ended",
            "callDetails.endedAt": new Date(),
            "callDetails.duration": duration,
          }
        );

        activeCallsMap.delete(callId);

        return res.json({ success: true, callEnded: true, duration });
      }
    }

    res.json({ success: true, callEnded: false });
  } catch (error) {
    console.error("❌ Erreur quitter appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// OBTENIR LE STATUT D'UN APPEL
// ============================================
router.get("/calls/:callId/status", auth, async (req, res) => {
  try {
    const { callId } = req.params;

    // Vérifier dans les appels actifs
    const activeCall = activeCallsMap.get(callId);

    if (activeCall) {
      return res.json({
        success: true,
        active: true,
        status: activeCall.status,
        startedAt: activeCall.startedAt,
        answeredAt: activeCall.answeredAt,
        participants: Array.from(activeCall.participants.entries()).map(
          ([id, data]) => ({ userId: id, ...data })
        ),
      });
    }

    // Chercher dans la base de données
    const message = await Message.findOne({ "callDetails.callId": callId })
      .populate("callDetails.initiator", "name profilePicture")
      .populate("callDetails.answeredBy", "name profilePicture")
      .populate("callDetails.participants.userId", "name profilePicture");

    if (!message) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    res.json({
      success: true,
      active: false,
      callDetails: message.callDetails,
    });
  } catch (error) {
    console.error("❌ Erreur statut appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// OBTENIR L'HISTORIQUE DES APPELS
// ============================================
router.get("/calls/history", auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    const { limit = 20, page = 1 } = req.query;

    // Trouver les conversations de l'utilisateur
    const conversations = await Conversation.find({
      participants: userId,
    }).select("_id");

    const conversationIds = conversations.map((c) => c._id);

    // Récupérer les messages d'appel
    const calls = await Message.find({
      conversationId: { $in: conversationIds },
      type: "call",
    })
      .populate("sender", "name profilePicture")
      .populate("callDetails.initiator", "name profilePicture")
      .populate("callDetails.participants.userId", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      type: "call",
    });

    res.json({
      success: true,
      calls,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Erreur historique appels:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
