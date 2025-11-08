'use client'

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Image, File, Mic, Download, ExternalLink } from 'lucide-react';

export default function MessageBubble({ message, isMine }) {
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
    return 'text';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 🚀 OUVRIR LE FICHIER
  const handleOpenFile = () => {
    console.log('📂 Ouverture du fichier:', message.fileName);
    if (message.fileUrl) {
      window.open(message.fileUrl, '_blank');
    }
  };

  // 🚀 TÉLÉCHARGER LE FICHIER
  const handleDownload = () => {
    console.log('📥 Téléchargement:', message.fileName);
    
    if (message.fileUrl) {
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderFileMessage = () => {
    const fileType = getFileType();

    if (fileType === 'image') {
      return (
        <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-blue-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
          <span className={`text-xs mt-1 block ${isMine ? 'text-right text-blue-300' : 'text-blue-600'}`}>
            {formatTime(message.createdAt)}
          </span>
        </div>
      );
    }

    // POUR LES FICHIERS (PDF, DOC, etc.)
    return (
      <div className={`max-w-xs ${isMine ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          isMine 
            ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white' 
            : 'bg-white text-blue-900 shadow-sm border border-blue-200'
        }`}>
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
          
          {/* BOUTONS ACTION FICHIER */}
          <div className="flex gap-1">
            {/* BOUTON OUVRIR */}
            <button
              onClick={handleOpenFile}
              className={`p-2 rounded-full transition transform hover:scale-110 ${
                isMine 
                  ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              title="Ouvrir le fichier"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            
            {/* BOUTON TÉLÉCHARGER */}
            <button
              onClick={handleDownload}
              className={`p-2 rounded-full transition transform hover:scale-110 ${
                isMine 
                  ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
              title="Télécharger le fichier"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        <span className={`text-xs mt-2 block ${isMine ? 'text-right text-blue-300' : 'text-blue-600'}`}>
          {formatTime(message.createdAt)}
        </span>
      </div>
    );
  };

  const renderTextMessage = () => {
    return (
      <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMine && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=0ea5e9&color=fff`}
            alt={message.sender?.name}
            className="w-8 h-8 rounded-full object-cover shrink-0"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=0ea5e9&color=fff`;
            }}
          />
        )}

        <div
          className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
            isMine
              ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white rounded-br-none'
              : 'bg-white text-blue-900 rounded-bl-none shadow-sm border border-blue-200'
          }`}
        >
          <p className="text-sm wrap-break-word">{message.content}</p>
          <span
            className={`text-xs mt-1 block ${
              isMine ? 'text-blue-200' : 'text-blue-600'
            }`}
          >
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  };

  if (getFileType() !== 'text') {
    return renderFileMessage();
  }

  return renderTextMessage();
}