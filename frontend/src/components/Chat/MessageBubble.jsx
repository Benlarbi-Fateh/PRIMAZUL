'use client'

import { useState, useRef, useEffect, useContext } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Image as ImageIcon, 
  File, 
  Mic, 
  Download, 
  ExternalLink, 
  Check, 
  CheckCheck,
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2,
  MoreVertical, 
  Trash2, 
  Edit2, 
  Languages, 
  X, 
  RotateCcw,
  Reply
} from 'lucide-react';
import Image from 'next/image';
import VoiceMessage from './VoiceMessage';
import ReactionPicker from './ReactionPicker';
import MessageReactions from './MessageReactions';
import { AuthContext } from '@/context/AuthProvider';
import { emitToggleReaction } from '@/services/socket';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'next/navigation';

// ========================================
// 📅 DATE SEPARATOR COMPONENT
// ========================================
export function DateSeparator({ date }) {
  const { isDark } = useTheme();
  
  const formatDate = (d) => {
    const dateObj = new Date(d);
    if (isToday(dateObj)) return "Aujourd'hui";
    if (isYesterday(dateObj)) return "Hier";
    return format(dateObj, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className={`px-3 py-1 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} capitalize`}>{formatDate(date)}</span>
      </div>
    </div>
  );
}

// ========================================
// 💬 MESSAGE BUBBLE COMPONENT
// ========================================
export default function MessageBubble({ 
  message, 
  isMine, 
  isGroup,
  isLast = false,
  onDelete,
  onEdit,
  onTranslate,
  onReply
}) {
  // ========================================
  // 📦 ÉTATS
  // ========================================
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateIcon, setShowTranslateIcon] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const currentUserId = user?._id || user?.id;
  const router = useRouter();

  // ========================================
  // 🎨 FORMATAGE
  // ========================================
  const formatTime = (date) => {
    try {
      return format(new Date(date), 'HH:mm', { locale: fr });
    } catch {
      return '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ========================================
  // 🎯 GESTION DES FICHIERS
  // ========================================
  const getFileType = () => {
    if (message.type === 'image') return 'image';
    if (message.type === 'audio') return 'audio';
    if (message.type === 'file') return 'file';
    if (message.type === 'voice') return 'voice';
    if (message.type === 'video') return 'video';
    return 'text';
  };

  const handleOpenFile = () => {
    if (message.fileUrl) {
      window.open(message.fileUrl, '_blank');
    }
  };

  const handleDownload = async () => {
    if (!message.fileUrl) return;

    try {
      const response = await fetch(message.fileUrl);
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = message.fileName || 'download';
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('❌ Erreur téléchargement :', error);
      window.open(message.fileUrl, '_blank');
    }
  };

  const handleOpenStoryFromReply = (e) => {
    e.stopPropagation();
    const statusId = message.storyReply?.statusId;
    if (!statusId) return;

    router.push(`/status?statusId=${statusId}`);
  };

  // ========================================
  // 🎥 GESTION VIDÉO
  // ========================================
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoClick = () => {
    if (!showControls) {
      setShowControls(true);
      setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Erreur fullscreen: ${err.message}`);
      });
    }
  };

  // ========================================
  // 😊 GESTION DES RÉACTIONS
  // ========================================
  const handleReaction = (emoji) => {
    emitToggleReaction({
      messageId: message._id,
      emoji,
      userId: currentUserId,
      conversationId: message.conversationId
    });
  };

  // ========================================
  // 🗑️ GESTION DU MENU 3 POINTS
  // ========================================
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    
    if (window.confirm('Voulez-vous vraiment supprimer ce message ?')) {
      if (onDelete) {
        onDelete(message._id);
      }
    }
    
    setShowMenu(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    
    if (onEdit) {
      onEdit(message._id, message.content);
    }
    
    setShowMenu(false);
  };

  const handleReply = (e) => {
    e.stopPropagation();
    
    if (onReply) {
      onReply(message._id, message.content, message.sender);
    }
    
    setShowMenu(false);
  };

  // ========================================
  // 🌍 GESTION DE LA TRADUCTION
  // ========================================
  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'Anglais', flag: '🇬🇧' },
    { code: 'es', name: 'Espagnol', flag: '🇪🇸' },
    { code: 'de', name: 'Allemand', flag: '🇩🇪' },
    { code: 'it', name: 'Italien', flag: '🇮🇹' },
    { code: 'ar', name: 'Arabe', flag: '🇸🇦' },
    { code: 'zh', name: 'Chinois', flag: '🇨🇳' },
    { code: 'ja', name: 'Japonais', flag: '🇯🇵' },
  ];

  const handleTranslateClick = (e) => {
    e.stopPropagation();
    
    if (isTranslated) {
      setIsTranslated(false);
      setShowLanguageMenu(false);
    } else {
      setShowLanguageMenu(!showLanguageMenu);
    }
  };

  const handleTranslate = async (targetLang) => {
    setIsTranslating(true);
    setShowLanguageMenu(false);
    
    try {
      if (onTranslate) {
        if (!isTranslated) {
          setOriginalText(message.content);
        }
        
        const translated = await onTranslate(message.content, message._id, targetLang);
        
        setTranslatedText(translated);
        setIsTranslated(true);
      }
    } catch (error) {
      console.error('❌ Erreur de traduction:', error);
      alert('Impossible de traduire ce message');
    } finally {
      setIsTranslating(false);
    }
  };

  // ========================================
  // 🎨 FERMETURE DES MENUS
  // ========================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu || showLanguageMenu) {
        setShowMenu(false);
        setShowLanguageMenu(false);
      }
    };
    
    if (showMenu || showLanguageMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu, showLanguageMenu]);

  // ========================================
  // 📊 RENDU DU STATUT
  // ========================================
  const status = message.status || 'sent';
  const showTimestamp = isHovered || isLast;

  const renderStatus = () => {
    if (!isMine) return null;
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-cyan-400 inline ml-1" />;
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-blue-200 inline ml-1" />;
    if (status === 'sent') return <Check className="w-4 h-4 text-blue-200 inline ml-1" />;
    return null;
  };

  const renderTimestamp = () => (
    <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${showTimestamp ? 'max-h-6 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
      <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatTime(message.createdAt)}</span>
      {renderStatus()}
    </div>
  );

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mt-2 mb-1`}>
        <MessageReactions
          reactions={message.reactions}
          onReactionClick={handleReaction}
          currentUserId={currentUserId}
          isMine={isMine}
        />
      </div>
    );
  };

  // ========================================
  // 🎬 RENDU MESSAGE VIDÉO
  // ========================================
  const renderVideoMessage = () => {
    const avatarUrl = message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;

    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
            {message.sender?.name}
          </p>
        )}
        <div className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end mb-1">
              <Image 
                src={avatarUrl} 
                alt={message.sender?.name || 'User'} 
                fill 
                sizes="32px"
                className="object-cover" 
              />
            </div>
          )}
          <div 
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row' : 'flex-row-reverse'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* ORDRE: 3 POINTS → REACTION */}
            <div className={`flex items-center gap-1 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* MENU 3 POINTS */}
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {showMenu && (
                  <div 
                    className={`absolute ${isMine ? 'left-0' : 'right-0'} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleReply}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                    </button>

                    {isMine && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* REACTION PICKER */}
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>

            <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100">
                {message.replyTo && (
                  <div className={`p-2 border-l-4 ${
                    isMine 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'bg-gray-100 border-blue-500'
                  }`}>
                    <p className={`text-xs font-semibold ${
                      isMine ? 'text-blue-700' : 'text-blue-600'
                    }`}>
                      {message.replyToSender?.name || 'Utilisateur'}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${
                      isMine ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {message.replyToContent}
                    </p>
                  </div>
                )}

                <div 
                  className="relative w-full h-44 sm:h-52 bg-black cursor-pointer"
                  onClick={handleVideoClick}
                >
                  <video
                    ref={videoRef}
                    preload="metadata"
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  >
                    <source src={message.fileUrl} type="video/mp4" />
                    <source src={message.fileUrl} type="video/webm" />
                    Votre navigateur ne supporte pas les vidéos.
                  </video>
                  
                  {!isPlaying && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all hover:bg-black/50"
                    >
                      <div className="w-14 h-14 flex items-center justify-center bg-white/90 rounded-full hover:scale-105 transition-transform">
                        <Play className="w-8 h-8 text-black ml-1" fill="black" />
                      </div>
                    </button>
                  )}

                  {(showControls || isPlaying) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlay();
                            }}
                            className="text-white hover:bg-white/20 p-2 rounded-full"
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" fill="white" />
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute();
                            }}
                            className="text-white hover:bg-white/20 p-2 rounded-full"
                          >
                            {isMuted ? (
                              <VolumeX className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                          
                          <span className="text-xs text-white font-medium">
                            {formatDuration(message.videoDuration || 0)}
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFullscreen();
                          }}
                          className="text-white hover:bg-white/20 p-2 rounded-full"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">
                    VIDÉO
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-black/90 transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                
                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-gradient-to-b from-white to-blue-50/30">
                    <p className="text-sm text-slate-700 font-medium">{message.content}</p>
                  </div>
                )}
              </div>
              
              <span className={`text-xs mt-1.5 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
                {formatTime(message.createdAt)}
                {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };

  // ========================================
  // 🎤 RENDU MESSAGE VOCAL
  // ========================================
  const renderVoiceMessage = () => {
    const avatarUrl = message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;

    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span className={`text-xs font-semibold mb-1 ml-10 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            {message.sender?.name}
          </span>
        )}
        <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
              <Image 
                src={avatarUrl} 
                alt={message.sender?.name || 'User'} 
                fill 
                sizes="32px"
                className="object-cover" 
              />
            </div>
          )}
          <div 
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row' : 'flex-row-reverse'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* ORDRE: 3 POINTS → REACTION */}
            <div className={`flex items-center gap-1 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* MENU 3 POINTS */}
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {showMenu && (
                  <div 
                    className={`absolute ${isMine ? 'left-0' : 'right-0'} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleReply}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                    </button>

                    {isMine && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* REACTION PICKER */}
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>

            <div className="flex flex-col max-w-xs lg:max-w-md">
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100">
                {message.replyTo && (
                  <div className={`p-2 border-l-4 ${
                    isMine 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'bg-gray-100 border-blue-500'
                  }`}>
                    <p className={`text-xs font-semibold ${
                      isMine ? 'text-blue-700' : 'text-blue-600'
                    }`}>
                      {message.replyToSender?.name || 'Utilisateur'}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${
                      isMine ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {message.replyToContent}
                    </p>
                  </div>
                )}

                <VoiceMessage
                  voiceUrl={message.voiceUrl}
                  voiceDuration={message.voiceDuration}
                  isMine={isMine}
                  isGroup={isGroup}
                  sender={message.sender}
                  isDark={isDark}
                />
              </div>
              
              <span className={`text-xs mt-1.5 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
                {formatTime(message.createdAt)}
                {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };

  // ========================================
  // 🖼️ RENDU MESSAGE IMAGE
  // ========================================
  const renderImageMessage = () => {
    const avatarUrl = message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;

    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
            {message.sender?.name}
          </p>
        )}
        <div className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end">
              <Image 
                src={avatarUrl} 
                alt={message.sender?.name || 'User'} 
                fill 
                sizes="32px"
                className="object-cover" 
              />
            </div>
          )}
          <div 
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row' : 'flex-row-reverse'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* ORDRE: 3 POINTS → REACTION */}
            <div className={`flex items-center gap-1 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* MENU 3 POINTS */}
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {showMenu && (
                  <div 
                    className={`absolute ${isMine ? 'left-0' : 'right-0'} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleReply}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                    </button>

                    {isMine && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* REACTION PICKER */}
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>

            <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
              <div 
                className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all transform hover:scale-[1.02] cursor-pointer"
                onClick={handleOpenFile}
              >
                {message.replyTo && (
                  <div className={`p-2 border-l-4 ${
                    isMine 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'bg-gray-100 border-blue-500'
                  }`}>
                    <p className={`text-xs font-semibold ${
                      isMine ? 'text-blue-700' : 'text-blue-600'
                    }`}>
                      {message.replyToSender?.name || 'Utilisateur'}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${
                      isMine ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {message.replyToContent}
                    </p>
                  </div>
                )}

                <div className={`relative w-56 h-44 sm:w-64 sm:h-52 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Image 
                    src={message.fileUrl} 
                    alt={message.fileName || 'Image'} 
                    fill 
                    sizes="(max-width: 640px) 224px, 256px"
                    className="object-cover hover:scale-105 transition-transform duration-300" 
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-black/90 transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-linear-to-b from-white to-blue-50/30">
                    <p className="text-sm text-slate-700 font-medium">{message.content}</p>
                  </div>
                )}
              </div>
              
              <span className={`text-xs mt-1.5 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
                {formatTime(message.createdAt)}
                {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };

 // ========================================
// 💬 RENDU MESSAGE TEXTE
// ========================================
const renderTextMessage = () => {
  const avatarUrl =
    message.sender?.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      message.sender?.name || 'User'
    )}&background=3b82f6&color=fff&bold=true`;

  const story = message.storyReply;
  const isStoryReply = message.type === 'story_reply' && story;

  // 🟣 CAS SPÉCIAL : MESSAGE DE RÉPONSE À UNE STORY
  if (isStoryReply) {
    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span
            className={`text-xs font-semibold mb-1 ml-10 ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}
          >
            {message.sender?.name}
          </span>
        )}

        <div
          className={`flex items-end gap-2 ${
            isMine ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Avatar */}
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
              <Image
                src={avatarUrl}
                alt={message.sender?.name || 'User'}
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          )}

          {/* Colonne principale : preview story + (icônes + bulle) */}
          <div
            className={`flex flex-col max-w-xs lg:max-w-md xl:max-w-lg gap-1 ${
              isMine ? 'items-end' : 'items-start'
            }`}
          >
            {/* 🔹 "Réponse à un statut" (en haut) + vignette (en dessous), cliquable */}
            <div
  className={`flex flex-col gap-1 cursor-pointer ${
    isMine ? 'items-end self-end' : 'items-start'
  }`}
  onClick={handleOpenStoryFromReply}
>
              {/* Texte au-dessus */}
              <span
                className={`text-[10px] uppercase tracking-wide ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Réponse à un statut
              </span>

              {/* Ligne des vignettes en dessous */}
              <div className="flex items-center gap-2">
                {/* 🟣 VIGNETTE POUR STORY TEXTE */}
                {story.storyType === 'text' && story.storyText && (
                  <div className="relative w-20 h-24 rounded-md overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center px-1">
                      <p className="text-[10px] text-white text-center leading-snug line-clamp-4 whitespace-pre-wrap">
                        {story.storyText}
                      </p>
                    </div>
                  </div>
                )}

                {/* 🟢 VIGNETTE POUR IMAGE / VIDÉO */}
                {(story.storyType === 'image' || story.storyType === 'video') &&
                  story.storyUrl && (
                    <div className="relative w-16 h-24 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={story.storyUrl}
                        alt="Statut"
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                      {story.storyType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-[8px] font-semibold text-white bg-black/60 px-1 py-0.5 rounded-full">
                            VIDÉO
                          </span>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Ligne ICÔNES + BULLE, alignées ensemble */}
            <div
              className={`relative flex items-start gap-2 group ${
                isMine ? 'flex-row' : 'flex-row-reverse'
              }`}
              onMouseEnter={() => {
                setShowTranslateIcon(true);
                setIsHovered(true);
              }}
              onMouseLeave={() => {
                setShowTranslateIcon(false);
                setIsHovered(false);
              }}
            >
              {/* COLONNE ICONES : 3 POINTS → REACTION → TRADUCTION */}
              <div
                className={`flex items-start gap-1 ${
                  isMine ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* MENU 3 POINTS */}
                <div className="relative mt-[2px]">
                  <button
                    onClick={handleMenuToggle}
                    className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {showMenu && (
                    <div
                      className={`absolute ${
                        isMine ? 'left-0' : 'right-0'
                      } top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={handleReply}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                      >
                        <Reply className="w-4 h-4" />
                        Répondre
                      </button>

                      {isMine && (
                        <>
                          <button
                            onClick={handleEdit}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                          >
                            <Edit2 className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* REACTION PICKER */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-[2px]">
                  <ReactionPicker
                    onSelect={handleReaction}
                    isMine={isMine}
                  />
                </div>

                {/* BOUTON TRADUCTION */}
                {showTranslateIcon && (
                  <div className="relative mt-[2px]">
                    <button
                      onClick={handleTranslateClick}
                      disabled={isTranslating}
                      className={`p-2 rounded-full transition transform hover:scale-110 ${
                        isTranslated
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                      }`}
                      title={
                        isTranslated
                          ? 'Voir le texte original'
                          : 'Traduire ce message'
                      }
                    >
                      {isTranslating ? (
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : isTranslated ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <Languages className="w-4 h-4" />
                      )}
                    </button>

                    {showLanguageMenu && (
                      <div
                        className={`absolute ${
                          isMine ? 'right-0' : 'left-0'
                        } bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-[9999]`}
                        style={{
                          maxHeight: '280px',
                          overflowY: 'auto',
                          top: '100%',
                          bottom: 'auto',
                          marginTop: '8px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-2 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-600">
                            Traduire en :
                          </p>
                        </div>
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleTranslate(lang.code)}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 transition"
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="text-sm text-gray-700">
                              {lang.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BULLE BLEUE / BLANCHE */}
              <div
                className={`px-5 py-3 rounded-3xl shadow-md transition-all transform hover:scale-[1.02] ${
                  isMine
                    ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white rounded-br-md'
                    : 'bg-white text-slate-800 rounded-bl-md border-2 border-blue-100'
                }`}
              >
                {message.replyTo && (
                  <div
                    className={`mb-2 p-2 rounded-lg border-l-4 ${
                      isMine
                        ? 'bg-blue-700/30 border-white/50'
                        : 'bg-gray-100 border-blue-500'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        isMine ? 'text-white/80' : 'text-blue-600'
                      }`}
                    >
                      {message.replyToSender?.name || 'Utilisateur'}
                    </p>
                    <p
                      className={`text-xs mt-1 line-clamp-2 ${
                        isMine ? 'text-white/70' : 'text-gray-600'
                      }`}
                    >
                      {message.replyToContent}
                    </p>
                  </div>
                )}

                <p className="text-sm wrap-break-word whitespace-pre-wrap leading-relaxed">
                  {isTranslated ? translatedText : message.content}
                </p>

                <span
                  className={`text-xs mt-2 flex items-center gap-1 ${
                    isMine
                      ? 'text-blue-100 justify-end'
                      : 'text-slate-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                  {renderStatus()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {renderReactions()}
        {renderTimestamp()}
      </div>
    );
  }

  // 🟢 CAS NORMAL : TOUS LES AUTRES MESSAGES TEXTE (TON DESIGN D’ORIGINE)
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {!isMine && isGroup && (
        <span
          className={`text-xs font-semibold mb-1 ml-10 ${
            isDark ? 'text-blue-300' : 'text-blue-700'
          }`}
        >
          {message.sender?.name}
        </span>
      )}

      <div
        className={`flex items-end gap-2 ${
          isMine ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {!isMine && (
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
            <Image
              src={avatarUrl}
              alt={message.sender?.name || 'User'}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        )}

        {/* CONTENEUR PRINCIPAL AVEC GESTION DU SURVOL */}
        <div
          className={`relative flex items-center gap-2 group ${
            isMine ? 'flex-row' : 'flex-row-reverse'
          }`}
          onMouseEnter={() => {
            setShowTranslateIcon(true);
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setShowTranslateIcon(false);
            setIsHovered(false);
          }}
        >
          {/* ORDRE: 3 POINTS → REACTION → TRADUCTION */}
          <div
            className={`flex items-center gap-1 ${
              isMine ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            {/* MENU 3 POINTS */}
            <div className="relative">
              <button
                onClick={handleMenuToggle}
                className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>

              {showMenu && (
                <div
                  className={`absolute ${
                    isMine ? 'left-0' : 'right-0'
                  } top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleReply}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                  >
                    <Reply className="w-4 h-4" />
                    Répondre
                  </button>

                  {isMine && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* REACTION PICKER - VISIBLE */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ReactionPicker
                onSelect={handleReaction}
                isMine={isMine}
              />
            </div>

            {/* BOUTON TRADUCTION */}
            {showTranslateIcon && (
              <div className="relative">
                <button
                  onClick={handleTranslateClick}
                  disabled={isTranslating}
                  className={`p-2 rounded-full transition transform hover:scale-110 ${
                    isTranslated
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                  }`}
                  title={
                    isTranslated
                      ? 'Voir le texte original'
                      : 'Traduire ce message'
                  }
                >
                  {isTranslating ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : isTranslated ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Languages className="w-4 h-4" />
                  )}
                </button>

                {showLanguageMenu && (
                  <div
                    className={`absolute ${
                      isMine ? 'right-0' : 'left-0'
                    } bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-[9999]`}
                    style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      top: '100%',
                      bottom: 'auto',
                      marginTop: '8px',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-600">
                        Traduire en :
                      </p>
                    </div>
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleTranslate(lang.code)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 transition"
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className="text-sm text-gray-700">
                          {lang.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BULLE DE MESSAGE */}
          <div
            className={`max-w-xs lg:max-w-md xl-max-w-lg px-5 py-3 rounded-3xl shadow-md transition-all transform hover:scale-[1.02] ${
              isMine
                ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white rounded-br-md'
                : 'bg-slate-700 text-white rounded-bl-md border-2 border-slate-600'

            }`}
          >
            {message.replyTo && (
              <div
                className={`mb-2 p-2 rounded-lg border-l-4 ${
                  isMine
                    ? 'bg-blue-700/30 border-white/50'
                    : 'bg-gray-100 border-blue-500'
                }`}
              >
                <p
                  className={`text-xs font-semibold ${
                    isMine ? 'text-white/80' : 'text-blue-600'
                  }`}
                >
                  {message.replyToSender?.name || 'Utilisateur'}
                </p>
                <p
                  className={`text-xs mt-1 line-clamp-2 ${
                    isMine ? 'text-white/70' : 'text-gray-600'
                  }`}
                >
                  {message.replyToContent}
                </p>
              </div>
            )}

            <p className="text-sm wrap-break-word whitespace-pre-wrap leading-relaxed">
              {isTranslated ? translatedText : message.content}
            </p>

            <span
              className={`text-xs mt-2 flex items-center gap-1 ${
                isMine ? 'text-blue-100 justify-end' : 'text-slate-500'
              }`}
            >
              {formatTime(message.createdAt)}
              {renderStatus()}
            </span>
          </div>
        </div>
      </div>

      {renderReactions()}
      {renderTimestamp()}
    </div>
  );
}

  // ========================================
  // 📁 RENDU MESSAGE FICHIER
  // ========================================
  const renderFileMessage = () => {
    const avatarUrl = message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;

    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span className={`text-xs font-semibold mb-1 ml-10 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            {message.sender?.name}
          </span>
        )}
        <div className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end">
              <Image 
                src={avatarUrl} 
                alt={message.sender?.name || 'User'} 
                fill 
                sizes="32px"
                className="object-cover" 
              />
            </div>
          )}
          <div 
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row' : 'flex-row-reverse'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* ORDRE: 3 POINTS → REACTION */}
            <div className={`flex items-center gap-1 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* MENU 3 POINTS */}
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {showMenu && (
                  <div 
                    className={`absolute ${isMine ? 'left-0' : 'right-0'} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleReply}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                    </button>

                    {isMine && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* REACTION PICKER */}
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>

            <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
              {message.replyTo && (
                <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                  isMine 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-gray-100 border-blue-500'
                }`}>
                  <p className={`text-xs font-semibold ${
                    isMine ? 'text-blue-700' : 'text-blue-600'
                  }`}>
                    {message.replyToSender?.name || 'Utilisateur'}
                  </p>
                  <p className={`text-xs mt-1 line-clamp-2 ${
                    isMine ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {message.replyToContent}
                  </p>
                </div>
              )}

              <div 
                className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all transform hover:scale-[1.02]"
              >
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                    <File className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate" title={message.fileName}>
                      {message.fileName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFileSize(message.fileSize)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleOpenFile}
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Ouvrir"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-linear-to-b from-white to-blue-50/30">
                    <p className="text-sm text-slate-700 font-medium">{message.content}</p>
                  </div>
                )}
              </div>
              
              <span className={`text-xs mt-1.5 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
                {formatTime(message.createdAt)}
                {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };

  // ========================================
  // 🎵 RENDU MESSAGE AUDIO
  // ========================================
  const renderAudioMessage = () => {
    const avatarUrl = message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;

    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span className={`text-xs font-semibold mb-1 ml-10 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            {message.sender?.name}
          </span>
        )}
        <div className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          {!isMine && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0 self-end">
              <Image 
                src={avatarUrl} 
                alt={message.sender?.name || 'User'} 
                fill 
                sizes="32px"
                className="object-cover" 
              />
            </div>
          )}
          <div 
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row' : 'flex-row-reverse'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* ORDRE: 3 POINTS → REACTION */}
            <div className={`flex items-center gap-1 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* MENU 3 POINTS */}
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1 rounded-full hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {showMenu && (
                  <div 
                    className={`absolute ${isMine ? 'left-0' : 'right-0'} top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleReply}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                    </button>

                    {isMine && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* REACTION PICKER */}
              <ReactionPicker onSelect={handleReaction} isMine={isMine} />
            </div>

            <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all transform hover:scale-[1.02]">
                {message.replyTo && (
                  <div className={`p-2 border-l-4 ${
                    isMine 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'bg-gray-100 border-blue-500'
                  }`}>
                    <p className={`text-xs font-semibold ${
                      isMine ? 'text-blue-700' : 'text-blue-600'
                    }`}>
                      {message.replyToSender?.name || 'Utilisateur'}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${
                      isMine ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {message.replyToContent}
                    </p>
                  </div>
                )}

                <div className="p-4 flex items-center gap-3"></div>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate" title={message.fileName}>
                      {message.fileName || 'Fichier audio'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFileSize(message.fileSize)}
                      {message.audioDuration && ` • ${formatDuration(message.audioDuration)}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleOpenFile}
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Écouter"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {message.content && (
                  <div className="p-4 border-t-2 border-blue-50 bg-linear-to-b from-white to-blue-50/30">
                    <p className="text-sm text-slate-700 font-medium">{message.content}</p>
                  </div>
                )}
              </div>
              
              <span className={`text-xs mt-1.5 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
                {formatTime(message.createdAt)}
                {renderStatus()}
              </span>
            </div>
          </div>
        </div>
        {renderReactions()}
      </div>
    );
  };

  // ========================================
  // 🎯 RENDU PRINCIPAL
  // ========================================
  const fileType = getFileType();

  switch (fileType) {
    case 'video':
      return renderVideoMessage();
    case 'voice':
      return renderVoiceMessage();
    case 'image':
      return renderImageMessage();
    case 'file':
      return renderFileMessage();
    case 'audio':
      return renderAudioMessage();
    default:
      return renderTextMessage();
  }
}