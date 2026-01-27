"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/context/AuthProvider";
import api from "@/lib/api";
import Link from "next/link";
import VerifyCode from "@/components/Auth/VerifyCode";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageCircle,
  Sparkles,
  Zap,
  Shield,
  ArrowLeft,
  UserPlus,
  Smartphone,
  Clock,
} from "lucide-react";

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

  useEffect(() => {
    if (user) {
      router.push("/");
    }
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
    } catch (error) {
      setError(error.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code) => {
    try {
      const response = await api.post("/auth/verify-login", { userId, code });
      if (response.data.token) {
        authLogin(response.data.token, response.data.user);
        router.push("/");
      }
    } catch (error) {
      throw error;
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 flex-col justify-between relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

        {/* Glow effects */}
        <div className="absolute top-20 -left-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl"></div>

        {/* Logo */}
        <div className="flex flex-col items-center justify-center text-center relative z-10 mt-16">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4 border border-white/30 shadow-xl">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">PrimAzul</h1>
          <p className="text-blue-100 text-sm">Making distance disappear</p>
        </div>

        {/* Features */}
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Messages instantanés</h3>
              <p className="text-blue-100 text-sm">Discutez en temps réel</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Sécurité renforcée</h3>
              <p className="text-blue-100 text-sm">
                2FA après 24h d&apos;inactivité
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Connexion rapide</h3>
              <p className="text-blue-100 text-sm">
                Accès direct si actif récemment
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center relative z-10">
          <p className="text-white/60 text-sm">
            © 2024 PrimAzul. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  PrimAzul
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Making distance disappear
                </p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/20 p-4 sm:p-6 lg:p-8 transition-all hover:shadow-cyan-500/5 hover:border-slate-600/50">
            {showVerification ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-slate-700/50 rounded-xl transition-all text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Vérification de sécurité
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
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
                  <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/25 mb-4">
                    <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Content de vous revoir
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base">
                    Connectez-vous à votre compte
                  </p>
                  <p className="text-cyan-400 text-xs mt-2 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    Connexion directe si actif récemment
                  </p>
                </div>

                {error && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl text-red-400 text-sm flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>{error}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-slate-700/50 border border-slate-600 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-white placeholder-slate-400 text-sm sm:text-base"
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-slate-700/50 border border-slate-600 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-white placeholder-slate-400 text-sm sm:text-base"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
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
                      className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-400 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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

                <div className="mt-6 sm:mt-8 text-center">
                  <p className="text-slate-400 text-sm sm:text-base">
                    Pas de compte ?{" "}
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-400/25 transform hover:scale-105 text-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      S&apos;inscrire
                    </Link>
                  </p>
                </div>

                {/* Info sécurité */}
                <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl sm:rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-cyan-300">
                        Sécurité renforcée
                      </p>
                      <p className="text-xs text-cyan-400/80 mt-1">
                        Un code de vérification sera demandé après 24 heures
                        d&apos;inactivité pour protéger votre compte.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center text-slate-400 p-2 sm:p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-emerald-400" />
              <span className="text-xs font-medium">Sécurisé</span>
            </div>
            <div className="flex flex-col items-center text-slate-400 p-2 sm:p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-amber-400" />
              <span className="text-xs font-medium">Rapide</span>
            </div>
            <div className="flex flex-col items-center text-slate-400 p-2 sm:p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-cyan-400" />
              <span className="text-xs font-medium">24h 2FA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}