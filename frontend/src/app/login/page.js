'use client'

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import VerifyCode from '@/components/Auth/VerifyCode';
import { Mail, Lock, Eye, EyeOff, MessageCircle, Sparkles, Zap, Shield, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // 🆕 États pour la vérification
  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  const { user, login: authLogin } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      
      // 🆕 Si la réponse demande une vérification
      if (response.data.requiresVerification) {
        setUserId(response.data.userId);
        setUserEmail(response.data.email);
        setShowVerification(true);
      } else if (response.data.token) {
        // Connexion directe (ancien système)
        authLogin(response.data.token, response.data.user);
        router.push('/');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError(error.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Vérifier le code
  const handleVerifyCode = async (code) => {
    const response = await api.post('/auth/verify-login', {
      userId,
      code
    });

    if (response.data.token) {
      authLogin(response.data.token, response.data.user);
      router.push('/');
    }
  };

  // 🆕 Renvoyer le code
  const handleResendCode = async () => {
    await api.post('/auth/resend-code', { email: userEmail });
  };

  // 🆕 Retour au formulaire
  const handleBack = () => {
    setShowVerification(false);
    setUserId(null);
    setUserEmail('');
    setPassword('');
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-float">
        <div className="w-6 h-6 bg-blue-400 rounded-full opacity-60"></div>
      </div>
      <div className="absolute bottom-20 right-10 animate-float delay-1000">
        <div className="w-4 h-4 bg-blue-300 rounded-full opacity-60"></div>
      </div>
      <div className="absolute top-1/3 right-20 animate-float delay-500">
        <div className="w-3 h-3 bg-blue-200 rounded-full opacity-60"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header avec animation */}
        {!showVerification && (
          <div className="text-center mb-10">
            <div 
              className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-blue-400 to-blue-600 rounded-3xl shadow-2xl mb-6 transform transition-all duration-500 hover:scale-105 hover:rotate-3"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <MessageCircle className={`w-12 h-12 text-white transition-all duration-500 ${isHovered ? 'scale-110' : ''}`} />
              {isHovered && (
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-ping" />
              )}
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-linear-to-r from-blue-200 to-blue-400 bg-clip-text text-transparent">
                PrimAzul
              </h1>
              <div className="flex items-center justify-center gap-2 text-blue-200">
                <Zap className="w-5 h-5 animate-pulse" />
                <p className="text-lg font-medium">Making distance disappear</p>
              </div>
              <p className="text-blue-100 text-sm mt-2">Connectez-vous pour rejoindre la conversation</p>
            </div>
          </div>
        )}

        {/* Carte principale */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 hover:shadow-2xl">
          {showVerification ? (
            // 🆕 ÉCRAN DE VÉRIFICATION
            <VerifyCode
              email={userEmail}
              userId={userId}
              type="login"
              onVerify={handleVerifyCode}
              onResend={handleResendCode}
              onBack={handleBack}
            />
          ) : (
            // FORMULAIRE DE CONNEXION
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-xl text-sm flex items-center gap-3 animate-shake">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Champ Email */}
                <div className="group">
                  <label className="block text-sm font-medium text-blue-200 mb-3 ml-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <div className="relative bg-blue-900/30 border border-blue-700/50 rounded-2xl transition-all duration-300 group-hover:border-blue-400/50 group-focus-within:border-blue-400">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 transition-colors duration-300 group-hover:text-blue-300" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-white placeholder-blue-200/50 rounded-2xl"
                        placeholder="votre@email.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Champ Mot de passe */}
                <div className="group">
                  <label className="block text-sm font-medium text-blue-200 mb-3 ml-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                    <div className="relative bg-blue-900/30 border border-blue-700/50 rounded-2xl transition-all duration-300 group-hover:border-blue-400/50 group-focus-within:border-blue-400">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 transition-colors duration-300 group-hover:text-blue-300" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-transparent border-none outline-none text-white placeholder-blue-200/50 rounded-2xl"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
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
                </div>

                {/* Bouton de connexion */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative overflow-hidden bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-500 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-blue-500/25"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {loading ? (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="animate-pulse">Connexion en cours...</span>
                    </div>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 animate-pulse" />
                      Se connecter
                    </span>
                  )}
                </button>
              </form>

              {/* 🆕 Mot de passe oublié */}
              <div className="mt-6 text-center">
                <Link 
                  href="/forgot-password" 
                  className="text-blue-200/80 text-sm hover:text-blue-300 transition-all duration-300 hover:underline hover:underline-offset-2 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Lien d'inscription */}
              <div className="mt-6 text-center">
                <p className="text-blue-200/80">
                  Nouveau sur PrimAzul ?{' '}
                  <Link 
                    href="/register" 
                    className="text-white font-semibold hover:text-blue-300 transition-all duration-300 hover:underline hover:underline-offset-4"
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Features & Security */}
        {!showVerification && (
          <>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center text-blue-200/70">
                <Shield className="w-5 h-5 mb-1 text-green-400" />
                <span className="text-xs">Sécurisé</span>
              </div>
              <div className="flex flex-col items-center text-blue-200/70">
                <Zap className="w-5 h-5 mb-1 text-yellow-400" />
                <span className="text-xs">Rapide</span>
              </div>
              <div className="flex flex-col items-center text-blue-200/70">
                <Sparkles className="w-5 h-5 mb-1 text-blue-400" />
                <span className="text-xs">Moderne</span>
              </div>
            </div>

            <p className="text-center text-sm text-blue-200/50 mt-8 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Vos données sont chiffrées de bout en bout
            </p>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}