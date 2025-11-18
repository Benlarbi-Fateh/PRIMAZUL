'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar';
import MobileHeader from '@/components/Layout/MobileHeader';
import { useSocket } from '@/hooks/useSocket';
import { MessageCircle, Send, Folder, Sparkles, Users, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  // Initialiser le socket
  useSocket();

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Responsive */}
        <div className="w-full lg:w-96">
          <Sidebar />
        </div>

        {/* Zone centrale - Complètement responsive */}
        <div className="hidden lg:flex flex-1 flex-col min-h-0">
          <MobileHeader />
          
          {/* Contenu responsive qui s'adapte au zoom */}
          <div 
            className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #dbeafe, #ffffff, #ecfeff)'
            }}
          >
            <div className="text-center w-full max-w-6xl h-full flex flex-col justify-center">
              
              {/* En-tête responsive */}
              <div className="mb-4 lg:mb-6 xl:mb-8">
                <div className="relative inline-block mb-3 lg:mb-4 xl:mb-6">
                  <div className="absolute inset-0 bg-blue-300 rounded-full blur-sm lg:blur-md xl:blur-lg opacity-30"></div>
                  <div 
                    className="relative rounded-full p-4 lg:p-5 xl:p-6 inline-block shadow-lg lg:shadow-xl xl:shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #06b6d4)'
                    }}
                  >
                    <MessageCircle className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 text-white" />
                  </div>
                </div>

                <h2 
                  className="text-2xl lg:text-3xl xl:text-4xl font-bold bg-clip-text text-transparent mb-2 lg:mb-3 xl:mb-4"
                  style={{
                    background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Bienvenue sur PrimAzul
                </h2>
                
                <p className="text-slate-600 text-sm lg:text-base xl:text-lg font-medium px-4">
                  Sélectionnez une conversation ou créez-en une nouvelle pour commencer
                </p>
              </div>

              {/* Grille responsive qui s'adapte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 xl:gap-6 max-w-4xl xl:max-w-5xl mx-auto mb-4 lg:mb-6 xl:mb-8 px-2">
                
                {/* Messages instantanés */}
                <div className="bg-white rounded-lg lg:rounded-xl p-3 lg:p-4 xl:p-5 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-blue-100 hover:border-blue-200">
                  <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                    <div 
                      className="p-2 lg:p-3 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
                      }}
                    >
                      <Send className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-blue-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm lg:text-base xl:text-lg mb-1">
                        Messages instantanés
                      </h3>
                      <p className="text-slate-600 text-xs lg:text-sm xl:text-base truncate">
                        Discutez en temps réel avec une interface fluide
                      </p>
                    </div>
                  </div>
                </div>

                {/* Partage multimédia */}
                <div className="bg-white rounded-lg lg:rounded-xl p-3 lg:p-4 xl:p-5 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-blue-100 hover:border-blue-200">
                  <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                    <div 
                      className="p-2 lg:p-3 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)'
                      }}
                    >
                      <Folder className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-cyan-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm lg:text-base xl:text-lg mb-1">
                        Partage multimédia
                      </h3>
                      <p className="text-slate-600 text-xs lg:text-sm xl:text-base truncate">
                        Partagez images, documents et messages vocaux
                      </p>
                    </div>
                  </div>
                </div>

                {/* Groupes et contacts */}
                <div className="bg-white rounded-lg lg:rounded-xl p-3 lg:p-4 xl:p-5 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-blue-100 hover:border-blue-200">
                  <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                    <div 
                      className="p-2 lg:p-3 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)'
                      }}
                    >
                      <Users className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-indigo-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm lg:text-base xl:text-lg mb-1">
                        Groupes et contacts
                      </h3>
                      <p className="text-slate-600 text-xs lg:text-sm xl:text-base truncate">
                        Créez des groupes et gérez vos contacts
                      </p>
                    </div>
                  </div>
                </div>

                {/* Design élégant */}
                <div className="bg-white rounded-lg lg:rounded-xl p-3 lg:p-4 xl:p-5 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-blue-100 hover:border-blue-200">
                  <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                    <div 
                      className="p-2 lg:p-3 rounded-lg group-hover:scale-105 transition-transform duration-300 shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #fef7ff, #fce7f3)'
                      }}
                    >
                      <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-pink-600" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm lg:text-base xl:text-lg mb-1">
                        Design élégant
                      </h3>
                      <p className="text-slate-600 text-xs lg:text-sm xl:text-base truncate">
                        Interface moderne et intuitive
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section espace de messagerie responsive */}
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg lg:rounded-xl p-4 lg:p-5 xl:p-6 border border-blue-200 max-w-sm lg:max-w-md xl:max-w-lg mx-auto mb-3 lg:mb-4 xl:mb-6">
                <h3 className="font-semibold text-slate-800 text-base lg:text-lg xl:text-xl mb-3 lg:mb-4 text-center">
                  Votre espace de messagerie
                </h3>
                
                {/* Indicateurs de statut responsive */}
                <div className="flex justify-center gap-4 lg:gap-6 xl:gap-8 text-xs lg:text-sm xl:text-base text-slate-700">
                  <div className="flex items-center gap-1 lg:gap-2">
                    <div className="w-2 h-2 lg:w-2 lg:h-2 xl:w-3 xl:h-3 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium">Connecté</span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Shield className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-blue-500" />
                    <span className="font-medium">Sécurisé</span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <Zap className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 text-yellow-500" />
                    <span className="font-medium">Rapide</span>
                  </div>
                </div>
              </div>

              {/* Slogan final responsive */}
              <div className="mt-4 lg:mt-6 xl:mt-8">
                <p className="text-slate-500 text-xs lg:text-sm xl:text-base font-medium flex items-center justify-center gap-2 lg:gap-3">
                  <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
                  Making distance disappear
                  <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}