'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function MessageInput({ onSendMessage, onTyping, onStopTyping }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
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

      console.log('✅ Fichier uploadé:', response.data);

      const fileType = getFileType(file.type);

      // 🚀 CORRECTION SIMPLE : Envoyer l'objet fichier
      onSendMessage({
        type: fileType,
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
        content: message.trim() // Le texte saisi par l'utilisateur
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

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const frequentEmojis = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '✨', '💯', '🎉', '👏'];

  return (
    <div className="bg-white border-t border-gray-200">
      {showEmojiPicker && (
        <div className="border-b border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Emojis fréquents</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {frequentEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:bg-gray-100 w-10 h-10 rounded-lg transition transform hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className={`flex items-end gap-3 bg-gray-50 rounded-2xl p-3 transition-all ${
          isFocused ? 'ring-2 ring-green-500 shadow-sm' : ''
        }`}>
          
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`shrink-0 p-2 rounded-full transition-all transform hover:scale-110 ${
              showEmojiPicker 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
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
            className={`shrink-0 p-2 rounded-full transition-all transform hover:scale-110 ${
              uploading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
            }`}
            title="Joindre un fichier"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
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
              placeholder={uploading ? "Upload en cours..." : "Message..."}
              className="w-full bg-transparent px-2 py-2 text-gray-900 placeholder-gray-400 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent disabled:opacity-50"
              rows="1"
              style={{ maxHeight: '120px' }}
              disabled={uploading}
            />
            
            {message.length > 0 && (
              <div className="absolute -bottom-5 right-0 text-xs text-gray-400">
                {message.length}
              </div>
            )}
          </div>

          {message.trim() || uploading ? (
            <button
              type="submit"
              disabled={uploading || (!message.trim() && !uploading)}
              className={`shrink-0 p-3 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${
                uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              title={uploading ? "Upload en cours..." : "Envoyer"}
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          ) : (
            <button
              type="button"
              className="shrink-0 p-2 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-50 transition-all transform hover:scale-110"
              title="Message vocal"
              disabled={uploading}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        {isFocused && !uploading && (
          <p className="text-xs text-gray-400 mt-2 text-center animate-fade-in">
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">Enter</kbd> pour envoyer, 
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono ml-1">Shift+Enter</kbd> pour une nouvelle ligne
          </p>
        )}

        {uploading && (
          <p className="text-xs text-green-600 mt-2 text-center animate-pulse">
            📤 Upload du fichier en cours...
          </p>
        )}
      </form>
    </div>
  );
}