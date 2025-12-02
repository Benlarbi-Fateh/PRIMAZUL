'use client'

import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function VoiceMessage({ voiceUrl, voiceDuration, isMine }) {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voiceDuration || 0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Generate deterministic wave bars using useMemo
  const bars = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const h = Math.abs(Math.sin(i * 1.2) * 40 + Math.cos(i * 0.8) * 25) + 15;
      return Math.min(90, Math.max(20, h));
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || voiceDuration || 0);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [voiceDuration]);

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
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const handleSeek = (e) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const formatTime = (s) => {
    if (isNaN(s) || s === 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // Styles basés sur le thème
  const getBackgroundClass = () => {
    if (isMine) {
      return 'bg-linear-to-r from-blue-600 to-blue-800 text-white rounded-br-md';
    } else {
      if (isDark) {
        return 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700 rounded-bl-md';
      } else {
        return 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md';
      }
    }
  };

  const getButtonClass = () => {
    if (isMine) {
      return 'bg-white/20 hover:bg-white/30';
    } else {
      if (isDark) {
        return 'bg-slate-700 hover:bg-slate-600 text-slate-100';
      } else {
        return 'bg-blue-50 hover:bg-blue-100 text-blue-700';
      }
    }
  };

  const getWaveColor = (isActive) => {
    if (isMine) {
      return isActive ? 'bg-white' : 'bg-white/30';
    } else {
      if (isDark) {
        return isActive ? 'bg-blue-400' : 'bg-slate-600';
      } else {
        return isActive ? 'bg-blue-600' : 'bg-slate-200';
      }
    }
  };

  const getTimeTextClass = (isPrimary = true) => {
    if (isMine) {
      return isPrimary ? 'text-white/70' : 'text-white/50';
    } else {
      if (isDark) {
        return isPrimary ? 'text-slate-300' : 'text-slate-500';
      } else {
        return isPrimary ? 'text-slate-400' : 'text-slate-300';
      }
    }
  };

  const getMicIconClass = () => {
    if (isMine) {
      return 'bg-white/10 text-white/60';
    } else {
      if (isDark) {
        return 'bg-slate-700 text-slate-300';
      } else {
        return 'bg-slate-50 text-slate-400';
      }
    }
  };

  return (
    <div className={`px-3 py-2.5 rounded-2xl min-w-[200px] max-w-[260px] ${getBackgroundClass()}`}>
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />
      
      <div className="flex items-center gap-3">
        {/* Play Button */}
        <button
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 ${getButtonClass()}`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" fill="currentColor" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
          )}
        </button>

        {/* Waveform */}
        <div className="flex-1 min-w-0">
          <div 
            ref={progressRef}
            onClick={handleSeek}
            className="flex items-center gap-0.5 h-8 cursor-pointer"
          >
            {bars.map((h, i) => {
              const isActive = (i / bars.length) * 100 <= progress;
              return (
                <div
                  key={i}
                  className={`w-[3px] rounded-full transition-all duration-100 ${getWaveColor(isActive)}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
          
          {/* Time */}
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] font-medium ${getTimeTextClass(true)}`}>
              {formatTime(currentTime)}
            </span>
            <span className={`text-[10px] ${getTimeTextClass(false)}`}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Mic Icon */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${getMicIconClass()}`}>
          <Mic className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}