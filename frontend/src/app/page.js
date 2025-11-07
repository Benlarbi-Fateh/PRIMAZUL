'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Sidebar from '@/components/Layout/Sidebar';
import MobileHeader from '@/components/Layout/MobileHeader';
import { useSocket } from '@/hooks/useSocket';
import { MessageCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  // Initialiser le socket
  useSocket();

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Zone centrale - Message de bienvenue */}
        <div className="flex-1 flex flex-col">
          <MobileHeader />
          
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full mb-6">
                <MessageCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Bienvenue sur WhatsApp Clone
              </h2>
              <p className="text-gray-600 mb-6">
                Sélectionnez une conversation dans la liste ou créez-en une nouvelle pour commencer à discuter
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-left p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Messages instantanés</p>
                    <p className="text-sm text-gray-500">Envoyez et recevez des messages en temps réel</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-2xl">📁</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Partage de fichiers</p>
                    <p className="text-sm text-gray-500">Partagez images, documents et plus</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left p-4 bg-white rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Interface moderne</p>
                    <p className="text-sm text-gray-500">Design élégant et intuitif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}