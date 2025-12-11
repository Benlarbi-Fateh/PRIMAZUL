"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import { Shield, Lock, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Thème global
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const pageBgStyle = {
    background: isDark
      ? "radial-gradient(circle_at_top,#1d4ed8 0,#020617 55%),radial-gradient(circle_at_bottom,#0f172a 0,#020617 55%)"
      : "linear-gradient(135deg,#dbeafe,#ffffff,#ecfeff)",
  };

  const textGradientStyle = {
    background: "linear-gradient(to right,#2563eb,#06b6d4)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  const secureBadgeClass =
    "mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-md border backdrop-blur-sm " +
    (isDark
      ? "bg-slate-900/80 border-slate-700"
      : "bg-white/80 border-blue-100");

  const secureTextClass =
    "text-sm font-medium " +
    (isDark ? "text-sky-200" : "text-blue-700");

  const secureIconClass =
    "w-4 h-4 " +
    (isDark ? "text-sky-400" : "text-blue-600");

  const progressBgClass =
    "mt-8 w-64 h-2 rounded-full overflow-hidden mx-auto shadow-inner " +
    (isDark ? "bg-slate-800" : "bg-blue-100");

  // Désactiver SSR
  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, isClient]);

  // Pendant SSR
  if (!isClient) {
    return <div className="min-h-screen" style={pageBgStyle} />;
  }

  // Loader
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={pageBgStyle}
      >
        {/* Bulles de fond */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={
              "absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl animate-pulse " +
              (isDark ? "bg-sky-500/40" : "bg-blue-300 opacity-30")
            }
          />
          <div
            className={
              "absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000 " +
              (isDark ? "bg-cyan-500/40" : "bg-cyan-300 opacity-30")
            }
          />
          <div
            className={
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500 " +
              (isDark ? "bg-indigo-500/30" : "bg-blue-200 opacity-20")
            }
          />
        </div>

        {/* Contenu */}
        <div className="text-center relative z-10 animate-fade-in">
          {/* Icône centrale */}
          <div className="relative inline-block mb-8">
            {/* cercle externe */}
            <div className="absolute inset-0 animate-spin">
              <div
                className={
                  "w-24 h-24 rounded-full border-4 " +
                  (isDark
                    ? "border-slate-700 border-t-sky-500"
                    : "border-blue-200 border-t-blue-600")
                }
              />
            </div>

            {/* cercle interne */}
            <div className="absolute inset-2 animate-spin-reverse">
              <div
                className={
                  "w-20 h-20 rounded-full border-4 " +
                  (isDark
                    ? "border-slate-800 border-b-cyan-400"
                    : "border-cyan-200 border-b-cyan-500")
                }
              />
            </div>

            {/* bloc central */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center animate-pulse"
                style={{
                  background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
                }}
              >
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* particules */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-ping" />
            <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-sky-400 animate-ping delay-300" />
          </div>

          {/* Texte */}
          <div className="space-y-3">
            <h2
              className="text-2xl font-bold animate-pulse"
              style={textGradientStyle}
            >
              Vérification en cours...
            </h2>

            <div className="flex gap-2 justify-center items-center">
              <div
                className="w-3 h-3 rounded-full animate-bounce shadow-lg bg-blue-500"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="w-3 h-3 rounded-full animate-bounce shadow-lg bg-blue-500"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-3 h-3 rounded-full animate-bounce shadow-lg bg-blue-500"
                style={{ animationDelay: "0.4s" }}
              />
            </div>

            <div className={secureBadgeClass}>
              <Lock className={secureIconClass} />
              <span className={secureTextClass}>Connexion sécurisée</span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className={progressBgClass}>
            <div
              className="h-full rounded-full animate-loading-bar"
              style={{
                background:
                  "linear-gradient(to right,#3b82f6,#06b6d4,#3b82f6)",
              }}
            />
          </div>
        </div>

        <style jsx>{`
          @keyframes spin-reverse {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }
          @keyframes loading-bar {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-spin-reverse {
            animation: spin-reverse 1.5s linear infinite;
          }
          .animate-loading-bar {
            animation: loading-bar 2s ease-in-out infinite;
          }
          .delay-300 {
            animation-delay: 0.3s;
          }
          .delay-500 {
            animation-delay: 0.5s;
          }
          .delay-1000 {
            animation-delay: 1s;
          }
        `}</style>
      </div>
    );
  }

  // Une fois chargé et authentifié
  return user ? children : null;
}