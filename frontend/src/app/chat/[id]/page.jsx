"use client";

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { isSameDay } from "date-fns";
import { AuthContext } from "@/context/AuthProvider";
import {
  getConversation,
  getMessages,
  sendMessage,
  markMessagesAsDelivered,
  markConversationAsRead,
  getMessageReadBy,
  deleteMessageForMe,
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
  onCallMissed,
  onCallEnded,
} from "@/services/socket";
import { useSocket } from "@/hooks/useSocket";
import { useTheme } from "@/hooks/useTheme";

import { CallContext } from "@/context/Callcontext"; // Attention majuscule
import CallMessage from "@/components/Chat/CallMessage";
import StoryReplyMessage from "@/components/Chat/StoryReplyMessage";
import { useNotifications } from "@/context/NotificationContext";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import MainSidebar from "@/components/Layout/MainSidebar.client";
import Sidebar from "@/components/Layout/Sidebar";
import MobileHeader from "@/components/Layout/MobileHeader";
import ChatHeader from "@/components/Layout/ChatHeader";
import MessageBubble, { DateSeparator } from "@/components/Chat/MessageBubble";
import MessageInput from "@/components/Chat/MessageInput";
import TypingIndicator from "@/components/Chat/TypingIndicator";
import MessageSearch from "@/components/Chat/MessageSearch";
import { useSearchParams } from "next/navigation";

import TasksSidePanel from "@/components/Tasks/TasksSidePanel";

import {
  Plane,
  Users,
  Loader2,
  Phone,
  Video,
  Search,
  MoreVertical,
  ArrowLeft,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import { useMute } from "@/context/MuteContext";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();

  const hasInitiatedCall = useRef(false);
  const searchParams = useSearchParams();
  const { showNotification } = useNotifications();
  const { initiateCall } = useContext(CallContext);

  const { isMuted } = useMute();
  const isMutedRef = useRef(false);

  const conversationId = params.id;

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [contactId, setContactId] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const [replyingToId, setReplyingToId] = useState(null);
  const [replyingToContent, setReplyingToContent] = useState("");
  const [replyingToSender, setReplyingToSender] = useState(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isMarkingAsReadRef = useRef(false);

  const [isReadByOpen, setIsReadByOpen] = useState(false);
  const [readByUsers, setReadByUsers] = useState([]);
  const [readByLoading, setReadByLoading] = useState(false);

  useSocket();

  const handleOpenTasks = useCallback(() => {
    setIsTasksPanelOpen(true);
  }, []);

  const handleCloseTasks = useCallback(() => {
    setIsTasksPanelOpen(false);
  }, []);

  const handleGoToFullTasks = useCallback(() => {
    router.push(`/chat/${conversationId}/tasks`);
  }, [router, conversationId]);

  const handleShowReadBy = async (message) => {
    if (!conversation?.isGroup) return;

    const myId = user?._id || user?.id;
    const senderId = message.sender?._id || message.sender?.id;
    if (senderId !== myId) return;

    setIsReadByOpen(true);
    setReadByLoading(true);

    try {
      const res = await getMessageReadBy(message._id);
      const rawList = res.data.readBy || [];

      const uniqueList = [];
      const seenUserIds = new Set();

      rawList.forEach((item) => {
        const userId = item._id || item.user?._id || item.user;
        if (userId && !seenUserIds.has(userId)) {
          seenUserIds.add(userId);
          uniqueList.push(item);
        }
      });

      setReadByUsers(uniqueList);
    } catch (e) {
      console.error(e);
      setReadByUsers([]);
    } finally {
      setReadByLoading(false);
    }
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 50;

    setShouldAutoScroll(isNearBottom);
  };

  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
  };

  useEffect(() => {
    if (conversationId) {
      isMutedRef.current = isMuted(conversationId);
    }
  }, [conversationId, isMuted]);

  useEffect(() => {
    return () => {
      if (conversationId) {
        console.log("🚪 Quitter la conversation:", conversationId);
        leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    setShouldAutoScroll(true);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !user) return;

    let markReadTimeout;

    const loadConversation = async () => {
      try {
        setLoading(true);

        const convResponse = await getConversation(conversationId);
        setConversation(convResponse.data.conversation);

        const convData = convResponse.data.conversation;
        if (!convData.isGroup) {
          const userId = user._id || user.id;
          const otherParticipant = convData.participants?.find(
            (p) => p._id !== userId,
          );
          if (otherParticipant) setContactId(otherParticipant._id);
        }

        const messagesResponse = await getMessages(conversationId);
        const loadedMessages = messagesResponse.data.messages || [];
        setMessages(loadedMessages);

        setLoading(false);

        const socket = getSocket();
        if (socket) {
          joinConversation(conversationId);
        }

        markReadTimeout = setTimeout(async () => {
          if (isMarkingAsReadRef.current) return;
          if (document.hidden) return;

          isMarkingAsReadRef.current = true;

          try {
            const receivedMessageIds = loadedMessages
              .filter(
                (msg) =>
                  msg.sender._id !== (user._id || user.id) &&
                  msg.status === "sent",
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
      if (markReadTimeout) clearTimeout(markReadTimeout);
      isMarkingAsReadRef.current = false;
    };
  }, [conversationId, user]);

  useEffect(() => {
    const callType = searchParams.get("call");

    if (!callType || hasInitiatedCall.current) return;
    if (!conversation) return;

    if (!conversation.isGroup) {
      const userId = user?._id || user?.id;
      const otherParticipant = conversation.participants?.find(
        (p) => p._id !== userId,
      );
      if (!otherParticipant) return;
    }

    const startCall = async () => {
      hasInitiatedCall.current = true;
      await new Promise((resolve) => setTimeout(resolve, 800));

      try {
        if (callType === "audio") {
          if (conversation.isGroup) {
            const participants = conversation.participants.filter(
              (p) => p._id !== (user._id || user.id),
            );
            if (participants.length > 0) {
              initiateCall(
                conversationId,
                participants,
                "audio",
                true,
                conversation.groupName,
              );
            }
          } else {
            const userId = user?._id || user?.id;
            const otherParticipant = conversation.participants?.find(
              (p) => p._id !== userId,
            );
            if (otherParticipant) {
              initiateCall(conversationId, otherParticipant, "audio", false);
            }
          }
        } else if (callType === "video") {
          if (conversation.isGroup) {
            const participants = conversation.participants.filter(
              (p) => p._id !== (user._id || user.id),
            );
            if (participants.length > 0) {
              initiateCall(
                conversationId,
                participants,
                "video",
                true,
                conversation.groupName,
              );
            }
          } else {
            const userId = user?._id || user?.id;
            const otherParticipant = conversation.participants?.find(
              (p) => p._id !== userId,
            );
            if (otherParticipant) {
              initiateCall(conversationId, otherParticipant, "video", false);
            }
          }
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'initiation de l'appel:", error);
      }

      window.history.replaceState({}, "", `/chat/${conversationId}`);
    };

    startCall();
  }, [searchParams, conversation, user, conversationId, initiateCall]);

  useEffect(() => {
    const handleFocus = () => {
      if (conversationId && user) {
        setTimeout(() => {
          console.log("🎯 Focus fenêtre : Marquage conversation comme lue");
          markConversationAsRead(conversationId).catch((err) =>
            console.error(err),
          );
        }, 100);
      }
    };

    window.addEventListener("focus", handleFocus);
    if (document.hasFocus()) handleFocus();

    return () => window.removeEventListener("focus", handleFocus);
  }, [conversationId, user]);

  useEffect(() => {
    const socket = getSocket();

    if (socket && conversationId && user) {
      const currentUserId = user._id || user.id;

      onReceiveMessage((message) => {
        const msgConvId =
          typeof message.conversationId === "object"
            ? message.conversationId._id?.toString()
            : message.conversationId?.toString();

        if (msgConvId === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === message._id)) return prev;
            const next = [...prev, message].sort((a, b) => {
              return new Date(a.createdAt) - new Date(b.createdAt);
            });
            return next;
          });

          const senderId = message.sender._id || message.sender.id;

          if (senderId !== currentUserId) {
            if (!isMutedRef.current) {
              let notificationBody = "Nouveau message";
              if (message.type === "text")
                notificationBody = message.content?.slice(0, 50);
              else if (message.type === "image") notificationBody = "📷 Image";

              showNotification(message.sender?.name || "Nouveau message", {
                body: notificationBody,
                icon: message.sender?.profilePicture || "/default-avatar.png",
                tag: conversationId,
              });
            }

            markMessagesAsDelivered([message._id]);

            if (document.hasFocus() && !document.hidden) {
              markConversationAsRead(conversationId);
            }
          }
        }
      });

      onMessageStatusUpdated(({ messageIds, status, readByUserId }) => {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (messageIds.includes(msg._id)) {
              let updatedReadBy = msg.readBy || [];

              if (status === "read" && readByUserId) {
                const alreadyInList = updatedReadBy.some((r) => {
                  const rId = r._id || r.user?._id || r.user;
                  return rId === readByUserId;
                });

                if (!alreadyInList) {
                  updatedReadBy = [
                    ...updatedReadBy,
                    {
                      _id: readByUserId,
                      user: readByUserId,
                      name: "...",
                      readAt: new Date(),
                    },
                  ];
                }
              }

              return {
                ...msg,
                status: status,
                readBy: updatedReadBy,
              };
            }
            return msg;
          }),
        );
      });

      onConversationStatusUpdated(
        ({ conversationId: updatedConvId, status, userId }) => {
          if (updatedConvId === conversationId) {
            setMessages((prevMessages) =>
              prevMessages.map((msg) => {
                const isMyMessage =
                  (msg.sender._id || msg.sender) === currentUserId;
                if (isMyMessage && msg.status !== "read") {
                  return { ...msg, status: "read" };
                }
                if (userId && msg.status !== "read") {
                  return { ...msg, status: "read" };
                }
                return msg;
              }),
            );
          }
        },
      );

      onCallMissed((data) => {
        const newMessage = data.message || data;
        const msgConvId =
          typeof newMessage.conversationId === "object"
            ? newMessage.conversationId._id?.toString()
            : newMessage.conversationId?.toString();

        if (msgConvId === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
          setShouldAutoScroll(true);
        }
      });

      onCallEnded((data) => {
        const newMessage = data.message || data;
        const msgConvId =
          typeof newMessage.conversationId === "object"
            ? newMessage.conversationId._id?.toString()
            : newMessage.conversationId?.toString();

        if (msgConvId === conversationId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === newMessage._id)) return prev;
            return [...prev, newMessage];
          });
          setShouldAutoScroll(true);
        }
      });

      socket.off("message-deleted");
      socket.on("message-deleted", ({ messageId }) => {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      });

      socket.off("message-edited");
      socket.on(
        "message-edited",
        ({ messageId, content, isEdited, editedAt }) => {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId ? { ...m, content, isEdited, editedAt } : m,
            ),
          );
        },
      );

      onReactionUpdated(({ messageId, reactions }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
        );
      });

      onUserTyping(({ conversationId: cId, userId: uId }) => {
        if (cId === conversationId && uId !== currentUserId) {
          setTypingUsers((prev) =>
            prev.includes(uId) ? prev : [...prev, uId],
          );
        }
      });

      onUserStoppedTyping(({ conversationId: cId, userId: uId }) => {
        if (cId === conversationId) {
          setTypingUsers((prev) => prev.filter((id) => id !== uId));
        }
      });
    }
  }, [conversationId, user, showNotification]);

  useEffect(() => {
    if (!shouldAutoScroll || !messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers, shouldAutoScroll]);

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    const userId = user._id || user.id;
    return conversation.participants?.find((p) => p._id !== userId);
  };

  const contact = getOtherParticipant();

  const handleVideoCall = () => {
    if (!conversation) return;
    if (conversation.isGroup) {
      const participants = conversation.participants.filter(
        (p) => p._id !== (user._id || user.id),
      );
      if (participants.length === 0) return alert("Seul dans le groupe");
      initiateCall(
        conversationId,
        participants,
        "video",
        true,
        conversation.groupName,
      );
    } else if (contact) {
      initiateCall(conversationId, contact, "video", false);
    }
  };

  const handleAudioCall = () => {
    if (!conversation) return;
    if (conversation.isGroup) {
      const participants = conversation.participants.filter(
        (p) => p._id !== (user._id || user.id),
      );
      if (participants.length === 0) return alert("Seul dans le groupe");
      initiateCall(
        conversationId,
        participants,
        "audio",
        true,
        conversation.groupName,
      );
    } else if (contact) {
      initiateCall(conversationId, contact, "audio", false);
    }
  };

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
          }),
        );
        router.push(`/chat/${response.data.conversationId}`);
        return;
      }

      if (replyingToId) handleCancelReply();
      if (user) emitStopTyping(conversationId, user._id || user.id);
    } catch (error) {
      console.error("❌ Erreur envoi message:", error);
      alert("Erreur lors de l'envoi du message");
    }
  };

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

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      const response = await api.delete(`/messages/${messageId}`);
      if (response.data.success) console.log("✅ Message supprimé avec succès");
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      alert("Impossible de supprimer le message");
    }
  };

  const handleDeleteMessageForMe = async (messageId) => {
    try {
      const response = await deleteMessageForMe(messageId);
      if (response.data.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    } catch (error) {
      console.error("❌ Erreur suppression pour moi:", error);
      alert("Impossible de supprimer le message");
    }
  };

  const handleScheduleMessage = async (scheduleData) => {
    try {
      const response = await api.post("/messages/schedule", {
        conversationId,
        content: scheduleData.content,
        scheduledFor: scheduleData.scheduledFor,
        type: "text",
      });
      if (response.data.success) {
        const scheduledMessage = response.data.message;
        setMessages((prev) => [...prev, scheduledMessage]);
        alert(
          `✅ Message programmé pour ${new Date(scheduleData.scheduledFor).toLocaleString("fr-FR")}`,
        );
      }
    } catch (error) {
      console.error("❌ Erreur programmation:", error);
      alert("Impossible de programmer le message");
      throw error;
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
      console.error("❌ Erreur modification:", error);
      alert("Impossible de modifier le message");
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
      else throw new Error(response.data.error || "Erreur de traduction");
    } catch (error) {
      console.error("❌ Erreur traduction:", error);
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
    ? "bg-slate-800/90 border-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.6)]"
    : "bg-white/95 border-slate-200 shadow-[0_14px_40px_rgba(15,23,42,0.08)]";
  const textPrimary = isDark ? "text-slate-50" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600";
  const buttonStyle = isDark
    ? "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 shadow-sky-500/40"
    : "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 shadow-sky-500/40";
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
                className={`animate-spin rounded-full h-20 w-20 border-4 ${isDark ? "border-slate-700 border-t-sky-500" : "border-blue-200 border-t-blue-600"} shadow-xl`}
              ></div>
              <Plane
                className={`w-10 h-10 ${isDark ? "text-sky-400" : "text-blue-600"} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse`}
              />
            </div>
            <p
              className={`mt-6 font-bold text-lg ${isDark ? "text-sky-300" : "text-blue-800"}`}
            >
              Chargement de la conversation...
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
            className={`text-center max-w-md animate-fade-in p-8 rounded-3xl ${cardStyle} border`}
          >
            <h2 className={`text-2xl font-bold mb-3 ${textPrimary}`}>
              Conversation introuvable
            </h2>
            <button
              onClick={() => router.push("/")}
              className={`px-8 py-4 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl ${buttonStyle}`}
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={`flex h-[100dvh] w-full overflow-hidden ${pageBg}`}>
        {/* Sidebar visible uniquement sur Desktop */}
        <div className="hidden lg:block shrink-0">
          <MainSidebar />
        </div>

        <div className="flex flex-1 h-full overflow-hidden">
          {/* Liste conversations visible uniquement sur Desktop */}
          <div className="hidden lg:block w-80 xl:w-96 h-full border-r border-gray-200 dark:border-slate-700 shrink-0">
            <Sidebar activeConversationId={conversationId} />
          </div>

          {/* ZONE DE CHAT PRINCIPALE (Mobile & Desktop) */}
          <div className="flex-1 flex flex-col h-full relative min-w-0">
            {/* Header Mobile */}
            <div className="lg:hidden shrink-0 z-50">
              <MobileHeader
                contact={contact}
                conversation={conversation}
                onBack={() => router.push("/")}
                onVideoCall={handleVideoCall}
                onAudioCall={handleAudioCall}
                onSearchOpen={() => setIsSearchOpen(true)}
                onOpenTasks={handleOpenTasks}
              />
            </div>

            {/* Header Desktop */}
            <div className="hidden lg:block shrink-0 z-50">
              <ChatHeader
                contact={contact}
                conversation={conversation}
                onBack={() => router.push("/")}
                onSearchOpen={() => setIsSearchOpen(true)}
                onVideoCall={handleVideoCall}
                onAudioCall={handleAudioCall}
                onOpenTasks={handleOpenTasks}
              />
            </div>

            <MessageSearch
              conversationId={conversationId}
              onMessageSelect={scrollToMessage}
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
            />

            {/* LISTE DES MESSAGES (Scrollable) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 ${emptyChatBg} custom-scrollbar`}
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full animate-fade-in">
                  <div
                    className={`text-center max-w-sm p-8 rounded-3xl ${cardStyle} border`}
                  >
                    <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
                      Aucun message pour l&apos;instant
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
                        new Date(prevMessage.createdAt),
                      );

                    return (
                      <div
                        key={`${message._id}-${index}`}
                        id={`message-${message._id}`}
                        className="transition-all duration-300"
                      >
                        {showDateSeparator && (
                          <DateSeparator date={message.createdAt} />
                        )}
                        {message.type === "call" ? (
                          <div className="flex w-full mb-2 justify-center">
                            <CallMessage
                              message={message}
                              isMine={message.sender?._id === userId}
                              currentUserId={userId}
                            />
                          </div>
                        ) : message.type === "story_reaction" ? (
                          <div className="flex w-full mb-2 justify-center">
                            <div
                              className={`px-3 py-1.5 rounded-full text-xs ${isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}
                            >
                              {message.content}
                            </div>
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
                            onDeleteForMe={handleDeleteMessageForMe}
                            onClickMessage={() => handleShowReadBy(message)}
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

            {/* INPUT MESSAGE (Fixe en bas) */}
            <div className="shrink-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
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
                onSchedule={handleScheduleMessage}
              />
            </div>
          </div>

          {/* PANNEAU LATÉRAL DE TÂCHES */}
          <TasksSidePanel
            isOpen={isTasksPanelOpen}
            onClose={handleCloseTasks}
            conversationId={conversationId}
            conversation={conversation}
            onGoToFullTasks={handleGoToFullTasks}
          />

          {/* MODAL VU PAR */}
          {isReadByOpen && (
            <div
              className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setIsReadByOpen(false)}
            >
              <div
                className={`w-full max-w-sm rounded-2xl p-5 ${cardStyle} border shadow-2xl flex flex-col max-h-[80vh]`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-100 dark:border-gray-700">
                  <h3
                    className={`font-bold text-lg ${textPrimary} flex items-center gap-2`}
                  >
                    <Users className="w-5 h-5 text-blue-500" /> Vu par (
                    {readByUsers.length})
                  </h3>
                  <button
                    onClick={() => setIsReadByOpen(false)}
                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition ${textSecondary}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar pr-1">
                  {readByLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                      <p className={`text-sm ${textSecondary}`}>
                        Chargement...
                      </p>
                    </div>
                  ) : readByUsers.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className={`text-sm ${textSecondary}`}>
                        Personne n&lsquo;a encore vu ce message.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {readByUsers.map((u, index) => {
                        const uniqueId =
                          u._id || u.user?._id || u.user || `fallback-${index}`;
                        const displayName =
                          u.name || u.user?.name || "Utilisateur inconnu";
                        const displayPic =
                          u.profilePicture || u.user?.profilePicture;
                        const rawDate = u.readAt || new Date();
                        return (
                          <li
                            key={uniqueId}
                            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                          >
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-gray-100 dark:border-slate-600">
                              {displayPic ? (
                                <img
                                  src={displayPic}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold text-sm">
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold truncate ${textPrimary}`}
                              >
                                {displayName}
                              </p>
                              <p className="text-xs text-blue-400 dark:text-blue-300 flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                {rawDate
                                  ? new Date(rawDate).toLocaleDateString(
                                      "fr-FR",
                                      { hour: "2-digit", minute: "2-digit" },
                                    )
                                  : ""}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
