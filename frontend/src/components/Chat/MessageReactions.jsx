'use client'

import { useState } from 'react';

export default function MessageReactions({ reactions = [], onReactionClick, currentUserId, isMine }) {
  const [showTooltip, setShowTooltip] = useState(null);

  if (!reactions || reactions.length === 0) return null;

  // Grouper les réactions par emoji avec comptage
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji;
    if (!acc[emoji]) {
      acc[emoji] = { count: 0, users: [], hasReacted: false };
    }
    acc[emoji].count++;
    acc[emoji].users.push(reaction.userId);
    
    // Vérifier si l'utilisateur actuel a réagi avec cet emoji
    const reactionUserId = reaction.userId?._id || reaction.userId;
    if (reactionUserId?.toString() === currentUserId?.toString()) {
      acc[emoji].hasReacted = true;
    }
    return acc;
  }, {});

  return (
    <div className={`w-full mt-2 ${isMine ? 'text-right' : 'text-left'}`}>
      <div className={`inline-flex items-center gap-1 flex-wrap justify-start max-w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
        {Object.entries(groupedReactions).map(([emoji, data]) => (
          <div key={emoji} className="relative">
            <button
              onClick={() => onReactionClick(emoji)}
              onMouseEnter={() => setShowTooltip(emoji)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all min-w-10 justify-center
                ${data.hasReacted 
                  ? 'bg-blue-100 border-2 border-blue-300 hover:bg-blue-200' 
                  : 'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                }`}
            >
              <span className="text-sm">{emoji}</span>
              {data.count > 1 && (
                <span className="text-slate-600 font-medium min-w-2 text-center">{data.count}</span>
              )}
            </button>

            {/* Tooltip avec les noms */}
            {showTooltip === emoji && data.users.length > 0 && (
              <div className={`absolute bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50
                ${isMine ? 'right-0' : 'left-0'}`}
              >
                {data.users.map(u => u?.name || 'Utilisateur').join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}