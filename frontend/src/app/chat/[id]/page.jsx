'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  onConversationStatusUpdated
} from '@/services/socket';
import { useSocket } from '@/hooks/useSocket';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar';
import MobileHeader from '@/components/Layout/MobileHeader';
import ChatHeader from '@/components/Layout/ChatHeader';
import MessageBubble from '@/components/Chat/MessageBubble';
import MessageInput from '@/components/Chat/MessageInput';
import TypingIndicator from '@/components/Chat/TypingIndicator';
import { Plane, Users, Sparkles } from 'lucide-react';
import useBlockCheck from '@/hooks/useBlockCheck';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const conversationId = params.id;
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);

  // 🆕 États pour la modification
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  
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
    if (isBlocked) return;

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

// 🆕 ÉCOUTER LES SUPPRESSIONS EN TEMPS RÉEL
      socket.off('message-deleted');
      socket.on('message-deleted', ({ messageId }) => {
        console.log('🗑️ Message supprimé reçu:', messageId);
        setMessages((prev) => prev.filter(msg => msg._id !== messageId));
      });

      // 🆕 ÉCOUTER LES MODIFICATIONS EN TEMPS RÉEL
      socket.off('message-edited');
      socket.on('message-edited', ({ messageId, content, isEdited, editedAt }) => {
        console.log('✏️ Message modifié reçu:', messageId);
        setMessages((prev) => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, content, isEdited, editedAt }
            : msg
        ));
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
      }, [conversationId, user, isBlocked]);

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
      
      const response = await sendMessage(messageData);
      if (response.data.conversationId && response.data.conversationId !== conversationId) {
  console.log('🔄 Nouvelle conversation créée, redirection...');
  
  // 🔥 AJOUTEZ CES 3 LIGNES :
  // 1. Émettre un événement global pour rafraîchir la sidebar
  window.dispatchEvent(new CustomEvent('refresh-sidebar-conversations', {
    detail: { newConversationId: response.data.conversationId }
  }));
  
  // 2. Rediriger vers la nouvelle conversation
  router.push(`/chat/${response.data.conversationId}`);
  return;
}
      
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


  
// ========================================
  // 🆕 FONCTION SUPPRIMER
  // ========================================
  const handleDeleteMessage = async (messageId) => {
    console.log('🗑️ ChatPage: Suppression demandée pour:', messageId);
    
    if (!window.confirm('Voulez-vous vraiment supprimer ce message ?')) {
      return;
    }

    try {
      const response = await api.delete(`/messages/${messageId}`);
      console.log('📦 Réponse suppression:', response.data);
      
      if (response.data.success) {
        console.log('✅ Message supprimé avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Impossible de supprimer le message');
    }
  };

  // ========================================
  // 🆕 FONCTION MODIFIER (ACTIVER LE MODE)
  // ========================================
  const handleEditMessage = (messageId, currentContent) => {
    console.log('✏️ ChatPage: Mode édition activé pour:', messageId);
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
  };

  // ========================================
  // 🆕 FONCTION CONFIRMER LA MODIFICATION
  // ========================================
  const handleConfirmEdit = async (newContent) => {
    if (!editingMessageId || !newContent.trim()) {
      console.log('❌ Contenu vide');
      setEditingMessageId(null);
      setEditingContent('');
      return;
    }

    console.log('✏️ Confirmation modification:', editingMessageId);

    try {
      const response = await api.put(`/messages/${editingMessageId}`, {
        content: newContent.trim()
      });
      
      console.log('📦 Réponse modification:', response.data);
      
      if (response.data.success) {
        console.log('✅ Message modifié avec succès');
        setEditingMessageId(null);
        setEditingContent('');
      }
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      alert('Impossible de modifier le message');
    }
  };

  // ========================================
  // 🆕 FONCTION ANNULER LA MODIFICATION
  // ========================================
  const handleCancelEdit = () => {
    console.log('❌ Annulation édition');
    setEditingMessageId(null);
    setEditingContent('');
  };

  // ========================================
  // 🆕 FONCTION TRADUIRE
  // ========================================
  const handleTranslateMessage = async (content, messageId, targetLang) => {
    console.log('🌍 ChatPage: Traduction demandée pour:', messageId, 'en', targetLang);
    
    try {
      const response = await api.post(`/messages/${messageId}/translate`, {
        targetLang
      });
      
      console.log('📦 Réponse traduction:', response.data);
      
      if (response.data.success) {
        console.log('✅ Message traduit:', response.data.translatedContent);
        return response.data.translatedContent;
      } else {
        throw new Error(response.data.error || 'Erreur de traduction');
      }
    } catch (error) {
      console.error('❌ Erreur traduction:', error);
      throw error;
    }
  };
 
  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    const userId = user._id || user.id;
    return conversation.participants?.find(p => p._id !== userId);
  };

  const getDisplayName = () => {
    if (!conversation) return 'Chargement...';
    if (conversation.isGroup) {
      return conversation.groupName || 'Groupe sans nom';
    }
    const contact = getOtherParticipant();
    return contact?.name || 'Utilisateur';
  };

  const contact = getOtherParticipant();

  const { isBlocked } = useBlockCheck(contact?._id);
  if (loading) {
    return (
      <ProtectedRoute>
        <div 
          className="flex h-screen items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #dbeafe, #ffffff, #ecfeff)'
          }}
        >
          <div className="text-center animate-fade-in">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 shadow-xl"></div>
              <Plane className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse" />
            </div>
            <p className="mt-6 text-blue-800 font-bold text-lg">Chargement de la conversation...</p>
            <div className="flex gap-2 justify-center mt-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!conversation || (!conversation.isGroup && !contact)) {
    return (
      <ProtectedRoute>
        <div 
          className="flex h-screen items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #dbeafe, #ffffff, #ecfeff)'
          }}
        >
          <div className="text-center max-w-md animate-fade-in">
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #fecaca, #fca5a5)'
              }}
            >
              <Plane className="w-12 h-12 text-rose-500 -rotate-45" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Conversation introuvable</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">Cette conversation n&apos;existe pas ou a été supprimée</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 text-white rounded-2xl font-bold transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
              style={{
                background: 'linear-gradient(to right, #2563eb, #06b6d4)'
              }}
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
      <div 
        className="flex h-screen"
        style={{
          background: 'linear-gradient(135deg, #dbeafe, #ffffff, #ecfeff)'
        }}
      >
        <div className="hidden lg:block">
          <Sidebar activeConversationId={conversationId} />
        </div>

        <div className="flex-1 flex flex-col">
          {/* 📱 Mobile Header - visible seulement sur mobile */}
          <div className="lg:hidden">
            <MobileHeader 
              contact={contact}
              conversation={conversation}
              onBack={() => router.push('/')} 
            />
          </div>
          
          {/* 💻 Desktop Header - visible seulement sur desktop */}
          <div className="hidden lg:block">
            <ChatHeader 
              contact={contact}
              conversation={conversation}
              onBack={() => router.push('/')} 
            />
          </div>

          {/* ZONE DES MESSAGES AVEC LE THÈME APPLIQUÉ */}
          <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent chat-background"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="text-center max-w-sm">
                  <div 
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border-2 border-blue-200"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff, #dbeafe)'
                    }}
                  >
                    {conversation.isGroup ? (
                      <Users className="w-12 h-12 text-purple-600" />
                    ) : (
                      <Plane className="w-12 h-12 text-blue-600 -rotate-45" />
                    )}
                  </div>
                  <p className="text-slate-800 font-bold text-lg mb-2">Aucun message pour l&apos;instant</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {conversation.isGroup 
                      ? `Commencez la discussion dans ${conversation.groupName || 'ce groupe'}`
                      : `Envoyez votre premier message à ${contact?.name || 'cet utilisateur'}`
                    }
                  </p>
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
                      isGroup={conversation?.isGroup || false}
                      // 🆕 Props pour la modification ghiles
                       onDelete={handleDeleteMessage}
                      onEdit={handleEditMessage}
                      onTranslate={handleTranslateMessage}
                    />
                  );
                })}
                
                {typingUsers.length > 0 && !isBlocked && (
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
            contactId={contact?._id}
            // 🆕 Props pour la modification ghiles
            editingMessageId={editingMessageId}
            editingContent={editingContent}
            onConfirmEdit={handleConfirmEdit}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}