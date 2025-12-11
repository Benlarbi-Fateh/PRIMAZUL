'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMessages, sendMessage } from '@/lib/api';
import { 
  getSocket, 
  joinConversation, 
  leaveConversation, 
  onReceiveMessage,
  onMessageStatusUpdated 
} from '@/services/socket';
import { Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble'; // Votre composant existant pour les messages
import MessageInput from '../MessageInput'; // Le composant modifié ci-dessus

const ChatWindow = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [storyReply, setStoryReply] = useState(null); // 🆕 État pour gérer les réponses aux stories
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (socket) {
      joinConversation(conversationId);
      
      onReceiveMessage((newMessage) => {
        console.log('📩 Nouveau message reçu:', newMessage);
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
      });

      onMessageStatusUpdated((data) => {
        console.log('📊 Statut message mis à jour:', data);
        setMessages(prev => prev.map(msg => 
          data.messageIds.includes(msg._id) 
            ? { ...msg, status: data.status }
            : msg
        ));
      });
    }

    fetchMessages();

    return () => {
      if (socket) {
        leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(conversationId);
      if (response.success) {
        setMessages(response.messages || []);
        scrollToBottom();
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🆕 FONCTION POUR RÉPONDRE À UNE STORY
  const handleReplyToStory = (storyData) => {
    setStoryReply({
      id: storyData.id,
      type: storyData.type,
      preview: storyData.preview,
      onCancel: () => setStoryReply(null)
    });
  };

  const handleSendMessage = async (content, options = {}) => {
    if ((!content || !content.trim()) && !options.fileUrl) return;

    const messageData = {
      conversationId,
      sender: user._id,
      content: options.cleanContent || content || '',
      type: options.type || 'text',
      fileUrl: options.fileUrl || '',
      fileName: options.fileName || '',
      fileSize: options.fileSize || 0,
      isStoryReply: options.isStoryReply || false,
      storyId: options.storyId || null,
      storyType: options.storyType || null,
      storyPreview: options.storyPreview || ''
    };

    try {
      setSending(true);
      
      // 🆕 SI C'EST UNE RÉPONSE À UNE STORY, UTILISER L'API SPÉCIFIQUE
      if (options.isStoryReply && options.storyId) {
        const response = await api.post(`/api/status/${options.storyId}/reply`, {
          message: content.trim()
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          // Réinitialiser l'état de réponse à la story
          setStoryReply(null);
          
          // Mettre à jour les messages si nécessaire
          if (response.data.chatMessage) {
            setMessages(prev => [...prev, response.data.chatMessage]);
            scrollToBottom();
          }
        }
      } else {
        // Message normal
        await sendMessage(messageData);
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    // Implémenter le typing indicator si besoin
  };

  const handleStopTyping = () => {
    // Implémenter le stop typing si besoin
  };

  // 🆕 FONCTION POUR AFFICHER UNE RÉACTION À UNE STORY
  const showStoryReaction = (message) => {
    return (
      <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl">
              {message.storyReactionType === 'like' ? '👍' :
               message.storyReactionType === 'love' ? '❤️' :
               message.storyReactionType === 'haha' ? '😄' :
               message.storyReactionType === 'wow' ? '😮' :
               message.storyReactionType === 'sad' ? '😢' :
               message.storyReactionType === 'angry' ? '😠' :
               message.storyReactionType === 'fire' ? '🔥' : '👏'}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">
              {message.sender?.name || 'Quelqu\'un'}
            </p>
            <p className="text-sm text-gray-600">
              {message.content}
            </p>
            <button 
              onClick={() => handleReplyToStory({
                id: message.storyId,
                type: message.storyType,
                preview: message.storyPreview
              })}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Répondre à la story
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <span className="text-2xl">💬</span>
            </div>
            <p className="font-medium">Aucun message</p>
            <p className="text-sm mt-1">Envoyez votre premier message</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <React.Fragment key={message._id}>
                {message.isStoryReaction ? (
                  // 🆕 AFFICHER LES RÉACTIONS AUX STORIES
                  showStoryReaction(message)
                ) : (
                  // Messages normaux
                  <MessageBubble 
                    message={message}
                    isOwnMessage={message.sender?._id === user._id}
                    onReplyToStory={handleReplyToStory} // 🆕 Passer la fonction
                  />
                )}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input pour envoyer des messages */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        conversationId={conversationId}
        storyReply={storyReply} // 🆕 Passer l'état de réponse à la story
      />
    </div>
  );
};

export default ChatWindow;