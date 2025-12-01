import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2, Camera, AlertCircle } from 'lucide-react';
import api, { uploadFile } from '@/lib/api';
import VoiceRecorder from './VoiceRecorder';
import CameraCapture from './CameraCapture';

export default function MessageInput({ onSendMessage, onTyping, onStopTyping }) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Ajustement responsive de la textarea
  useEffect(() => {
    const adjustTextareaHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const isMobile = window.innerWidth < 768;
        const maxHeight = isMobile ? 80 : 100;
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      }
    };

    adjustTextareaHeight();
  }, [message]);

  // Réajuster si la fenêtre change de taille
  useEffect(() => {
    const handleResize = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const isMobile = window.innerWidth < 768;
        const maxHeight = isMobile ? 80 : 100;
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer emoji picker quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEmojiPicker && containerRef.current && !containerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

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
      setUploadError('Fichier trop volumineux (max 10MB)');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    await uploadFileToServer(file);
  };

  const handleCameraCapture = async (file) => {
    setShowCamera(false);
    await uploadFileToServer(file);
  };

  const uploadFileToServer = async (file) => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadFile(formData);

      const fileType = getFileType(file.type);

      onSendMessage({
        type: fileType,
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
        content: message.trim()
      });

      setMessage('');
      setUploadProgress(100);

    } catch (error) {
      let errorMessage = 'Erreur lors de l\'upload';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout';
      } else if (error.response) {
        errorMessage = error.response.data?.error || `Erreur serveur (${error.response.status})`;
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur';
      }
      
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(null), 5000);
      
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleSendVoice = async (audioBlob, duration) => {
    try {
      setUploading(true);
      
      const file = new File([audioBlob], `voice_${Date.now()}.webm`, {
        type: audioBlob.type
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadFile(formData);

      onSendMessage({
        type: 'voice',
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
        duration: duration,
        isVoiceMessage: true
      });
      
      setShowVoiceRecorder(false);
      
    } catch (error) {
      console.error('❌ Erreur envoi vocal:', error);
      setUploadError('Erreur lors de l\'envoi du message vocal');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const frequentEmojis = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '✨', '💯', '🎉', '👏'];

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onCancel={() => setShowCamera(false)}
      />
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
    <div ref={containerRef} className="bg-slate-50 border-t border-slate-200">
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

      {uploadError && (
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3">
        <div className={`
          flex items-center gap-2 rounded-2xl p-3 transition-all
          ${isFocused 
            ? 'ring-2 ring-blue-500 bg-white shadow-sm' 
            : 'bg-white border border-slate-300'
          }
        `}>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`
                p-2 rounded-xl transition
                ${showEmojiPicker 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title="Ajouter un emoji"
              disabled={uploading}
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={uploading}
              className={`
                p-2 rounded-xl transition
                ${uploading 
                  ? 'text-slate-400 cursor-not-allowed' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }
              `}
              title="Prendre une photo"
            >
              <Camera className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`
                p-2 rounded-xl transition
                ${uploading 
                  ? 'text-slate-400 cursor-not-allowed' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                }
              `}
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
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
            disabled={uploading}
          />

          <div className="flex-1 flex items-center min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={uploading ? "Envoi..." : "Écrivez votre message..."}
              className="
                w-full bg-transparent px-3 py-2.5 
                text-slate-800 placeholder-slate-500 
                focus:outline-none resize-none 
                text-sm leading-5 overflow-hidden
                /* Responsive placeholder */
                placeholder:whitespace-nowrap
                placeholder:overflow-hidden
                placeholder:text-ellipsis
                max-w-full
              "
              rows="1"
              style={{ 
                maxHeight: '100px',
                minHeight: '40px'
              }}
              disabled={uploading}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {message.trim() || uploading ? (
              <button
                type="submit"
                disabled={uploading || (!message.trim() && !uploading)}
                className={`
                  p-2.5 rounded-xl transition
                  ${uploading 
                    ? 'bg-slate-400 cursor-not-allowed text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                  }
                `}
                title={uploading ? "Upload en cours..." : "Envoyer"}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowVoiceRecorder(true)}
                className="
                  p-2.5 rounded-xl 
                  bg-linear-to-r from-blue-500 to-blue-600 
                  hover:from-blue-600 hover:to-blue-700 
                  text-white transition shadow-md hover:shadow-lg
                  /* Responsive size */
                  min-w-11 min-h-11
                "
                title="Enregistrer un message vocal"
                disabled={uploading}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {uploading && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600">Envoi en cours...</span>
              {uploadProgress > 0 && (
                <span className="text-xs text-slate-600">{uploadProgress}%</span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}