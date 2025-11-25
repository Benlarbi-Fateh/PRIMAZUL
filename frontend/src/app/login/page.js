'use client'

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import VerifyCode from '@/components/Auth/VerifyCode';
import { Mail, Lock, Eye, EyeOff, MessageCircle, Sparkles, Zap, Shield, KeyRound, ArrowLeft, UserPlus, Smartphone, Clock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const { user, login: authLogin } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });

      // 🆕 GÉRER LES DEUX CAS : 2FA requis ou connexion directe
      if (response.data.requiresVerification) {
        // 🔐 2FA requis (inactivité > 24h)
        setUserId(response.data.userId);
        setUserEmail(response.data.email);
        setShowVerification(true);
      } else {
        // ✅ Connexion directe (activité récente)
        authLogin(response.data.token, response.data.user);
        router.push('/');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code) => {
    try {
      const response = await api.post('/auth/verify-login', { userId, code });
      if (response.data.token) {
        authLogin(response.data.token, response.data.user);
        router.push('/');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleResendCode = async () => {
    await api.post('/auth/resend-code', { email: userEmail });
  };

  const handleBack = () => {
    setShowVerification(false);
    setUserId(null);
    setUserEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar - Version Desktop - MÊME BLEU QUE CHATHEADER */}
      <div className="hidden lg:flex lg:w-2/5 bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 p-8 flex-col justify-between relative overflow-hidden">
        {/* Pattern de fond identique au ChatHeader */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        
        {/* Logo centré en haut */}
        <div className="flex flex-col items-center justify-center text-center relative z-10 mt-20">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4 border border-white/30">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">PrimAzul</h1>
          <p className="text-blue-100 text-sm">Making distance disappear</p>
        </div>

        {/* Features centrées */}
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Smartphone className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Messages instantanés</h3>
              <p className="text-blue-100 text-sm">Discutez en temps réel</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Sécurité renforcée</h3>
              <p className="text-blue-100 text-sm">2FA après 24h d&apos;inactivité</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Clock className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Connexion rapide</h3>
              <p className="text-blue-100 text-sm">Accès direct si actif récemment</p>
            </div>
          </div>
        </div>

        {/* Footer centré */}
        <div className="text-center relative z-10">
          <p className="text-white/80 text-sm">Rejoignez la conversation</p>
        </div>
      </div>

      {/* Main Content - RESPONSIVE */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-linear-to-br from-blue-50 to-gray-100">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PrimAzul</h1>
                <p className="text-gray-600 text-xs sm:text-sm">Making distance disappear</p>
              </div>
            </div>
          </div>

          {/* Card - RESPONSIVE */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg border border-white/60 p-4 sm:p-6 lg:p-8">
            {showVerification ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-blue-50 rounded-xl transition-all text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vérification de sécurité</h2>
                    <p className="text-gray-600 text-sm mt-1">
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
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Content de vous revoir</h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Connectez-vous à votre compte
                    <span className="block text-xs text-blue-600 mt-1">
                      ⚡ Connexion directe si actif récemment
                    </span>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl text-red-700 text-sm flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/80 border border-gray-200 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/80 border border-gray-200 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                  <p className="text-gray-600 text-sm sm:text-base">
                    Pas de compte ?{' '}
                    <Link 
                      href="/register" 
                      className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 inline-flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
                    >
                      <UserPlus className="w-4 h-4" />
                      S&apos;inscrire
                    </Link>
                  </p>
                </div>

                {/* Information sur la sécurité */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Sécurité renforcée</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Un code de vérification sera demandé après 24 heures d&apos;inactivité pour protéger votre compte.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center text-gray-600 p-2 sm:p-3 bg-white/50 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-green-500" />
              <span className="text-xs font-medium">Sécurisé</span>
            </div>
            <div className="flex flex-col items-center text-gray-600 p-2 sm:p-3 bg-white/50 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-yellow-500" />
              <span className="text-xs font-medium">Rapide</span>
            </div>
            <div className="flex flex-col items-center text-gray-600 p-2 sm:p-3 bg-white/50 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-blue-500" />
              <span className="text-xs font-medium">24h 2FA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}