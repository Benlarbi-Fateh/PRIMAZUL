'use client'

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Image, File, Mic, Download, ExternalLink, Check, CheckCheck } from 'lucide-react';
import VoiceMessage from './VoiceMessage';

export default function MessageBubble({ message, isMine, isGroup }) {
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
      return <CheckCheck className="w-4 h-4 text-cyan-400 inline ml-1" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-blue-200 inline ml-1" />;
    }
    if (status === 'sent') {
      return <Check className="w-4 h-4 text-blue-200 inline ml-1" />;
    }
    return null;
  };

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

  const renderVoiceMessage = () => {
    return (
      <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
        <div className="flex flex-col max-w-xs lg:max-w-md">
          {!isMine && isGroup && (
            <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
              {message.sender?.name}
            </p>
          )}
          
          <VoiceMessage
            voiceUrl={message.voiceUrl}
            voiceDuration={message.voiceDuration}
            isMine={isMine}
          />
          <span className={`text-xs mt-1.5 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
            {formatTime(message.createdAt)}
            {renderStatus()}
          </span>
        </div>
      </div>
    );
  };

  const renderFileMessage = () => {
    const fileType = getFileType();

    if (fileType === 'image') {
      return (
        <div className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
            {!isMine && isGroup && (
              <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
                {message.sender?.name}
              </p>
            )}
            
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all transform hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={message.fileUrl} 
                alt={message.fileName || 'Image partagée'}
                className="w-full max-h-80 object-cover cursor-pointer hover:opacity-95 transition"
                onClick={handleOpenFile}
              />
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
      );
    }

    return (
      <div className={`flex items-center gap-2 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
        <div className={`max-w-xs ${isMine ? 'ml-auto' : 'mr-auto'}`}>
          {!isMine && isGroup && (
            <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
              {message.sender?.name}
            </p>
          )}
          
          <div className={`p-5 rounded-3xl flex items-center gap-4 shadow-lg transition-all transform hover:scale-[1.02] ${
            isMine 
              ? 'bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 text-white' 
              : 'bg-white text-slate-800 border-2 border-blue-100'
          }`}>
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              {fileType === 'audio' ? (
                <Mic className="w-6 h-6" />
              ) : (
                <File className="w-6 h-6" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-base">
                {message.fileName || 'Fichier'}
              </p>
              <p className="text-xs opacity-80 mt-1 font-medium">
                {formatFileSize(message.fileSize)}
              </p>
              {message.content && (
                <p className="text-xs mt-2 opacity-90">{message.content}</p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleOpenFile}
                className={`p-2.5 rounded-xl transition transform hover:scale-110 active:scale-95 ${
                  isMine 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
                title="Ouvrir le fichier"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleDownload}
                className={`p-2.5 rounded-xl transition transform hover:scale-110 active:scale-95 ${
                  isMine 
                    ? 'bg-white/20 hover:bg-white/30 text-white' 
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
                title="Télécharger le fichier"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
          <span className={`text-xs mt-2 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
            {formatTime(message.createdAt)}
            {renderStatus()}
          </span>
        </div>
      </div>
    );
  };

  const renderTextMessage = () => {
    return (
      <div 
        className={`flex items-end gap-3 ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}
      >
        {!isMine && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
            alt={message.sender?.name}
            className="w-9 h-9 rounded-2xl object-cover ring-2 ring-blue-100 shadow-md shrink-0"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;
            }}
          />
        )}

        <div className="relative flex items-center gap-2">
          <div
            className={`max-w-xs lg:max-w-md xl:max-w-lg px-5 py-3 rounded-3xl shadow-md transition-all transform hover:scale-[1.02] ${
              isMine
                ? 'bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 text-white rounded-br-md'
                : 'bg-white text-slate-800 rounded-bl-md border-2 border-blue-100'
            }`}
          >
            {!isMine && isGroup && (
              <p className="text-xs font-bold text-blue-600 mb-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
                {message.sender?.name}
              </p>
            )}
            
            <p className="text-sm wrap-break-word whitespace-pre-wrap leading-relaxed">{message.content}</p>
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