"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  KeyRound,
  Shield,
  Sparkles,
  MessageCircle,
  Zap,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  // === Thème global ===
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Styles généraux dépendants du thème
  const pageBgStyle = {
    background: isDark
      ? "linear-gradient(135deg,#020617,#020617,#0b1120)" // sombre
      : "linear-gradient(135deg,#eff6ff,#ffffff,#e5e7eb)", // clair
  };

  const sidebarStyle = {
    background: isDark
      ? "linear-gradient(135deg,#1d4ed8,#020617)"
      : "linear-gradient(135deg,#2563eb,#1d4ed8)",
  };

  const contentBgStyle = {
    background: isDark
      ? "linear-gradient(135deg,#020617,#020617,#020617)"
      : "linear-gradient(135deg,#eff6ff,#f3f4f6)",
  };

  const mainCardClass =
    "backdrop-blur-sm rounded-3xl shadow-lg border p-8 " +
    (isDark
      ? "bg-slate-900/90 border-slate-700 text-slate-50"
      : "bg-white/80 border-white/60 text-gray-900");

  const leftTextMuted = isDark ? "text-blue-100" : "text-blue-100";
  const textMuted = isDark ? "text-slate-300" : "text-gray-600";
  const textStrong = isDark ? "text-slate-50" : "text-gray-900";

  const inputClass =
    "w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all text-sm " +
    (isDark
      ? "bg-slate-900/80 border-slate-700 text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
      : "bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent");

  const errorAlertClass =
    "mb-6 p-4 rounded-2xl text-sm flex items-center gap-3 border " +
    (isDark
      ? "bg-rose-950/60 border-rose-700 text-rose-200"
      : "bg-red-50 border-red-200 text-red-700");

  const secondaryButtonClass =
    "mt-6 w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all duration-300 border " +
    (isDark
      ? "bg-slate-900/70 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-500"
      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400");

  const sidebarCardClass =
    "flex items-center gap-4 p-4 rounded-2xl backdrop-blur-sm border " +
    (isDark ? "bg-white/5 border-white/15" : "bg-white/10 border-white/20");

  const mobileFeatureCard =
    "flex flex-col items-center p-3 rounded-2xl backdrop-blur-sm text-xs font-medium " +
    (isDark
      ? "bg-slate-900/70 text-slate-200"
      : "bg-white/50 text-gray-600");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError(
        error.response?.data?.error || "Une erreur est survenue"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==== ÉTAT : email envoyé ====
  if (success) {
    return (
      <div
        className={`min-h-screen flex ${
          isDark ? "text-slate-50" : "text-gray-900"
        }`}
        style={pageBgStyle}
      >
        {/* Sidebar - Desktop */}
        <div
          className="hidden lg:flex lg:w-2/5 p-8 flex-col justify-between"
          style={sidebarStyle}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PrimAzul</h1>
              <p className="text-blue-100 text-sm">
                Making distance disappear
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className={sidebarCardClass}>
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">
                  Sécurité renforcée
                </h3>
                <p className={`${leftTextMuted} text-sm`}>
                  Votre compte est protégé
                </p>
              </div>
            </div>

            <div className={sidebarCardClass}>
              <Sparkles className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">
                  Processus sécurisé
                </h3>
                <p className={`${leftTextMuted} text-sm`}>
                  Réinitialisation en toute sécurité
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/80 text-sm">
              Vérification en cours
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div
          className="flex-1 flex items-center justify-center p-6"
          style={contentBgStyle}
        >
          <div className="w-full max-w-md text-center">
            <div className={mainCardClass}>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-6 bg-gradient-to-br from-green-400 to-green-600">
                <Mail className="w-10 h-10 text-white" />
              </div>

              <h2 className={`text-2xl font-bold mb-4 ${textStrong}`}>
                Email envoyé !
              </h2>
              <p className={`mb-2 ${textMuted}`}>
                Un code de vérification a été envoyé à
              </p>
              <p className={`font-semibold mb-6 ${textStrong}`}>
                {email}
              </p>
              <p className={`text-sm ${textMuted}`}>
                Redirection en cours...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==== ÉTAT : formulaire ====
  return (
    <div
      className={`min-h-screen flex ${
        isDark ? "text-slate-50" : "text-gray-900"
      }`}
      style={pageBgStyle}
    >
      {/* Sidebar - Desktop */}
      <div
        className="hidden lg:flex lg:w-2/5 p-8 flex-col justify-between"
        style={sidebarStyle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">PrimAzul</h1>
            <p className="text-blue-100 text-sm">
              Making distance disappear
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className={sidebarCardClass}>
            <KeyRound className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Réinitialisation sécurisée
              </h3>
              <p className={`${leftTextMuted} text-sm`}>
                Code de vérification requis
              </p>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Protection du compte
              </h3>
              <p className={`${leftTextMuted} text-sm`}>
                Vos données en sécurité
              </p>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <Sparkles className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Processus rapide
              </h3>
              <p className={`${leftTextMuted} text-sm`}>
                Retrouvez l&apos;accès en quelques minutes
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white/80 text-sm">
            Sécurisez votre compte
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex items-center justify-center p-6"
        style={contentBgStyle}
      >
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className={`text-2xl font-bold ${textStrong}`}>
                  PrimAzul
                </h1>
                <p className={`text-sm ${textMuted}`}>
                  Making distance disappear
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className={mainCardClass}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4 bg-gradient-to-br from-blue-500 to-blue-600">
                <KeyRound className="w-8 h-8 text-white" />
              </div>

              <h2 className={`text-3xl font-bold mb-2 ${textStrong}`}>
                Mot de passe oublié ?
              </h2>
              <p className={textMuted}>
                Pas de problème, on va arranger ça !
              </p>
            </div>

            {error && (
              <div className={errorAlertClass}>
                <div className="w-2 h-2 rounded-full bg-current" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDark ? "text-slate-200" : "text-gray-700"
                  }`}
                >
                  Adresse email
                </label>
                <div className="relative">
                  <Mail
                    className={
                      "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 " +
                      (isDark ? "text-slate-500" : "text-gray-400")
                    }
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="votre@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <p className={`text-sm mt-2 ${textMuted}`}>
                  Entrez votre email pour recevoir un code de
                  réinitialisation
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mail className="w-5 h-5" />
                    Envoyer le code
                  </span>
                )}
              </button>
            </form>

            {/* Retour à la connexion */}
            <Link href="/login" className={secondaryButtonClass}>
              <ArrowLeft className="w-5 h-5" />
              Retour à la connexion
            </Link>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 grid grid-cols-3 gap-4 text-center">
            <div className={mobileFeatureCard}>
              <KeyRound className="w-5 h-5 mb-1 text-blue-500" />
              <span>Sécurisé</span>
            </div>
            <div className={mobileFeatureCard}>
              <Shield className="w-5 h-5 mb-1 text-green-500" />
              <span>Protégé</span>
            </div>
            <div className={mobileFeatureCard}>
              <Zap className="w-5 h-5 mb-1 text-yellow-500" />
              <span>Rapide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}