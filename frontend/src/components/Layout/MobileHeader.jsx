'use client'

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import { formatMessageDate } from '@/utils/dateFormatter';

export default function MobileHeader({ contact, onBack }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  // ============================
  // Header pour la page d'accueil
  // ============================
  if (!contact) {
    return (
      <div className="lg:hidden relative overflow-hidden">
        {/* Fond vert dégradé */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom right, #10b981, #059669)",
          }}
        ></div>

        {/* Lueur douce en haut à droite */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent)",
          }}
        ></div>

        <div className="relative p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  user?.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || 'User'
                  )}&background=fff&color=10b981&bold=true&size=128`
                }
                alt={user?.name}
                className="w-11 h-11 rounded-full ring-3 ring-white/50 shadow-lg object-cover"
              />
            </div>
            <div className="text-white">
              <h2 className="font-bold text-lg drop-shadow-md">{user?.name}</h2>
              <p className="text-xs text-green-50/90 font-medium">En ligne</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // Header pour une conversation
  // ============================
  return (
    <div className="lg:hidden relative overflow-hidden">
      {/* Fond vert dégradé */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom right, #10b981, #059669)",
        }}
      ></div>

      {/* Lueur douce en haut à droite */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent)",
        }}
      ></div>

      <div className="relative p-3 flex items-center justify-between gap-2">
        {/* Bouton retour + Info contact */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onBack || (() => router.push('/'))}
            className="text-white p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Photo de profil */}
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                contact.profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  contact.name || 'User'
                )}&background=fff&color=10b981&bold=true&size=128`
              }
              alt={contact.name}
              className="w-11 h-11 rounded-full ring-3 ring-white/50 shadow-lg object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  contact.name || 'User'
                )}&background=fff&color=10b981&bold=true&size=128`;
              }}
            />
            {contact.isOnline && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-lg">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            )}
          </div>

          {/* Nom et statut */}
          <div className="text-white flex-1 min-w-0">
            <h2 className="font-bold text-base drop-shadow-md truncate">
              {contact.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {contact.isOnline ? (
                <>
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse shadow-sm"></div>
                  <p className="text-xs text-green-50/90 font-medium">
                    En ligne
                  </p>
                </>
              ) : (
                <p className="text-xs text-green-50/80 truncate">
                  Vu {formatMessageDate(contact.lastSeen)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions (Appel / Vidéo / Menu) */}
        <div className="flex items-center gap-1">
          <button
            className="text-white p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
            title="Appel audio"
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            className="text-white p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
            title="Appel vidéo"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            className="text-white p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
            title="Plus d'options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ligne de séparation subtile */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
        }}
      ></div>
    </div>
  );
}