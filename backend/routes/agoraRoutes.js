// backend/routes/agoraRoutes.js
const express = require("express");
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const auth = require("../middleware/authMiddleware");
const {
  agoraTokenRateLimit,
  agoraCallInitiateRateLimit,
  agoraCallActionRateLimit,
  agoraCallPingRateLimit,
} = require("../middleware/actionRateLimits");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

// ============================================
// STOCKAGE DES APPELS ACTIFS (Amélioré)
// ============================================
const activeCallsMap = new Map();
const conversationActiveCallsMap = new Map(); // conversationId -> callId

// Timeouts pour le nettoyage automatique
const callTimeoutsMap = new Map();

// Constantes
const GROUP_CALL_TIMEOUT_MS = 20000; // 20 secondes pour les appels de groupe
const P2P_CALL_TIMEOUT_MS = 45000; // 45 secondes pour les appels 1v1
const CALL_CLEANUP_INTERVAL_MS = 60000; // Nettoyage toutes les minutes

const getUserId = (req) => req.user._id || req.user.id || req.user.userId;

const normalizeId = (value) => value?.toString();

const getAgoraConfig = () => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appID || !appCertificate) {
    return null;
  }

  return { appID, appCertificate };
};

const getNumericUid = (userId) => {
  const source = normalizeId(userId);
  const hash = source
    .split("")
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);

  return Math.abs(hash) || 1;
};

const ensureConversationMember = async (conversationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }

  return Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });
};

const getCallForUser = async (callId, userId) => {
  if (!callId) {
    return null;
  }

  const activeCall = activeCallsMap.get(callId);
  if (activeCall) {
    const conversation = await ensureConversationMember(
      activeCall.conversationId,
      userId,
    );

    if (!conversation) {
      return null;
    }

    return {
      callId,
      channelName: activeCall.channelName,
      conversationId: activeCall.conversationId,
      callType: activeCall.callType,
      isGroup: activeCall.isGroup,
      status: activeCall.status,
      fromMemory: true,
    };
  }

  const callMessage = await Message.findOne({ "callDetails.callId": callId });
  if (!callMessage) {
    return null;
  }

  const conversation = await ensureConversationMember(
    callMessage.conversationId,
    userId,
  );

  if (!conversation) {
    return null;
  }

  return {
    callId,
    channelName: `channel_${callId}`,
    conversationId: callMessage.conversationId,
    callType: callMessage.callDetails.callType,
    isGroup: callMessage.callDetails.isGroup,
    status: callMessage.callDetails.status,
    fromMemory: false,
  };
};

const buildAgoraToken = (channelName, uid) => {
  const config = getAgoraConfig();
  if (!config) {
    return null;
  }

  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    config.appID,
    config.appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs,
  );
};

// ============================================
// NETTOYAGE AUTOMATIQUE DES APPELS EXPIRÉS
// ============================================
const cleanupExpiredCalls = async () => {
  const now = Date.now();
  
  for (const [callId, callData] of activeCallsMap.entries()) {
    // Si l'appel est toujours en état "initiated" et a dépassé le timeout
    if (callData.status === "initiated") {
      const timeout = callData.isGroup ? GROUP_CALL_TIMEOUT_MS : P2P_CALL_TIMEOUT_MS;
      const elapsed = now - callData.startedAt;
      
      if (elapsed > timeout) {
        console.log(`🧹 Nettoyage auto de l'appel expiré: ${callId}`);
        await endCallInternal(callId, "no_answer", null);
      }
    }
    
    // Nettoyage des appels "ongoing" sans participants depuis plus de 5 min
    if (callData.status === "ongoing" && callData.participants.size === 0) {
      const inactiveDuration = now - (callData.lastActivity || callData.startedAt);
      if (inactiveDuration > 300000) { // 5 minutes
        console.log(`🧹 Nettoyage appel inactif: ${callId}`);
        await endCallInternal(callId, "inactive", null);
      }
    }
  }
};

// Lancer le nettoyage périodique
setInterval(cleanupExpiredCalls, CALL_CLEANUP_INTERVAL_MS);

// ============================================
// FONCTION INTERNE POUR TERMINER UN APPEL
// ============================================
const endCallInternal = async (callId, reason, io) => {
  const activeCall = activeCallsMap.get(callId);
  if (!activeCall) return null;

  // Annuler le timeout s'il existe
  const timeout = callTimeoutsMap.get(callId);
  if (timeout) {
    clearTimeout(timeout);
    callTimeoutsMap.delete(callId);
  }

  const endedAt = new Date();
  const duration = activeCall.answeredAt 
    ? Math.round((endedAt - activeCall.answeredAt) / 1000) 
    : 0;
  
  let finalStatus = reason || "ended";
  if (!activeCall.answeredAt && activeCall.status === "initiated") {
    finalStatus = "missed";
  } else if (activeCall.answeredAt) {
    finalStatus = "ended";
  }

  try {
    const message = await Message.findOneAndUpdate(
      { "callDetails.callId": callId },
      {
        "callDetails.status": finalStatus,
        "callDetails.endedAt": endedAt,
        "callDetails.duration": duration,
      },
      { new: true }
    );

    // Nettoyer les maps
    activeCallsMap.delete(callId);
    
    // Supprimer le lien conversation -> appel
    if (activeCall.conversationId) {
      const currentCallId = conversationActiveCallsMap.get(activeCall.conversationId.toString());
      if (currentCallId === callId) {
        conversationActiveCallsMap.delete(activeCall.conversationId.toString());
      }
    }

    // Notifier via socket si disponible
    if (io && message) {
      io.to(activeCall.conversationId.toString()).emit("call-ended", {
        callId,
        duration,
        status: finalStatus,
        reason,
      });
    }

    console.log(`✅ Appel ${callId} terminé - Status: ${finalStatus}, Durée: ${duration}s`);
    
    return { duration, status: finalStatus };
  } catch (error) {
    console.error("❌ Erreur endCallInternal:", error);
    return null;
  }
};

// ============================================
// GÉNÉRER UN TOKEN AGORA
// ============================================
router.post("/token", auth, agoraTokenRateLimit, async (req, res) => {
  try {
    const { callId, uid } = req.body;
    const userId = getUserId(req);

    if (!callId) {
      return res.status(400).json({ error: "callId requis" });
    }

    const call = await getCallForUser(callId, userId);
    if (!call) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    if (!["initiated", "ongoing"].includes(call.status)) {
      return res.status(410).json({ error: "Cet appel est termine" });
    }

    const numericUid = Number.isInteger(Number(uid))
      ? Number(uid)
      : getNumericUid(userId);

    const token = buildAgoraToken(call.channelName, numericUid);
    const channelName = call.channelName;
    if (!token) {
      return res.status(500).json({ error: "Agora credentials not configured" });
    }

    console.log(`🎫 Token Agora généré pour channel: ${channelName}`);

    res.json({ 
      token, 
      channelName: call.channelName,
      uid: numericUid,
      config: {
        mode: 'rtc',
        codec: 'vp8',
        isGroup: call.isGroup || false
      }
    });
  } catch (error) {
    console.error("❌ Erreur génération token:", error);
    res.status(500).json({ error: "Erreur génération token" });
  }
});

// ============================================
// VÉRIFIER SI UN APPEL ACTIF EXISTE POUR UNE CONVERSATION
// ============================================
router.get("/calls/active/:conversationId", auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = getUserId(req);

    const conversation = await ensureConversationMember(conversationId, userId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation introuvable" });
    }
    
    // Vérifier dans la map des appels actifs
    const activeCallId = conversationActiveCallsMap.get(conversationId);
    
    if (activeCallId) {
      const activeCall = activeCallsMap.get(activeCallId);
      
      if (activeCall && (activeCall.status === "initiated" || activeCall.status === "ongoing")) {
        // Récupérer les détails du message d'appel
        const callMessage = await Message.findOne({ "callDetails.callId": activeCallId })
          .populate("sender", "name profilePicture")
          .populate("callDetails.initiator", "name profilePicture");

        return res.json({
          success: true,
          hasActiveCall: true,
          call: {
            callId: activeCallId,
            channelName: activeCall.channelName,
            callType: activeCall.callType,
            isGroup: activeCall.isGroup,
            status: activeCall.status,
            startedAt: activeCall.startedAt,
            answeredAt: activeCall.answeredAt,
            initiator: activeCall.initiator,
            participantsCount: activeCall.participants.size,
            participants: Array.from(activeCall.participants.entries()).map(([id, data]) => ({
              oduserId: id,
              ...data
            })),
            message: callMessage,
          }
        });
      }
    }

    // Vérifier aussi dans la base de données (au cas où le serveur a redémarré)
    const recentCall = await Message.findOne({
      conversationId,
      type: "call",
      "callDetails.status": { $in: ["initiated", "ongoing"] },
      createdAt: { $gte: new Date(Date.now() - 300000) } // 5 dernières minutes
    })
    .populate("sender", "name profilePicture")
    .populate("callDetails.initiator", "name profilePicture")
    .sort({ createdAt: -1 });

    if (recentCall) {
      return res.json({
        success: true,
        hasActiveCall: true,
        call: {
          callId: recentCall.callDetails.callId,
          channelName: `channel_${recentCall.callDetails.callId}`,
          callType: recentCall.callDetails.callType,
          isGroup: recentCall.callDetails.isGroup,
          status: recentCall.callDetails.status,
          startedAt: recentCall.callDetails.startedAt,
          initiator: recentCall.callDetails.initiator,
          message: recentCall,
          fromDatabase: true // Indicateur que ça vient de la DB
        }
      });
    }

    res.json({
      success: true,
      hasActiveCall: false,
    });
  } catch (error) {
    console.error("❌ Erreur vérification appel actif:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// INITIER UN APPEL
// ============================================
router.post("/calls/initiate", auth, agoraCallInitiateRateLimit, async (req, res) => {
  try {
    const { conversationId, callType, isGroup, participants } = req.body;
    const initiatorId = req.user._id || req.user.id || req.user.userId;

    console.log("📞 Initiation appel:", { conversationId, callType, isGroup });

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId requis" });
    }

    const conversation = await ensureConversationMember(conversationId, initiatorId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation introuvable" });
    }

    if (callType && !["audio", "video"].includes(callType)) {
      return res.status(400).json({ error: "Type d'appel invalide" });
    }

    // ✅ VÉRIFIER SI UN APPEL EST DÉJÀ EN COURS POUR CETTE CONVERSATION
    const existingCallId = conversationActiveCallsMap.get(conversationId);
    if (existingCallId) {
      const existingCall = activeCallsMap.get(existingCallId);
      
      if (existingCall && (existingCall.status === "initiated" || existingCall.status === "ongoing")) {
        console.log(`⚠️ Appel déjà en cours pour cette conversation: ${existingCallId}`);
        
        return res.status(409).json({ 
          error: "Un appel est déjà en cours pour cette conversation",
          activeCallId: existingCallId,
          canJoin: existingCall.status === "ongoing",
          callDetails: {
            callId: existingCallId,
            channelName: existingCall.channelName,
            status: existingCall.status,
            isGroup: existingCall.isGroup,
            callType: existingCall.callType,
          }
        });
      }
    }

    const callId = uuidv4();
    const channelName = `channel_${callId}`;

    // Préparer les participants
    const conversationParticipantIds = new Set(
      conversation.participants.map((participantId) => participantId.toString()),
    );
    const participantsList = (participants || [])
      .map((p) => {
        if (typeof p === "string") {
          return { userId: p };
        }

        return {
          userId: p?._id || p?.userId || p?.id,
          name: p?.name,
          profilePicture: p?.profilePicture,
        };
      })
      .filter(
        (p) =>
          p.userId &&
          conversationParticipantIds.has(p.userId.toString()) &&
          p.userId.toString() !== initiatorId.toString(),
      );

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
    const callData = {
      messageId: callMessage._id,
      conversationId,
      channelName,
      callType: callType || "video",
      initiator: initiatorId,
      startedAt: Date.now(),
      answeredAt: null,
      participants: new Map(),
      status: "initiated",
      isGroup: isGroup || false,
      lastActivity: Date.now(),
    };
    
    activeCallsMap.set(callId, callData);
    conversationActiveCallsMap.set(conversationId, callId);

    // ✅ CONFIGURER LE TIMEOUT AUTOMATIQUE POUR LES APPELS DE GROUPE
    const timeoutDuration = isGroup ? GROUP_CALL_TIMEOUT_MS : P2P_CALL_TIMEOUT_MS;
    
    const timeoutId = setTimeout(async () => {
      const call = activeCallsMap.get(callId);
      
      if (call && call.status === "initiated") {
        console.log(`⏰ Timeout appel ${isGroup ? 'groupe' : '1v1'}: ${callId}`);
        
        const io = req.app.get("io");
        await endCallInternal(callId, "no_answer", io);
        
        // Notifier tous les participants que l'appel a expiré
        if (io) {
          io.to(conversationId).emit("call-timeout", {
            callId,
            reason: "no_answer",
            isGroup,
          });
        }
      }
      
      callTimeoutsMap.delete(callId);
    }, timeoutDuration);
    
    callTimeoutsMap.set(callId, timeoutId);

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

    console.log(`✅ Appel créé: ${callId} (timeout: ${timeoutDuration/1000}s)`);

    res.status(201).json({
      success: true,
      callId,
      channelName,
      message: callMessage,
      timeout: timeoutDuration,
    });
  } catch (error) {
    console.error("❌ Erreur initiation appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// REJOINDRE UN APPEL EXISTANT (NOUVELLE ROUTE)
// ============================================
router.post("/calls/:callId/join", auth, agoraCallActionRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;
    const userName = req.user.name;
    const userProfilePicture = req.user.profilePicture;

    const authorizedCall = await getCallForUser(callId, userId);
    if (!authorizedCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    console.log(`🔗 ${userName} rejoint l'appel ${callId}`);

    const activeCall = activeCallsMap.get(callId);

    if (!activeCall) {
      // Vérifier dans la DB
      const callMessage = await Message.findOne({ "callDetails.callId": callId });
      
      if (!callMessage) {
        return res.status(404).json({ error: "Appel introuvable" });
      }
      
      if (callMessage.callDetails.status === "ended" || callMessage.callDetails.status === "missed") {
        return res.status(410).json({ error: "Cet appel est terminé" });
      }

      // Recréer l'entrée dans activeCallsMap si nécessaire
      const reconstructedCall = {
        messageId: callMessage._id,
        conversationId: callMessage.conversationId,
        channelName: `channel_${callId}`,
        callType: callMessage.callDetails.callType,
        initiator: callMessage.callDetails.initiator,
        startedAt: new Date(callMessage.callDetails.startedAt).getTime(),
        answeredAt: callMessage.callDetails.status === "ongoing" ? Date.now() : null,
        participants: new Map(),
        status: callMessage.callDetails.status,
        isGroup: callMessage.callDetails.isGroup,
        lastActivity: Date.now(),
      };
      
      activeCallsMap.set(callId, reconstructedCall);
      conversationActiveCallsMap.set(callMessage.conversationId.toString(), callId);
    }

    const call = activeCallsMap.get(callId);
    
    if (call.status !== "ongoing" && call.status !== "initiated") {
      return res.status(410).json({ error: "Cet appel n'est plus disponible" });
    }

    // Ajouter le participant
    call.participants.set(userId.toString(), {
      oduserId: userId.toString(),
      joinedAt: Date.now(),
      name: userName,
      profilePicture: userProfilePicture,
      status: "connected",
    });

    // Mettre à jour le statut si nécessaire
    if (call.status === "initiated") {
      call.status = "ongoing";
      call.answeredAt = Date.now();
      
      // Annuler le timeout
      const timeout = callTimeoutsMap.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        callTimeoutsMap.delete(callId);
      }
    }

    call.lastActivity = Date.now();

    // Mettre à jour la DB
    await Message.findOneAndUpdate(
      { "callDetails.callId": callId },
      {
        "callDetails.status": "ongoing",
        $addToSet: { "callDetails.answeredBy": userId },
        $pull: { "callDetails.missedBy": userId },
      }
    );

    // Générer un token pour ce participant
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const numericUid = Math.abs(userId.toString().split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)) || 1;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      call.channelName,
      numericUid,
      RtcRole.PUBLISHER,
      Math.floor(Date.now() / 1000) + 3600
    );

    // Notifier les autres participants
    const io = req.app.get("io");
    if (io) {
      io.to(call.conversationId.toString()).emit("call-participant-joined", {
        callId,
        userId: userId.toString(),
        userName,
        userProfilePicture,
      });
    }

    res.json({
      success: true,
      callId,
      channelName: call.channelName,
      token,
      uid: numericUid,
      callType: call.callType,
      isGroup: call.isGroup,
      participantsCount: call.participants.size,
    });
  } catch (error) {
    console.error("❌ Erreur rejoindre appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// RÉPONDRE À UN APPEL
// ============================================
router.post("/calls/:callId/answer", auth, agoraCallActionRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;
    const userName = req.user.name;

    const authorizedCall = await getCallForUser(callId, userId);
    if (!authorizedCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    console.log(`✅ Réponse appel ${callId} par ${userName}`);

    const activeCall = activeCallsMap.get(callId);

    if (!activeCall) {
      return res.status(404).json({ error: "Appel introuvable ou terminé" });
    }

    if (activeCall.status === "ended" || activeCall.status === "missed") {
      return res.status(410).json({ error: "Cet appel est déjà terminé" });
    }

    // Ajouter le participant
    activeCall.participants.set(userId.toString(), {
      oduserId: userId.toString(),
      joinedAt: Date.now(),
      name: userName,
      status: "connected",
    });

    // Si c'est le premier à répondre
    if (activeCall.status === "initiated") {
      activeCall.status = "ongoing";
      activeCall.answeredAt = Date.now();
      
      // ✅ ANNULER LE TIMEOUT
      const timeout = callTimeoutsMap.get(callId);
      if (timeout) {
        clearTimeout(timeout);
        callTimeoutsMap.delete(callId);
        console.log(`⏰ Timeout annulé pour appel ${callId}`);
      }
    }

    activeCall.lastActivity = Date.now();

    // Mettre à jour le message
    await Message.findOneAndUpdate(
      { "callDetails.callId": callId },
      {
        "callDetails.status": "ongoing",
        $addToSet: { "callDetails.answeredBy": userId },
        $pull: { "callDetails.missedBy": userId },
      }
    );

    // Notifier les autres
    const io = req.app.get("io");
    if (io) {
      io.to(activeCall.conversationId.toString()).emit("call-participant-joined", {
        callId,
        oduserId: userId.toString(),
        userName,
      });
    }

    res.json({ 
      success: true, 
      callId,
      channelName: activeCall.channelName,
      callType: activeCall.callType,
      isGroup: activeCall.isGroup,
    });
  } catch (error) {
    console.error("❌ Erreur réponse appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// REFUSER UN APPEL
// ============================================
router.post("/calls/:callId/decline", auth, agoraCallActionRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    const authorizedCall = await getCallForUser(callId, userId);
    if (!authorizedCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

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
      const io = req.app.get("io");
      await endCallInternal(callId, "declined", io);
    }

    // Pour les groupes, vérifier si tout le monde a refusé
    if (activeCall && activeCall.isGroup) {
      const message = await Message.findOne({ "callDetails.callId": callId });
      
      if (message) {
        const totalParticipants = message.callDetails.participants.length;
        const declinedCount = message.callDetails.declinedBy.length;
        
        // Si tout le monde a refusé sauf l'initiateur
        if (declinedCount >= totalParticipants - 1 && activeCall.participants.size === 0) {
          console.log("👥 Tout le groupe a refusé l'appel");
          const io = req.app.get("io");
          await endCallInternal(callId, "all_declined", io);
        }
      }
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
router.post("/calls/:callId/end", auth, agoraCallActionRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id || req.user.id || req.user.userId;

    const authorizedCall = await getCallForUser(callId, userId);
    if (!authorizedCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    console.log(`🛑 Fin appel ${callId}`);

    const existingMessage = await Message.findOne({
      "callDetails.callId": callId,
    });

    if (!existingMessage) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    // Protection contre double fin
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

    const io = req.app.get("io");
    const result = await endCallInternal(callId, reason, io);

    if (result) {
      res.json({ 
        success: true, 
        duration: result.duration, 
        status: result.status 
      });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error("❌ Erreur fin appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// QUITTER UN APPEL (pour les appels de groupe)
// ============================================
router.post("/calls/:callId/leave", auth, agoraCallActionRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    const authorizedCall = await getCallForUser(callId, userId);
    if (!authorizedCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    console.log(`👋 ${userId} quitte l'appel ${callId}`);

    const activeCall = activeCallsMap.get(callId);

    if (!activeCall) {
      return res.json({ success: true, callEnded: false });
    }

    // Mettre à jour le statut du participant
    const participant = activeCall.participants.get(userId.toString());
    if (participant) {
      participant.leftAt = Date.now();
      participant.status = "left";
      activeCall.participants.delete(userId.toString());
    }

    activeCall.lastActivity = Date.now();

    // Notifier les autres
    const io = req.app.get("io");
    if (io) {
      io.to(activeCall.conversationId.toString()).emit("call-participant-left", {
        callId,
        oduserId: userId.toString(),
      });
    }

    // Compter les participants actifs restants
    const remainingActive = Array.from(activeCall.participants.values())
      .filter(p => p.status === "connected").length;

    console.log(`👥 Participants restants: ${remainingActive}`);

    // Si moins de 2 participants actifs pour un groupe, ou 0 pour tous
    if (remainingActive === 0 || (!activeCall.isGroup && remainingActive < 1)) {
      console.log("🛑 Plus assez de participants, fin de l'appel");
      await endCallInternal(callId, "ended", io);
      return res.json({ success: true, callEnded: true });
    }

    res.json({ success: true, callEnded: false, remainingParticipants: remainingActive });
  } catch (error) {
    console.error("❌ Erreur quitter appel:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// PING POUR MAINTENIR L'APPEL ACTIF
// ============================================
router.post("/calls/:callId/ping", auth, agoraCallPingRateLimit, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    const authorizedCall = await getCallForUser(callId, userId);
    if (!authorizedCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    const activeCall = activeCallsMap.get(callId);

    if (activeCall) {
      activeCall.lastActivity = Date.now();
      
      const participant = activeCall.participants.get(userId.toString());
      if (participant) {
        participant.lastPing = Date.now();
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================
// OBTENIR LE STATUT D'UN APPEL
// ============================================
router.get("/calls/:callId/status", auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id || req.user.id || req.user.userId;

    const authorizedCall = await getCallForUser(callId, userId);
    if (!authorizedCall) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    const activeCall = activeCallsMap.get(callId);

    if (activeCall) {
      return res.json({
        success: true,
        active: true,
        status: activeCall.status,
        channelName: activeCall.channelName,
        callType: activeCall.callType,
        isGroup: activeCall.isGroup,
        startedAt: activeCall.startedAt,
        answeredAt: activeCall.answeredAt,
        participants: Array.from(activeCall.participants.entries()).map(
          ([id, data]) => ({ oduserId: id, ...data })
        ),
        participantsCount: activeCall.participants.size,
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

    const conversations = await Conversation.find({
      participants: userId,
    }).select("_id");

    const conversationIds = conversations.map((c) => c._id);

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

// Exporter les maps pour le socket handler
module.exports = router;
module.exports.activeCallsMap = activeCallsMap;
module.exports.conversationActiveCallsMap = conversationActiveCallsMap;
module.exports.endCallInternal = endCallInternal;
