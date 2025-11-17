'use client'

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, Trash2 } from 'lucide-react';

export default function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  // Nettoyer l'URL de l'audio quand le composant est démonté
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
      
      // Utiliser webm pour la compatibilité
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType
      });
      
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
        
        // Arrêter tous les tracks du stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          // Limiter à 5 minutes (300 secondes)
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
      
      // Arrêter le stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border-t border-blue-200 p-4">
      <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-4">
        
        {/* BOUTON ENREGISTRER */}
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="p-4 bg-linear-to-r from-red-500 to-pink-500 text-white rounded-full hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg"
            title="Commencer l'enregistrement"
          >
            <Mic size={24} />
          </button>
        )}
        
        {/* EN COURS D'ENREGISTREMENT */}
        {isRecording && (
          <>
            <button
              onClick={stopRecording}
              className="p-4 bg-red-500 text-white rounded-full animate-pulse shadow-lg"
              title="Arrêter l'enregistrement"
            >
              <Square size={24} fill="white" />
            </button>
            
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-900">Enregistrement en cours...</span>
                </div>
                <div className="text-2xl font-mono font-bold text-red-500">
                  {formatDuration(duration)}
                </div>
                {duration >= 290 && (
                  <p className="text-xs text-red-500 mt-1">Limite de 5 min bientôt atteinte</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={cancelRecording} 
              className="p-3 hover:bg-red-100 rounded-full transition"
              title="Annuler"
            >
              <X size={24} className="text-red-500" />
            </button>
          </>
        )}
        
        {/* LECTURE AUDIO ENREGISTRÉ */}
        {audioBlob && !isRecording && (
          <>
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
              <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shrink-0">
                <Mic size={20} className="text-white" />
              </div>
              
              <div className="flex-1">
                <audio 
                  src={audioUrl} 
                  controls 
                  className="w-full h-8"
                  style={{ 
                    accentColor: '#3b82f6'
                  }}
                />
                <p className="text-xs text-blue-600 mt-1">
                  Durée: {formatDuration(duration)}
                </p>
              </div>
            </div>
            
            <button
              onClick={deleteRecording}
              className="p-3 hover:bg-red-100 rounded-full transition"
              title="Supprimer"
            >
              <Trash2 size={20} className="text-red-500" />
            </button>
            
            <button
              onClick={sendVoice}
              className="p-4 bg-linear-to-r from-blue-600 to-cyan-500 text-white rounded-full hover:from-blue-700 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg"
              title="Envoyer le message vocal"
            >
              <Send size={24} />
            </button>
            
            <button 
              onClick={cancelRecording} 
              className="p-3 hover:bg-blue-200 rounded-full transition"
              title="Annuler"
            >
              <X size={20} className="text-blue-600" />
            </button>
          </>
        )}
      </div>
      
      {!isRecording && !audioBlob && (
        <p className="text-xs text-blue-600 text-center mt-2">
          Appuyez sur le micro pour enregistrer un message vocal
        </p>
      )}
    </div>
  );
}