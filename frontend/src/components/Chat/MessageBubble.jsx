'use client'

import { useState, useContext, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { File, Mic, Download, ExternalLink, Check, CheckCheck, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import VoiceMessage from './VoiceMessage';
import ReactionPicker from './ReactionPicker';
import MessageReactions from './MessageReactions';
import { AuthContext } from '@/context/AuthProvider';
import { emitToggleReaction } from '@/services/socket';

export function DateSeparator({ date }) {
  const formatDate = (d) => {
    const dateObj = new Date(d);
    if (isToday(dateObj)) return "Aujourd'hui";
    if (isYesterday(dateObj)) return "Hier";
    return format(dateObj, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-3 py-1 bg-slate-100 rounded-full">
        <span className="text-xs font-medium text-slate-500 capitalize">{formatDate(date)}</span>
      </div>
    </div>
  );
}

export default function MessageBubble({ message, isMine, isGroup, isLast = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);
  const { user } = useContext(AuthContext);
  const currentUserId = user?._id || user?.id;

  const handleReaction = (emoji) => {
    emitToggleReaction({
      messageId: message._id,
      emoji,
      userId: currentUserId,
      conversationId: message.conversationId
    });
  };

  const formatTime = (date) => {
    try {
      return format(new Date(date), 'HH:mm', { locale: fr });
    } catch {
      return '';
    }
  };

  const getFileType = () => {
    if (message.type === 'image') return 'image';
    if (message.type === 'audio') return 'audio';
    if (message.type === 'file') return 'file';
    if (message.type === 'voice') return 'voice';
    if (message.type === 'video') return 'video';
    return 'text';
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

  const handleOpenFile = () => message.fileUrl && window.open(message.fileUrl, '_blank');

  const handleDownload = () => {
    if (message.fileUrl) {
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }
  };

  const status = message.status || 'sent';
  const fileType = getFileType();
  const avatarUrl = message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'U')}&background=6366f1&color=fff`;
  const showTimestamp = isHovered || isLast;

  const renderStatus = () => {
    if (!isMine) return null;
    if (status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    if (status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
    return <Check className="w-3.5 h-3.5 text-slate-400" />;
  };

  const renderTimestamp = () => (
    <div className={`flex items-center gap-1 overflow-hidden transition-all duration-300 ${showTimestamp ? 'max-h-6 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
      <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
      {renderStatus()}
    </div>
  );

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    return (
      <div className={`flex ${isMine ? 'justify-start' : 'justify-end'} -mt-2 ${isMine ? 'mr-2' : 'ml-10'}`}>
        <MessageReactions
          reactions={message.reactions}
          onReactionClick={handleReaction}
          currentUserId={currentUserId}
          isMine={isMine}
        />
      </div>
    );
  };

  // Video Message - Version améliorée
  if (fileType === 'video') {
    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span className="text-xs font-semibold text-blue-700 mb-1 ml-10">{message.sender?.name}</span>
        )}
        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
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
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={`rounded-2xl overflow-hidden shadow-md ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
              <div 
                className="relative w-56 h-44 sm:w-64 sm:h-52 bg-black cursor-pointer"
                onClick={handleVideoClick}
              >
                {/* Vidéo */}
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
                
                {/* Bouton Play/Pause central */}
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

                {/* Contrôles vidéo */}
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
                        
                        {/* Durée */}
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

                {/* Badge vidéo en haut */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium">
                  VIDÉO
                </div>

                {/* Téléchargement */}
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
              
              {/* Texte sous la vidéo */}
              {message.content && (
                <div className={`px-3 py-2 ${isMine ? 'bg-linear-to-r from-blue-600 to-blue-800 text-white' : 'bg-white text-slate-700'}`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              )}
            </div>
            <ReactionPicker onSelect={handleReaction} isMine={isMine} />
          </div>
        </div>
        {renderReactions()}
        {renderTimestamp()}
      </div>
    );
  }

  // Voice Message
  if (fileType === 'voice') {
    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span className="text-xs font-semibold text-blue-700 mb-1 ml-10">{message.sender?.name}</span>
        )}
        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
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
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <VoiceMessage voiceUrl={message.voiceUrl} voiceDuration={message.voiceDuration} isMine={isMine} isGroup={isGroup} sender={message.sender} />
            <ReactionPicker onSelect={handleReaction} isMine={isMine} />
          </div>
        </div>
        {renderReactions()}
        {renderTimestamp()}
      </div>
    );
  }

  // Image Message (reste inchangé)
  if (fileType === 'image') {
    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span className="text-xs font-semibold text-blue-700 mb-1 ml-10">{message.sender?.name}</span>
        )}
        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
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
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className={`rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`}
              onClick={handleOpenFile}
            >
              <div className="relative w-56 h-44 sm:w-64 sm:h-52 bg-slate-100">
                <Image 
                  src={message.fileUrl} 
                  alt={message.fileName || 'Image'} 
                  fill 
                  sizes="(max-width: 640px) 224px, 256px"
                  className="object-cover hover:scale-105 transition-transform duration-300" 
                />
              </div>
              {message.content && (
                <div className={`px-3 py-2 ${isMine ? 'bg-linear-to-r from-blue-600 to-blue-800 text-white' : 'bg-white text-slate-700'}`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              )}
            </div>
            <ReactionPicker onSelect={handleReaction} isMine={isMine} />
          </div>
        </div>
        {renderReactions()}
        {renderTimestamp()}
      </div>
    );
  }

  // File Message (reste inchangé)
  if (fileType !== 'text') {
    return (
      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && isGroup && (
          <span className="text-xs font-semibold text-blue-700 mb-1 ml-10">{message.sender?.name}</span>
        )}
        <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
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
            className={`relative flex items-center gap-1 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={`p-3 rounded-2xl flex items-center gap-3 ${isMine ? 'bg-linear-to-r from-blue-600 to-blue-800 text-white rounded-br-md' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isMine ? 'bg-white/20' : 'bg-blue-50'}`}>
                {fileType === 'audio' ? <Mic className="w-5 h-5" /> : <File className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{message.fileName || 'Fichier'}</p>
                <p className="text-xs opacity-70">{formatFileSize(message.fileSize)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={handleOpenFile} className={`p-2 rounded-lg transition-colors ${isMine ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={handleDownload} className={`p-2 rounded-lg transition-colors ${isMine ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ReactionPicker onSelect={handleReaction} isMine={isMine} />
          </div>
        </div>
        {renderReactions()}
        {renderTimestamp()}
      </div>
    );
  }

  // Text Message (reste inchangé)
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {!isMine && isGroup && (
        <span className="text-xs font-semibold text-blue-700 mb-1 ml-10">{message.sender?.name}</span>
      )}
      <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
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
          className={`relative flex items-center gap-1 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={`px-4 py-2.5 rounded-2xl max-w-xs lg:max-w-md ${isMine ? 'bg-linear-to-r from-blue-600 to-blue-800 text-white rounded-br-md' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md'}`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <ReactionPicker onSelect={handleReaction} isMine={isMine} />
        </div>
      </div>
      {renderReactions()}
      {renderTimestamp()}
    </div>
  );
}