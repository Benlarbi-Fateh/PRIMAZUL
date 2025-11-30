"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import VerifyCode from "@/components/Auth/VerifyCode";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  Zap,
  Shield,
  ArrowLeft,
  UserPlus,
  Smartphone,
  Clock,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const { user, login: authLogin } = useContext(AuthContext);
  const router = useRouter();

  // === Thème global ===
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Fond global
  const pageBgStyle = {
    background: isDark
      ? "radial-gradient(circle_at_top,#1d4ed8 0,#020617 55%),radial-gradient(circle_at_bottom,#0f172a 0,#020617 55%)"
      : "linear-gradient(135deg,#eff6ff,#ffffff,#e5e7eb)",
  };

  const sidebarStyle = {
    background: isDark
      ? "linear-gradient(135deg,#1d4ed8,#020617)"
      : "linear-gradient(135deg,#2563eb,#1d4ed8)",
  };

  const contentBgStyle = {
    background: "transparent",
  };

  // Classes dépendantes du thème
  const textStrong = isDark ? "text-slate-50" : "text-gray-900";
  const textMuted = isDark ? "text-slate-400" : "text-gray-600";

  const mainCardClass =
    "backdrop-blur-xl rounded-3xl shadow-[0_22px_65px_rgba(15,23,42,0.6)] border p-5 sm:p-7 lg:p-8 " +
    (isDark
      ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-slate-700 text-slate-50"
      : "bg-white/90 border-white/60 text-gray-900");

  const errorAlertClass =
    "mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm flex items-center gap-3 border " +
    (isDark
      ? "bg-rose-950/60 border-rose-700 text-rose-200"
      : "bg-red-50 border-red-200 text-red-700");

  const inputBase =
    "w-full rounded-xl sm:rounded-2xl outline-none transition-all text-sm sm:text-base px-10 sm:px-12 py-3 sm:py-3.5 border " +
    (isDark
      ? "bg-slate-900/80 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      : "bg-white/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600");

  const sidebarCardClass =
    "flex items-center gap-4 p-4 rounded-2xl backdrop-blur-sm border " +
    (isDark ? "bg-white/5 border-white/15" : "bg-white/10 border-white/20");

  const mobileFeatureCard =
    "flex flex-col items-center p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-sm text-xs font-medium " +
    (isDark
      ? "bg-slate-900/80 text-slate-200"
      : "bg-white/60 text-gray-600");

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.requiresVerification) {
        setUserId(response.data.userId);
        setUserEmail(response.data.email);
        setShowVerification(true);
      } else {
        authLogin(response.data.token, response.data.user);
        router.push("/");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code) => {
    const response = await api.post("/auth/verify-login", { userId, code });
    if (response.data.token) {
      authLogin(response.data.token, response.data.user);
      router.push("/");
    }
  };

  const handleResendCode = async () => {
    await api.post("/auth/resend-code", { email: userEmail });
  };

  const handleBack = () => {
    setShowVerification(false);
    setUserId(null);
    setUserEmail("");
    setPassword("");
  };

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row ${
        isDark ? "text-slate-50" : "text-gray-900"
      }`}
      style={pageBgStyle}
    >
      {/* Sidebar Desktop */}
      <div
        className="hidden lg:flex lg:w-2/5 p-8 flex-col justify-between relative overflow-hidden"
        style={sidebarStyle}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.15)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2)_0,_transparent_55%)] opacity-70" />

        <div className="relative z-10 mt-20 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4 border border-white/30 shadow-lg shadow-slate-900/40">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-1">PrimAzul</h1>
          <p className="text-blue-100 text-sm">Making distance disappear</p>
        </div>

        <div className="space-y-5 relative z-10">
          <div className={sidebarCardClass}>
            <Smartphone className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Messages instantanés
              </h3>
              <p className="text-blue-100 text-sm">
                Discutez en temps réel
              </p>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Sécurité renforcée
              </h3>
              <p className="text-blue-100 text-sm">
                2FA après 24h d&apos;inactivité
              </p>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <Clock className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Connexion rapide
              </h3>
              <p className="text-blue-100 text-sm">
                Accès direct si actif récemment
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center">
          <p className="text-white/80 text-sm">
            Rejoignez la conversation
          </p>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8"
        style={contentBgStyle}
      >
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className={`text-xl sm:text-2xl font-semibold ${textStrong}`}>
                  PrimAzul
                </h1>
                <p className={`text-xs sm:text-sm ${textMuted}`}>
                  Making distance disappear
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className={mainCardClass}>
            {showVerification ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={handleBack}
                    className={
                      "p-2 rounded-xl transition-all " +
                      (isDark
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-gray-600 hover:bg-blue-50")
                    }
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2
                      className={`text-xl sm:text-2xl font-semibold ${textStrong}`}
                    >
                      Vérification de sécurité
                    </h2>
                    <p className={`text-sm mt-1 ${textMuted}`}>
                      🔐 Sécurité activée après 24h d&apos;inactivité
                    </p>
                  </div>
                </div>

                <VerifyCode
                  email={userEmail}
                  userId={userId}
                  type="login"
                  onVerify={handleVerifyCode}
                  onResend={handleResendCode}
                  onBack={handleBack}
                />
              </div>
            ) : (
              <>
                <div className="text-center mb-6 sm:mb-8">
                  <h2
                    className={`text-2xl sm:text-3xl font-semibold mb-2 ${textStrong}`}
                  >
                    Content de vous revoir
                  </h2>
                  <p className={`text-sm sm:text-base ${textMuted}`}>
                    Connectez-vous à votre compte
                    <span className="block text-xs mt-1 text-blue-500">
                      ⚡ Connexion directe si actif récemment
                    </span>
                  </p>
                </div>

                {error && (
                  <div className={errorAlertClass}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Email */}
                  <div>
                    <label
                      className={
                        "block text-sm font-medium mb-2 " +
                        (isDark ? "text-slate-200" : "text-gray-700")
                      }
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        className={
                          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 " +
                          (isDark ? "text-slate-500" : "text-gray-400")
                        }
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputBase}
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label
                      className={
                        "block text-sm font-medium mb-2 " +
                        (isDark ? "text-slate-200" : "text-gray-700")
                      }
                    >
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock
                        className={
                          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 " +
                          (isDark ? "text-slate-500" : "text-gray-400")
                        }
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputBase + " pr-10 sm:pr-12"}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={
                          "absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 transition-colors " +
                          (isDark
                            ? "text-slate-400 hover:text-slate-200"
                            : "text-gray-400 hover:text-gray-600")
                        }
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Bouton connexion */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:translate-y-[-1px] active:translate-y-[0px] shadow-lg shadow-blue-500/40 hover:shadow-blue-500/50 text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Connexion...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        Se connecter
                      </span>
                    )}
                  </button>
                </form>

                {/* Lien inscription */}
                <div className="mt-6 sm:mt-8 text-center">
                  <p className={`text-sm sm:text-base ${textMuted}`}>
                    Pas de compte ?{" "}
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-500 transition-all shadow-md shadow-blue-500/40 hover:shadow-blue-500/60 transform hover:translate-y-[-1px]"
                    >
                      <UserPlus className="w-4 h-4" />
                      S&apos;inscrire
                    </Link>
                  </p>
                </div>

                {/* Carte sécurité */}
                <div
                  className={
                    "mt-6 p-4 rounded-xl sm:rounded-2xl border " +
                    (isDark
                      ? "bg-slate-900/85 border-sky-700"
                      : "bg-blue-50 border-blue-200")
                  }
                >
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-500">
                        Sécurité renforcée
                      </p>
                      <p className="text-xs mt-1 text-blue-200 sm:text-blue-700">
                        Un code de vérification sera demandé après 24 heures
                        d&apos;inactivité pour protéger votre compte.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile features */}
          <div className="lg:hidden mt-6 grid grid-cols-3 gap-3 text-center">
            <div className={mobileFeatureCard}>
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-green-500" />
              <span>Sécurisé</span>
            </div>
            <div className={mobileFeatureCard}>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-yellow-500" />
              <span>Rapide</span>
            </div>
            <div className={mobileFeatureCard}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-blue-500" />
              <span>24h 2FA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}