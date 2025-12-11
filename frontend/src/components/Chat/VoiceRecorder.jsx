"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X, Trash2, Play, Pause } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function VoiceRecorder({ onSendVoice, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerClass =
    "border-t p-3 " +
    (isDark
      ? "bg-slate-950/95 border-slate-800"
      : "bg-slate-50 border-slate-200");

  const initialCardClass =
    "rounded-xl p-4 flex items-center justify-between " +
    (isDark
      ? "bg-slate-900 border border-slate-700 shadow-md"
      : "bg-white shadow-sm border border-slate-200");

  const previewCardClass =
    "rounded-xl p-4 flex flex-col gap-3 shadow-sm border " +
    (isDark
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200");

  const primaryText = isDark ? "text-slate-100" : "text-slate-800";
  const secondaryText = isDark ? "text-slate-400" : "text-slate-500";

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => (prev >= 300 ? (stopRecording(), 300) : prev + 1));
      }, 1000);
    } catch (error) {
      console.error("❌ Micro error:", error);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
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
    if (isRecording) stopRecording();
    resetRecorder();
    onCancel();
  };

  const deleteRecording = () => resetRecorder();

  const resetRecorder = () => {
    setDuration(0);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    chunksRef.current = [];
    setIsPlaying(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={containerClass}>
      <div className="max-w-md mx-auto">
        {/* ÉTAT INITIAL */}
        {!isRecording && !audioBlob && (
          <div className={initialCardClass}>
            <div className="flex items-center gap-3">
              <button
                onClick={startRecording}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all flex items-center justify-center shadow-md"
              >
                <Mic size={20} />
              </button>
              <div>
                <p className={`text-sm font-medium ${primaryText}`}>
                  Appuyez pour enregistrer
                </p>
                <p className={`text-xs ${secondaryText}`}>Max 5 minutes</p>
              </div>
            </div>
            <button
              onClick={cancelRecording}
              className={
                "p-2 rounded-lg transition-colors " +
                (isDark
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  : "text-slate-400 hover:text-slate-600")
              }
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* ENREGISTREMENT */}
        {isRecording && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <button
                onClick={stopRecording}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all flex items-center justify-center"
              >
                <Square size={16} fill="white" />
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-white/90 text-sm font-medium">
                    Enregistrement
                  </span>
                </div>

                <div className="flex items-center gap-1 h-6 mb-1">
                  {Array.from({ length: 15 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white/60 rounded-full animate-pulse"
                      style={{
                        height: `${20 + Math.sin(i * 0.8) * 15}%`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white font-mono font-medium text-sm">
                    {formatDuration(duration)}
                  </span>
                  {duration >= 290 && (
                    <span className="text-xs text-yellow-200 bg-yellow-800/30 px-2 py-1 rounded">
                      Bientôt fini
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRÉVISUALISATION */}
        {audioBlob && !isRecording && (
          <div className={previewCardClass}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayback}
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center justify-center"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div>
                  <p className={`text-sm font-medium ${primaryText}`}>
                    Message vocal
                  </p>
                  <p className={`text-xs ${secondaryText}`}>
                    {formatDuration(duration)}
                  </p>
                </div>
              </div>

              <button
                onClick={deleteRecording}
                className={
                  "p-2 rounded-lg transition-colors " +
                  (isDark
                    ? "text-slate-400 hover:text-red-400 hover:bg-slate-800"
                    : "text-slate-400 hover:text-red-500")
                }
              >
                <Trash2 size={16} />
              </button>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                onClick={cancelRecording}
                className={
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-colors " +
                  (isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700")
                }
              >
                Annuler
              </button>
              <button
                onClick={sendVoice}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Send size={14} />
                Envoyer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}