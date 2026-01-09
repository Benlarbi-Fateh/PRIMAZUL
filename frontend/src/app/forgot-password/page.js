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
  CheckCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();

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
      setError(error.response?.data?.error || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Sidebar Desktop */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          <div className="absolute top-20 -left-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl"></div>

          <div className="flex flex-col items-center justify-center text-center relative z-10 mt-20">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4 border border-white/30 shadow-xl">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">PrimAzul</h1>
            <p className="text-emerald-100 text-sm">
              Making distance disappear
            </p>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <CheckCircle className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">Email envoyé !</h3>
                <p className="text-emerald-100 text-sm">
                  Vérifiez votre boîte mail
                </p>
              </div>
            </div>
          </div>

          <div className="text-center relative z-10">
            <p className="text-white/60 text-sm">Redirection en cours...</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-sm sm:max-w-md text-center">
            <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/25 mb-6">
                <Mail className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Email envoyé !
              </h2>
              <p className="text-slate-400 mb-2">
                Un code de vérification a été envoyé à
              </p>
              <p className="text-cyan-400 font-semibold mb-6">{email}</p>
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Redirection en cours...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="absolute top-20 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-20 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center justify-center text-center relative z-10 mt-20">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4 border border-white/30 shadow-xl">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">PrimAzul</h1>
          <p className="text-blue-100 text-sm">Making distance disappear</p>
        </div>

        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <KeyRound className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">
                Réinitialisation sécurisée
              </h3>
              <p className="text-blue-100 text-sm">
                Code de vérification requis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Protection du compte</h3>
              <p className="text-blue-100 text-sm">Vos données en sécurité</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Sparkles className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Processus rapide</h3>
              <p className="text-blue-100 text-sm">
                Retrouvez l&apos;accès en quelques minutes
              </p>
            </div>
          </div>
        </div>

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
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl sm:rounded-3xl shadow-2xl shadow-blue-900/20 p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/25 mb-4">
                <KeyRound className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Mot de passe oublié ?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Pas de problème, on va arranger ça !
              </p>
            </div>

            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl text-red-400 text-sm flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-2xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-white placeholder-slate-400"
                    placeholder="votre@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Entrez votre email pour recevoir un code de réinitialisation
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-400 text-white py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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

            <Link
              href="/login"
              className="mt-6 w-full py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-2xl text-slate-300 hover:text-white font-medium transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à la connexion
            </Link>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center text-slate-400 p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
              <KeyRound className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-xs font-medium">Sécurisé</span>
            </div>
            <div className="flex flex-col items-center text-slate-400 p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
              <Shield className="w-5 h-5 mb-1 text-emerald-400" />
              <span className="text-xs font-medium">Protégé</span>
            </div>
            <div className="flex flex-col items-center text-slate-400 p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
              <Zap className="w-5 h-5 mb-1 text-cyan-400" />
              <span className="text-xs font-medium">Rapide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
