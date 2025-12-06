'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar.jsx';
import MobileHeader from '@/components/Layout/MobileHeader';
import { useSocket } from '@/hooks/useSocket';
import { MessageCircle, Send, Folder, Sparkles, Users, Shield, Zap } from 'lucide-react';
import MainSidebar from '@/components/Layout/MainSidebar.client';
import { useTheme } from '@/hooks/useTheme';

export default function HomePage() {
  const router = useRouter();
  useSocket();
  const { isDark } = useTheme();

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen ${isDark ? 'bg-slate-900' : 'bg-linear-to-b from-sky-50 to-slate-50'}`}>
        <MainSidebar />
        
        <div className="flex-1 flex">
          <div className="w-full lg:w-96">
            <Sidebar />
          </div>

          <div className="hidden lg:flex flex-1 flex-col min-h-0">
            <MobileHeader />
            
            <div className={`flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden relative ${
              isDark ? 'bg-slate-900' : 'bg-linear-to-br from-sky-50 to-slate-50'
            }`}>
              <div className="absolute inset-0">
                <div className={`absolute top-20 left-20 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-100/40'}`}></div>
                <div className={`absolute bottom-20 right-20 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-100/30'}`}></div>
                <div className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-cyan-900/10' : 'bg-cyan-100/20'}`}></div>
                
                <div 
                  className={`absolute top-10 right-10 w-32 h-32 border-2 rounded-3xl ${isDark ? 'border-blue-900/10' : 'border-blue-200/20'}`}
                  style={{transform: 'rotate(45deg)'}}
                ></div>
                <div 
                  className={`absolute bottom-10 left-10 w-24 h-24 border-2 rounded-2xl ${isDark ? 'border-indigo-900/10' : 'border-indigo-200/20'}`}
                  style={{transform: 'rotate(12deg)'}}
                ></div>
              </div>

              <div className="text-center w-full max-w-6xl h-full flex flex-col justify-center relative z-10">
                <div className="mb-8">
                  <div className="relative inline-block mb-6">
                    <div className={`absolute inset-0 rounded-full blur-lg opacity-40 ${isDark ? 'bg-blue-800' : 'bg-blue-300'}`}></div>
                    <div 
                      className="relative rounded-2xl p-5 inline-block shadow-xl border"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)'
                      }}
                    >
                      <MessageCircle className="w-14 h-14 text-white" />
                    </div>
                  </div>

                  <h2 
                    className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4"
                    style={{
                      background: isDark 
                        ? 'linear-gradient(to right, #60a5fa, #3b82f6)' 
                        : 'linear-gradient(to right, #1e40af, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Bienvenue sur PrimAzul
                  </h2>
                  
                  <p className={`text-lg font-light px-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Sélectionnez une conversation ou créez-en une nouvelle pour commencer
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8 px-4">
                  <div className={`backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border ${isDark ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500 hover:bg-slate-800' : 'bg-white/80 border-blue-100 hover:border-blue-300 hover:bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        }}
                      >
                        <Send className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          Messages instantanés
                        </h3>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                          Discutez en temps réel avec une interface fluide
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border ${isDark ? 'bg-slate-800/80 border-slate-700 hover:border-cyan-500 hover:bg-slate-800' : 'bg-white/80 border-cyan-100 hover:border-cyan-300 hover:bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #06b6d4, #0891b2)'
                        }}
                      >
                        <Folder className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          Partage multimédia
                        </h3>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                          Partagez images, documents et messages vocaux
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border ${isDark ? 'bg-slate-800/80 border-slate-700 hover:border-indigo-500 hover:bg-slate-800' : 'bg-white/80 border-indigo-100 hover:border-indigo-300 hover:bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                        }}
                      >
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          Groupes et contacts
                        </h3>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                          Créez des groupes et gérez vos contacts
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border ${isDark ? 'bg-slate-800/80 border-slate-700 hover:border-violet-500 hover:bg-slate-800' : 'bg-white/80 border-violet-100 hover:border-violet-300 hover:bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        }}
                      >
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          Design élégant
                        </h3>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                          Interface moderne et intuitive
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`backdrop-blur-sm rounded-2xl p-6 border max-w-md mx-auto mb-6 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-blue-200'}`}>
                  <h3 className={`font-semibold text-xl mb-4 text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Votre espace de messagerie
                  </h3>
                  <div className={`flex justify-center gap-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Connecté</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">Sécurisé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <span className="font-medium">Rapide</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className={`text-lg font-light flex items-center justify-center gap-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    Making distance disappear
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}