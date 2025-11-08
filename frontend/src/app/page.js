'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar';
import MobileHeader from '@/components/Layout/MobileHeader';
import { useSocket } from '@/hooks/useSocket';
import { MessageCircle, Send, Folder, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  // Initialiser le socket
  useSocket();

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar - Responsive */}
        <div className="w-full lg:w-96">
          <Sidebar />
        </div>

        {/* Zone centrale - CACHÉE sur mobile, VISIBLE sur desktop */}
        <div className="hidden lg:flex flex-1 flex-col">
          <MobileHeader />
          
          {/* Contenu de bienvenue avec design moderne */}
          <div className="flex-1 flex items-center justify-center bg-linear-to-br from-blue-50 via-white to-indigo-50 p-8">
            <div className="text-center max-w-2xl">
              {/* Icône principale avec animation */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="relative bg-linear-to-br from-blue-500 to-indigo-600 rounded-full p-8 inline-block shadow-2xl">
                  <MessageCircle className="w-20 h-20 text-white" />
                </div>
              </div>

              {/* Titre avec gradient */}
              <h2 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Bienvenue sur WhatsApp Clone
              </h2>
              
              <p className="text-gray-600 text-lg mb-10">
                Sélectionnez une conversation dans la liste ou créez-en une nouvelle pour commencer à discuter
              </p>

              {/* Cartes de fonctionnalités avec hover effects */}
              <div className="grid gap-4">
                {/* Messages instantanés */}
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="bg-linear-to-br from-blue-100 to-blue-200 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Send className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">Messages instantanés</h3>
                      <p className="text-gray-600 text-sm">Envoyez et recevez des messages en temps réel avec vos contacts</p>
                    </div>
                  </div>
                </div>

                {/* Partage de fichiers */}
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="bg-linear-to-br from-indigo-100 to-indigo-200 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Folder className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">Partage de fichiers</h3>
                      <p className="text-gray-600 text-sm">Partagez facilement images, documents et fichiers multimédias</p>
                    </div>
                  </div>
                </div>

                {/* Interface moderne */}
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="bg-linear-to-br from-purple-100 to-purple-200 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-gray-800 text-lg mb-1">Interface moderne</h3>
                      <p className="text-gray-600 text-sm">Design élégant et intuitif pour une expérience utilisateur optimale</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques ou info supplémentaire */}
              <div className="mt-10 flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>En ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Chiffrement de bout en bout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}