'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, ArrowLeft, KeyRound, Shield, Sparkles, MessageCircle, Zap } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(true);
        // Rediriger vers la page de vérification après 2 secondes
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Sidebar - Version Desktop */}
        <div className="hidden lg:flex lg:w-2/5 bg-linear-to-br from-blue-500 to-blue-700 p-8 flex-col justify-between">
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
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">Sécurité renforcée</h3>
                <p className="text-blue-100 text-sm">Votre compte est protégé</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <Sparkles className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-white font-semibold">Processus sécurisé</h3>
                <p className="text-blue-100 text-sm">Réinitialisation en toute sécurité</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/80 text-sm">Vérification en cours</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 bg-linear-to-br from-blue-50 to-gray-100">
          <div className="w-full max-w-md text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/60 p-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-green-400 to-green-600 rounded-2xl shadow-lg mb-6">
                <Mail className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email envoyé !</h2>
              <p className="text-gray-600 mb-2">
                Un code de vérification a été envoyé à
              </p>
              <p className="text-gray-900 font-semibold mb-6">{email}</p>
              <p className="text-sm text-gray-500">Redirection en cours...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <KeyRound className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-white font-semibold">Réinitialisation sécurisée</h3>
              <p className="text-blue-100 text-sm">Code de vérification requis</p>
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
              <p className="text-blue-100 text-sm">Retrouvez l&apos;accès en quelques minutes</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-white/80 text-sm">Sécurisez votre compte</p>
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
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h2>
              <p className="text-gray-600">Pas de problème, on va arranger ça !</p>
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
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
                    placeholder="votre@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Entrez votre email pour recevoir un code de réinitialisation
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
            <Link
              href="/login"
              className="mt-6 w-full py-3 bg-gray-100 border border-gray-300 rounded-2xl text-gray-700 font-medium hover:bg-gray-200 hover:border-gray-400 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à la connexion
            </Link>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center text-gray-600 p-3 bg-white/50 rounded-2xl backdrop-blur-sm">
              <KeyRound className="w-5 h-5 mb-1 text-blue-500" />
              <span className="text-xs font-medium">Sécurisé</span>
            </div>
            <div className="flex flex-col items-center text-gray-600 p-3 bg-white/50 rounded-2xl backdrop-blur-sm">
              <Shield className="w-5 h-5 mb-1 text-green-500" />
              <span className="text-xs font-medium">Protégé</span>
            </div>
            <div className="flex flex-col items-center text-gray-600 p-3 bg-white/50 rounded-2xl backdrop-blur-sm">
              <Zap className="w-5 h-5 mb-1 text-yellow-500" />
              <span className="text-xs font-medium">Rapide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}