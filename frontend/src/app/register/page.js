'use client'

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { register } from '@/lib/api';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, MessageCircle, Sparkles, Zap, Shield, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  const { user, login } = useContext(AuthContext);
  const router = useRouter();

  // Résoudre l'erreur d'hydratation
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Calculer la force du mot de passe
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    if (password.match(/[^a-zA-Z\d]/)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await register({ name, email, password });
      
      if (response.data.token) {
        login(response.data.token, response.data.user);
        router.push('/');
      } else {
        setError('Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setError(error.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'bg-green-500';
    if (passwordStrength >= 50) return 'bg-yellow-500';
    if (passwordStrength >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return 'Fort';
    if (passwordStrength >= 50) return 'Moyen';
    if (passwordStrength >= 25) return 'Faible';
    return 'Très faible';
  };

  // Ne rendre que sur le client pour éviter l'erreur d'hydratation
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
              <p className="text-lg font-medium">Rejoignez notre communauté</p>
            </div>
            <p className="text-blue-100 text-sm mt-2">Créez votre compte pour commencer à discuter</p>
          </div>
        </div>

        {/* Carte d'inscription */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 hover:shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-400/20 backdrop-blur-sm border border-red-400/30 text-red-200 rounded-xl text-sm flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Nom */}
            <div className="group">
              <label className="block text-sm font-medium text-blue-200 mb-3 ml-1">
                Nom complet
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative bg-blue-900/30 border border-blue-700/50 rounded-2xl transition-all duration-300 group-hover:border-blue-400/50 group-focus-within:border-blue-400">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 transition-colors duration-300 group-hover:text-blue-300" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-white placeholder-blue-200/50 rounded-2xl"
                    placeholder="John Doe"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

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
                    minLength={6}
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
              
              {/* Indicateur de force du mot de passe */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-200">Force du mot de passe</span>
                    <span className={`font-medium ${
                      passwordStrength >= 75 ? 'text-green-400' :
                      passwordStrength >= 50 ? 'text-yellow-400' :
                      passwordStrength >= 25 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-blue-800/50 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Champ Confirmation mot de passe */}
            <div className="group">
              <label className="block text-sm font-medium text-blue-200 mb-3 ml-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative bg-blue-900/30 border border-blue-700/50 rounded-2xl transition-all duration-300 group-hover:border-blue-400/50 group-focus-within:border-blue-400">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400 transition-colors duration-300 group-hover:text-blue-300" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-transparent border-none outline-none text-white placeholder-blue-200/50 rounded-2xl"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Indicateur de correspondance */}
              {confirmPassword && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Les mots de passe correspondent</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-400">Les mots de passe ne correspondent pas</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bouton d'inscription */}
            <button
              type="submit"
              disabled={loading || password !== confirmPassword || password.length < 6}
              className="w-full group relative overflow-hidden bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-500 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-blue-500/25"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {loading ? (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="animate-pulse">Création du compte...</span>
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Créer mon compte
                </span>
              )}
            </button>
          </form>

          {/* Lien de connexion */}
          <div className="mt-8 text-center">
            <p className="text-blue-200/80">
              Déjà un compte ?{' '}
              <Link 
                href="/login" 
                className="text-white font-semibold hover:text-blue-300 transition-all duration-300 hover:underline hover:underline-offset-4"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center text-blue-200/70">
            <Shield className="w-5 h-5 mb-1 text-green-400" />
            <span className="text-xs">Sécurisé</span>
          </div>
          <div className="flex flex-col items-center text-blue-200/70">
            <Zap className="w-5 h-5 mb-1 text-yellow-400" />
            <span className="text-xs">Instantané</span>
          </div>
          <div className="flex flex-col items-center text-blue-200/70">
            <CheckCircle className="w-5 h-5 mb-1 text-blue-400" />
            <span className="text-xs">Gratuit</span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-blue-200/50 mt-8 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" />
          Inscription 100% sécurisée et chiffrée
        </p>
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