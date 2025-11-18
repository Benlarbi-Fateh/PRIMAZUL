'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import VoiceRecorder from './VoiceRecorder';

export default function MessageInput({ onSendMessage, onTyping, onStopTyping }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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

    onSendMessage(message.trim());
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

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        onSendVoice={handleSendVoice}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl border-t-2 border-blue-100 shadow-2xl">
      {showEmojiPicker && (
        <div 
          className="border-b-2 border-blue-100 p-4 animate-slide-in-left"
          style={{
            background: 'linear-gradient(to bottom, #dbeafe, #ffffff)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Emojis fréquents
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {frequentEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-3xl hover:bg-blue-100 w-12 h-12 rounded-2xl transition-all transform hover:scale-125 active:scale-110 shadow-sm hover:shadow-md"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div 
          className={`flex items-end gap-3 rounded-3xl p-4 transition-all ${
            isFocused ? 'ring-4 ring-blue-300 shadow-xl transform scale-[1.01]' : 'shadow-md'
          }`}
          style={{
            background: 'linear-gradient(to right, #dbeafe, #ecfeff)'
          }}
        >
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`shrink-0 p-3 rounded-2xl transition-all transform hover:scale-110 active:scale-95 ${
              showEmojiPicker 
                ? 'text-blue-600 bg-blue-200 shadow-md' 
                : 'text-blue-500 hover:text-blue-600 hover:bg-blue-100'
            }`}
            title="Ajouter un emoji"
            disabled={uploading}
          >
            <Smile className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`shrink-0 p-3 rounded-2xl transition-all transform hover:scale-110 active:scale-95 ${
              uploading 
                ? 'text-blue-400 cursor-not-allowed bg-blue-100' 
                : 'text-blue-500 hover:text-blue-600 hover:bg-blue-100'
            }`}
            title="Joindre un fichier"
          >
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Paperclip className="w-6 h-6" />}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
            disabled={uploading}
          />

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={uploading ? "Upload en cours..." : "Écrivez votre message..."}
              className="w-full bg-white/80 backdrop-blur-sm px-4 py-3 text-slate-800 placeholder-blue-400 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent disabled:opacity-50 rounded-2xl border-2 border-transparent focus:border-blue-300 font-medium"
              rows="1"
              style={{ maxHeight: '120px' }}
              disabled={uploading}
            />
            
            {message.length > 0 && (
              <div className="absolute -bottom-6 right-0 text-xs text-blue-500 font-semibold">
                {message.length} caractères
              </div>
            )}
          </div>

          {message.trim() || uploading ? (
            <button
              type="submit"
              disabled={uploading || (!message.trim() && !uploading)}
              className={`shrink-0 p-4 rounded-2xl transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl ${
                uploading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'text-white'
              }`}
              title={uploading ? "Upload en cours..." : "Envoyer"}
              style={!uploading ? {
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8, #06b6d4)'
              } : {}}
            >
              {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className="shrink-0 p-4 rounded-2xl text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
              title="Enregistrer un message vocal"
              disabled={uploading}
              style={{
                background: 'linear-gradient(135deg, #f43f5e, #db2777)'
              }}
            >
              <Mic className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* SUPPRIMÉ : Le texte "Enter pour envoyer..." */}

        {uploading && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-xl text-blue-700 font-semibold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Envoi en cours...</span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}