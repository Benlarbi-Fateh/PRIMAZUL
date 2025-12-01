'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar.jsx';
import MobileHeader from '@/components/Layout/MobileHeader';
import { useSocket } from '@/hooks/useSocket';
import { MessageCircle, Send, Folder, Sparkles, Users, Shield, Zap } from 'lucide-react';
import MainSidebar from '@/components/Layout/MainSidebar.client';

export default function HomePage() {
  const router = useRouter();
  useSocket();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <MainSidebar />
        
        <div className="flex-1 flex">
          <div className="w-full lg:w-96">
            <Sidebar />
          </div>

          <div className="hidden lg:flex flex-1 flex-col min-h-0">
            <MobileHeader />
            
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden relative">
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom right, #eff6ff, #f8fafc, #ecfeff)'
                }}
              >
                <div className="absolute top-20 left-20 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-100/20 rounded-full blur-3xl"></div>
                
                <div 
                  className="absolute top-10 right-10 w-32 h-32 border-2 border-blue-200/20 rounded-3xl"
                  style={{transform: 'rotate(45deg)'}}
                ></div>
                <div 
                  className="absolute bottom-10 left-10 w-24 h-24 border-2 border-indigo-200/20 rounded-2xl"
                  style={{transform: 'rotate(12deg)'}}
                ></div>
              </div>

              <div className="text-center w-full max-w-6xl h-full flex flex-col justify-center relative z-10">
                <div className="mb-8">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-blue-300 rounded-full blur-lg opacity-40"></div>
                    <div 
                      className="relative rounded-2xl p-5 inline-block shadow-xl border border-blue-100"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)'
                      }}
                    >
                      <MessageCircle className="w-14 h-14 text-white" />
                    </div>
                  </div>

                  <h2 
                    className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4"
                    style={{
                      background: 'linear-gradient(to right, #1e40af, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Bienvenue sur PrimAzul
                  </h2>
                  
                  <p className="text-slate-600 text-lg font-light px-4">
                    Sélectionnez une conversation ou créez-en une nouvelle pour commencer
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-8 px-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-blue-100 hover:border-blue-300 hover:bg-white">
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
                        <h3 className="font-semibold text-slate-800 text-lg mb-1">
                          Messages instantanés
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Discutez en temps réel avec une interface fluide
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-cyan-100 hover:border-cyan-300 hover:bg-white">
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
                        <h3 className="font-semibold text-slate-800 text-lg mb-1">
                          Partage multimédia
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Partagez images, documents et messages vocaux
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-indigo-100 hover:border-indigo-300 hover:bg-white">
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
                        <h3 className="font-semibold text-slate-800 text-lg mb-1">
                          Groupes et contacts
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Créez des groupes et gérez vos contacts
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-violet-100 hover:border-violet-300 hover:bg-white">
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
                        <h3 className="font-semibold text-slate-800 text-lg mb-1">
                          Design élégant
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Interface moderne et intuitive
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200 max-w-md mx-auto mb-6">
                  <h3 className="font-semibold text-slate-800 text-xl mb-4 text-center">
                    Votre espace de messagerie
                  </h3>
                  <div className="flex justify-center gap-6 text-slate-700">
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
                  <p className="text-slate-500 text-lg font-light flex items-center justify-center gap-3">
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