'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2, Sparkles, Check ,Lock, Shield} from 'lucide-react';
import api from '@/lib/api';
import VoiceRecorder from './VoiceRecorder';
import useBlockCheck from '../../hooks/useBlockCheck';

export default function MessageInput({ 
  onSendMessage, 
  onTyping, 
  onStopTyping,
  // 🆕 Props pour le mode édition
  editingMessageId,
  editingContent,
  onConfirmEdit,
  onCancelEdit,
  contactId 
}) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
const { isBlocked, blockStatus, loading: blockLoading } = useBlockCheck(contactId);

  // 🆕 Synchroniser avec le contenu en édition
  useEffect(() => {
    if (editingMessageId && editingContent) {
      setMessage(editingContent);
      textareaRef.current?.focus();
    }
  }, [editingMessageId, editingContent]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, isMobile ? 80 : 120)}px`;
    }
  }, [message, isMobile]);

const checkBlockStatus = () => {
  if (isBlocked) {
    alert(blockStatus?.blockedMe 
      ? '❌ Vous êtes bloqué par cet utilisateur' 
      : '🚫 Vous avez bloqué cet utilisateur'
    );
    return true;
  }
  return false;
};
const handleSendMessage = async (messageContent) => {
  if (isBlocked) {
    alert(blockStatus?.blockedMe 
      ? '❌ Vous êtes bloqué par cet utilisateur' 
      : '🚫 Vous avez bloqué cet utilisateur'
    );
    return;
  }
  
  try {
    await onSendMessage(messageContent);
  } catch (error) {
    console.error('❌ Erreur envoi:', error);
    
    if (error.response?.status === 403 || error.response?.data?.blocked) {
      alert('❌ Message non envoyé - Utilisateur bloqué');
      window.dispatchEvent(new CustomEvent('block-status-changed'));
      return;
    }
    
    alert('Erreur lors de l\'envoi du message');
  }
};

  const handleChange = (e) => {
  if (isBlocked) {
    e.preventDefault();
    return;
  }
  
  const value = e.target.value;
  setMessage(value);
    
  if (!editingMessageId && onTyping) {
    onTyping();
  }

  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  typingTimeoutRef.current = setTimeout(() => {
    if (onStopTyping) onStopTyping();
  }, 2000);
};

  const handleSubmit = (e) => {
    e.preventDefault();
      if (checkBlockStatus()) return;
  
  if (!message.trim() && !uploading) return;
    

    // 🆕 Si en mode édition, confirmer la modification
    if (editingMessageId) {
      onConfirmEdit(message.trim());
      setMessage('');
    } else {
      // Sinon, envoyer un nouveau message
      onSendMessage(message.trim());
      setMessage('');
    }
    
    if (onStopTyping) onStopTyping();
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // 🆕 Échapper pour annuler l'édition
    if (e.key === 'Escape' && editingMessageId) {
      handleCancelEdit();
    }
  };

  // 🆕 Annuler l'édition
  const handleCancelEdit = () => {
    setMessage('');
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleFileSelect = async (e) => {
      if (checkBlockStatus()) return;
  
  const file = e.target.files?.[0];
  if (!file) return;
  

    if (file.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 10MB)');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        }
      });

      const fileType = getFileType(file.type);

      handleSendMessage({
  type: fileType,
  fileUrl: response.data.fileUrl,
  fileName: response.data.fileName,
  fileSize: response.data.fileSize,
  content: message.trim()
});

      setMessage('');

    } catch (error) {
      console.error('❌ Erreur upload:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const handleSendVoice = async (audioBlob, duration) => {
    try {
      handleSendMessage({
  type: 'voice',
  audioBlob,
  duration,
  isVoiceMessage: true
});
      
      setShowVoiceRecorder(false);
      
    } catch (error) {
      console.error('❌ Erreur envoi vocal:', error);
      alert('Erreur lors de l\'envoi du message vocal');
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const frequentEmojis = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '✨', '💯', '🎉', '👏'];

if (isBlocked) {
  return (
    <div className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white shadow-2xl relative overflow-hidden">
      {/* Effet de fond animé */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300 via-red-300 to-orange-300 animate-pulse"></div>
      
      {/* Contenu responsive */}
      <div className="relative px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
        {/* Icône */}
        <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
          {(blockStatus?.blockedMe || false) ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
        </div>
        
        {/* Texte */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm sm:text-base truncate">
            {(blockStatus?.blockedMe || false) ? (
              '🚫 Vous êtes bloqué'
            ) : (
              '🛡️ Utilisateur bloqué'
            )}
          </div>
          <div className="text-xs sm:text-sm text-white/90 truncate">
            {(blockStatus?.blockedMe || false)
              ? 'Impossible d\'envoyer des messages' 
              : 'Vous avez bloqué cet utilisateur'
            }
          </div>
        </div>
        
        {/* Bouton Débloquer - uniquement si c'est VOUS qui avez bloqué */}
        {(blockStatus?.iBlocked || false) && !(blockStatus?.blockedMe || false) && (
          <button
            onClick={async () => {
              if (!window.confirm('Voulez-vous débloquer cet utilisateur ?')) return;
              
              try {
                const response = await api.post('/message-settings/unblock', { 
                  targetUserId: contactId 
                });
                
                const data = response.data;
                
                if (data.success) {
                  window.dispatchEvent(new CustomEvent('block-status-changed'));
                  alert('✅ Utilisateur débloqué');
                  window.location.reload(); // Rafraîchir la page
                }
              } catch (error) {
                console.error('Erreur déblocage:', error);
                alert('❌ Erreur lors du déblocage');
              }
            }}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-red-600 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg whitespace-nowrap"
          >
            Débloquer
          </button>
        )}
      </div>
    </div>
  );
}

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        onSendVoice={handleSendVoice}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl border-t-2 border-blue-100 shadow-2xl safe-area-padding-bottom">
      {/* 🆕 BARRE D'INDICATION MODE ÉDITION */}
      {editingMessageId && (
        <div 
          className="border-b-2 border-blue-200 px-3 sm:px-4 py-2 sm:py-3 animate-slide-in-left"
          style={{
            background: 'linear-gradient(to right, #dbeafe, #ecfeff)'
          }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full"></div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-blue-700 flex items-center gap-1 sm:gap-2">
                  ✏️ <span>Modification en cours</span>
                </p>
                <p className="text-xs text-blue-600 hidden xs:block">
                  <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-blue-700 font-mono text-xs">Enter</kbd> pour confirmer · 
                  <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-blue-700 font-mono text-xs ml-1">Esc</kbd> pour annuler
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelEdit}
              className="p-1 sm:p-2 hover:bg-blue-200 rounded-full transition-all transform hover:scale-110 active:scale-95"
              title="Annuler (Esc)"
            >
              <X size={18} className="text-blue-600" />
            </button>
          </div>
        </div>
      )}

      {showEmojiPicker && !editingMessageId && (
        <div 
          className="border-b-2 border-blue-100 p-3 sm:p-4 animate-slide-in-left"
          style={{
            background: 'linear-gradient(to bottom, #dbeafe, #ffffff)'
          }}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1 sm:gap-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
              <span className="hidden xs:inline">Emojis fréquents</span>
              <span className="xs:hidden">Emojis</span>
            </span>
            <button
              onClick={() =>{ if (checkBlockStatus()) return;
    setShowVoiceRecorder(true);}}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 sm:p-2 rounded-xl transition-all active:scale-95"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center sm:justify-start">
            {frequentEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl sm:text-3xl hover:bg-blue-100 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl transition-all transform hover:scale-110 active:scale-105 shadow-sm hover:shadow-md"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-2 sm:p-3 md:p-4">
        <div 
          className={`flex items-end gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl p-3 sm:p-4 transition-all ${
            editingMessageId 
              ? 'ring-2 sm:ring-4 ring-blue-400 shadow-xl transform scale-[1.02]'
              : isFocused 
                ? 'ring-2 sm:ring-4 ring-blue-300 shadow-lg sm:shadow-xl transform scale-[1.01]' 
                : 'shadow-md'
          }`}
          style={{
            background: editingMessageId 
              ? 'linear-gradient(to right, #dbeafe, #bfdbfe)' 
              : 'linear-gradient(to right, #dbeafe, #ecfeff)'
          }}
        >
          
          {/* 🆕 MASQUER EMOJI ET FICHIERS EN MODE ÉDITION */}
          {!editingMessageId && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`shrink-0 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all transform hover:scale-110 active:scale-95 ${
                  showEmojiPicker 
                    ? 'text-blue-600 bg-blue-200 shadow-md' 
                    : 'text-blue-500 hover:text-blue-600 hover:bg-blue-100'
                }`}
                disabled={uploading}
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`shrink-0 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all transform hover:scale-110 active:scale-95 ${
                  uploading 
                    ? 'text-blue-400 cursor-not-allowed bg-blue-100' 
                    : 'text-blue-500 hover:text-blue-600 hover:bg-blue-100'
                }`}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
            disabled={uploading}
          />

          <div className="flex-1 relative min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                editingMessageId 
                  ? "Modifier le message..." 
                  : uploading 
                    ? "Upload en cours..." 
                    : "Écrivez votre message..."
              }
              className={`w-full bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 text-slate-800 placeholder-blue-400 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent disabled:opacity-50 rounded-xl sm:rounded-2xl border-2 border-transparent focus:border-blue-300 font-medium text-sm sm:text-base ${
                editingMessageId ? 'font-semibold border-blue-400' : ''
              }`}
              rows="1"
              style={{ 
                maxHeight: isMobile ? '80px' : '120px',
                minHeight: '40px'
              }}
              disabled={uploading}
            />
            
            {message.length > 0 && !isMobile && (
              <div className="absolute -bottom-5 right-0 text-xs text-blue-500 font-semibold hidden xs:block">
                {message.length} caractères
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {message.trim() || uploading ? (
              <button
                type="submit"
                disabled={uploading || (!message.trim() && !uploading)}
                className={`shrink-0 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl ${
                  uploading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'text-white'
                }`}
                title={uploading ? "Upload en cours..." : editingMessageId ? "Confirmer" : "Envoyer"}
                style={!uploading ? {
                  background: editingMessageId 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : 'linear-gradient(135deg, #2563eb, #1d4ed8, #06b6d4)'
                } : {}}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : editingMessageId ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            ) : !editingMessageId && (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="shrink-0 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                disabled={uploading}
                style={{
                  background: 'linear-gradient(135deg, #f43f5e, #db2777)'
                }}
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </button>
            )}
          </div>
        </div>

        {uploading && (
          <div className="mt-2 sm:mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-blue-100 rounded-lg sm:rounded-xl text-blue-700 font-semibold animate-pulse text-xs sm:text-sm">
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              <span>Envoi en cours...</span>
            </div>
          </div>
        )}

        {message.length > 0 && isMobile && (
          <div className="text-center mt-1">
            <span className="text-xs text-blue-500 font-semibold bg-blue-100 px-2 py-1 rounded-full">
              {message.length} caractères
            </span>
          </div>
        )}
      </form>

      <style jsx>{`
        .safe-area-padding-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        @keyframes slide-in-left {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}