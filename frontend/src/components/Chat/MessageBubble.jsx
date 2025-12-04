'use client'

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Image, File, Mic, Download, ExternalLink, Check, CheckCheck,
  MoreVertical, Trash2, Edit2, Languages, X, RotateCcw
} from 'lucide-react';
import VoiceMessage from './VoiceMessage';

export default function MessageBubble({ 
  message, 
  isMine, 
  isGroup,
  onDelete,
  onEdit,
  onTranslate
}) {
  // ========================================
  // 📦 ÉTATS
  // ========================================
  const [showMenu, setShowMenu] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateIcon, setShowTranslateIcon] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const formatTime = (date) => {
    try {
      return format(new Date(date), 'HH:mm', { locale: fr });
    } catch {
      return '';  
    }
  };

  const renderStatus = () => {
    if (!isMine) return null;

    const status = message.status || 'sent';

    if (status === 'read') {
      return <CheckCheck className="w-4 h-4 text-blue-400 inline ml-1" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-400 inline ml-1" />;
    }
    if (status === 'sent') {
      return <Check className="w-4 h-4 text-gray-400 inline ml-1" />;
    }
    return null;
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
    console.log('🔍 Traduction vers:', targetLang);
    setIsTranslating(true);
    setShowLanguageMenu(false);
    
    try {
      if (onTranslate) {
        if (!isTranslated) {
          setOriginalText(message.content);
        }
        
        const translated = await onTranslate(message.content, message._id, targetLang);
        console.log('✅ Traduction reçue:', translated);
        
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
  // 🎨 RENDU SELON LE TYPE
  // ========================================
  const getFileType = () => {
    if (message.type === 'image') return 'image';
    if (message.type === 'audio') return 'audio';
    if (message.type === 'file') return 'file';
    if (message.type === 'voice') return 'voice';
    return 'text';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleOpenFile = () => {
    if (message.fileUrl) {
      window.open(message.fileUrl, '_blank');
    }
  };

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

  // ========================================
  // 🎤 MESSAGE VOCAL
  // ========================================
  const renderVoiceMessage = () => {
    return (
      <div className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
        {!isMine && (
          <img
            src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
            alt={message.sender?.name}
            className="w-9 h-9 rounded-2xl object-cover ring-2 ring-blue-100 shadow-md shrink-0"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;
            }}
          />
        )}

        <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="flex flex-col max-w-xs lg:max-w-md">
            {!isMine && isGroup && (
              <p className="text-xs font-semibold text-blue-700 mb-1 ml-2">
                {message.sender?.name}
              </p>
            )}
            
            <VoiceMessage
              voiceUrl={message.voiceUrl}
              voiceDuration={message.voiceDuration}
              isMine={isMine}
            />
            <span className={`text-xs mt-1 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-blue-600'}`}>
              {formatTime(message.createdAt)}
              {renderStatus()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // 📁 MESSAGE FICHIER
  // ========================================
  const renderFileMessage = () => {
    const fileType = getFileType();

    if (fileType === 'image') {
      return (
        <div className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          {!isMine && (
            <img
              src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
              alt={message.sender?.name}
              className="w-9 h-9 rounded-2xl object-cover ring-2 ring-blue-100 shadow-md shrink-0"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;
              }}
            />
          )}

          <div className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
              {!isMine && isGroup && (
                <p className="text-xs font-semibold text-blue-700 mb-1 ml-2">
                  {message.sender?.name}
                </p>
              )}
              
              <div 
                className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all transform hover:scale-[1.02]"
                style={{
                  borderRadius: `var(--bubble-radius)`
                }}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-blue-200">
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName || 'Image partagée'}
                    className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition"
                    onClick={handleOpenFile}
                  />
                  {message.content && (
                    <div className="p-3 border-t border-blue-100">
                      <p className="text-sm text-blue-900">{message.content}</p>
                    </div>
                  )}
                </div>
                <span className={`text-xs mt-1 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-blue-600'}`}>
                  {formatTime(message.createdAt)}
                  {renderStatus()}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
        {!isMine && (
          <img
            src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
            alt={message.sender?.name}
            className="w-9 h-9 rounded-2xl object-cover ring-2 ring-blue-100 shadow-md shrink-0"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;
            }}
          />
        )}

        <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`max-w-xs ${isMine ? 'ml-auto' : 'mr-auto'}`}>
            {!isMine && isGroup && (
              <p className="text-xs font-semibold text-blue-700 mb-1 ml-2">
                {message.sender?.name}
              </p>
            )}
            
            <div 
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                isMine 
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' 
                  : 'bg-white text-blue-900 shadow-sm border border-blue-200'
              }`}
              style={{
                borderRadius: `var(--bubble-radius)`,
                background: isMine 
                  ? 'var(--user-bubble-bg)' 
                  : 'var(--other-bubble-bg)',
                color: isMine 
                  ? 'var(--user-bubble-text)' 
                  : 'var(--other-bubble-text)'
              }}
            >
              <div className="shrink-0">
                {fileType === 'audio' ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <File className="w-6 h-6" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">
                  {message.fileName || 'Fichier'}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {formatFileSize(message.fileSize)}
                </p>
                {message.content && (
                  <p className="text-xs mt-2 opacity-90">{message.content}</p>
                )}
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={handleOpenFile}
                  className={`p-2 rounded-full transition transform hover:scale-110 ${
                    isMine 
                      ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleDownload}
                  className={`p-2 rounded-full transition transform hover:scale-110 ${
                    isMine 
                      ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <span className={`text-xs mt-2 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-blue-600'}`}>
              {formatTime(message.createdAt)}
              {renderStatus()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // 💬 MESSAGE TEXTE
  // ========================================
  const renderTextMessage = () => {
    return (
      <div 
        className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} relative`}
        onMouseEnter={() => setShowTranslateIcon(true)}
        onMouseLeave={() => setShowTranslateIcon(false)}
      >
        {!isMine && (
          <img
            src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=0ea5e9&color=fff`}
            alt={message.sender?.name}
            className="w-8 h-8 rounded-full object-cover shrink-0"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=0ea5e9&color=fff`;
            }}
          />
        )}

        <div className="relative flex items-center gap-2">
          {/* MENU 3 POINTS */}
          {isMine && (
            <div className="relative">
              <button
                onClick={handleMenuToggle}
                className="p-1 rounded-full hover:bg-gray-200 transition"
              >
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>

              {showMenu && (
                <div 
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]"
                  onClick={(e) => e.stopPropagation()}
                >
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
                </div>
              )}
            </div>
          )}

          <div
            className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
              isMine
                ? 'text-white rounded-br-none'
                : 'bg-white text-slate-800 border-2 border-blue-100 rounded-bl-none'
            }`}
            style={{
              borderRadius: `var(--bubble-radius)`,
              background: isMine 
                ? 'var(--user-bubble-bg)' 
                : 'var(--other-bubble-bg)',
              color: isMine 
                ? 'var(--user-bubble-text)' 
                : 'var(--other-bubble-text)'
            }}
          >
            {!isMine && isGroup && (
              <p 
                className="text-xs font-bold mb-1.5 flex items-center gap-1"
                style={{ color: 'var(--chat-primary)' }}
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--chat-primary)' }}
                ></span>
                {message.sender?.name}
              </p>
            )}
            
            <p className="text-sm wrap-break-word whitespace-pre-wrap">
              {isTranslated ? translatedText : message.content}
            </p>

            <span
              className={`text-xs mt-2 flex items-center gap-1 ${
                isMine ? 'justify-end opacity-80' : 'opacity-70'
              }`}
            >
              {formatTime(message.createdAt)}
              {renderStatus()}
            </span>
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
                title={isTranslated ? 'Voir le texte original' : 'Traduire ce message'}
              >
                {isTranslating ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : isTranslated ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  <Languages className="w-4 h-4" />
                )}
              </button>

              {/* MENU LANGUES */}
              {showLanguageMenu && (
                <div 
                  className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-[200px] max-h-[300px] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600">Traduire en :</p>
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleTranslate(lang.code)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 transition"
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="text-sm text-gray-700">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const fileType = getFileType();
  
  if (fileType === 'voice') {
    return renderVoiceMessage();
  }
  
  if (fileType !== 'text') {
    return renderFileMessage();
  }

  return renderTextMessage();
}