// frontend/src/components/Settings/NotificationSettings.jsx
"use client";

import { useState } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  Check,
  Play,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  useNotifications,
  NOTIFICATION_SOUNDS,
} from "@/context/NotificationContext";
import { useTheme } from "@/hooks/useTheme";

export default function NotificationSettings() {
  const { isDark } = useTheme();
  const {
    settings,
    toggleNotifications,
    toggleSound,
    changeSound,
    changeVolume,
    testSound,
    requestPermission,
    notificationPermission,
  } = useNotifications();

  const [showSoundPicker, setShowSoundPicker] = useState(false);

  // Styles
  const cardBg = isDark
    ? "bg-blue-900/80 backdrop-blur-xl border-blue-800"
    : "bg-white/80 backdrop-blur-xl border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";
  const textMuted = isDark ? "text-blue-400" : "text-blue-500";

  const selectedItemBg = isDark
    ? "bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-500"
    : "bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400";

  const itemBg = isDark
    ? "bg-blue-800/50 hover:bg-blue-800 border-blue-700"
    : "bg-blue-50 hover:bg-blue-100 border-blue-200";

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      alert("✅ Notifications autorisées !");
    } else {
      alert("❌ Notifications refusées");
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification système */}
      {notificationPermission !== "granted" && (
        <div
          className={`rounded-2xl p-4 border-2 ${
            isDark
              ? "bg-orange-900/20 border-orange-800"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <Bell
              className={`w-5 h-5 mt-0.5 ${
                isDark ? "text-orange-400" : "text-orange-600"
              }`}
            />
            <div className="flex-1">
              <p
                className={`font-semibold text-sm ${
                  isDark ? "text-orange-300" : "text-orange-800"
                }`}
              >
                Notifications désactivées
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDark ? "text-orange-400" : "text-orange-700"
                }`}
              >
                Autorisez les notifications pour recevoir des alertes en temps
                réel
              </p>
              <button
                onClick={handleRequestPermission}
                className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold ${
                  isDark
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                Autoriser les notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle notifications */}
      <div className={`rounded-2xl p-5 border-2 ${cardBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? "bg-blue-800" : "bg-blue-100"
              }`}
            >
              <Bell
                className={`w-6 h-6 ${
                  isDark ? "text-cyan-400" : "text-blue-600"
                }`}
              />
            </div>
            <div>
              <h3 className={`font-bold ${textPrimary}`}>
                Activer les notifications
              </h3>
              <p className={`text-sm ${textMuted}`}>
                Recevoir des alertes pour les nouveaux messages
              </p>
            </div>
          </div>
          <button onClick={toggleNotifications} className="relative">
            <div
              className={`w-14 h-7 rounded-full transition-colors ${
                settings.enabled
                  ? isDark
                    ? "bg-cyan-500"
                    : "bg-blue-500"
                  : isDark
                  ? "bg-blue-700"
                  : "bg-slate-300"
              }`}
            ></div>
            <div
              className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
                settings.enabled ? "transform translate-x-7" : ""
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* Toggle son */}
      {settings.enabled && (
        <div className={`rounded-2xl p-5 border-2 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? "bg-purple-800" : "bg-purple-100"
                }`}
              >
                {settings.soundEnabled ? (
                  <Volume2
                    className={`w-6 h-6 ${
                      isDark ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                ) : (
                  <VolumeX
                    className={`w-6 h-6 ${
                      isDark ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                )}
              </div>
              <div>
                <h3 className={`font-bold ${textPrimary}`}>
                  Son des notifications
                </h3>
                <p className={`text-sm ${textMuted}`}>
                  Jouer un son à chaque notification
                </p>
              </div>
            </div>
            <button onClick={toggleSound} className="relative">
              <div
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.soundEnabled
                    ? isDark
                      ? "bg-purple-500"
                      : "bg-purple-500"
                    : isDark
                    ? "bg-blue-700"
                    : "bg-slate-300"
                }`}
              ></div>
              <div
                className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
                  settings.soundEnabled ? "transform translate-x-7" : ""
                }`}
              ></div>
            </button>
          </div>
        </div>
      )}

      {/* Choix de la sonnerie */}
      {settings.enabled && settings.soundEnabled && (
        <div className={`rounded-2xl p-5 border-2 ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? "bg-green-800" : "bg-green-100"
                }`}
              >
                <Sparkles
                  className={`w-6 h-6 ${
                    isDark ? "text-green-400" : "text-green-600"
                  }`}
                />
              </div>
              <div>
                <h3 className={`font-bold ${textPrimary}`}>
                  Sonnerie de notification
                </h3>
                <p className={`text-sm ${textMuted}`}>
                  {
                    NOTIFICATION_SOUNDS.find(
                      (s) => s.id === settings.selectedSound
                    )?.name
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSoundPicker(!showSoundPicker)}
              className={`p-2 rounded-lg hover:bg-opacity-80 transition-colors ${
                isDark ? "hover:bg-blue-800" : "hover:bg-blue-100"
              }`}
            >
              <ChevronRight
                className={`w-5 h-5 transition-transform ${
                  showSoundPicker ? "rotate-90" : ""
                } ${textSecondary}`}
              />
            </button>
          </div>

          {showSoundPicker && (
            <div className="space-y-2 mt-4">
              {NOTIFICATION_SOUNDS.map((sound) => {
                const isSelected = settings.selectedSound === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => {
                      changeSound(sound.id);
                      setTimeout(testSound, 100);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? selectedItemBg + " text-white shadow-lg"
                        : itemBg + " " + textPrimary
                    }`}
                  >
                    <span className="font-medium">{sound.name}</span>
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="w-5 h-5" />}
                      <Play className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Test du son */}
          <button
            onClick={testSound}
            className={`w-full mt-4 px-4 py-3 rounded-xl font-semibold transition-all ${
              isDark
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            } shadow-lg hover:shadow-xl`}
          >
            <span className="flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Tester le son
            </span>
          </button>
        </div>
      )}

      {/* Contrôle du volume */}
      {settings.enabled && settings.soundEnabled && (
        <div className={`rounded-2xl p-5 border-2 ${cardBg}`}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark ? "bg-orange-800" : "bg-orange-100"
              }`}
            >
              <Volume2
                className={`w-6 h-6 ${
                  isDark ? "text-orange-400" : "text-orange-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${textPrimary}`}>Volume</h3>
              <p className={`text-sm ${textMuted}`}>
                {Math.round(settings.volume * 100)}%
              </p>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={settings.volume * 100}
            onChange={(e) => changeVolume(e.target.value / 100)}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: isDark
                ? `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${
                    settings.volume * 100
                  }%, #1e3a8a ${settings.volume * 100}%, #1e3a8a 100%)`
                : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    settings.volume * 100
                  }%, #e0e7ff ${settings.volume * 100}%, #e0e7ff 100%)`,
            }}
          />
        </div>
      )}
    </div>
  );
}
