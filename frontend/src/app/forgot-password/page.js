'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Mail, ArrowLeft, KeyRound, Shield, Sparkles } from 'lucide-react';

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
      <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-green-400 to-green-600 rounded-full shadow-2xl animate-bounce-once">
            <Mail className="w-12 h-12 text-white" />
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Email envoyé ! ✅</h2>
            <p className="text-blue-200 mb-2">
              Un code de vérification a été envoyé à
            </p>
            <p className="text-white font-semibold mb-4">{email}</p>
            <p className="text-sm text-blue-300">Redirection en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-blue-400 to-blue-600 rounded-3xl shadow-2xl mb-6">
            <KeyRound className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">
              Mot de passe oublié ?
            </h1>
            <p className="text-blue-200 text-lg">
              Pas de problème, on va arranger ça ! 🔐
            </p>
            <p className="text-blue-100 text-sm">
              Entrez votre email pour recevoir un code de réinitialisation
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
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

            {/* Bouton Envoyer */}
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-linear-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-semibold transition-all duration-500 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-blue-500/25"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {loading ? (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="animate-pulse">Envoi en cours...</span>
                </div>
              ) : (
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Envoyer le code
                </span>
              )}
            </button>
          </form>

          {/* Retour à la connexion */}
          <Link
            href="/login"
            className="mt-6 w-full py-3 bg-blue-900/30 border border-blue-700/50 rounded-2xl text-white font-medium hover:bg-blue-800/50 hover:border-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la connexion
          </Link>
        </div>

        {/* Info sécurité */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-blue-200/70 text-sm">
            <Shield className="w-4 h-4" />
            <span>Vos données sont protégées et sécurisées</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}