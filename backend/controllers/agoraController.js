// backend/controllers/callController.js
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { v4: uuidv4 } = require("uuid");

// Stocker les appels actifs en mémoire
const activeCallsMap = new Map();

// ============================================
// INITIER UN APPEL
// ============================================
exports.initiateCall = async (req, res) => {
  try {
    const { conversationId, callType, isGroup, participants } = req.body;
    const initiatorId = req.user._id || req.user.id;

    const callId = uuidv4();

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
        participants:
          participants?.map((p) => ({
            userId: p._id || p.userId,
            name: p.name,
            profilePicture: p.profilePicture,
          })) || [],
      },
    });

    await callMessage.populate("sender", "name profilePicture");
    await callMessage.populate("callDetails.initiator", "name profilePicture");

    // Stocker l'appel actif
    activeCallsMap.set(callId, {
      messageId: callMessage._id,
      conversationId,
      initiator: initiatorId,
      startedAt: new Date(),
      participants: new Map(),
      status: "initiated",
    });

    // Mettre à jour la conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: callMessage._id,
      updatedAt: Date.now(),
    });

    console.log(`📞 Appel initié: ${callId}`);

    res.status(201).json({
      success: true,
      callId,
      message: callMessage,
    });
  } catch (error) {
    console.error("❌ Erreur initiation appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// RÉPONDRE À UN APPEL
// ============================================
exports.answerCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id;
    const userName = req.user.name;

    const activeCall = activeCallsMap.get(callId);
    if (!activeCall) {
      return res.status(404).json({ error: "Appel introuvable ou terminé" });
    }

    // Marquer comme répondu
    activeCall.participants.set(userId.toString(), {
      joinedAt: new Date(),
      name: userName,
    });

    if (activeCall.status === "initiated") {
      activeCall.status = "ongoing";
      activeCall.answeredAt = new Date();
    }

    // Mettre à jour le message
    await Message.findByIdAndUpdate(activeCall.messageId, {
      "callDetails.status": "ongoing",
      $addToSet: { "callDetails.answeredBy": userId },
      $pull: { "callDetails.missedBy": userId },
    });

    console.log(`✅ ${userName} a répondu à l'appel ${callId}`);

    res.json({ success: true, callId });
  } catch (error) {
    console.error("❌ Erreur réponse appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// REFUSER UN APPEL
// ============================================
exports.declineCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id;

    const activeCall = activeCallsMap.get(callId);
    if (!activeCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    await Message.findByIdAndUpdate(activeCall.messageId, {
      $addToSet: { "callDetails.declinedBy": userId },
    });

    console.log(`❌ Appel ${callId} refusé par ${userId}`);

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur refus appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// TERMINER UN APPEL
// ============================================
exports.endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason } = req.body; // 'ended', 'no_answer', 'busy'

    const activeCall = activeCallsMap.get(callId);
    if (!activeCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    const endedAt = new Date();
    const startedAt = activeCall.answeredAt || activeCall.startedAt;
    const duration = activeCall.answeredAt
      ? Math.round((endedAt - activeCall.answeredAt) / 1000)
      : 0;

    // Déterminer le statut final
    let finalStatus = reason || "ended";
    if (!activeCall.answeredAt && activeCall.status === "initiated") {
      finalStatus = "missed";
    }

    // Calculer les participants qui ont manqué
    const message = await Message.findById(activeCall.messageId);
    const allParticipants = message.callDetails.participants.map((p) =>
      p.userId.toString()
    );
    const answeredUsers = (message.callDetails.answeredBy || []).map((id) =>
      id.toString()
    );
    const missedUsers = allParticipants.filter(
      (id) => !answeredUsers.includes(id)
    );

    // Mettre à jour le message
    await Message.findByIdAndUpdate(activeCall.messageId, {
      "callDetails.status": finalStatus,
      "callDetails.endedAt": endedAt,
      "callDetails.duration": duration,
      "callDetails.missedBy": missedUsers,
    });

    // Nettoyer
    activeCallsMap.delete(callId);

    console.log(
      `🛑 Appel ${callId} terminé - Durée: ${duration}s - Statut: ${finalStatus}`
    );

    res.json({
      success: true,
      duration,
      status: finalStatus,
    });
  } catch (error) {
    console.error("❌ Erreur fin appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// PARTICIPANT QUITTE L'APPEL
// ============================================
exports.leaveCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id;

    const activeCall = activeCallsMap.get(callId);
    if (!activeCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    const participant = activeCall.participants.get(userId.toString());
    if (participant) {
      participant.leftAt = new Date();
      participant.duration = Math.round(
        (participant.leftAt - participant.joinedAt) / 1000
      );
    }

    // Si c'était le dernier participant, terminer l'appel
    const remainingParticipants = Array.from(
      activeCall.participants.values()
    ).filter((p) => !p.leftAt);

    if (remainingParticipants.length <= 1) {
      // Terminer l'appel automatiquement
      return this.endCall(req, res);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur quitter appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ============================================
// OBTENIR L'ÉTAT D'UN APPEL
// ============================================
exports.getCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;

    const activeCall = activeCallsMap.get(callId);
    if (activeCall) {
      return res.json({
        success: true,
        active: true,
        status: activeCall.status,
        participants: Array.from(activeCall.participants.entries()).map(
          ([id, data]) => ({
            id,
            ...data,
          })
        ),
      });
    }

    // Chercher dans la base de données
    const message = await Message.findOne({ "callDetails.callId": callId })
      .populate("callDetails.initiator", "name profilePicture")
      .populate("callDetails.answeredBy", "name profilePicture");

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
};

// Exporter la map pour le socket handler
exports.activeCallsMap = activeCallsMap;
