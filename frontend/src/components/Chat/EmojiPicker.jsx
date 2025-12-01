'use client'

import { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles } from 'lucide-react';

const EMOJI_CATEGORIES = [
  { id: 'recent', name: 'Récent', icon: '🕒', color: 'text-purple-500' },
  { id: 'smileys', name: 'Smileys', icon: '😊', color: 'text-yellow-500' },
  { id: 'gestures', name: 'Gestes', icon: '👋', color: 'text-pink-500' },
  { id: 'people', name: 'Personnes', icon: '👤', color: 'text-blue-500' },
  { id: 'animals', name: 'Animaux', icon: '🐶', color: 'text-green-500' },
  { id: 'food', name: 'Nourriture', icon: '🍔', color: 'text-red-500' },
  { id: 'travel', name: 'Voyage', icon: '✈️', color: 'text-indigo-500' },
  { id: 'objects', name: 'Objets', icon: '💡', color: 'text-amber-500' },
  { id: 'symbols', name: 'Symboles', icon: '❤️', color: 'text-rose-500' },
];

const EMOJI_DATA = {
  recent: ['😊', '❤️', '👍', '🔥', '🎉', '👏', '🥰', '🤔', '😂', '✨', '💯', '🙏'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👍', '👎', '👏'],
  people: ['👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '👵', '🧓', '👴', '👲', '🧕', '👮', '👷'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
  food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '✈️', '🚁'],
  objects: ['⌚', '📱', '💻', '🖥️', '🖨️', '📷', '📹', '🎥', '📺', '📻', '🎙️', '💡', '🔦', '📚'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💞', '💓', '💗', '💖', '💘'],
};

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentEmojis, setRecentEmojis] = useState(EMOJI_DATA.recent);
  const pickerRef = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji) => {
    onSelect(emoji);
    
    // Ajouter aux récents si pas déjà présent
    if (!recentEmojis.includes(emoji)) {
      const newRecents = [emoji, ...recentEmojis.slice(0, 11)];
      setRecentEmojis(newRecents);
    }
  };

  // Obtenir les emojis à afficher
  const getDisplayEmojis = () => {
    if (searchTerm.trim()) {
      const allEmojis = Object.values(EMOJI_DATA).flat();
      return allEmojis.filter(emoji => 
        emoji.includes(searchTerm)
      ).slice(0, 48);
    }
    
    if (activeCategory === 'recent') {
      return recentEmojis.slice(0, 24);
    }
    
    return (EMOJI_DATA[activeCategory] || []).slice(0, 24);
  };

  const displayEmojis = getDisplayEmojis();

  return (
    <div 
      ref={pickerRef}
      className="
        fixed bottom-20 left-1/2 -translate-x-1/2
        w-[380px] max-w-[calc(100vw-2rem)] max-h-[400px]
        bg-white rounded-2xl shadow-2xl shadow-black/20
        border border-gray-200 overflow-hidden z-50
        flex flex-col
      "
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Emojis</h3>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5
              bg-gray-50 border border-gray-200
              rounded-xl text-sm
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:border-blue-500
            "
            autoFocus
          />
        </div>
      </div>

      {/* Navigation par catégories */}
      {!searchTerm && (
        <div className="px-3 pt-3 bg-white border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-2">
            {EMOJI_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex flex-col items-center p-2 min-w-14 rounded-xl
                  transition-all duration-200
                  ${activeCategory === category.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <div className={`text-lg mb-1 ${category.color}`}>
                  {category.icon}
                </div>
                <span className={`
                  text-[10px] font-medium truncate w-full text-center
                  ${activeCategory === category.id 
                    ? 'text-blue-600' 
                    : 'text-gray-500'
                  }
                `}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grille d'emojis */}
      <div className="flex-1 p-3 overflow-y-auto scrollbar-thin">
        {displayEmojis.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">Aucun emoji trouvé</p>
            <p className="text-xs text-gray-400 mt-1">Essayez d&apos;autres mots-clés</p>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-2">
            {displayEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className="
                  w-9 h-9 flex items-center justify-center text-xl
                  rounded-xl transition-all duration-150
                  hover:bg-gray-100 hover:scale-110 active:scale-95
                "
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}