'use client'

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

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
    <div className={`flex items-center gap-3 p-4 rounded-2xl max-w-xs ${
      isMine 
        ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white ml-auto' 
        : 'bg-white text-blue-900 shadow-sm border border-blue-200'
    }`}>
      <audio 
        ref={audioRef} 
        src={voiceUrl} 
        preload="metadata"
      />
      
      {/* BOUTON PLAY/PAUSE */}
      <button
        onClick={togglePlay}
        disabled={loading}
        className={`shrink-0 p-3 rounded-full transition-all transform hover:scale-105 ${
          isMine
            ? 'bg-blue-700 hover:bg-blue-800'
            : 'bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={loading ? 'Chargement...' : isPlaying ? 'Pause' : 'Lecture'}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={20} className="text-white" fill="white" />
        ) : (
          <Play size={20} className="text-white" fill="white" />
        )}
      </button>
      
      {/* BARRE DE PROGRESSION */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Mic size={14} className={isMine ? 'text-blue-200' : 'text-blue-500'} />
          <span className="text-xs font-medium">
            Message vocal
          </span>
        </div>
        
        {/* Barre */}
        <div className={`h-1.5 rounded-full overflow-hidden ${
          isMine ? 'bg-blue-700' : 'bg-blue-100'
        }`}>
          <div 
            className={`h-full rounded-full transition-all ${
              isMine ? 'bg-white' : 'bg-linear-to-r from-blue-500 to-cyan-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Temps */}
        <div className="flex justify-between items-center mt-2">
          <span className={`text-xs font-mono ${
            isMine ? 'text-blue-100' : 'text-blue-600'
          }`}>
            {formatTime(currentTime)}
          </span>
          <span className={`text-xs font-mono ${
            isMine ? 'text-blue-200' : 'text-blue-500'
          }`}>
            {formatTime(voiceDuration)}
          </span>
        </div>
      </div>
    </div>
  );
}