'use client'

import { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthProvider';
import { Shield, Lock, Sparkles } from 'lucide-react';

function LoadingScreen() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{background: 'linear-gradient(135deg, #dbeafe, #ffffff, #ecfeff)'}}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="text-center relative z-10">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 animate-spin">
            <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
          
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div 
              className="w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center animate-pulse"
              style={{background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'}}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-ping" />
          <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-blue-400 animate-ping" />
        </div>

        <div className="space-y-3">
          <h2 
            className="text-2xl font-bold animate-pulse"
            style={{
              background: 'linear-gradient(to right, #2563eb, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Vérification en cours...
          </h2>
          
          <div className="flex gap-2 justify-center items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.4s'}}></div>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-blue-100">
            <Lock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">Connexion sécurisée</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (typeof window === 'undefined' || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}