"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { isSameDay } from "date-fns";
import { AuthContext } from "@/context/AuthProvider";
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
  onConversationStatusUpdated,
  onReactionUpdated,
} from "@/services/socket";
import { useSocket } from "@/hooks/useSocket";
import { useTheme } from "@/hooks/useTheme";
// ✅ AJOUTS POUR LES APPELS
import { CallContext } from "@/context/Callcontext";
import CallMessage from "@/components/Chat/CallMessage";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import Sidebar from "@/components/Layout/Sidebar";
import MobileHeader from "@/components/Layout/MobileHeader";
import ChatHeader from "@/components/Layout/ChatHeader";
import MessageBubble, { DateSeparator } from "@/components/Chat/MessageBubble";
import MessageInput from "@/components/Chat/MessageInput";
import TypingIndicator from "@/components/Chat/TypingIndicator";
import { Plane, Users, Loader2 } from "lucide-react";
import StoryReplyMessage from "@/components/Chat/StoryReplyMessage";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();

  // ✅ RÉCUPÉRATION DE LA FONCTION D'APPEL
  const { initiateCall } = useContext(CallContext);

  const conversationId = params.id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [contactId, setContactId] = useState(null);

  // États pour la modification
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  // États pour la réponse
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyingToContent, setReplyingToContent] = useState("");
  const [replyingToSender, setReplyingToSender] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isMarkingAsReadRef = useRef(false);

  useSocket();

  // Cleanup
  useEffect(() => {
    return () => {
      if (conversationId) {
        console.log("🚪 Quitter la conversation:", conversationId);
        leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        const convResponse = await getConversation(conversationId);
        setConversation(convResponse.data.conversation);

        // Extraire l'ID du contact
        const convData = convResponse.data.conversation;
        if (!convData.isGroup) {
          const userId = user._id || user.id;
          const otherParticipant = convData.participants?.find(
            (p) => p._id !== userId
          );
          if (otherParticipant) {
            setContactId(otherParticipant._id);
          }
        }

        const messagesResponse = await getMessages(conversationId);
        const loadedMessages = messagesResponse.data.messages || [];
        setMessages(loadedMessages);
        setLoading(false);

        const socket = getSocket();
        if (socket) {
          joinConversation(conversationId);
        }

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

  useEffect(() => {
    const socket = getSocket();
    if (socket && conversationId && user) {
      onReceiveMessage((message) => {
        if (message.conversationId === conversationId) {
          setMessages((prev) => {
            const exists = prev.some((m) => m._id === message._id);
            if (exists) return prev;
            return [...prev, message];
          });
          const userId = user._id || user.id;
          if (message.sender._id !== userId) {
            markMessagesAsDelivered([message._id])
              .then(() => markConversationAsRead(conversationId))
              .catch((err) => console.error("❌ Erreur marquage:", err));
          }
        }
      });

      onMessageStatusUpdated(({ messageIds, status }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            messageIds.includes(msg._id) ? { ...msg, status } : msg
          )
        );
      });

      onConversationStatusUpdated(
        ({ conversationId: updatedConvId, status }) => {
          console.log("📊 Statut conversation mis à jour:", {
            conversationId: updatedConvId,
            status,
          });
        }
      );

      socket.off("message-deleted");
      socket.on(
        "message-deleted",
        ({ messageId, conversationId: deletedConvId }) => {
          if (deletedConvId === conversationId || !deletedConvId) {
            setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
          }
        }
      );

      socket.off("message-edited");
      socket.on(
        "message-edited",
        ({ messageId, content, isEdited, editedAt }) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? { ...msg, content, isEdited, editedAt }
                : msg
            )
          );
        }
      );

      onReactionUpdated(({ messageId, reactions }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId ? { ...msg, reactions } : msg
          )
        );
      });

      onUserTyping(({ conversationId: typingConvId, userId }) => {
        const currentUserId = user._id || user.id;
        if (typingConvId === conversationId && userId !== currentUserId) {
          setTypingUsers((prev) =>
            !prev.includes(userId) ? [...prev, userId] : prev
          );
        }
      });

      onUserStoppedTyping(({ conversationId: typingConvId, userId }) => {
        const currentUserId = user._id || user.id;
        if (typingConvId === conversationId && userId !== currentUserId) {
          setTypingUsers((prev) => prev.filter((id) => id !== userId));
        }
      });
    }
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // ========================================
  // ✅ NOUVELLES FONCTIONS POUR LES APPELS
  // ========================================
  const handleVideoCall = () => {
    if (!conversation) return;
    const channel = `call_${conversationId}_${Date.now()}`;

    if (conversation.isGroup) {
      // Pour un groupe, on passe la LISTE COMPLÈTE des objets participants
      const participants = conversation.participants.filter(
        (p) => p._id !== (user._id || user.id)
      );
      if (participants.length === 0) return alert("Seul dans le groupe");

      // (Channel, Array of Objects, Type, isGroup, GroupName, ConvID)
      initiateCall(
        channel,
        participants,
        "video",
        true,
        conversation.groupName,
        conversationId
      );
    } else if (contact) {
      // Pour P2P, on passe l'OBJET CONTACT (pas un tableau)
      // (Channel, Contact Object, Type, isGroup, GroupName, ConvID)
      initiateCall(channel, contact, "video", false, "", conversationId);
    }
  };

  const handleAudioCall = () => {
    if (!conversation) return;
    const channel = `call_${conversationId}_${Date.now()}`;

    if (conversation.isGroup) {
      const participants = conversation.participants.filter(
        (p) => p._id !== (user._id || user.id)
      );
      if (participants.length === 0) return alert("Seul dans le groupe");
      initiateCall(
        channel,
        participants,
        "audio",
        true,
        conversation.groupName,
        conversationId
      );
    } else if (contact) {
      initiateCall(channel, contact, "audio", false, "", conversationId);
    }
  };

  // ========================================
  // FONCTIONS EXISTANTES (SEND, EDIT, DELETE...)
  // ========================================
  const handleSendMessage = async (content) => {
    try {
      let messageData;
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
        messageData = {
          conversationId,
          content: content.trim(),
          type: "text",
          ...(replyingToId && {
            replyTo: replyingToId,
            replyToContent: replyingToContent,
            replyToSender: replyingToSender?._id || replyingToSender,
          }),
        };
      }
      const response = await sendMessage(messageData);

      if (
        response.data.conversationId &&
        response.data.conversationId !== conversationId
      ) {
        window.dispatchEvent(
          new CustomEvent("refresh-sidebar-conversations", {
            detail: { newConversationId: response.data.conversationId },
          })
        );
        router.push(`/chat/${response.data.conversationId}`);
        return;
      }
      if (replyingToId) handleCancelReply();
      if (user) emitStopTyping(conversationId, user._id || user.id);
    } catch (error) {
      console.error("❌ Erreur envoi:", error);
      alert("Erreur envoi");
    }
  };

  const handleTyping = () => {
    if (!user) return;
    emitTyping(conversationId, user._id || user.id);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => emitStopTyping(conversationId, user._id || user.id),
      2000
    );
  };
  const handleStopTyping = () => {
    if (!user) return;
    clearTimeout(typingTimeoutRef.current);
    emitStopTyping(conversationId, user._id || user.id);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
    }
  };

  const handleEditMessage = (messageId, currentContent) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
  };
  const handleConfirmEdit = async (newContent) => {
    if (!editingMessageId || !newContent.trim()) {
      setEditingMessageId(null);
      setEditingContent("");
      return;
    }
    try {
      const response = await api.put(`/messages/${editingMessageId}`, {
        content: newContent.trim(),
      });
      if (response.data.success) {
        setEditingMessageId(null);
        setEditingContent("");
      }
    } catch (error) {
      console.error("❌ Erreur modif:", error);
    }
  };
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleTranslateMessage = async (content, messageId, targetLang) => {
    try {
      const response = await api.post(`/messages/${messageId}/translate`, {
        targetLang,
      });
      if (response.data.success) return response.data.translatedContent;
      throw new Error(response.data.error || "Erreur");
    } catch (error) {
      console.error("❌ Erreur trad:", error);
      throw error;
    }
  };

  const handleReplyMessage = (messageId, content, sender) => {
    setReplyingToId(messageId);
    setReplyingToContent(content);
    setReplyingToSender(sender);
  };
  const handleCancelReply = () => {
    setReplyingToId(null);
    setReplyingToContent("");
    setReplyingToSender(null);
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    const userId = user._id || user.id;
    return conversation.participants?.find((p) => p._id !== userId);
  };
  const contact = getOtherParticipant();

  // Styles
  const pageBg = isDark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100";
  const loadingBg = isDark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100";
  const errorBg = isDark
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100";
  const emptyChatBg = isDark
    ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
    : "bg-gradient-to-b from-white via-sky-50/30 to-cyan-50/30";
  const cardStyle = isDark
    ? "bg-slate-800/90 border-slate-700"
    : "bg-white/95 border-slate-200";
  const textPrimary = isDark ? "text-slate-50" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600";
  const buttonStyle = isDark
    ? "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400"
    : "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400";
  const iconStyle = isDark
    ? "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700"
    : "bg-gradient-to-br from-white to-sky-50 border-blue-200";

  if (loading) {
    return (
      <ProtectedRoute>
        <div
          className={`flex h-screen items-center justify-center ${loadingBg}`}
        >
          <div className="text-center animate-fade-in">
            <div className="relative inline-block">
              <div
                className={`animate-spin rounded-full h-20 w-20 border-4 ${
                  isDark
                    ? "border-slate-700 border-t-sky-500"
                    : "border-blue-200 border-t-blue-600"
                } shadow-xl`}
              ></div>
              <Plane
                className={`w-10 h-10 ${
                  isDark ? "text-sky-400" : "text-blue-600"
                } absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse`}
              />
            </div>
            <p
              className={`mt-6 font-bold text-lg ${
                isDark ? "text-sky-300" : "text-blue-800"
              }`}
            >
              Chargement...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!conversation || (!conversation.isGroup && !contact)) {
    return (
      <ProtectedRoute>
        <div className={`flex h-screen items-center justify-center ${errorBg}`}>
          <div
            className={`text-center max-w-md p-8 rounded-3xl ${cardStyle} border`}
          >
            <h2 className={`text-2xl font-bold mb-3 ${textPrimary}`}>
              Conversation introuvable
            </h2>
            <button
              onClick={() => router.push("/")}
              className={`px-8 py-4 text-white rounded-2xl font-bold ${buttonStyle}`}
            >
              Retour
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={`flex h-screen ${pageBg}`}>
        <MainSidebar />
        <div className="flex flex-1">
          <div className="hidden lg:block">
            <Sidebar activeConversationId={conversationId} />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="lg:hidden">
              {/* ✅ HEADER MOBILE AVEC HANDLERS */}
              <MobileHeader
                contact={contact}
                conversation={conversation}
                onBack={() => router.push("/")}
                onVideoCall={handleVideoCall}
                onAudioCall={handleAudioCall}
              />
            </div>
            <div className="hidden lg:block">
              {/* ✅ HEADER DESKTOP AVEC HANDLERS */}
              <ChatHeader
                contact={contact}
                conversation={conversation}
                onBack={() => router.push("/")}
                onVideoCall={handleVideoCall}
                onAudioCall={handleAudioCall}
              />
            </div>

            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 ${emptyChatBg} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full animate-fade-in">
                  <div
                    className={`text-center max-w-sm p-8 rounded-3xl ${cardStyle} border`}
                  >
                    <div
                      className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-2 ${iconStyle}`}
                    >
                      {conversation.isGroup ? (
                        <Users
                          className={`w-12 h-12 ${
                            isDark ? "text-purple-400" : "text-purple-600"
                          }`}
                        />
                      ) : (
                        <Plane
                          className={`w-12 h-12 ${
                            isDark ? "text-sky-400" : "text-blue-600"
                          } -rotate-45`}
                        />
                      )}
                    </div>
                    <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                      Aucun message
                    </p>
                  </div>
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

                        {/* ✅ AFFICHAGE HISTORIQUE APPEL */}
                        {message.type === "call" ? (
                          <div
                            className={`flex w-full mb-2 ${
                              message.sender?._id === userId
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <CallMessage
                              message={message}
                              isMine={message.sender?._id === userId}
                            />
                          </div>
                        ) : /* ✅ AJOUT ICI : REPONSE STORY */
                        message.type === "story_reply" ? (
                          <div
                            className={`flex w-full mb-2 ${
                              message.sender?._id === userId
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <StoryReplyMessage
                              message={message}
                              isMine={message.sender?._id === userId}
                            />
                          </div>
                        ) : (
                          <MessageBubble
                            message={message}
                            isMine={message.sender?._id === userId}
                            isGroup={conversation?.isGroup || false}
                            isLast={isLast}
                            onDelete={handleDeleteMessage}
                            onEdit={handleEditMessage}
                            onTranslate={handleTranslateMessage}
                            onReply={handleReplyMessage}
                          />
                        )}
                      </div>
                    );
                  })}
                  {typingUsers.length > 0 && (
                    <TypingIndicator
                      contactName={contact?.name || "Quelqu'un"}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              conversationId={conversationId}
              contactId={contactId}
              editingMessageId={editingMessageId}
              editingContent={editingContent}
              onConfirmEdit={handleConfirmEdit}
              onCancelEdit={handleCancelEdit}
              replyingToId={replyingToId}
              replyingToContent={replyingToContent}
              replyingToSender={replyingToSender}
              onCancelReply={handleCancelReply}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
