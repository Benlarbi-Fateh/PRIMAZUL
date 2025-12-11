"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { MESSAGE_SOUNDS, CALL_SOUNDS } from "@/constants/notificationSounds";

const NotificationsContext = createContext(null);
const STORAGE_KEY = "notificationPreferences";

// Récupère un id par défaut de façon sûre
const DEFAULT_MESSAGE_SOUND_ID =
  (Array.isArray(MESSAGE_SOUNDS) && MESSAGE_SOUNDS[0]?.id) || "default_message";

const DEFAULT_CALL_SOUND_ID =
  (Array.isArray(CALL_SOUNDS) && CALL_SOUNDS[0]?.id) || "default_call";

const defaultPreferences = {
  enabled: true,
  messageSoundId: DEFAULT_MESSAGE_SOUND_ID,
  callSoundId: DEFAULT_CALL_SOUND_ID,
};

export function NotificationsProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    if (typeof window === "undefined") return defaultPreferences;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences;

    try {
      const parsed = JSON.parse(raw);
      return { ...defaultPreferences, ...parsed };
    } catch (e) {
      console.warn("Impossible de parser les préférences de notification", e);
      return defaultPreferences;
    }
  });

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (patch) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  };

  const getSoundFile = (id, type) => {
    const list = type === "message" ? MESSAGE_SOUNDS : CALL_SOUNDS;
    if (!Array.isArray(list) || list.length === 0) return null;

    const found = list.find((s) => s.id === id);
    return (found || list[0]).file;
  };

  const canPlay = preferences.enabled;

  const playMessageSound = useCallback(() => {
    if (!canPlay) return;
    const src = getSoundFile(preferences.messageSoundId, "message");
    if (!src) return;
    const audio = new Audio(src);
    audio.play().catch(() => {});
  }, [preferences.messageSoundId, canPlay]);

  const playCallSound = useCallback(() => {
    if (!canPlay) return;
    const src = getSoundFile(preferences.callSoundId, "call");
    if (!src) return;
    const audio = new Audio(src);
    audio.play().catch(() => {});
  }, [preferences.callSoundId, canPlay]);

  return (
    <NotificationsContext.Provider
      value={{
        preferences,
        updatePreferences,
        playMessageSound,
        playCallSound,
        MESSAGE_SOUNDS,
        CALL_SOUNDS,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications doit être utilisé dans un <NotificationsProvider>"
    );
  }
  return ctx;
}