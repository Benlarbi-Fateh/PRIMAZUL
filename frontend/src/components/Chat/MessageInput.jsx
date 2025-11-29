'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import VoiceRecorder from './VoiceRecorder';
import useBlockCheck from '../../hooks/useBlockCheck';

export default function MessageInput({ onSendMessage, onTyping, onStopTyping, contactId }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
 const { isBlocked, blockStatus } = useBlockCheck(contactId);

  // Détection mobile
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

  // 🆕 AJOUTER CETTE FONCTION : Vérification de blocage avant envoi
const checkBlockStatus = () => {
  if (isBlocked) {
    alert(blockStatus.blockedMe 
      ? '❌ Vous êtes bloqué par cet utilisateur' 
      : '🚫 Vous avez bloqué cet utilisateur'
    );
    return true; // Bloquer l'action
  }
  return false; // Autoriser l'action
};

const handleSendMessage = async (messageContent) => {
  // Vérification finale avant envoi
  if (checkBlockStatus()) {
    return;
  }
  
  try {
    await onSendMessage(messageContent);
  } catch (error) {
     if (error.response?.status === 403 || error.response?.data?.blocked) {
      alert('❌ Message non envoyé - Utilisateur bloqué');
      return; 
    }
    if (error.response?.data?.blocked) {
      // Le backend a confirmé le blocage
      alert('❌ Message non envoyé - Utilisateur bloqué');
    } else {
      console.error('Erreur envoi message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  }
};

  const handleChange = (e) => {
      if (isBlocked) return;
  
  const value = e.target.value;
  setMessage(value);
    
    if (onTyping) onTyping();

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
    

    handleSendMessage(message.trim()); 
    setMessage('');
    
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
    <div className="bg-red-50 border-t border-red-200 p-6 text-center">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-800 mb-1">
            {blockStatus.blockedMe 
              ? '❌ Vous êtes bloqué' 
              : '🚫 Vous avez bloqué cet utilisateur'
            }
          </h3>
          <p className="text-red-600 text-sm">
            Vous ne pouvez pas envoyer de messages
          </p>
        </div>
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
      {showEmojiPicker && (
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
            isFocused ? 'ring-2 sm:ring-4 ring-blue-300 shadow-lg sm:shadow-xl transform scale-[1.01]' : 'shadow-md'
          }`}
          style={{
            background: 'linear-gradient(to right, #dbeafe, #ecfeff)'
          }}
        >
          
          {/* Boutons d'actions - cachés sur mobile très petit */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`shrink-0 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all transform hover:scale-110 active:scale-95 ${
                showEmojiPicker 
                  ? 'text-blue-600 bg-blue-200 shadow-md' 
                  : 'text-blue-500 hover:text-blue-600 hover:bg-blue-100'
              }`}
              title="Ajouter un emoji"
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
              title="Joindre un fichier"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              )}
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
            disabled={uploading}
          />

          {/* Zone de texte */}
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={uploading ? "Upload en cours..." : "Écrivez votre message..."}
              className="w-full bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 text-slate-800 placeholder-blue-400 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent disabled:opacity-50 rounded-xl sm:rounded-2xl border-2 border-transparent focus:border-blue-300 font-medium text-sm sm:text-base"
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

          {/* Bouton d'envoi ou vocal */}
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
                title={uploading ? "Upload en cours..." : "Envoyer"}
                style={!uploading ? {
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8, #06b6d4)'
                } : {}}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="shrink-0 p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
                title="Enregistrer un message vocal"
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

        {/* Indicateur de caractères pour mobile */}
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
      `}</style>
    </div>
  );
}