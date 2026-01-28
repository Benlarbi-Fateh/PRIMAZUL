const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { v4: uuidv4 } = require("uuid");

// ✅ Stockage en mémoire RAM (Pas de Redis)
const activeCallsMap = new Map();

exports.initiateCall = async (req, res) => {
  try {
    const { conversationId, callType, isGroup, participants } = req.body;
    const initiatorId = req.user._id || req.user.id;
    const callId = uuidv4();

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

    // Stockage RAM
    activeCallsMap.set(callId, {
      messageId: callMessage._id,
      conversationId,
      initiator: initiatorId,
      startedAt: new Date(),
      participants: new Map(),
      status: "initiated",
      isGroup: !!isGroup,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: callMessage._id,
      updatedAt: Date.now(),
    });

    console.log(`📞 Appel initié (RAM): ${callId}`);

    res.status(201).json({ success: true, callId, message: callMessage });
  } catch (error) {
    console.error("❌ Erreur initiation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.answerCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = (req.user._id || req.user.id).toString();
    const userName = req.user.name;

    const activeCall = activeCallsMap.get(callId);
    if (!activeCall)
      return res.status(404).json({ error: "Appel introuvable" });

    activeCall.participants.set(userId, {
      joinedAt: new Date(),
      name: userName,
    });

    if (activeCall.status === "initiated") {
      activeCall.status = "ongoing";
      activeCall.answeredAt = new Date();
    }

    await Message.findByIdAndUpdate(activeCall.messageId, {
      "callDetails.status": "ongoing",
      $addToSet: { "callDetails.answeredBy": userId },
      $pull: { "callDetails.missedBy": userId },
    });

    res.json({ success: true, callId });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.declineCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id;

    // On met à jour la BDD même si l'appel n'est plus en RAM
    const msg = await Message.findOne({ "callDetails.callId": callId });
    if (msg) {
      await Message.findByIdAndUpdate(msg._id, {
        $addToSet: { "callDetails.declinedBy": userId },
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason } = req.body;

    const activeCall = activeCallsMap.get(callId);
    // Si pas en RAM, on cherche en BDD pour clore proprement
    const message = await Message.findOne({ "callDetails.callId": callId });

    if (!message) return res.status(404).json({ error: "Appel introuvable" });

    const endedAt = new Date();
    const startedAt =
      activeCall?.answeredAt ||
      activeCall?.startedAt ||
      message.callDetails.startedAt;
    const duration = activeCall?.answeredAt
      ? Math.round((endedAt - activeCall.answeredAt) / 1000)
      : 0;

    let finalStatus = reason || "ended";
    if (!activeCall?.answeredAt && message.callDetails.status === "initiated") {
      finalStatus = "missed";
    }

    // Participants manqués
    const allParticipants = message.callDetails.participants.map((p) =>
      p.userId.toString(),
    );
    const answeredUsers = (message.callDetails.answeredBy || []).map((id) =>
      id.toString(),
    );
    const missedUsers = allParticipants.filter(
      (id) => !answeredUsers.includes(id),
    );

    await Message.findByIdAndUpdate(message._id, {
      "callDetails.status": finalStatus,
      "callDetails.endedAt": endedAt,
      "callDetails.duration": duration,
      "callDetails.missedBy": missedUsers,
    });

    activeCallsMap.delete(callId);
    res.json({ success: true, duration, status: finalStatus });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.leaveCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = (req.user._id || req.user.id).toString();
    const activeCall = activeCallsMap.get(callId);

    if (activeCall && activeCall.participants.has(userId)) {
      // Logique simplifiée pour RAM
      activeCall.participants.delete(userId);
      if (activeCall.participants.size === 0) {
        return this.endCall(req, res);
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

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
          ([id, data]) => ({ id, ...data }),
        ),
      });
    }

    const message = await Message.findOne({ "callDetails.callId": callId });
    if (!message) return res.status(404).json({ error: "Appel introuvable" });

    res.json({
      success: true,
      active: false,
      callDetails: message.callDetails,
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Export pour utilisation ailleurs si besoin
exports.activeCallsMap = activeCallsMap;
