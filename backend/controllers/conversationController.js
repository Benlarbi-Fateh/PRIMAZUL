const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Message = require("../models/Message");
const Contact = require("../models/Contact");
const BlockedUser = require("../models/BlockedUser");
const mongoose = require("mongoose");

exports.getConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // 1️⃣ Optimisation : Récupérer Bloqués et Contacts en parallèle (Index Only)
    const [blockedDocs, contactsDocs] = await Promise.all([
      BlockedUser.find({
        $or: [{ userId: userId }, { blockedUserId: userId }],
      })
        .select("userId blockedUserId")
        .lean(),
      Contact.find({ owner: userId }).select("contact").lean(),
    ]);

    // Création de Sets pour accès O(1) instantané
    const blockedSet = new Set();
    blockedDocs.forEach((b) => {
      blockedSet.add(b.userId.toString());
      blockedSet.add(b.blockedUserId.toString());
    });

    const contactSet = new Set(contactsDocs.map((c) => c.contact.toString()));

    // 2️⃣ PIPELINE D'AGRÉGATION MONGODB
    const conversations = await Conversation.aggregate([
      // A. Filtrer les conversations où je suis participant
      { $match: { participants: userId } },

      // B. Exclure les conversations archivées par moi
      {
        $match: {
          "archivedBy.userId": { $ne: userId },
        },
      },

      // C. Récupérer le dernier message (Optimisé)
      {
        $lookup: {
          from: "messages",
          localField: "lastMessage",
          foreignField: "_id",
          as: "lastMessageDetails",
        },
      },
      {
        $unwind: {
          path: "$lastMessageDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // D. Populer les participants (Nom, Photo, Online)
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                profilePicture: 1,
                isOnline: 1,
                lastSeen: 1,
              },
            },
          ],
          as: "participantsDetails",
        },
      },

      // E. Populer l'expéditeur du dernier message
      {
        $lookup: {
          from: "users",
          localField: "lastMessageDetails.sender",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "senderDetails",
        },
      },
      {
        $addFields: {
          "lastMessageDetails.sender": { $arrayElemAt: ["$senderDetails", 0] },
        },
      },

      // F. COMPTER LES MESSAGES NON LUS (Complexe mais performant)
      {
        $lookup: {
          from: "messages",
          let: { convId: "$_id", deletedArr: "$deletedBy" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversationId", "$$convId"] }, // Même conversation
                    { $ne: ["$sender", userId] }, // Pas mes messages
                    { $ne: ["$status", "read"] }, // Pas encore lus
                    {
                      $not: { $in: [userId, { $ifNull: ["$deletedFor", []] }] },
                    }, // Pas supprimés pour moi

                    // Gérer "Vider la discussion" (Soft Delete)
                    {
                      $gte: [
                        "$createdAt",
                        {
                          $let: {
                            vars: {
                              userDel: {
                                $filter: {
                                  input: { $ifNull: ["$$deletedArr", []] },
                                  as: "del",
                                  cond: { $eq: ["$$del.userId", userId] },
                                },
                              },
                            },
                            in: {
                              $ifNull: [
                                { $arrayElemAt: ["$$userDel.deletedAt", 0] },
                                new Date(0),
                              ],
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "unreadInfo",
        },
      },
      {
        $addFields: {
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ["$unreadInfo.count", 0] }, 0],
          },
          participants: "$participantsDetails",
          lastMessage: "$lastMessageDetails",
        },
      },

      // Nettoyage final
      {
        $project: {
          unreadInfo: 0,
          participantsDetails: 0,
          lastMessageDetails: 0,
          senderDetails: 0,
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    // 3️⃣ FILTRAGE FINAL (Logique métier complexe en RAM, mais sur un dataset réduit)
    const visibleConversations = [];

    for (const conv of conversations) {
      // Groupes toujours visibles
      if (conv.isGroup) {
        visibleConversations.push(conv);
        continue;
      }

      // Logique 1-1
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString(),
      );

      if (!otherParticipant) continue;

      const otherId = otherParticipant._id.toString();

      // Vérif Blocage (Rapide grâce au Set)
      if (blockedSet.has(otherId)) {
        continue;
      }

      // Vérif Contact (Rapide grâce au Set) - Si pas contact, on cache sauf si message existant
      if (!contactSet.has(otherId) && !conv.lastMessage) {
        continue;
      }

      // Gestion de l'affichage du dernier message après "Vider la discussion"
      if (conv.lastMessage) {
        const myDeletion = conv.deletedBy?.find(
          (d) => d.userId.toString() === userId.toString(),
        );

        if (
          myDeletion &&
          new Date(conv.lastMessage.createdAt) <= new Date(myDeletion.deletedAt)
        ) {
          conv.lastMessage = null; // On cache le vieux message
        }
      }

      visibleConversations.push(conv);
    }

    res.json({
      success: true,
      conversations: visibleConversations,
    });
  } catch (error) {
    console.error("❌ Erreur getConversations:", error);
    res.status(500).json({ error: error.message });
  }
};

// ========================================
// GARDEZ CES FONCTIONS EXISTANTES TELLES QUELLES (NON OPTIMISÉES MAIS FONCTIONNELLES)
// ========================================

exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.body;

    if (!contactId)
      return res.status(400).json({ error: "Contact ID manquant" });

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, contactId], $size: 2 },
      isGroup: false,
    }).populate("participants", "name email profilePicture isOnline lastSeen");

    let restored = false;

    if (conversation) {
      const wasDeletedByMe = conversation.deletedBy?.some(
        (item) => item.userId && item.userId.toString() === userId.toString(),
      );

      if (wasDeletedByMe) {
        conversation.deletedBy = conversation.deletedBy.filter(
          (item) =>
            !item.userId || item.userId.toString() !== userId.toString(),
        );
        await conversation.save();
        restored = true;
      }
      return res.json({ success: true, conversation, restored });
    }

    conversation = new Conversation({
      participants: [userId, contactId],
      isGroup: false,
      deletedBy: [],
    });
    await conversation.save();
    await conversation.populate(
      "participants",
      "name email profilePicture isOnline lastSeen",
    );

    res.json({ success: true, conversation, isNew: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findById(id)
      .populate("participants", "name email profilePicture isOnline lastSeen")
      .populate("groupAdmin", "name email profilePicture")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name" },
      });

    if (!conversation)
      return res.status(404).json({ error: "Conversation non trouvée" });

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === userId.toString(),
    );

    if (!isParticipant) return res.status(403).json({ error: "Accès refusé" });

    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants.find(
        (p) => p._id.toString() !== userId.toString(),
      );

      if (otherParticipant) {
        const isBlocked = await BlockedUser.findOne({
          $or: [
            { userId: userId, blockedUserId: otherParticipant._id },
            { userId: otherParticipant._id, blockedUserId: userId },
          ],
        });

        if (isBlocked) {
          return res.status(403).json({
            error: "Conversation inaccessible - Utilisateur bloqué",
            blocked: true,
          });
        }
      }
    }

    res.json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
