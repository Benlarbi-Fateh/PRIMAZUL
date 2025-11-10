'use client'

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
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
  onConversationStatusUpdated
} from '@/services/socket';
import { useSocket } from '@/hooks/useSocket';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar';
import MobileHeader from '@/components/Layout/MobileHeader';
import MessageBubble from '@/components/Chat/MessageBubble';
import MessageInput from '@/components/Chat/MessageInput';
import TypingIndicator from '@/components/Chat/TypingIndicator';
import { Plane } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const conversationId = params.id;
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isMarkingAsReadRef = useRef(false);

  useSocket();

  // Cleanup : Quitter la conversation quand on quitte la page
  useEffect(() => {
    return () => {
      if (conversationId) {
        console.log('🚪 Quitter la conversation:', conversationId);
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
          headers: {
            'Content-Type': 'multipart/form-data'
          }
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center bg-blue-50">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              <Plane className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45" />
            </div>
            <p className="mt-4 text-blue-800 font-medium">Chargement de la conversation...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!conversation || !contact) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center bg-blue-50">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-10 h-10 text-red-500 -rotate-45" />
            </div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Conversation introuvable</h2>
            <p className="text-blue-700 mb-6">Cette conversation n&apos;existe pas ou a été supprimée</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
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
      <div className="flex h-screen bg-blue-100">
        <div className="hidden lg:block">
          <Sidebar activeConversationId={conversationId} />
        </div>

        <div className="flex-1 flex flex-col">
          <MobileHeader 
            contact={contact} 
            onBack={() => router.push('/')} 
          />

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-linear-to-b from-blue-50 to-cyan-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-blue-200">
                    <Plane className="w-10 h-10 text-blue-600 -rotate-45" />
                  </div>
                  <p className="text-blue-800 font-medium">Aucun message pour l&apos;instant</p>
                  <p className="text-sm text-blue-600 mt-2">Envoyez votre premier message à {contact.name}</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const userId = user?._id || user?.id;
                  return (
                    <MessageBubble
                      key={message._id}
                      message={message}
                      isMine={message.sender?._id === userId}
                    />
                  );
                })}
                
                {typingUsers.length > 0 && (
                  <TypingIndicator contactName={contact.name} />
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
    </ProtectedRoute>
  );
}