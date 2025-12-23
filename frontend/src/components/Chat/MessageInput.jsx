'use client'

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  X, 
  Loader2, 
  Check, 
  Clock, 
  Reply, 
  Camera, 
  AlertCircle, 
  Image as ImageIcon 
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import api, { uploadFile } from '@/lib/api';
import VoiceRecorder from './VoiceRecorder';
import CameraCapture from './CameraCapture';
import EmojiPicker from './EmojiPicker';
import ScheduleModal from './ScheduleModal';
import useBlockCheck from '@/hooks/useBlockCheck';

export default function MessageInput({ 
  onSendMessage, 
  onTyping, 
  onStopTyping,
  conversationId,
  contactId,
  // Props pour le mode édition
  editingMessageId,
  editingContent,
  onConfirmEdit,
  onCancelEdit,
  // Props pour la réponse
  replyingToId,
  replyingToContent,
  replyingToSender,
  onCancelReply
}) {
  const { isDark } = useTheme();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const containerRef = useRef(null);
  
  const { isBlocked, blockStatus } = useBlockCheck(contactId);

  // Styles basés sur le thème (comme 2e composant)
  const containerBg = isDark
    ? 'bg-blue-950/80 border-blue-800'
    : 'bg-blue-50 border-blue-200';

  const inputBg = isDark
    ? 'bg-blue-800/50 border-blue-700'
    : 'bg-white border-blue-300';

  const textColor = isDark ? 'text-blue-100' : 'text-slate-800';

  const placeholderColor = isDark
    ? 'placeholder-blue-400'
    : 'placeholder-slate-500';

  const buttonColor = isDark
    ? 'text-blue-400 hover:text-cyan-400 hover:bg-blue-700/50'
    : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50';

  const buttonActive = isDark
    ? 'text-cyan-400 bg-blue-700/50'
    : 'text-blue-600 bg-blue-50';

  const sendButtonStyle = isDark
    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/20'
    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg';

  const errorBg = isDark
    ? 'bg-red-900/30 border-red-800 text-red-300'
    : 'bg-red-50 border-red-200 text-red-700';

  const progressBg = isDark ? 'bg-blue-700' : 'bg-blue-200';

  const progressBar = isDark ? 'bg-cyan-500' : 'bg-blue-500';

  const progressText = isDark ? 'text-blue-300' : 'text-blue-600';

  const focusedRing = isDark ? 'ring-2 ring-cyan-500' : 'ring-2 ring-blue-500';

  const disabledColor = isDark
    ? 'text-blue-600 cursor-not-allowed'
    : 'text-blue-400 cursor-not-allowed';

  const voiceButtonStyle = isDark
    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';

  // Synchroniser avec le contenu en édition
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

  // Ajuste la hauteur du textarea (comme 2e composant)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = isMobile ? 80 : 100;
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [message, isMobile]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showEmojiPicker &&
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const checkBlockStatus = () => {
    if (isBlocked) {
      alert(
        blockStatus?.blockedMe
          ? '❌ Vous êtes bloqué par cet utilisateur'
          : '🚫 Vous avez bloqué cet utilisateur'
      );
      return true;
    }
    return false;
  };

  const handleSendMessage = async (messageContent) => {
    if (isBlocked) {
      alert(
        blockStatus?.blockedMe
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

      alert("Erreur lors de l'envoi du message");
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

    if (editingMessageId) {
      onConfirmEdit(message.trim());
      setMessage('');
    } else {
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

    if (e.key === 'Escape' && editingMessageId) {
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setMessage('');
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleMediaSelect = async (e) => {
    if (checkBlockStatus()) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadError('Veuillez sélectionner une image ou une vidéo');
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    const maxSizeText = isVideo ? '50MB' : '10MB';

    if (file.size > maxSize) {
      setUploadError(`Fichier trop volumineux (max ${maxSizeText})`);
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    await uploadFileToServer(file);
  };

  const handleFileSelect = async (e) => {
    if (checkBlockStatus()) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
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

      let videoDuration = 0;
      if (file.type.startsWith('video/')) {
        videoDuration = await getVideoDuration(file);
      }

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileType = getFileType(file.type);

      const messageData = {
        type: fileType,
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
        videoDuration: response.data.videoDuration || videoDuration || 0,
        videoThumbnail: response.data.videoThumbnail || null,
        content: message.trim(),
      };

      await handleSendMessage(messageData);
      setMessage('');
      setUploadProgress(100);
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      let errorMessage = "Erreur lors de l'upload";
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout';
      } else if (error.response) {
        errorMessage =
          error.response.data?.error ||
          `Erreur serveur (${error.response.status})`;
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur';
      }
      setUploadError(errorMessage);
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleSendVoice = async (audioBlob, duration) => {
    try {
      await handleSendMessage({
        type: 'voice',
        audioBlob,
        duration,
        isVoiceMessage: true,
      });

      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('❌ Erreur envoi vocal:', error);
      alert("Erreur lors de l'envoi du message vocal");
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  // Blocage (inchangé)
  if (isBlocked) {
    return (
      <div className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300 via-red-300 to-orange-300 animate-pulse"></div>

        <div className="relative px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2 sm:gap-3">
          <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            {blockStatus?.blockedMe ? (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm sm:text-base truncate">
              {blockStatus?.blockedMe
                ? '🚫 Vous êtes bloqué'
                : '🛡️ Utilisateur bloqué'}
            </div>
            <div className="text-xs sm:text-sm text-white/90 truncate">
              {blockStatus?.blockedMe
                ? "Impossible d'envoyer des messages"
                : "Vous avez bloqué cet utilisateur"}
            </div>
          </div>

          {blockStatus?.iBlocked && !blockStatus?.blockedMe && (
            <button
              onClick={async () => {
                if (!window.confirm('Voulez-vous débloquer cet utilisateur ?'))
                  return;

                try {
                  const response = await api.post(
                    '/message-settings/unblock',
                    {
                      targetUserId: contactId,
                    }
                  );

                  const data = response.data;

                  if (data.success) {
                    window.dispatchEvent(
                      new CustomEvent('block-status-changed')
                    );
                    alert('✅ Utilisateur débloqué');
                    window.location.reload();
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

  // Vue caméra / vocal (inchangées)
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
    <div
      ref={containerRef}
      className={`border-t relative ${containerBg} safe-area-padding-bottom`}
    >
      {/* Bandeau édition */}
      {editingMessageId && (
        <div
          className="border-b-2 border-blue-200 px-3 sm:px-4 py-2 sm:py-3 animate-slide-in-left"
          style={{ background: 'linear-gradient(to right, #dbeafe, #ecfeff)' }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full"></div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-blue-700 flex items-center gap-1 sm:gap-2">
                  ✏️ <span>Modification en cours</span>
                </p>
                <p className="text-xs text-blue-600 hidden xs:block">
                  <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-blue-700 font-mono text-xs">
                    Enter
                  </kbd>{' '}
                  pour confirmer ·
                  <kbd className="px-1.5 py-0.5 bg-blue-200 rounded text-blue-700 font-mono text-xs ml-1">
                    Esc
                  </kbd>{' '}
                  pour annuler
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

      {/* Bandeau réponse */}
      {replyingToId && (
        <div
          className="border-b-2 border-green-200 px-3 sm:px-4 py-2 sm:py-3 animate-slide-in-left"
          style={{ background: 'linear-gradient(to right, #d1fae5, #a7f3d0)' }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-green-600 to-emerald-500 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-green-700 flex items-center gap-1 sm:gap-2">
                  <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Réponse à {replyingToSender?.name || 'Utilisateur'}</span>
                </p>
                <p className="text-xs text-green-600 truncate max-w-xs sm:max-w-md">
                  {replyingToContent}
                </p>
              </div>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 sm:p-2 hover:bg-green-200 rounded-full transition-all transform hover:scale-110 active:scale-95"
              title="Annuler"
            >
              <X size={18} className="text-green-600" />
            </button>
          </div>
        </div>
      )}

      {/* EmojiPicker (design du 2e composant) */}
      {showEmojiPicker && !editingMessageId && (
        <EmojiPicker
          onSelect={handleEmojiClick}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Erreur upload */}
      {uploadError && (
        <div className="px-3 pt-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${errorBg}`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        </div>
      )}

      {/* Formulaire principal : design comme le 2e composant */}
      <form onSubmit={handleSubmit} className="p-3">
        <div
          className={`
            flex items-center gap-2 rounded-2xl p-3 transition-all border
            ${
              editingMessageId
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400'
                : isFocused
                ? focusedRing
                : inputBg
            }
          `}
        >
          {/* Boutons de gauche (emoji, caméra, media, fichier) */}
          {!editingMessageId && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`
                  p-2 rounded-xl transition
                  ${
                    showEmojiPicker
                      ? buttonActive
                      : uploading
                      ? disabledColor
                      : buttonColor
                  }
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
                  ${uploading ? disabledColor : buttonColor}
                `}
                title="Prendre une photo"
              >
                <Camera className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                disabled={uploading}
                className={`
                  p-2 rounded-xl transition
                  ${uploading ? disabledColor : buttonColor}
                `}
                title="Envoyer une image ou vidéo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={`
                  p-2 rounded-xl transition
                  ${uploading ? disabledColor : buttonColor}
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
          )}

          <input
            ref={mediaInputRef}
            type="file"
            onChange={handleMediaSelect}
            className="hidden"
            accept="image/*,video/*"
            disabled={uploading}
          />

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
            disabled={uploading}
          />

          {/* Zone de texte */}
          <div className="flex-1 relative flex items-center min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                editingMessageId
                  ? 'Modifier le message...'
                  : uploading
                  ? 'Upload en cours...'
                  : 'Écrivez votre message...'
              }
              className={`
                w-full bg-transparent px-3 py-2.5 
                ${textColor} ${placeholderColor}
                focus:outline-none resize-none 
                text-sm leading-5 overflow-hidden
                placeholder:whitespace-nowrap
                placeholder:overflow-hidden
                placeholder:text-ellipsis
                max-w-full
              `}
              rows={1}
              style={{
                maxHeight: isMobile ? '80px' : '120px',
                minHeight: '40px',
              }}
              disabled={uploading}
            />

            {/* Compteur desktop */}
            {message.length > 0 && !isMobile && (
              <div className="absolute -bottom-5 right-0 text-xs text-blue-500 font-semibold hidden xs:block">
                {message.length} caractères
              </div>
            )}
          </div>

          {/* Boutons droite : schedule / envoyer / vocal */}
          <div className="flex items-center gap-1 shrink-0">
            {!editingMessageId && !message.trim() && !uploading && (
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className={`
                  p-2 rounded-xl transition
                  ${uploading ? disabledColor : buttonColor}
                `}
                title="Programmer un message"
                disabled={uploading}
              >
                <Clock className="w-5 h-5" />
              </button>
            )}

            {message.trim() || uploading ? (
              <button
                type="submit"
                disabled={uploading || (!message.trim() && !uploading)}
                className={`
                  p-2.5 rounded-xl transition
                  ${
                    uploading
                      ? isDark
                        ? 'bg-blue-700/50 cursor-not-allowed text-blue-400'
                        : 'bg-blue-400 cursor-not-allowed text-white'
                      : editingMessageId
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md hover:shadow-lg'
                      : sendButtonStyle
                  }
                `}
                title={
                  uploading
                    ? 'Upload en cours...'
                    : editingMessageId
                    ? 'Confirmer'
                    : 'Envoyer'
                }
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : editingMessageId ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            ) : (
              !editingMessageId && (
                <button
                  type="button"
                  onClick={() => setShowVoiceRecorder(true)}
                  className={`
                    p-2.5 rounded-xl 
                    text-white transition shadow-md hover:shadow-lg
                    min-w-11 min-h-11
                    ${voiceButtonStyle}
                  `}
                  title="Enregistrer un message vocal"
                  disabled={uploading}
                >
                  <Mic className="w-5 h-5" />
                </button>
              )
            )}
          </div>
        </div>

        {/* Progression upload */}
        {uploading && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${progressText}`}>
                Envoi en cours...
              </span>
              {uploadProgress > 0 && (
                <span className={`text-xs ${progressText}`}>
                  {uploadProgress}%
                </span>
              )}
            </div>
            <div className={`w-full rounded-full h-1.5 ${progressBg}`}>
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${progressBar}`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Compteur mobile */}
        {message.length > 0 && isMobile && (
          <div className="text-center mt-1">
            <span className="text-xs text-blue-500 font-semibold bg-blue-100 px-2 py-1 rounded-full">
              {message.length} caractères
            </span>
          </div>
        )}
      </form>

      {/* Schedule modal (inchangé) */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={async (data) => {
          try {
            await api.post('/messages/schedule', {
              ...data,
              conversationId,
              type: 'text',
            });
            alert('✅ Message programmé avec succès !');
            setShowScheduleModal(false);
          } catch (error) {
            console.error('Erreur:', error);
            alert('❌ Impossible de programmer le message');
            throw error;
          }
        }}
        initialContent={message}
      />

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