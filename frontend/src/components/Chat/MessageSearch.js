'use client'

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';

export default function MessageSearch({ 
  conversationId, 
  onMessageSelect,
  isOpen,
  onClose 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isDark } = useTheme();
  const searchTimeoutRef = useRef(null);

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
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      console.log('🔍 Recherche:', { conversationId, query: searchQuery, apiUrl });
      
      const response = await fetch(
        `${apiUrl}/messages/search/${conversationId}?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📡 Statut réponse:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Résultats:', data);
        setResults(data.messages || []);
        setCurrentIndex(0);
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur API:', errorData);
        setResults([]);
      }
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
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

  const handleSelectMessage = (message, index) => {
    setCurrentIndex(index);
    onMessageSelect(message._id);
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 font-bold px-0.5 rounded">
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
    <div className={`border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-slate-700' : 'bg-gray-100'
          }`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher dans la conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent outline-none text-sm ${
                isDark ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-400'
              }`}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setResults([]);
                }}
                className={`p-1 rounded hover:bg-opacity-10 ${
                  isDark ? 'hover:bg-white' : 'hover:bg-black'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {currentIndex + 1} / {results.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={`p-1 rounded ${
                    currentIndex === 0
                      ? isDark ? 'text-slate-600' : 'text-gray-300'
                      : isDark ? 'text-white hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === results.length - 1}
                  className={`p-1 rounded ${
                    currentIndex === results.length - 1
                      ? isDark ? 'text-slate-600' : 'text-gray-300'
                      : isDark ? 'text-white hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSearching && (
          <div className={`text-sm text-center py-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Recherche en cours...
          </div>
        )}

        {!isSearching && searchQuery.length >= 2 && results.length === 0 && (
          <div className={`text-sm text-center py-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Aucun résultat pour "{searchQuery}"
          </div>
        )}

        {results.length > 0 && (
          <div className={`max-h-64 overflow-y-auto rounded-lg ${
            isDark ? 'bg-slate-700' : 'bg-gray-50'
          }`}>
            {results.map((message, index) => {
              const avatarUrl = message.sender?.profilePicture || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=3b82f6&color=fff&bold=true`;

              return (
                <button
                  key={message._id}
                  onClick={() => handleSelectMessage(message, index)}
                  className={`w-full p-3 text-left transition-colors ${
                    index === currentIndex
                      ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                      : isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-100'
                  } ${index !== results.length - 1 ? 'border-b ' + (isDark ? 'border-slate-600' : 'border-gray-200') : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                      <Image
                        src={avatarUrl}
                        alt={message.sender?.name || 'User'}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {message.sender?.name}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {format(new Date(message.createdAt), 'dd MMM HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className={`text-sm line-clamp-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {highlightText(message.content, searchQuery)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}