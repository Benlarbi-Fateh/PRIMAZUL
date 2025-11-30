"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Sidebar from "@/components/Layout/Sidebar.jsx";
import MobileHeader from "@/components/Layout/MobileHeader";
import { useSocket } from "@/hooks/useSocket";
import {
  MessageCircle,
  Send,
  Folder,
  Sparkles,
  Users,
  Shield,
  Zap,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function HomePage() {
  const router = useRouter();
  useSocket();

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const heroBgClass = isDark
    ? "absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "absolute inset-0 bg-linear-to-br from-blue-50 via-slate-50 to-indigo-50";

  const textMain = isDark ? "text-slate-100" : "text-slate-800";
  const textSecondary = isDark ? "text-slate-300" : "text-slate-600";

  const featureCardBase =
    "backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border ";

  const blueCard =
    featureCardBase +
    (isDark
      ? "bg-slate-900/80 border-slate-700 hover:bg-slate-900"
      : "bg-white/80 border-blue-100 hover:border-blue-300 hover:bg-white");

  const cyanCard =
    featureCardBase +
    (isDark
      ? "bg-slate-900/80 border-slate-700 hover:bg-slate-900"
      : "bg-white/80 border-cyan-100 hover:border-cyan-300 hover:bg-white");

  const indigoCard =
    featureCardBase +
    (isDark
      ? "bg-slate-900/80 border-slate-700 hover:bg-slate-900"
      : "bg-white/80 border-indigo-100 hover:border-indigo-300 hover:bg-white");

  const violetCard =
    featureCardBase +
    (isDark
      ? "bg-slate-900/80 border-slate-700 hover:bg-slate-900"
      : "bg-white/80 border-violet-100 hover:border-violet-300 hover:bg-white");

  const infoCardClass =
    "backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto mb-6 border " +
    (isDark
      ? "bg-slate-900/85 border-slate-700"
      : "bg-white/80 border-blue-200");

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-96">
          <Sidebar />
        </div>

        {/* Zone centrale */}
        <div className="hidden lg:flex flex-1 flex-col min-h-0">
          <MobileHeader />

          <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden relative">
            {/* Fond dégradé */}
            <div className={heroBgClass}>
              {/* halos */}
              <div
                className={
                  "absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl " +
                  (isDark ? "bg-sky-500/20" : "bg-blue-100/40")
                }
              />
              <div
                className={
                  "absolute bottom-20 right-20 w-80 h-80 rounded-full blur-3xl " +
                  (isDark ? "bg-indigo-500/20" : "bg-indigo-100/30")
                }
              />
              <div
                className={
                  "absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 " +
                  (isDark ? "bg-cyan-500/15" : "bg-cyan-100/20")
                }
              />

              {/* motifs */}
              <div
                className={
                  "absolute top-10 right-10 w-32 h-32 border-2 rounded-3xl rotate-45 " +
                  (isDark ? "border-slate-700/50" : "border-blue-200/20")
                }
              />
              <div
                className={
                  "absolute bottom-10 left-10 w-24 h-24 border-2 rounded-2xl rotate-12 " +
                  (isDark ? "border-slate-700/50" : "border-indigo-200/20")
                }
              />
            </div>

            <div className="text-center w-full max-w-6xl h-full flex flex-col justify-center relative z-10">
              {/* En-tête */}
              <div className="mb-8">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-blue-300 rounded-full blur-lg opacity-40" />
                  <div
                    className="relative rounded-2xl p-5 inline-block shadow-xl border"
                    style={{
                      background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                      borderColor: "rgba(191,219,254,0.7)",
                    }}
                  >
                    <MessageCircle className="w-14 h-14 text-white" />
                  </div>
                </div>

                <h2
                  className="text-3xl lg:text-4xl xl:text-5xl font-bold bg-clip-text text-transparent mb-4"
                  style={{
                    background: "linear-gradient(to right,#1e40af,#3b82f6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Bienvenue sur PrimAzul
                </h2>

                <p className={`text-lg font-light px-4 ${textSecondary}`}>
                  Sélectionnez une conversation ou créez-en une nouvelle pour
                  commencer
                </p>
              </div>

              {/* Grille de features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8 px-4">
                {/* Messages instantanés */}
                <div className={blueCard}>
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                      style={{
                        background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                      }}
                    >
                      <Send className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className={`font-semibold text-lg mb-1 ${textMain}`}>
                        Messages instantanés
                      </h3>
                      <p className={`text-sm ${textSecondary}`}>
                        Discutez en temps réel avec une interface fluide
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partage multimédia */}
                <div className={cyanCard}>
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                      style={{
                        background: "linear-gradient(135deg,#06b6d4,#0891b2)",
                      }}
                    >
                      <Folder className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className={`font-semibold text-lg mb-1 ${textMain}`}>
                        Partage multimédia
                      </h3>
                      <p className={`text-sm ${textSecondary}`}>
                        Partagez images, documents et messages vocaux
                      </p>
                    </div>
                  </div>
                </div>

                {/* Groupes et contacts */}
                <div className={indigoCard}>
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                      style={{
                        background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                      }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className={`font-semibold text-lg mb-1 ${textMain}`}>
                        Groupes et contacts
                      </h3>
                      <p className={`text-sm ${textSecondary}`}>
                        Créez des groupes et gérez vos contacts
                      </p>
                    </div>
                  </div>
                </div>

                {/* Design élégant */}
                <div className={violetCard}>
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                      style={{
                        background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className={`font-semibold text-lg mb-1 ${textMain}`}>
                        Design élégant
                      </h3>
                      <p className={`text-sm ${textSecondary}`}>
                        Interface moderne et intuitive
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Espace messagerie */}
              <div className={infoCardClass}>
                <h3
                  className={`font-semibold text-xl mb-4 text-center ${textMain}`}
                >
                  Votre espace de messagerie
                </h3>
                <div className="flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className={`font-medium ${textMain}`}>Connecté</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span className={`font-medium ${textMain}`}>Sécurisé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className={`font-medium ${textMain}`}>Rapide</span>
                  </div>
                </div>
              </div>

              {/* Slogan */}
              <div className="mt-6">
                <p
                  className={
                    "text-lg font-light flex items-center justify-center gap-3 " +
                    (isDark ? "text-slate-200" : "text-slate-500")
                  }
                >
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Making distance disappear
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}