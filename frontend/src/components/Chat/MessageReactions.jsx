"use client";

import { useState } from "react";

export default function MessageReactions({
  reactions = [],
  onReactionClick,
  currentUserId,
  isMine,
  isDark = false,
}) {
  const [showTooltip, setShowTooltip] = useState(null);

  if (!reactions || reactions.length === 0) return null;

  // Grouper les réactions par emoji avec comptage
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji;
    if (!acc[emoji]) {
      acc[emoji] = { count: 0, users: [], hasReacted: false };
    }

    // Protection contre les utilisateurs supprimés ou null
    if (!reaction.userId) return acc;

    acc[emoji].count++;
    acc[emoji].users.push(reaction.userId);

    // Robustesse : gérer si userId est un objet ou une string
    const reactionUserId =
      typeof reaction.userId === "object"
        ? reaction.userId._id
        : reaction.userId;

    if (
      reactionUserId &&
      currentUserId &&
      reactionUserId.toString() === currentUserId.toString()
    ) {
      acc[emoji].hasReacted = true;
    }
    return acc;
  }, {});

  return (
    <div
      className={`w-full mt-2 flex flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}
    >
      {Object.entries(groupedReactions).map(([emoji, data]) => (
        <div key={emoji} className="relative group/reaction">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Important pour ne pas ouvrir le message
              onReactionClick(emoji);
            }}
            onMouseEnter={() => setShowTooltip(emoji)}
            onMouseLeave={() => setShowTooltip(null)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all border
                ${
                  data.hasReacted
                    ? isDark
                      ? "bg-blue-500/20 border-blue-500 text-blue-300"
                      : "bg-blue-100 border-blue-300 text-blue-700"
                    : isDark
                      ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                } transform active:scale-95`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            {data.count > 1 && (
              <span className="font-semibold text-[10px] ml-0.5">
                {data.count}
              </span>
            )}
          </button>

          {/* Tooltip avec les noms (affichage conditionnel) */}
          {showTooltip === emoji && data.users.length > 0 && (
            <div
              className={`absolute bottom-full mb-2 px-2 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none transition-opacity duration-200
                ${isMine ? "right-0" : "left-0"}`}
            >
              {data.users
                .map((u) =>
                  typeof u === "object" ? u.name || "Inconnu" : "Utilisateur",
                )
                .slice(0, 5) // Limiter à 5 noms pour pas que ce soit énorme
                .join(", ")}
              {data.users.length > 5 &&
                ` et ${data.users.length - 5} autres...`}

              {/* Petite flèche du tooltip */}
              <div
                className={`absolute top-full w-0 h-0 border-4 border-transparent border-t-slate-900 ${isMine ? "right-3" : "left-3"}`}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
