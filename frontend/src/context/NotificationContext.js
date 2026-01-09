// frontend/src/context/NotificationContext.js
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

const NotificationContext = createContext();

// Sons disponibles
export const NOTIFICATION_SOUNDS = [
 {
    id: "default",
    name: "Par défaut",
    file: "/sounds/notifications/default.mp3",
  },
  {
    id: "message",
    name: "New message voice",
    file: "/sounds/notifications/youhaveanewmessage.mp3",
  },
  {
    id: "message2",
    name: "conclusive",
    file: "/sounds/notifications/conclusive.mp3",
  },
  {
    id: "message3",
    name: "light",
    file: "/sounds/notifications/light.mp3",
  },
];

export const NotificationProvider = ({ children }) => {
  const getInitialSettings = () => {
    if (typeof window === "undefined") {
      return {
        enabled: true,
        soundEnabled: true,
        selectedSound: "default",
        volume: 0.7,
      };
    }

    const saved = localStorage.getItem("notificationSettings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erreur parsing notification settings:", e);
      }
    }

    return {
      enabled: true,
      soundEnabled: true,
      selectedSound: "default",
      volume: 0.7,
    };
  };

  const [settings, setSettings] = useState(getInitialSettings);
  const [notificationPermission, setNotificationPermission] = useState("default");
  const audioRef = useRef(null);
  const previewAudioRef = useRef(null); // ✅ NOUVEAU : Ref pour le son de prévisualisation

  // Vérifier la permission au montage
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // Use setTimeout to defer setState and avoid cascading renders
      const timer = setTimeout(() => {
        setNotificationPermission(Notification.permission);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Sauvegarder les paramètres
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notificationSettings", JSON.stringify(settings));
    }
  }, [settings]);

  // Initialiser l'audio pour les notifications
  useEffect(() => {
    if (typeof window === "undefined") return;

    const soundConfig = NOTIFICATION_SOUNDS.find(
      (s) => s.id === settings.selectedSound
    );

    if (soundConfig) {
      const audio = new Audio(soundConfig.file);
      audio.volume = settings.volume;
      audio.load();

      audio.addEventListener("error", (e) => {
        console.error("❌ Erreur chargement audio:", soundConfig.file, e);
      });

      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [settings.selectedSound]);

  // Mettre à jour le volume séparément
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume;
    }
  }, [settings.volume]);

  const toggleNotifications = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const changeSound = useCallback((soundId) => {
    setSettings((prev) => ({ ...prev, selectedSound: soundId }));
  }, []);

  const changeVolume = useCallback((volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setSettings((prev) => ({ ...prev, volume: clampedVolume }));
  }, []);

  // ✅ NOUVEAU : Fonction pour prévisualiser un son SANS le sélectionner
  const previewSound = useCallback((soundId) => {
    console.log("🎵 Prévisualisation du son:", soundId);

    const soundConfig = NOTIFICATION_SOUNDS.find((s) => s.id === soundId);
    if (!soundConfig) {
      console.error("❌ Son non trouvé:", soundId);
      return;
    }

    // Arrêter le son précédent si en cours
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }

    // Créer et jouer le nouveau son
    const previewAudio = new Audio(soundConfig.file);
    previewAudio.volume = settings.volume;
    previewAudioRef.current = previewAudio;

    previewAudio.play()
      .then(() => {
        console.log("✅ Prévisualisation en cours:", soundConfig.name);
      })
      .catch((err) => {
        console.warn("⚠️ Prévisualisation bloquée:", err.message);
      });
  }, [settings.volume]);

  // Fonction de lecture du son de notification
  const playNotificationSound = useCallback(() => {
    console.log("🔊 playNotificationSound appelé");

    if (!settings.enabled || !settings.soundEnabled) {
      console.log("🔇 Son désactivé par les paramètres");
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;

        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("✅ Son joué avec succès");
            })
            .catch((err) => {
              console.warn("⚠️ Lecture audio bloquée:", err.message);
              const soundConfig = NOTIFICATION_SOUNDS.find(
                (s) => s.id === settings.selectedSound
              );
              if (soundConfig) {
                const fallbackAudio = new Audio(soundConfig.file);
                fallbackAudio.volume = settings.volume;
                fallbackAudio.play().catch((e) => {
                  console.error("❌ Fallback audio aussi bloqué:", e.message);
                });
              }
            });
        }
      } else {
        console.error("❌ audioRef.current est null");
        const soundConfig = NOTIFICATION_SOUNDS.find(
          (s) => s.id === settings.selectedSound
        );
        if (soundConfig) {
          const newAudio = new Audio(soundConfig.file);
          newAudio.volume = settings.volume;
          newAudio.play().catch((e) => {
            console.error("❌ Erreur création audio:", e.message);
          });
        }
      }
    } catch (error) {
      console.error("❌ Erreur lecture notification:", error);
    }
  }, [settings.enabled, settings.soundEnabled, settings.selectedSound, settings.volume]);

  const testSound = useCallback(() => {
    console.log("🧪 Test du son sélectionné...");

    const soundConfig = NOTIFICATION_SOUNDS.find(
      (s) => s.id === settings.selectedSound
    );

    if (soundConfig) {
      const testAudio = new Audio(soundConfig.file);
      testAudio.volume = settings.volume;
      testAudio.play()
        .then(() => console.log("✅ Test son réussi"))
        .catch((e) => console.error("❌ Test son échoué:", e.message));
    }
  }, [settings.selectedSound, settings.volume]);

  const showNotification = useCallback(
    (title, options = {}) => {
      console.log("📢 showNotification appelé:", title);

      if (!settings.enabled) {
        console.log("🔇 Notifications désactivées dans les settings");
        return;
      }

      if (settings.soundEnabled) {
        playNotificationSound();
      }

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notification = new Notification(title, {
            icon: options.icon || "/logo.png",
            badge: "/logo.png",
            tag: options.tag || "default",
            body: options.body || "",
            requireInteraction: false,
            silent: true,
            ...options,
          });

          setTimeout(() => notification.close(), 5000);

          console.log("✅ Notification système affichée");
        } catch (error) {
          console.error("❌ Erreur notification système:", error);
        }
      }
    },
    [settings, playNotificationSound]
  );

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.log("❌ Notifications non supportées");
      return false;
    }

    if (Notification.permission === "default") {
      console.log("🔔 Demande de permission...");
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      console.log("📋 Permission obtenue:", permission);
      return permission === "granted";
    }

    return Notification.permission === "granted";
  }, []);

  const value = {
    settings,
    toggleNotifications,
    toggleSound,
    changeSound,
    changeVolume,
    playNotificationSound,
    showNotification,
    testSound,
    previewSound, // ✅ NOUVEAU : Ajouter la fonction de prévisualisation
    requestPermission,
    notificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};