'use client'

import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { getConversation, getMessages, sendMessage, markMessagesAsDelivered, markConversationAsRead } from '@/lib/api';
import { toggleReaction, forwardMessage, getConversations } from '@/lib/api'; //p9
import { onMessageReacted, onMessageForwarded } from '@/services/socket';  //p9

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
//p9 recherche 
import ChatHeader from '@/components/Layout/ChatHeader';
import SidebarGauche from '@/components/Chat/SidebarGauche';
//..........................
import MessageBubble from '@/components/Chat/MessageBubble';
import MessageInput from '@/components/Chat/MessageInput';
import TypingIndicator from '@/components/Chat/TypingIndicator';
import { Plane, Users, Sparkles, ChevronDown } from 'lucide-react'; // chevrondown li yhbt f disccussion p9

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const conversationId = params.id;
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  //p9............rechercher dans msj 3la hadi zdtha
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  // p9 la fleche 2 ligne aki
  const messagesContainerRef = useRef(null);   // réf du container scrollable
  const [showScrollDown, setShowScrollDown] = useState(false); // contrôle la flèche


  const handleJumpToMessage = (msgId) => {
  const el = document.getElementById(`message-${msgId}`);
  if (!el) {
    console.warn('Element message not found (maybe not rendered yet):', msgId);
    return;
  }
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setHighlightedId(msgId);
  setTimeout(() => setHighlightedId(null), 1600);
};

  //.........................

  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  //......p9..................
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [allConversations, setAllConversations] = useState([]);
  //..............................
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
//................................
//......  p9......................
// 👈 écouter l'événement custom pour ouvrir la modal
useEffect(() => {
  const handler = (e) => {
    setForwardingMessage(e.detail.message);
    setShowForwardModal(true);
    loadAllConversations();
  };
  window.addEventListener('open-forward-modal', handler);
  return () => window.removeEventListener('open-forward-modal', handler);
}, []);

// 👈 écouter socket pour réactions et forward
useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  onMessageReacted((updatedMessage) => {
    setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
  });

  onMessageForwarded((newMessage) => {
    if (newMessage.conversationId === conversationId) {
      setMessages(prev => [...prev, newMessage]);
    }
  });

}, [conversationId]);
//........................................


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

 

  // p9 Ajouter l'effet d'écoute du scroll ui scroll vers le bas sur
 
    useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  // seuil (px) : quand on est à moins de `threshold` du bas on considère "en bas"
  const threshold = 180;

  const handleScroll = () => {
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // show arrow if user is far from bottom
    setShowScrollDown(distanceFromBottom > threshold);
  };

  // initial check (si messages déjà chargés)
  handleScroll();

  container.addEventListener('scroll', handleScroll, { passive: true });
  return () => container.removeEventListener('scroll', handleScroll);
}, [messages]); // ré-évaluer quand messages changent


    // ---- Fonctions pour forward ----
    //................p9......................
    const loadAllConversations = async () => {
    try {
      const resp = await getConversations();
      setAllConversations(resp.data.conversations || resp.data || []);
    } catch (err) {
      console.error('Erreur loadConversations', err);
      setAllConversations([]);
    }
  };

  const handleForwardToConversation = async (targetConvId) => {
    if (!forwardingMessage) return;
    try {
      await forwardMessage(targetConvId, forwardingMessage._id);
      setShowForwardModal(false);
      setForwardingMessage(null);
      alert('Message transféré');
    } catch (err) {
      console.error('Erreur forward', err);
      alert('Erreur lors du transfert');
    }
  };
  //.........................................
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

//p9 la fonction scrollToBottom  
const scrollToBottom = (smooth = true) => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
  } else {
    // fallback : scroll du container si besoin
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }
  setShowScrollDown(false);
};
//..........................



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

// .......p9............
const handleUpdateMessage = (updatedMessage) => {
  setMessages(prev =>
    prev.map(msg =>
      msg._id === updatedMessage._id ? updatedMessage : msg
    )
  );
};
//.................................
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
          <Sidebar/>
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
              onOpenSidebar={() => setSidebarOpen(true)} //p9 recherche msj
            />
          </div>

          <div 
            ref={messagesContainerRef}   //p9 Lier le ref au container des messages scroldown
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent"
            style={{
              background: 'linear-gradient(to bottom, #ffffff, rgba(219, 234, 254, 0.3), rgba(236, 254, 255, 0.3))'
            }}
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
                {messages.map((message , index) => {
                  const userId = user?._id || user?.id;
                  return (
                    <MessageBubble
                      key={message._id || index}
                      message={message}
                      isMine={message.sender?._id === userId}
                      isGroup={conversation?.isGroup || false}
                      onUpdateMessage={handleUpdateMessage}
                      highlightedId={highlightedId}  // <-- p9 recherche msj
                      />
                  );
                })}
                
                {typingUsers.length > 0 && (
                  <TypingIndicator contactName={contact?.name || 'Quelqu\'un'} />
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
           {/*...............p9...............*/}

           {showForwardModal && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl w-full max-w-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Transférer le message</h3>
        <button 
          onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }} 
          className="text-sm"
        >
          Annuler
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {allConversations.length === 0 ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : (
          allConversations.map(conv => {
            const otherName = conv.isGroup 
              ? (conv.groupName || 'Groupe') 
              : (conv.participants?.find(p => p._id !== (user._id || user.id))?.name || 'Contact');
            return (
              <div key={conv._id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleForwardToConversation(conv._id)}>
                  <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center">
                    <span className="font-bold">{(otherName || '').slice(0,2).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-medium">{otherName}</div>
                    <div className="text-xs text-slate-500">{conv.lastMessage?.content ? conv.lastMessage.content.slice(0,30) : ''}</div>
                  </div>
                </div>
                <div>
                  <button onClick={() => handleForwardToConversation(conv._id)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Transférer</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
)}
 {/*...............................*/}
             {/*//p9..........*/}
        <SidebarGauche
            open={sidebarOpen}                  
            onClose={() => setSidebarOpen(false)} 
            contact={contact}
            conversation={conversation}
            messages={messages}
            onJumpToMessage={handleJumpToMessage}
          />
 {/*//p9..........*/}
  
{/* Bouton "aller en bas" */}
{showScrollDown && (
  <button
    onClick={() => scrollToBottom(true)}
    aria-label="Aller en bas"
    className="
      fixed bottom-24 right-6 z-50
      w-12 h-12
      rounded-full
      flex items-center justify-center
      bg-white/70 border border-gray-200 
      shadow-xl
      backdrop-blur-md
      transition-all duration-300
      hover:scale-110 hover:bg-white
      hover:shadow-2xl
    "
  >
    <ChevronDown className="w-8 h-8 text-slate-700 animate-bounce" />
  </button>
)}



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