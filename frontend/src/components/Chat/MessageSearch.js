'use client'

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';
import api from '@/lib/api';

export default function MessageSearch({
  conversationId,
  onMessageSelect,
  isOpen,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isDark } = useTheme();
  const searchTimeoutRef = useRef(null);

  // 🔎 Recherche avec debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setCurrentIndex(0);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/messages/search/${conversationId}`, {
          params: { query: searchQuery },
        });

        if (response.data?.success) {
          setResults(response.data.messages || []);
          setCurrentIndex(0);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Erreur recherche messages:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, conversationId]);

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onMessageSelect(results[newIndex]._id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onMessageSelect(results[newIndex]._id);
    }
  };

  // ✅ NE FERME PLUS LA RECHERCHE, juste scroll vers le message
  const handleSelectMessage = (message, index) => {
    setCurrentIndex(index);
    onMessageSelect(message._id);
  };

  const highlightText = (text, query) => {
    if (!query?.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-yellow-300 dark:bg-yellow-600 font-bold px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[80]
        pointer-events-none          /* ✅ laisse passer le scroll à la conversation */
        flex items-start justify-end
        pt-4 pr-1 sm:pt-6 sm:pr-4
      `}
    >
      {/* panneau cliquable */}
      <div
        className={`
          pointer-events-auto         /* ✅ seul le panneau intercepte les clics */
          w-full max-w-xs sm:max-w-sm md:max-w-md
          rounded-2xl shadow-2xl border
          ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white border-gray-200'}
        `}
      >
        {/* HEADER */}
        <div
          className={`
            p-3 sm:p-4 border-b flex items-center gap-3
            ${isDark ? 'border-slate-700' : 'border-gray-200'}
          `}
        >
          {/* BARRE DE RECHERCHE */}
          <div className="flex-1">
            <div className="relative group">
              <div
                className={`
                  absolute inset-0 rounded-2xl pointer-events-none transition-all duration-200
                  ${
                    isDark
                      ? 'bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-purple-500/20 opacity-0 group-focus-within:opacity-100'
                      : 'bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-purple-500/10 opacity-0 group-focus-within:opacity-100'
                  }
                `}
              />

              <div
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-200
                  focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-400
                  ${
                    isDark
                      ? 'bg-slate-800/90 border-slate-600 shadow-sm'
                      : 'bg-white border-gray-200 shadow-sm'
                  }
                `}
              >
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full shrink-0
                    ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-blue-50 text-blue-600'}
                  `}
                >
                  <Search className="w-4 h-4" />
                </div>

                <input
                  type="text"
                  placeholder="Rechercher dans la conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`
                    flex-1 bg-transparent outline-none text-sm border-none
                    ${isDark ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-400'}
                  `}
                  autoFocus
                />

                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setResults([]);
                      setCurrentIndex(0);
                    }}
                    className={`
                      flex items-center justify-center w-7 h-7 rounded-full transition-colors
                      ${
                        isDark
                          ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }
                    `}
                    title="Effacer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* COMPTEUR & NAVIGATION (desktop) */}
          {results.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}
              >
                {currentIndex + 1} / {results.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-1 rounded ${
                    currentIndex === 0
                      ? isDark
                        ? 'text-slate-600'
                        : 'text-gray-300'
                      : isDark
                      ? 'text-white hover:bg-slate-700'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === results.length - 1}
                  className={`p-1 rounded ${
                    currentIndex === results.length - 1
                      ? isDark
                        ? 'text-slate-600'
                        : 'text-gray-300'
                      : isDark
                      ? 'text-white hover:bg-slate-700'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* BOUTON FERMER (le seul qui ferme la recherche) */}
          <button
            onClick={onClose}
            className={`
              p-2 rounded-lg
              ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPS : ÉTAT + LISTE DES RÉSULTATS */}
        <div className="p-2 sm:p-3">
          {isSearching && (
            <div
              className={`
                text-sm text-center py-2
                ${isDark ? 'text-slate-400' : 'text-gray-500'}
              `}
            >
              Recherche en cours...
            </div>
          )}

          {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
            <div
              className={`
                text-sm text-center py-2
                ${isDark ? 'text-slate-400' : 'text-gray-500'}
              `}
            >
              Aucun résultat pour "{searchQuery}"
            </div>
          )}

          {results.length > 0 && (
            <div
              className={`
                mt-2
                max-h-[24vh] sm:max-h-[28vh]
                overflow-y-auto rounded-lg
                ${isDark ? 'bg-slate-800' : 'bg-gray-50'}
              `}
            >
              {results.map((message, index) => {
                const avatarUrl =
                  message.sender?.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    message.sender?.name || 'User'
                  )}&background=3b82f6&color=fff&bold=true`;

                return (
                  <button
                    key={message._id}
                    onClick={() => handleSelectMessage(message, index)}
                    className={`
                      w-full px-3 py-2.5 text-left text-sm
                      flex gap-3
                      transition-colors
                      ${
                        index === currentIndex
                          ? isDark
                            ? 'bg-blue-900/40'
                            : 'bg-blue-100'
                          : isDark
                          ? 'hover:bg-slate-700'
                          : 'hover:bg-gray-100'
                      }
                      ${
                        index !== results.length - 1
                          ? 'border-b ' +
                            (isDark ? 'border-slate-700' : 'border-gray-200')
                          : ''
                      }
                    `}
                  >
                    <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={avatarUrl}
                        alt={message.sender?.name || 'User'}
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`
                            text-xs font-medium truncate
                            ${isDark ? 'text-white' : 'text-gray-900'}
                          `}
                        >
                          {message.sender?.name}
                        </span>
                        <span
                          className={`
                            text-[10px]
                            ${isDark ? 'text-slate-400' : 'text-gray-500'}
                          `}
                        >
                          {format(new Date(message.createdAt), 'dd MMM HH:mm', {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <p
                        className={`
                          text-xs line-clamp-2
                          ${isDark ? 'text-slate-300' : 'text-gray-700'}
                        `}
                      >
                        {highlightText(message.content, searchQuery)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}