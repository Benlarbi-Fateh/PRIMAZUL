'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isSameDay } from 'date-fns';
import { AuthContext } from '@/context/AuthProvider';
import { getConversation, getMessages, sendMessage, markMessagesAsDelivered, markConversationAsRead } from '@/lib/api';
import api from '@/lib/api';
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
  onReactionUpdated
} from '@/services/socket';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/hooks/useTheme';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import MainSidebar from '@/components/Layout/MainSidebar.client';
import Sidebar from '@/components/Layout/Sidebar';
import MobileHeader from '@/components/Layout/MobileHeader';
import ChatHeader from '@/components/Layout/ChatHeader';
import MessageBubble, { DateSeparator } from '@/components/Chat/MessageBubble';
import MessageInput from '@/components/Chat/MessageInput';
import TypingIndicator from '@/components/Chat/TypingIndicator';
import { Plane, Users, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const conversationId = params.id;
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isMarkingAsReadRef = useRef(false);

  useSocket();

  useEffect(() => {
    return () => {
      if (conversationId) {
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
              .filter(msg => msg.sender._id !== (user._id || user.id) && msg.status === 'sent')
              .map(msg => msg._id);
            
            if (receivedMessageIds.length > 0) {
              await markMessagesAsDelivered(receivedMessageIds);
            }

            await markConversationAsRead(conversationId);
          } catch (error) {
            console.error('❌ Erreur marquage:', error);
          } finally {
            isMarkingAsReadRef.current = false;
          }
        }, 500);
        
      } catch (error) {
        console.error('Erreur chargement conversation:', error);
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
            const exists = prev.some(m => m._id === message._id);
            if (exists) return prev;
            return [...prev, message];
          });

          const userId = user._id || user.id;
          if (message.sender._id !== userId) {
            markMessagesAsDelivered([message._id])
              .then(() => markConversationAsRead(conversationId))
              .catch(err => console.error('❌ Erreur marquage:', err));
          }
        }
      });

      onMessageStatusUpdated(({ messageIds, status }) => {
        setMessages((prevMessages) => 
          prevMessages.map(msg => 
            messageIds.includes(msg._id) 
              ? { ...msg, status } 
              : msg
          )
        );
      });

      onConversationStatusUpdated(({ conversationId: updatedConvId, status }) => {
        console.log('📊 Statut conversation mis à jour:', { conversationId: updatedConvId, status });
      });

      onReactionUpdated(({ messageId, reactions }) => {
        setMessages((prevMessages) =>
          prevMessages.map(msg =>
            msg._id === messageId
              ? { ...msg, reactions }
              : msg
          )
        );
      });

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

      onUserStoppedTyping(({ conversationId: typingConvId, userId }) => {
        const currentUserId = user._id || user.id;
        if (typingConvId === conversationId && userId !== currentUserId) {
          setTypingUsers((prev) => prev.filter((id) => id !== userId));
        }
      });
    }
  }, [conversationId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = async (content) => {
    try {
      let messageData;

      if (typeof content === 'object' && content.isVoiceMessage) {
        const formData = new FormData();
        formData.append('audio', content.audioBlob, 'voice-message.webm');
        formData.append('conversationId', conversationId);
        formData.append('duration', content.duration);

        await api.post('/audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return;
      }

      if (typeof content === 'object') {
        messageData = {
          conversationId,
          type: content.type,
          fileUrl: content.fileUrl,
          fileName: content.fileName,
          fileSize: content.fileSize,
          content: content.content || ''
        };
      } else {
        messageData = {
          conversationId,
          content: content.trim(),
          type: 'text'
        };
      }
      
      await sendMessage(messageData);
      
      if (user) {
        const userId = user._id || user.id;
        emitStopTyping(conversationId, userId);
      }
      
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
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

  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    const userId = user._id || user.id;
    return conversation.participants?.find(p => p._id !== userId);
  };

  const contact = getOtherParticipant();

  // Styles basés sur le thème (mêmes couleurs que settings)
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

  const chatContainerBg = isDark
    ? "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
    : "bg-gradient-to-b from-white via-sky-50/30 to-cyan-50/30";

  const cardStyle = isDark
    ? "bg-slate-800/90 border-slate-700 shadow-[0_18px_45px_rgba(15,23,42,0.6)]"
    : "bg-white/95 border-slate-200 shadow-[0_14px_40px_rgba(15,23,42,0.08)]";

  const textPrimary = isDark ? "text-slate-50" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-600";
  const textMuted = isDark ? "text-slate-500" : "text-slate-500";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 shadow-sky-500/40"
    : "bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 shadow-sky-500/40";

  const iconStyle = isDark
    ? "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700"
    : "bg-gradient-to-br from-white to-sky-50 border-blue-200";

  if (loading) {
    return (
      <ProtectedRoute>
        <div className={`flex h-screen items-center justify-center ${loadingBg}`}>
          <div className="text-center animate-fade-in">
            <div className="relative inline-block">
              <div className={`animate-spin rounded-full h-20 w-20 border-4 ${isDark ? 'border-slate-700 border-t-sky-500' : 'border-blue-200 border-t-blue-600'} shadow-xl`}></div>
              <Plane className={`w-10 h-10 ${isDark ? 'text-sky-400' : 'text-blue-600'} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse`} />
            </div>
            <p className={`mt-6 font-bold text-lg ${isDark ? 'text-sky-300' : 'text-blue-800'}`}>Chargement de la conversation...</p>
            <div className="flex gap-2 justify-center mt-3">
              <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-sky-500' : 'bg-blue-500'}`}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-sky-500' : 'bg-blue-500'}`} style={{animationDelay: '0.2s'}}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-sky-500' : 'bg-blue-500'}`} style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!conversation || (!conversation.isGroup && !contact)) {
    return (
      <ProtectedRoute>
        <div className={`flex h-screen items-center justify-center ${errorBg}`}>
          <div className={`text-center max-w-md animate-fade-in p-8 rounded-3xl ${cardStyle} border`}>
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-2 ${isDark ? 'border-slate-700' : 'border-rose-200'}`}>
              <Plane className={`w-12 h-12 ${isDark ? 'text-rose-400' : 'text-rose-500'} -rotate-45`} />
            </div>
            <h2 className={`text-2xl font-bold mb-3 ${textPrimary}`}>Conversation introuvable</h2>
            <p className={`mb-8 leading-relaxed ${textSecondary}`}>Cette conversation n&apos;existe pas ou a été supprimée</p>
            <button 
              onClick={() => router.push('/')} 
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
      <div className={`flex h-screen ${pageBg}`}>
        <MainSidebar />

        <div className="flex flex-1">
          <div className="hidden lg:block">
            <Sidebar activeConversationId={conversationId} />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="lg:hidden">
              <MobileHeader contact={contact} conversation={conversation} onBack={() => router.push('/')} />
            </div>
            
            <div className="hidden lg:block">
              <ChatHeader contact={contact} conversation={conversation} onBack={() => router.push('/')} />
            </div>

            {/* Container des messages avec scrollbar cachée */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 ${emptyChatBg} [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full animate-fade-in">
                  <div className={`text-center max-w-sm p-8 rounded-3xl ${cardStyle} border`}>
                    <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-2 ${iconStyle}`}>
                      {conversation.isGroup ? (
                        <Users className={`w-12 h-12 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      ) : (
                        <Plane className={`w-12 h-12 ${isDark ? 'text-sky-400' : 'text-blue-600'} -rotate-45`} />
                      )}
                    </div>
                    <p className={`font-bold text-lg mb-2 ${textPrimary}`}>Aucun message pour l&apos;instant</p>
                    <p className={`text-sm leading-relaxed ${textSecondary}`}>
                      {conversation.isGroup 
                        ? `Commencez la discussion dans ${conversation.groupName || 'ce groupe'}`
                        : `Envoyez votre premier message à ${contact?.name || 'cet utilisateur'}`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const userId = user?._id || user?.id;
                    const prevMessage = messages[index - 1];
                    const isLast = index === messages.length - 1;
                    
                    const showDateSeparator = !prevMessage || !isSameDay(
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
                    <TypingIndicator contactName={contact?.name || 'Quelqu\'un'} />
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}