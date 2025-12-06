'use client'

import { useState } from 'react';
import { Smile } from 'lucide-react';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export default function ReactionPicker({ onSelect, isMine, currentUserReaction }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (emoji) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
      >
        <Smile className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop pour fermer */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu des emojis - RESPONSIVE */}
          <div className={`absolute z-50 top-full mt-2 flex gap-1 p-1.5 bg-white rounded-full shadow-lg border border-slate-100 ${
            isMine 
              ? 'right-0 md:right-0' 
              : 'left-0 md:left-0'
          } max-w-[90vw] overflow-x-auto`}>
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className={`w-8 h-8 flex items-center justify-center text-lg rounded-full transition-all hover:scale-125 shrink-0
                  ${currentUserReaction === emoji 
                    ? 'bg-blue-100 ring-2 ring-blue-400 scale-110' 
                    : 'hover:bg-slate-100'
                  }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}