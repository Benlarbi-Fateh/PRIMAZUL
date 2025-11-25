'use client'
import React from 'react';
import SearchInConversation from './SearchInConversation';

export default function Sidebar({ open, onClose, contact, conversation, messages = [], onJumpToMessage }) {
  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[360px] bg-white shadow-2xl z-50">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Infos</h3>
        <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">✕</button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={contact?.profilePicture || conversation?.groupImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || conversation?.groupName || 'User')}`}
            alt={contact?.name || conversation?.groupName}
            className="w-16 h-16 rounded-xl object-cover"
          />
          <div>
            <div className="font-semibold">{contact?.name || conversation?.groupName}</div>
            <div className="text-sm text-gray-500">
              {conversation?.isGroup ? `${conversation.participants?.length || 0} participants` : (contact?.lastSeen ? `Vu ${new Date(contact.lastSeen).toLocaleString()}` : 'Hors ligne')}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const input = document.getElementById('chat-sidebar-search');
            if (input) input.focus();
          }}
          className="w-full py-2 px-3 bg-blue-600 text-white rounded-md"
        >
          Rechercher dans la discussion
        </button>

        <div className="border-t pt-3">
          <SearchInConversation
            messages={messages}
            onJumpToMessage={(id) => onJumpToMessage?.(id)}
            inputId="chat-sidebar-search"
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
