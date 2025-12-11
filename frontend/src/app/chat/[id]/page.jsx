"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { isSameDay } from "date-fns";
import { AuthContext } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { CallContext } from "@/context/CallContext";

import {
  getConversation,
  getMessages,
  sendMessage,
  markMessagesAsDelivered,
  markConversationAsRead,
} from "@/lib/api";
import api from "@/lib/api";
import {
  getSocket,
  joinConversation,
  leaveConversation,
  onReceiveMessage,
  emitTyping,
  emitStopTyping,
  onUserTyping,
  onUserStoppedTyping,
  onMessageStatusUpdated,
} from "@/services/socket";
import { useSocket } from "@/hooks/useSocket";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Sidebar from "@/components/Layout/Sidebar";
import MobileHeader from "@/components/Layout/MobileHeader";
import ChatHeader from "@/components/Layout/ChatHeader";
import MessageBubble, { DateSeparator } from "@/components/Chat/MessageBubble";
import MessageInput from "@/components/Chat/MessageInput";
import TypingIndicator from "@/components/Chat/TypingIndicator";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const { initiateCall } = useContext(CallContext);

  const conversationId = params.id;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { playMessageSound } = useNotifications();

  // --- GESTION DU MONTAGE (HYDRATION) ---
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- STYLES ---
  const pageBackgroundStyle = {
    background: isDark
      ? "linear-gradient(135deg, #020617, #020617, #0b1120)"
      : "linear-gradient(135deg, #dbeafe, #ffffff, #ecfeff)",
  };
  const messagesBackgroundStyle = {
    background: isDark
      ? "linear-gradient(to bottom, #020617, rgba(30,64,175,0.35), rgba(8,47,73,0.45))"
      : "linear-gradient(to bottom, #ffffff, rgba(219,234,254,0.3), rgba(236,254,255,0.3))",
  };
  const rootTextClass = isDark ? "text-slate-50" : "text-slate-900";

  // --- ÉTATS DU CHAT ---
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isMarkingAsReadRef = useRef(false);

  useSocket();

  // --- UTILITAIRES ---
  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    const userId = user._id || user.id;
    return conversation.participants?.find((p) => p._id !== userId);
  };
  const contact = getOtherParticipant();

  // ============================================================
  // 📞 HANDLERS POUR LANCER L'APPEL
  // ============================================================

  const handleVideoCall = () => {
    if (!conversation) {
      alert("Conversation introuvable.");
      return;
    }

    if (conversation.isGroup) {
      console.log("👥 Lancement appel groupe vidéo");

      const currentUserId = user._id || user.id;
      const otherParticipants = conversation.participants
        .filter((p) => p._id !== currentUserId)
        .map((p) => p._id);

      if (otherParticipants.length === 0) {
        alert("Aucun autre participant dans ce groupe.");
        return;
      }

      const channelName = `group_${Date.now()}_${conversationId}`;

      initiateCall(
        channelName,
        otherParticipants,
        "video",
        conversation.name || "Appel Groupe"
      );
    } else {
      console.log("👤 Lancement appel vidéo 1-to-1");

      if (contact) {
        const channelName = `call_${conversationId}_${Date.now()}`;
        initiateCall(channelName, contact._id, "video", null, conversationId);
      } else {
        alert("Impossible d'appeler : contact introuvable.");
      }
    }
  };

  const handleAudioCall = () => {
    if (!conversation) {
      alert("Conversation introuvable.");
      return;
    }

    if (conversation.isGroup) {
      console.log("👥 Lancement appel groupe audio");

      const currentUserId = user._id || user.id;
      const otherParticipants = conversation.participants
        .filter((p) => p._id !== currentUserId)
        .map((p) => p._id);

      if (otherParticipants.length === 0) {
        alert("Aucun autre participant dans ce groupe.");
        return;
      }

      const channelName = `group_${Date.now()}_${conversationId}`;

      initiateCall(
        channelName,
        otherParticipants,
        "audio",
        conversation.name || "Appel Groupe"
      );
    } else {
      console.log("👤 Lancement appel audio 1-to-1");

      if (contact) {
        const channelName = `call_${conversationId}_${Date.now()}`;
        initiateCall(channelName, contact._id, "audio", null, conversationId);
      } else {
        alert("Impossible d'appeler : contact introuvable.");
      }
    }
  };

  // ============================================================
  // 💬 LOGIQUE CHAT COMPLETE
  // ============================================================

  // 1. Rejoindre/Quitter la room Socket
  useEffect(() => {
    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  // 2. Chargement initial (Conversation + Messages + Read Status)
  useEffect(() => {
    if (!conversationId || !user) return;

    const loadConversation = async () => {
      try {
        setLoading(true);

        const convResponse = await getConversation(conversationId);
        setConversation(convResponse.data.conversation);

        const messagesResponse = await getMessages(conversationId);
        const loadedMessages = messagesResponse.data.messages || [];
        setMessages(loadedMessages);

        setLoading(false);

        const socket = getSocket();
        if (socket) {
          joinConversation(conversationId);
        }

        // Marquer comme lu
        setTimeout(async () => {
          if (isMarkingAsReadRef.current) return;
          isMarkingAsReadRef.current = true;

          try {
            const receivedMessageIds = loadedMessages
              .filter(
                (msg) =>
                  msg.sender._id !== (user._id || user.id) &&
                  msg.status === "sent"
              )
              .map((msg) => msg._id);

            if (receivedMessageIds.length > 0) {
              await markMessagesAsDelivered(receivedMessageIds);
            }

            await markConversationAsRead(conversationId);
          } catch (error) {
            console.error("❌ Erreur marquage:", error);
          } finally {
            isMarkingAsReadRef.current = false;
          }
        }, 500);
      } catch (error) {
        console.error("Erreur chargement conversation:", error);
        setLoading(false);
      }
    };

    loadConversation();

    return () => {
      isMarkingAsReadRef.current = false;
    };
  }, [conversationId, user]);

  // 3. Écouteurs Socket en temps réel (Messages, Typing, Status)
  useEffect(() => {
    const socket = getSocket();

    if (socket && conversationId && user) {
      // Réception message
      onReceiveMessage((message) => {
        const currentUserId = user._id || user.id;
        const isFromMe = message.sender._id === currentUserId;

        if (!isFromMe) {
          playMessageSound();
        }

        if (message.conversationId === conversationId) {
          setMessages((prev) => {
            const exists = prev.some((m) => m._id === message._id);
            if (exists) return prev;
            return [...prev, message];
          });

          if (!isFromMe) {
            markMessagesAsDelivered([message._id])
              .then(() => markConversationAsRead(conversationId))
              .catch((err) => console.error("❌ Erreur marquage:", err));
          }
        }
      });

      // Mise à jour statut (envoyé/lu)
      onMessageStatusUpdated(({ messageIds, status }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            messageIds.includes(msg._id) ? { ...msg, status } : msg
          )
        );
      });

      // Typing Started
      onUserTyping(({ conversationId: typingConvId, userId }) => {
        const currentUserId = user._id || user.id;
        if (typingConvId === conversationId && userId !== currentUserId) {
          setTypingUsers((prev) => {
            if (!prev.includes(userId)) {
              return [...prev, userId];
            }
            return prev;
          });
        }
      });

      // Typing Stopped
      onUserStoppedTyping(({ conversationId: typingConvId, userId }) => {
        const currentUserId = user._id || user.id;
        if (typingConvId === conversationId && userId !== currentUserId) {
          setTypingUsers((prev) => prev.filter((id) => id !== userId));
        }
      });
    }
  }, [conversationId, user, playMessageSound]);

  // 4. Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // 5. Envoi de message (Texte / Audio / Fichier)
  const handleSendMessage = async (content) => {
    try {
      let messageData;

      // Cas Audio
      if (typeof content === "object" && content.isVoiceMessage) {
        const formData = new FormData();
        formData.append("audio", content.audioBlob, "voice-message.webm");
        formData.append("conversationId", conversationId);
        formData.append("duration", content.duration);

        await api.post("/audio", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return;
      }

      // Cas Fichier
      if (typeof content === "object") {
        messageData = {
          conversationId,
          type: content.type,
          fileUrl: content.fileUrl,
          fileName: content.fileName,
          fileSize: content.fileSize,
          content: content.content || "",
        };
      } else {
        // Cas Texte
        messageData = {
          conversationId,
          content: content.trim(),
          type: "text",
        };
      }

      await sendMessage(messageData);

      if (user) {
        const userId = user._id || user.id;
        emitStopTyping(conversationId, userId);
      }
    } catch (error) {
      console.error("❌ Erreur envoi message:", error);
      alert("Erreur lors de l'envoi du message");
    }
  };

  // 6. Gestion Typing
  const handleTyping = () => {
    if (!user) return;
    const userId = user._id || user.id;
    emitTyping(conversationId, userId);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(conversationId, userId);
    }, 2000);
  };

  const handleStopTyping = () => {
    if (!user) return;
    const userId = user._id || user.id;
    clearTimeout(typingTimeoutRef.current);
    emitStopTyping(conversationId, userId);
  };

  // ============================================================
  // ✅ FILTRE LES APPELS ENTRANTS PAR CONVERSATION
  // ============================================================
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    // Intercepte les appels et vérifie que c'est pour cette conversation
    const originalEmit = socket.emit;

    // Note: On ne peut pas vraiment intercepter ici car on est côté client
    // Le vrai filtre se fait dans CallContext via data.conversationId
    // Mais on log juste pour debug
    console.log(`📞 Page active pour conversation: ${conversationId}`);

    return () => {};
  }, [conversationId]);

  // ============================================================
  // 🖥️ RENDU
  // ============================================================

  if (loading) {
    return (
      <ProtectedRoute>
        <div
          className="flex h-screen items-center justify-center"
          style={mounted ? pageBackgroundStyle : undefined}
        >
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!conversation || (!conversation.isGroup && !contact)) {
    return (
      <ProtectedRoute>
        <div
          className="flex h-screen items-center justify-center"
          style={mounted ? pageBackgroundStyle : undefined}
        >
          <div className="text-center">Conversation introuvable</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div
        className={`flex h-screen ${rootTextClass}`}
        style={mounted ? pageBackgroundStyle : undefined}
      >
        <div className="hidden lg:block">
          <Sidebar activeConversationId={conversationId} />
        </div>

        <div className="flex-1 flex flex-col">
          {/* HEADER MOBILE */}
          <div className="lg:hidden">
            <MobileHeader
              contact={contact}
              conversation={conversation}
              onBack={() => router.push("/")}
              onVideoCall={handleVideoCall}
              onAudioCall={handleAudioCall}
            />
          </div>

          {/* HEADER DESKTOP */}
          <div className="hidden lg:block">
            <ChatHeader
              contact={contact}
              conversation={conversation}
              onBack={() => router.push("/")}
              onVideoCall={handleVideoCall}
              onAudioCall={handleAudioCall}
            />
          </div>

          {/* LISTE DES MESSAGES */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={mounted ? messagesBackgroundStyle : undefined}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p>Aucun message pour l&rsquo;instant</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const userId = user?._id || user?.id;
                  const prevMessage = messages[index - 1];
                  const isLast = index === messages.length - 1;

                  const showDateSeparator =
                    !prevMessage ||
                    !isSameDay(
                      new Date(message.createdAt),
                      new Date(prevMessage.createdAt)
                    );

                  return (
                    <div key={message._id}>
                      {showDateSeparator && (
                        <DateSeparator date={message.createdAt} />
                      )}
                      <MessageBubble
                        message={message}
                        isMine={message.sender?._id === userId}
                        isGroup={conversation?.isGroup || false}
                        isLast={isLast}
                      />
                    </div>
                  );
                })}

                {typingUsers.length > 0 && (
                  <TypingIndicator contactName={contact?.name || "Quelqu'un"} />
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* INPUT */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
