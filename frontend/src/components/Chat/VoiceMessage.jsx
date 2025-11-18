'use client'

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';

export default function VoiceMessage({ voiceUrl, voiceDuration, isMine }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onCanPlay = () => setLoading(false);
    const onError = () => {
      console.error('Erreur de chargement audio');
      setLoading(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Erreur lecture audio:', error);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = voiceDuration ? (currentTime / voiceDuration) * 100 : 0;

  return (
    <div className={`group flex items-center gap-4 p-4 rounded-3xl max-w-xs transition-all transform hover:scale-[1.02] ${
      isMine 
        ? 'bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 text-white ml-auto shadow-lg hover:shadow-xl' 
        : 'bg-white text-blue-900 shadow-md hover:shadow-lg border-2 border-blue-100'
    }`}>
      <audio 
        ref={audioRef} 
        src={voiceUrl} 
        preload="metadata"
      />
      
      {/* BOUTON PLAY/PAUSE avec animation */}
      <button
        onClick={togglePlay}
        disabled={loading}
        className={`relative shrink-0 w-14 h-14 rounded-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          isMine
            ? 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            : 'bg-linear-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}`}
        title={loading ? 'Chargement...' : isPlaying ? 'Pause' : 'Lecture'}
      >
        {/* Effet de pulse pendant la lecture */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping"></div>
        )}
        
        {loading ? (
          <div className={`w-6 h-6 border-3 rounded-full animate-spin ${
            isMine ? 'border-white border-t-transparent' : 'border-blue-600 border-t-transparent'
          }`} />
        ) : isPlaying ? (
          <Pause size={24} className={isMine ? 'text-white' : 'text-white'} fill="currentColor" />
        ) : (
          <Play size={24} className={isMine ? 'text-white' : 'text-white'} fill="currentColor" />
        )}
      </button>
      
      {/* INFORMATIONS ET BARRE */}
      <div className="flex-1 min-w-0">
        {/* Header avec icône */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${
            isMine ? 'bg-white/20' : 'bg-blue-100'
          }`}>
            {isPlaying ? (
              <Volume2 size={16} className={isMine ? 'text-white animate-pulse' : 'text-blue-600 animate-pulse'} />
            ) : (
              <Mic size={16} className={isMine ? 'text-blue-200' : 'text-blue-500'} />
            )}
          </div>
          <span className={`text-xs font-bold tracking-wide ${
            isMine ? 'text-blue-100' : 'text-blue-600'
          }`}>
            MESSAGE VOCAL
          </span>
        </div>
        
        {/* Barre de progression moderne */}
        <div className="relative mb-3">
          {/* Background de la barre */}
          <div className={`h-2 rounded-full overflow-hidden ${
            isMine ? 'bg-blue-800/50' : 'bg-blue-100'
          }`}>
            {/* Progression */}
            <div 
              className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
                isMine 
                  ? 'bg-linear-to-r from-white to-blue-100' 
                  : 'bg-linear-to-rrom-blue-500 to-cyan-500'
              }`}
              style={{ width: `${progress}%` }}
            >
              {/* Effet de shimmer */}
              <div className={`absolute inset-0 ${
                isMine ? 'bg-linear-to-r from-transparent via-white/40 to-transparent' : 'bg-linear-to-r from-transparent via-white/30 to-transparent'
              } animate-shimmer`}></div>
            </div>
          </div>
          
          {/* Point de progression */}
          {progress > 0 && (
            <div 
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full transition-all shadow-lg ${
                isMine ? 'bg-white' : 'bg-blue-600'
              }`}
              style={{ left: `calc(${progress}% - 8px)` }}
            >
              <div className={`absolute inset-0 rounded-full ${
                isMine ? 'bg-white' : 'bg-blue-600'
              } animate-ping opacity-75`}></div>
            </div>
          )}
        </div>
        
        {/* Temps */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono font-bold ${
              isMine ? 'text-white' : 'text-blue-700'
            }`}>
              {formatTime(currentTime)}
            </span>
            {isPlaying && (
              <div className="flex gap-0.5">
                <span className={`w-1 h-3 rounded-full animate-wave ${
                  isMine ? 'bg-white' : 'bg-blue-600'
                }`} style={{animationDelay: '0s'}}></span>
                <span className={`w-1 h-4 rounded-full animate-wave ${
                  isMine ? 'bg-white' : 'bg-blue-600'
                }`} style={{animationDelay: '0.1s'}}></span>
                <span className={`w-1 h-3 rounded-full animate-wave ${
                  isMine ? 'bg-white' : 'bg-blue-600'
                }`} style={{animationDelay: '0.2s'}}></span>
              </div>
            )}
          </div>
          <span className={`text-sm font-mono font-bold ${
            isMine ? 'text-blue-200' : 'text-blue-500'
          }`}>
            {formatTime(voiceDuration)}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes wave {
          0%, 100% { height: 0.75rem; }
          50% { height: 1.25rem; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}