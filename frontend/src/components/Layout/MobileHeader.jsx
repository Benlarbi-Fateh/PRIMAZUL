'use client'

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { ArrowLeft, MoreVertical, Phone, Video, Users } from 'lucide-react'; // 🆕 AJOUT Users
import { formatMessageDate } from '@/utils/dateFormatter';

export default function MobileHeader({ contact, conversation, onBack }) { // 🆕 AJOUT conversation
  const { user } = useContext(AuthContext);
  const router = useRouter();

  // ============================
  // Header pour la page d'accueil
  // ============================
  if (!contact && !conversation) {
    return (
      <div className="lg:hidden relative overflow-hidden bg-linear-to-br from-blue-600 to-cyan-500">
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
                  )}&background=fff&color=0ea5e9&bold=true&size=128`
                }
                alt={user?.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-white/60 shadow-lg object-cover"
              />
            </div>
            <div className="text-white">
              <h2 className="font-bold text-base sm:text-lg drop-shadow-md truncate max-w-[150px] sm:max-w-[200px]">
                {user?.name}
              </h2>
              <p className="text-xs text-blue-50/90 font-medium">En ligne</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🆕 VÉRIFIER SI C'EST UN GROUPE
  const isGroup = conversation?.isGroup || false;
  const displayName = isGroup 
    ? (conversation?.groupName || 'Groupe sans nom')
    : (contact?.name || 'Utilisateur');
  
  const displayImage = isGroup
    ? (conversation?.groupImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation?.groupName || 'Groupe')}&background=6366f1&color=fff&bold=true&size=128`)
    : (contact?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=fff&color=0ea5e9&bold=true&size=128`);

  const participantsCount = isGroup ? (conversation?.participants?.length || 0) : null;

  // ============================
  // Header pour une conversation
  // ============================
  return (
    <div className="lg:hidden relative overflow-hidden bg-linear-to-br from-blue-600 to-cyan-500">
      {/* Lueur douce en haut à droite */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at top right, rgba(255,255,255,0.15), transparent)",
        }}
      ></div>

      <div className="relative p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3">
        {/* Bouton retour + Info contact/groupe */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={onBack || (() => router.push('/'))}
            className="text-white p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Photo de profil ou icône groupe */}
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={displayName}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full ring-2 ring-white/60 shadow-lg object-cover"
              onError={(e) => {
                e.target.src = isGroup
                  ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&bold=true&size=128`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fff&color=0ea5e9&bold=true&size=128`;
              }}
            />
            {/* 🆕 BADGE GROUPE */}
            {isGroup && (
              <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-linear-to-br from-purple-500 to-pink-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
            )}
            {/* Point vert en ligne (seulement pour conversations 1-1) */}
            {!isGroup && contact?.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-[1.5px] border-white shadow-sm">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
            )}
          </div>

          {/* Nom et statut */}
          <div className="text-white flex-1 min-w-0">
            <h2 className="font-bold text-sm sm:text-base drop-shadow-md truncate">
              {displayName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isGroup ? (
                // 🆕 AFFICHAGE POUR LES GROUPES
                <p className="text-xs text-blue-50/90 font-medium truncate">
                  {participantsCount} participant{participantsCount > 1 ? 's' : ''}
                </p>
              ) : (
                // AFFICHAGE POUR LES CONVERSATIONS 1-1
                <>
                  {contact?.isOnline ? (
                    <>
                      <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse shadow-sm shrink-0"></div>
                      <p className="text-xs text-blue-50/90 font-medium truncate">
                        En ligne
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-blue-50/80 truncate">
                      {contact?.lastSeen ? `Vu ${formatMessageDate(contact.lastSeen)}` : 'Hors ligne'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions (Appel / Vidéo / Menu) - 🆕 MASQUER POUR LES GROUPES */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {!isGroup && (
            <>
              <button
                className="text-white p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
                title="Appel audio"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                className="text-white p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
                title="Appel vidéo"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}

          <button
            className="text-white p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"
            title="Plus d'options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
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