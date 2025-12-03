// frontend/src/app/status/page.js
'use client';

import dynamic from 'next/dynamic';

// Charger le composant uniquement côté client
const StatusContent = dynamic(() => import('./StatusContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Chargement des statuts...</p>
        </div>
      </div>
    </div>
  )
});

export default function StatusPage() {
  return <StatusContent />;
}