'use client'
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';

export default function SearchInConversation({ messages = [], onJumpToMessage, onClose,inputId = 'chat-sidebar-search' }) {
  const [q, setQ] = useState('');

  const normalized = (s = '') => s.toString().toLowerCase();

  const results = useMemo(() => {
    const term = normalized(q).trim();
    if (!term) return [];
    const found = messages
      .filter(m => normalized(m.content || m.text || '').includes(term))
      .map(m => {
        const text = m.content || m.text || '';
        const idx = text.toLowerCase().indexOf(term);
        const start = Math.max(0, idx - 20);
        const end = Math.min(text.length, (idx === -1 ? 80 : idx + 60));
        const snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
        return { ...m, snippet };
      })
      .reverse(); // newest first
    return found;
  }, [messages, q]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher des messages"
          className="flex-1 py-2 px-3 border rounded-md"
          autoComplete="off"
        />
        {q && (
          <button onClick={() => setQ('')} className="p-2 rounded hover:bg-gray-100">✕</button>
        )}
      </div>

      {q.trim() !== '' && (
        <div className="max-h-[60vh] overflow-auto border rounded-md">
          {results.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">Aucun résultat</div>
          ) : results.map(r => (
            <button
              key={r._id}
              onClick={() => {
              onJumpToMessage?.(r._id);  // scroll vers le message
               onClose?.();               // ferme la sidebar
                }}
              className="w-full text-left p-3 hover:bg-gray-50 border-b flex justify-between items-start"
            >
              <div>
                <div className="text-sm font-medium wrap-break-word">{r.snippet}</div>
                <div className="text-xs text-gray-400 mt-1">{format(new Date(r.createdAt), 'dd/MM/yyyy HH:mm')}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
