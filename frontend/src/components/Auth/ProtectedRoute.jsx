'use client'

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { Shield, Lock, Sparkles } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);

  // Désactiver complètement le SSR - version corrigée
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isClient && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, isClient]);

  // Pendant le SSR ou avant le montage client → retourner vide
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Contenu vide pendant SSR */}
      </div>
    );
  }

  // Écran de chargement moderne (uniquement côté client)
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #dbeafe, #ffffff, #ecfeff)'
        }}
      >
        {/* Background animé */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-500"></div>
        </div>

        {/* Contenu du loader */}
        <div className="text-center relative z-10 animate-fade-in">
          {/* Icône centrale avec animation */}
          <div className="relative inline-block mb-8">
            {/* Cercle tournant externe */}
            <div className="absolute inset-0 animate-spin">
              <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
            
            {/* Cercle tournant interne (inverse) */}
            <div className="absolute inset-2 animate-spin-reverse">
              <div className="w-20 h-20 border-4 border-cyan-200 border-b-cyan-500 rounded-full"></div>
            </div>

            {/* Icône centrale */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div 
                className="w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                }}
              >
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Particules flottantes */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-ping" />
            <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-blue-400 animate-ping delay-300" />
          </div>

          {/* Texte */}
          <div className="space-y-3">
            <h2 
              className="text-2xl font-bold text-transparent bg-clip-text animate-pulse"
              style={{
                background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Vérification en cours...
            </h2>
            
            {/* Points animés */}
            <div className="flex gap-2 justify-center items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0s'}}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.2s'}}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.4s'}}></div>
            </div>

            {/* Message sécurisé */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-blue-100">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Connexion sécurisée</span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-8 w-64 h-2 bg-blue-100 rounded-full overflow-hidden mx-auto shadow-inner">
            <div 
              className="h-full rounded-full animate-loading-bar"
              style={{
                background: 'linear-gradient(to right, #3b82f6, #06b6d4, #3b82f6)'
              }}
            ></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
          .animate-spin-reverse {
            animation: spin-reverse 1.5s linear infinite;
          }
          .animate-loading-bar {
            animation: loading-bar 2s ease-in-out infinite;
          }
          .delay-300 {
            animation-delay: 0.3s;
          }
          .delay-500 {
            animation-delay: 0.5s;
          }
          .delay-1000 {
            animation-delay: 1s;
          }
        `}</style>
      </div>
    );
  }

  return user ? children : null;
}