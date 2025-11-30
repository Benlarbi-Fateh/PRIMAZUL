'use client'

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Image, File, Mic, Download, ExternalLink, Check, CheckCheck } from 'lucide-react';
import VoiceMessage from './VoiceMessage';

import { toggleReaction as apiToggleReaction } from '@/lib/api'; 

export default function MessageBubble({ message, isMine, isGroup, onUpdateMessage, highlightedId }) {
  const ref = useRef();

  useEffect(() => {
    if (highlightedId === message._id && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.current.classList.add('highlight');
      const timeout = setTimeout(() => ref.current?.classList.remove('highlight'), 1600);
      return () => clearTimeout(timeout);
    }
  }, [highlightedId, message._id]);

  const formatTime = (date) => {
    try { return format(new Date(date), 'HH:mm', { locale: fr }); } catch { return ''; }
  };

  const renderStatus = () => {
    if (!isMine) return null;
    const status = message.status || 'sent';
    if (status === 'read') return <CheckCheck className="w-4 h-4 text-cyan-400 inline ml-1" />;
    if (status === 'delivered') return <CheckCheck className="w-4 h-4 text-blue-200 inline ml-1" />;
    if (status === 'sent') return <Check className="w-4 h-4 text-blue-200 inline ml-1" />;
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
    if (message.fileUrl) window.open(message.fileUrl, '_blank');
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

  // EMOJI SET
  const emojiSet = ['👍','❤️','😂','😮','😢','👏'];

  // keep track of emoji menu + which reaction list modal is open
  const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
// remplace l'ancien état par un booléen pour ouvrir le modal "toutes les réactions"
 const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // group reactions into [{ emoji, count, users: [{_id,name,profilePicture}], reactedByMe }]
  const groupReactions = (reactions = []) => {
     if (!Array.isArray(reactions)) reactions = []; // <-- sécuriser

    const map = new Map();
    reactions.forEach(r => {
      const emoji = r.emoji;
      const user = (r.user && (typeof r.user === 'object')) ? r.user : { _id: r.user };
      if (!map.has(emoji)) map.set(emoji, { emoji, count: 0, users: [], reactedByMe: false });
      const entry = map.get(emoji);
      entry.count += 1;
      entry.users.push(user);
      const myUserId = window.__USER__?._id?.toString();
      if (myUserId && (user._id?.toString() === myUserId)) entry.reactedByMe = true;
    });
    return Array.from(map.values());
  };

  // call API to toggle reaction
  const handleReact = async (emoji) => {
    if (processing) return;

  if (!message._id) {
    console.error('Impossible de réagir : message._id manquant');
    return;
  }


    setProcessing(true);
    try {
      const resp = await apiToggleReaction(message._id, emoji);
      // API expected to return { success: true, message: populatedMessage }
      // adapt to your api shape:
      const updatedMessage = resp.data?.message || resp.data;
      if (onUpdateMessage) onUpdateMessage(updatedMessage);
    } catch (err) {
      console.error('Reaction error', err);
    } finally {
      setIsEmojiMenuOpen(false);
      setProcessing(false);
    }
  };

  // render grouped reaction bubbles (clickable -> open list)
  const renderGroupedReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    const grouped = groupReactions(message.reactions);
    return (
      <div className={`mt-1 inline-flex items-center gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
        {grouped.map(g => (
          <button
            key={`${message._id}-${g.emoji}`}
            onClick={(e) => { e.stopPropagation(); setShowReactionsModal(true); }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs shadow-sm transition ${g.reactedByMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-800'}`}
            aria-label={`Voir qui a réagi ${g.emoji}`}
            title={`${g.count} réactions`}
          >
            <span className="text-sm">{g.emoji}</span>
            <span className="font-semibold text-[11px]">{g.count}</span>
          </button>
        ))}
      </div>
    );
  };

/// Générer un nouvel ID pour le message transféré
const generateNewId = () => '_' + Math.random().toString(36).slice(2, 11);

// Fonction pour transférer le message sans réactions
const handleForward = (msg) => {
  const forwardedMessage = {
    ...msg,
    _id: generateNewId(), // nouvel ID
    reactions: [],        // on supprime les emojis/reactions
  };

  // Déclenche le modal de transfert
  const forwardEvent = new CustomEvent('open-forward-modal', { detail: { message: forwardedMessage } });
  window.dispatchEvent(forwardEvent);
};




  // common actions component (emoji + forward) visible on hover (group)
  const Actions = ({placementRight=false}) => (
    <div
      className={`absolute top-1 ${isMine ? '-left-24' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition flex flex-row items-center gap-2 z-40`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setIsEmojiMenuOpen(prev => !prev); }}
          title="Réagir"
          className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-sm"
        >
          🙂
        </button>

        {isEmojiMenuOpen && (
          <div onClick={(ev) => ev.stopPropagation()}
               className={`absolute top-0 p-3 rounded-2xl shadow-lg flex items-center gap-2 border border-gray-200 bg-white/95 backdrop-blur-sm z-50 ${isMine ? 'right-0 -top-12' : 'left-full ml-2'}`}>
            {emojiSet.map(emo => (
              <button
                key={emo}
                onClick={(ev) => { ev.stopPropagation(); handleReact(emo); }}
                className="text-xl p-2 rounded-lg hover:bg-gray-200 transition-colors duration-150"
                title={`Réagir ${emo}`}
              >
                {emo}
              </button>
            ))}

            <button
              onClick={(ev) => { ev.stopPropagation(); setIsEmojiMenuOpen(false); }}
              className="ml-2 px-2 py-1 rounded bg-gray-100 text-xs"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

     <button
  onClick={(e) => {
    e.stopPropagation();
    const forwardEvent = new CustomEvent('open-forward-modal', { detail: { message } });
    window.dispatchEvent(forwardEvent);
  }}
  title="Transférer"
  className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-sm"
>
  ⤴️
</button>

    </div>
  );

  // Reaction list modal (shows users who reacted with specific emoji)
  // Modal qui affiche toutes les réactions groupées (comme WhatsApp)
const ReactionsModal = ({ onClose }) => {
  if (!showReactionsModal) return null;

  const grouped = groupReactions(message.reactions || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-11/12 max-w-md bg-white rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Réactions</h3>
          <button onClick={onClose} className="text-sm px-2 py-1">Fermer</button>
        </div>

        <div className="flex flex-col gap-4 max-h-80 overflow-auto">
          {grouped.length === 0 ? (
            <div className="text-sm text-slate-500">Aucune réaction</div>
          ) : (
            grouped.map(g => (
              <div key={g.emoji} className="border-b last:border-b-0 pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-sm text-slate-500">{g.count}</span>
                </div>

                {g.users.map(u => (
                  <div key={`${g.emoji}-${u._id}`} className="flex items-center gap-3 pl-4 py-1">
                    <img
                      src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}`}
                      alt={u.name || 'Utilisateur'}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}`; }}
                    />
                    <div>
                      <div className="font-medium">{u.name || 'Utilisateur'}</div>
                      <div className="text-xs text-slate-500">Appuyez pour supprimer</div>
                    </div>
                    <div className="ml-auto text-2xl">{g.emoji}</div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


  // RENDERS: text / image / file / voice reuse the same "wrapper" pattern so actions show for all
  const baseWrapperClass = `relative ${highlightedId === message._id ? 'ring-4 ring-yellow-300/60 animate-pulse rounded-2xl' : ''}`;

  const renderTextMessage = () => (
    <div id={`message-${message._id}`} ref={ref} className={baseWrapperClass}>
      <div className={`flex items-end gap-3 group ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
        {!isMine && (
          <img
            src={message.sender?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
            alt={message.sender?.name}
            className="w-9 h-9 rounded-2xl object-cover ring-2 ring-blue-100 shadow-md shrink-0"
            onError={(e)=>{ e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`; }}
          />
        )}

        <div className="relative flex items-center gap-2">
          <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-5 py-3 rounded-3xl shadow-md transition-all transform hover:scale-[1.02]
            ${isMine ? 'bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 text-white rounded-br-md' : 'bg-white text-slate-800 rounded-bl-md border-2 border-blue-100'}`}>
            { !isMine && isGroup && (
              <p className="text-xs font-bold text-blue-600 mb-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
                {message.sender?.name}
              </p>
            )}
            <p className="text-sm wrap-break-word whitespace-pre-wrap leading-relaxed">{message.content}</p>
            <span className={`text-xs mt-2 flex items-center gap-1 ${isMine ? 'text-blue-100 justify-end' : 'text-slate-500'}`}>
              {formatTime(message.createdAt)}
              {renderStatus()}
            </span>

            {renderGroupedReactions()}
          </div>

          <Actions />
        </div>
      </div>

        <ReactionsModal onClose={() => setShowReactionsModal(false)} />
    </div>
  );

  const renderImageMessage = () => (
    <div id={`message-${message._id}`} ref={ref} className={baseWrapperClass}>
      <div className={`flex items-start gap-2 group ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
        <div className={`max-w-xs lg:max-w-md ${isMine ? 'ml-auto' : 'mr-auto'}`}>
          {!isMine && isGroup && (
            <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
              {message.sender?.name}
            </p>
          )}

          <div className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all transform hover:scale-[1.02]">
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

          {renderGroupedReactions()}
        </div>

        <Actions />
      </div>

<ReactionsModal onClose={() => setShowReactionsModal(false)} />
    </div>
  );

  const renderFileMessage = () => {
    const fileType = getFileType();
    if (fileType === 'image') return renderImageMessage();

    return (
      <div id={`message-${message._id}`} ref={ref} className={baseWrapperClass}>
        <div className={`flex items-center gap-2 group ${isMine ? 'flex-row-reverse animate-slide-in-right' : 'flex-row animate-slide-in-left'}`}>
          <div className={`max-w-xs ${isMine ? 'ml-auto' : 'mr-auto'}`}>
            {!isMine && isGroup && (
              <p className="text-xs font-bold text-blue-700 mb-1.5 ml-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-linear-to-r from-blue-500 to-cyan-500"></span>
                {message.sender?.name}
              </p>
            )}

            <div className={`p-5 rounded-3xl flex items-center gap-4 shadow-lg transition-all transform hover:scale-[1.02] ${isMine ? 'bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 text-white' : 'bg-white text-slate-800 border-2 border-blue-100'}`}>
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                {fileType === 'audio' ? <Mic className="w-6 h-6" /> : <File className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold truncate text-base">{message.fileName || 'Fichier'}</p>
                <p className="text-xs opacity-80 mt-1 font-medium">{formatFileSize(message.fileSize)}</p>
                {message.content && <p className="text-xs mt-2 opacity-90">{message.content}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <button onClick={handleOpenFile} className={`p-2.5 rounded-xl transition transform hover:scale-110 active:scale-95 ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`} title="Ouvrir le fichier">
                  <ExternalLink className="w-5 h-5" />
                </button>

                <button onClick={handleDownload} className={`p-2.5 rounded-xl transition transform hover:scale-110 active:scale-95 ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`} title="Télécharger">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <span className={`text-xs mt-2 flex items-center ${isMine ? 'justify-end text-blue-300' : 'text-slate-500'}`}>
              {formatTime(message.createdAt)}
              {renderStatus()}
            </span>

            {renderGroupedReactions()}
          </div>

          <Actions />
        </div>

          <ReactionsModal onClose={() => setShowReactionsModal(false)} />
      </div>
    );
  };

  const fileType = getFileType();

  if (fileType === 'voice') {
    return renderFileMessage(); // voice uses file style wrapper in your code - actions will show
  }

  if (fileType !== 'text') {
    return renderFileMessage();
  }

  return renderTextMessage();
}
