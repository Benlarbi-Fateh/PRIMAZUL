"use client";

import { UserPlus, Users } from "lucide-react";

export default function ContactSearchResults({
  emptyStateBg,
  handleSendInvitation,
  isDark,
  searchTerm,
  textPrimary,
  textSecondary,
  usersToDisplay,
}) {
  if (!searchTerm.trim()) return null;

  if (usersToDisplay.length === 0) {
    return (
      <div className="p-12 text-center">
        <div
          className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 ${emptyStateBg}`}
        >
          <Users
            className={`w-12 h-12 ${isDark ? "text-blue-400" : "text-slate-400"}`}
          />
        </div>
        <p className={`font-bold text-lg mb-2 ${textPrimary}`}>
          Aucun r&eacute;sultat
        </p>
        <p className={`text-sm ${textSecondary}`}>
          Essayez un autre terme de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {usersToDisplay.map((contact) => (
        <button
          key={contact._id}
          onClick={() => handleSendInvitation(contact._id)}
          className={`w-full p-4 rounded-2xl transition-all flex items-center gap-4 group border-2 border-transparent shadow-sm hover:shadow-lg transform hover:scale-[1.02] animate-slide-in-left ${isDark ? "bg-linear-to-r from-blue-900/80 to-blue-800/80 hover:from-blue-800 hover:to-blue-900 hover:border-blue-700" : "bg-white hover:bg-linear-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-200"}`}
        >
          <div className="flex-1 text-left min-w-0">
            <h3
              className={`font-bold truncate transition-colors ${isDark ? "text-cyan-100 group-hover:text-cyan-300" : "text-slate-800 group-hover:text-blue-600"}`}
            >
              {contact.name}
            </h3>
            <p
              className={`text-sm truncate ${isDark ? "text-blue-300" : "text-slate-500"}`}
            >
              {contact.email}
            </p>
          </div>
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-blue-800 group-hover:bg-cyan-500" : "bg-blue-100 group-hover:bg-blue-500"}`}
          >
            <UserPlus
              className={`w-5 h-5 transition-colors ${isDark ? "text-cyan-300 group-hover:text-blue-950" : "text-blue-500 group-hover:text-white"}`}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
