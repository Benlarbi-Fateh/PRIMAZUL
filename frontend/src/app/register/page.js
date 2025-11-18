'use client'

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import VerifyCode from '@/components/Auth/VerifyCode';
import { Mail, Lock, Eye, EyeOff, User, MessageCircle, Sparkles, Zap, Shield, ArrowLeft, LogIn, Users } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showVerification, setShowVerification] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  const { user, login: authLogin } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/'); // ✅ CHANGÉ : '/chat' → '/'
    }
  }, [user, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (response.data.requiresVerification) {
        setUserId(response.data.userId);
        setUserEmail(response.data.email);
        setShowVerification(true);
      } else if (response.data.token) {
        authLogin(response.data.token, response.data.user);
        router.push('/'); // ✅ CHANGÉ : '/chat' → '/'
      }
    } catch (error) {
      setError(error.response?.data?.error || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code) => {
    try {
      const response = await api.post('/auth/verify-register', { userId, code });
      if (response.data.token) {
        authLogin(response.data.token, response.data.user);
        router.push('/'); // ✅ CHANGÉ : '/chat' → '/'
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
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Version Desktop */}
      <div className="hidden lg:flex lg:w-2/5 bg-linear-to-br from-blue-600 to-blue-800 p-8 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">PrimAzul</h1>
            <p className="text-blue-100 text-sm">Making distance disappear</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Users className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Groupes et contacts</h3>
              <p className="text-blue-100 text-sm">Créez et gérez vos conversations</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Sparkles className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Partage multimédia</h3>
              <p className="text-blue-100 text-sm">Images, documents et messages vocaux</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Votre espace</h3>
              <p className="text-blue-100 text-sm">Connecté, sécurisé, rapide</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white/80 text-sm">Commencez votre aventure</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-linear-to-br from-blue-50 to-gray-100">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900">PrimAzul</h1>
                <p className="text-gray-600 text-sm">Making distance disappear</p>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/60 p-8">
            {showVerification ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-blue-50 rounded-xl transition-all text-gray-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Vérification</h2>
                </div>
                <VerifyCode
                  email={userEmail}
                  userId={userId}
                  type="register"
                  onVerify={handleVerifyCode}
                  onResend={handleResendCode}
                  onBack={handleBack}
                />
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Rejoignez-nous</h2>
                  <p className="text-gray-600">Créez votre compte PrimAzul</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom d&apos;utilisateur
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                        placeholder="Votre pseudo"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
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
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-12 pr-12 py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Création du compte...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Créer mon compte
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    Déjà un compte ?{' '}
                    <Link 
                      href="/login" 
                      className="bg-linear-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 inline-flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <LogIn className="w-4 h-4" />
                      Se connecter
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center text-gray-600 p-3 bg-white/50 rounded-2xl backdrop-blur-sm">
              <Users className="w-5 h-5 mb-1 text-blue-500" />
              <span className="text-xs font-medium">Groupes</span>
            </div>
            <div className="flex flex-col items-center text-gray-600 p-3 bg-white/50 rounded-2xl backdrop-blur-sm">
              <Sparkles className="w-5 h-5 mb-1 text-blue-600" />
              <span className="text-xs font-medium">Multimédia</span>
            </div>
            <div className="flex flex-col items-center text-gray-600 p-3 bg-white/50 rounded-2xl backdrop-blur-sm">
              <Shield className="w-5 h-5 mb-1 text-green-500" />
              <span className="text-xs font-medium">Sécurisé</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}