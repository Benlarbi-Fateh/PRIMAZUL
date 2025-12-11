'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import VoiceRecorder from './VoiceRecorder';

export default function MessageInput({ onSendMessage, onTyping, onStopTyping, conversationId, storyReply }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // 🆕 INITIALISER LE MESSAGE SI C'EST UNE RÉPONSE À UNE STORY
  useEffect(() => {
    if (storyReply) {
      setMessage(`@story "${storyReply.preview}" `);
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }, 100);
    }
  }, [storyReply]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [message]);

  const handleChange = (e) => {
    setMessage(e.target.value);
    
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
    
    if (!message.trim() && !uploading) return;

    // 🆕 SI C'EST UNE RÉPONSE À UNE STORY
    if (storyReply) {
      onSendMessage({
        content: message.trim(),
        type: 'story_reply',
        isStoryReply: true,
        storyId: storyReply.id,
        storyType: storyReply.type,
        storyPreview: storyReply.preview,
        // Retirer le préfixe @story si présent
        cleanContent: message.trim().replace(/^@story\s*"[^"]*"\s*/, '')
      });
    } else {
      // Message normal
      onSendMessage(message.trim());
    }
    
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

      onSendMessage({
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
      onSendMessage({
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

  // 🆕 FONCTION POUR ANNULER LA RÉPONSE À LA STORY
  const cancelStoryReply = () => {
    setMessage('');
    if (storyReply && storyReply.onCancel) {
      storyReply.onCancel();
    }
  };

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        onSendVoice={handleSendVoice}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <div className="bg-slate-50 border-t border-slate-200">
      {/* 🆕 BANNIÈRE POUR LES RÉPONSES AUX STORIES */}
      {storyReply && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-sm text-blue-700 font-medium">
                Réponse à une story
              </span>
              <p className="text-xs text-blue-600 truncate max-w-xs">
                {storyReply.preview}
              </p>
            </div>
          </div>
          <button
            onClick={cancelStoryReply}
            className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors"
            title="Annuler la réponse"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="border-b border-slate-200 p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-700">
              Emojis fréquents
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {frequentEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl hover:bg-slate-100 w-8 h-8 rounded transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3">
        <div className={`flex items-center gap-2 rounded-2xl p-3 transition-all ${
          isFocused 
            ? 'ring-2 ring-blue-500 bg-white shadow-sm' 
            : 'bg-white border border-slate-300'
        } ${storyReply ? 'ring-2 ring-blue-300' : ''}`}>
          
          {/* Boutons d'actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 rounded-xl transition ${
                showEmojiPicker 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Ajouter un emoji"
              disabled={uploading}
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`p-2 rounded-xl transition ${
                uploading 
                  ? 'text-slate-400 cursor-not-allowed' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="Joindre un fichier"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
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
          <div className="flex-1 flex items-center min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                uploading ? "Upload en cours..." : 
                storyReply ? "Votre réponse à la story..." : 
                "Écrivez votre message..."
              }
              className="w-full bg-transparent px-3 py-2.5 text-slate-800 placeholder-slate-500 focus:outline-none resize-none rounded-lg text-sm leading-5 overflow-hidden"
              rows="1"
              style={{ 
                maxHeight: '100px',
                minHeight: '40px'
              }}
              disabled={uploading}
            />
          </div>

          {/* Bouton d'envoi ou vocal */}
          <div className="flex items-center gap-1 shrink-0">
            {(message.trim() || uploading) ? (
              <button
                type="submit"
                disabled={uploading || (!message.trim() && !uploading)}
                className={`p-2.5 rounded-xl transition ${
                  uploading 
                    ? 'bg-slate-400 cursor-not-allowed text-white' 
                    : storyReply 
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                }`}
                title={uploading ? "Upload en cours..." : 
                       storyReply ? "Envoyer la réponse" : "Envoyer"}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : storyReply ? (
                  <MessageCircle className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition shadow-md hover:shadow-lg"
                title="Enregistrer un message vocal"
                disabled={uploading}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 🆕 INDICATEUR DE RÉPONSE À UNE STORY */}
        {storyReply && !uploading && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg text-green-700 text-xs border border-green-200">
              <MessageCircle className="w-3 h-3" />
              <span>Réponse à une story • {storyReply.type === 'text' ? '📝' : 
                                           storyReply.type === 'image' ? '🖼️' : '🎥'}</span>
            </div>
          </div>
        )}

        {uploading && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg text-blue-700 text-xs border border-blue-200">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Envoi en cours...</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}