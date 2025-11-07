'use client'

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { getConversation, getMessages, sendMessage } from '@/lib/api';
import { getSocket, joinConversation, onReceiveMessage, emitTyping, emitStopTyping, onUserTyping, onUserStoppedTyping } from '@/services/socket';
import { useSocket } from '@/hooks/useSocket';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar';
import MobileHeader from '@/components/Layout/MobileHeader';
import MessageBubble from '@/components/Chat/MessageBubble';
import MessageInput from '@/components/Chat/MessageInput';
import TypingIndicator from '@/components/Chat/TypingIndicator';
import { MessageCircle } from 'lucide-react';

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

  // Initialiser le socket
  useSocket();

  // Charger la conversation et les messages
  useEffect(() => {
    if (!conversationId || !user) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        
        const convResponse = await getConversation(conversationId);
        setConversation(convResponse.data.conversation);
        
        const messagesResponse = await getMessages(conversationId);
        setMessages(messagesResponse.data.messages || []);
        
        setLoading(false);
        
        const socket = getSocket();
        if (socket) {
          joinConversation(conversationId);
        }
      } catch (error) {
        console.error('Erreur chargement conversation:', error);
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, user]);

  // Écouter les nouveaux messages via socket
  useEffect(() => {
    const socket = getSocket();
    
    if (socket && conversationId && user) {
      onReceiveMessage((message) => {
        console.log('📩 Nouveau message reçu:', message);
        
        if (message.conversationId === conversationId) {
          setMessages((prev) => {
            // Éviter les doublons
            const exists = prev.some(m => m._id === message._id);
            if (exists) return prev;
            return [...prev, message];
          });
        }
      });

      onUserTyping(({ conversationId: typingConvId, userId }) => {
        const currentUserId = user._id || user.id;
        if (typingConvId === conversationId && userId !== currentUserId) {
          console.log('✍️ User en train d\'écrire:', userId);
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
          console.log('✅ User a arrêté d\'écrire:', userId);
          setTypingUsers((prev) => prev.filter((id) => id !== userId));
        }
      });
    }
  }, [conversationId, user]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // 🚀 CORRECTION SIMPLE : Gestion de l'envoi de message
  const handleSendMessage = async (content) => {
    try {
      let messageData;

      // Si c'est un objet (fichier), utiliser les données du fichier
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
        // Si c'est une string (texte normal)
        messageData = {
          conversationId,
          content: content.trim(),
          type: 'text'
        };
      }

      console.log('📤 Envoi message:', messageData);
      
      // Envoyer via l'API normale (comme avant)
      await sendMessage(messageData);
      
      // La mise à jour se fera via le socket automatiquement
      
      // Arrêter l'indicateur de frappe
      if (user) {
        const userId = user._id || user.id;
        emitStopTyping(conversationId, userId);
      }
      
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  // Gestion de l'indicateur "en train d'écrire"
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

  // Obtenir l'autre participant
  const getOtherParticipant = () => {
    if (!conversation || !user) return null;
    const userId = user._id || user.id;
    return conversation.participants?.find(p => p._id !== userId);
  };

  const contact = getOtherParticipant();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-green-500"></div>
              <MessageCircle className="w-8 h-8 text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-4 text-gray-600 font-medium">Chargement de la conversation...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!conversation || !contact) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Conversation introuvable</h2>
            <p className="text-gray-600 mb-6">Cette conversation n&apos;existe pas ou a été supprimée</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all transform hover:scale-105"
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
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar - cachée sur mobile */}
        <div className="hidden lg:block">
          <Sidebar activeConversationId={conversationId} />
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <MobileHeader 
            contact={contact} 
            onBack={() => router.push('/')} 
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-gray-600 font-medium">Aucun message pour l&apos;instant</p>
                  <p className="text-sm text-gray-500 mt-2">Envoyez votre premier message à {contact.name}</p>
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
                
                {/* INDICATEUR DE FRAPPE */}
                {typingUsers.length > 0 && (
                  <TypingIndicator contactName={contact.name} />
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input de message - SIMPLE */}
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