'use client'

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Trash2, Play, Pause, Radio, Sparkles } from 'lucide-react';

export default function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformBars, setWaveformBars] = useState(() => Array(20).fill(0).map(() => Math.random()));
  
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl]);

  // Animation de la waveform pendant l'enregistrement
  useEffect(() => {
    if (isRecording) {
      const animateWaveform = () => {
        setWaveformBars(Array(20).fill(0).map(() => Math.random()));
        animationRef.current = requestAnimationFrame(animateWaveform);
      };
      animateWaveform();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= 300) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur micro:', error);
      alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const sendVoice = () => {
    if (audioBlob) {
      onSendVoice(audioBlob, duration);
      resetRecorder();
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    resetRecorder();
    onCancel();
  };

  const deleteRecording = () => {
    resetRecorder();
  };

  const resetRecorder = () => {
    setDuration(0);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    chunksRef.current = [];
    setIsPlaying(false);
    setWaveformBars(() => Array(20).fill(0).map(() => Math.random()));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-linear-to-r from-blue-50 via-white to-cyan-50 border-t-2 border-blue-200 p-4 shadow-2xl">
      <div className="max-w-2xl mx-auto">
        
        {/* ENREGISTREMENT PAS COMMENCÉ */}
        {!isRecording && !audioBlob && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 animate-fade-in">
            <div className="text-center space-y-6">
              {/* Icon avec animation */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-linear-to-r from-rose-400 to-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <button
                  onClick={startRecording}
                  className="relative w-20 h-20 bg-linear-to-br from-rose-500 to-pink-600 text-white rounded-full hover:from-rose-600 hover:to-pink-700 transition-all transform hover:scale-110 active:scale-95 shadow-2xl flex items-center justify-center group"
                  title="Commencer l'enregistrement"
                >
                  <Mic size={32} className="group-hover:animate-pulse" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-blue-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Enregistrer un message vocal
                </h3>
                <p className="text-sm text-blue-600">Appuyez sur le micro pour commencer</p>
                <p className="text-xs text-blue-400">Durée maximale : 5 minutes</p>
              </div>

              <button
                onClick={cancelRecording}
                className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-semibold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
              >
                <X size={20} />
                Annuler
              </button>
            </div>
          </div>
        )}
        
        {/* EN COURS D'ENREGISTREMENT */}
        {isRecording && (
          <div className="bg-linear-to-br from-rose-500 via-pink-500 to-rose-600 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-6">
              {/* Bouton Stop avec animation */}
              <button
                onClick={stopRecording}
                className="shrink-0 w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-2xl transition-all transform hover:scale-110 active:scale-95 shadow-xl flex items-center justify-center group"
                title="Arrêter l'enregistrement"
              >
                <Square size={28} fill="white" className="group-hover:animate-pulse" />
              </button>
              
              <div className="flex-1 space-y-4">
                {/* Indicateur REC */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Radio className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-white font-bold tracking-wider">REC</span>
                  </div>
                  <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                </div>

                {/* Waveform animée */}
                <div className="flex items-center gap-1 h-12">
                  {waveformBars.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white/80 rounded-full animate-wave"
                      style={{
                        height: `${20 + height * 60}%`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    ></div>
                  ))}
                </div>

                {/* Timer */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-mono font-bold text-white drop-shadow-lg">
                    {formatDuration(duration)}
                  </span>
                  {duration >= 290 && (
                    <div className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
                      <span>Limite bientôt atteinte</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bouton Annuler */}
              <button 
                onClick={cancelRecording} 
                className="shrink-0 p-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl transition-all transform hover:scale-110 active:scale-95"
                title="Annuler"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
          </div>
        )}
        
        {/* LECTURE DE L'ENREGISTREMENT */}
        {audioBlob && !isRecording && (
          <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-200 animate-scale-in">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Mic size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Message vocal prêt</h3>
                    <p className="text-sm text-blue-600">Durée: {formatDuration(duration)}</p>
                  </div>
                </div>
                
                <button
                  onClick={deleteRecording}
                  className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-2xl transition-all transform hover:scale-110 active:scale-95"
                  title="Supprimer"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              {/* Player audio stylisé */}
              <div className="bg-linear-to-r from-blue-50 to-cyan-50 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayback}
                    className="shrink-0 w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all transform hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause size={20} fill="white" />
                    ) : (
                      <Play size={20} fill="white" />
                    )}
                  </button>
                  
                  <audio 
                    ref={audioRef}
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)}
                    className="flex-1"
                    controls
                    style={{ 
                      height: '40px',
                      accentColor: '#3b82f6'
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={cancelRecording}
                  className="flex-1 py-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Annuler
                </button>
                
                <button
                  onClick={sendVoice}
                  className="flex-1 py-4 bg-linear-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 group"
                >
                  <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  Envoyer
                  <Sparkles size={16} className="animate-pulse" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}