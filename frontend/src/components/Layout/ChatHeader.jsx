'use client'

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { onOnlineUsersUpdate, requestOnlineUsers } from '@/services/socket';
import { ArrowLeft, MoreVertical, Phone, Video, Users } from 'lucide-react';
import { formatMessageDate } from '@/utils/dateFormatter';
import { useAgora } from '@/hooks/useAgora';
import CallModal from '@/components/Call/CallModal';

export default function ChatHeader({ contact, conversation, onBack,onAudioCall,onVideoCall,callStatus }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // 🔥 CORRECTION : Utiliser la nouvelle fonction pour écouter les utilisateurs en ligne
  useEffect(() => {
    if (!user) return;

    // S'abonner aux mises à jour des utilisateurs en ligne
    const unsubscribe = onOnlineUsersUpdate((userIds) => {
      console.log('📡 ChatHeader - Mise à jour utilisateurs en ligne:', userIds);
      setOnlineUsers(new Set(userIds));
    });

    // Demander les utilisateurs en ligne immédiatement
    requestOnlineUsers();

    return () => {
      unsubscribe(); // Nettoyer l'écouteur
    };
  }, [user]);

  // Fonction pour vérifier si un utilisateur est en ligne
  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  if (!contact && !conversation) {
    return (
      <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="absolute inset-0" style={{
          background: "radial-gradient(circle at top right, rgba(6, 182, 212, 0.3), transparent)"
        }}></div>

        <div className="relative p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=fff&color=3b82f6&bold=true&size=128`}
                alt={user?.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-4 ring-white/40 shadow-2xl object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-3 border-white shadow-lg"></div>
            </div>
            <div className="text-white flex-1 min-w-0">
              <h2 className="font-bold text-lg sm:text-xl drop-shadow-lg truncate">
                {user?.name}
              </h2>
              <p className="text-sm text-blue-100 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-lg"></span>
                En ligne
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent"></div>
      </div>
    );
  }

  const isGroup = conversation?.isGroup || false;
  const displayName = isGroup 
    ? (conversation?.groupName || 'Groupe sans nom')
    : (contact?.name || 'Utilisateur');
  
  const displayImage = isGroup
    ? (conversation?.groupImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation?.groupName || 'Groupe')}&background=6366f1&color=fff&bold=true&size=128`)
    : (contact?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=fff&color=3b82f6&bold=true&size=128`);

  const participantsCount = isGroup ? (conversation?.participants?.length || 0) : null;
  
  // Vérifier le statut en ligne en temps réel
  const contactIsOnline = !isGroup && contact?._id && isUserOnline(contact._id);
 // 🔥 AJOUT : Vérifier si un appel est en cours pour désactiver les boutons
  const isCalling = callStatus && callStatus !== 'idle';
  return (
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 shadow-xl">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      
      <div className="absolute inset-0" style={{
        background: "radial-gradient(circle at top right, rgba(6, 182, 212, 0.3), transparent)"
      }}></div>

      <div className="relative p-4 sm:p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack || (() => router.push('/'))}
            className="text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm shrink-0 shadow-md"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt={displayName}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ring-4 ring-white/40 shadow-2xl object-cover"
              onError={(e) => {
                e.target.src = isGroup
                  ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&bold=true&size=128`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fff&color=3b82f6&bold=true&size=128`;
              }}
            />
            {isGroup && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-linear-to-br from-purple-500 to-pink-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <Users className="w-3 h-3 text-white" />
              </div>
            )}
            {contactIsOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-lg">
                <div className="w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75"></div>
              </div>
            )}
          </div>

          <div className="text-white flex-1 min-w-0">
            <h2 className="font-bold text-base sm:text-lg drop-shadow-lg truncate">
              {displayName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {isGroup ? (
                <p className="text-xs sm:text-sm text-blue-100 font-semibold truncate">
                  {participantsCount} participant{participantsCount > 1 ? 's' : ''}
                </p>
              ) : (
                <>
                  {contactIsOnline ? (
                    <>
                      <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-lg shrink-0"></span>
                      <p className="text-xs sm:text-sm text-blue-100 font-semibold truncate">
                        En ligne
                      </p>
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-blue-100 truncate">
                      {contact?.lastSeen ? `Vu ${formatMessageDate(contact.lastSeen)}` : 'Hors ligne'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isGroup && (
            <>
              <button
                onClick={onAudioCall}
                disabled={isCalling}
                className={`text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm shadow-md ${
                  isCalling 
                  ?'bg-gray-400 cursor-not-allowed'
                  :'hover:bg-white/20'
                }`}
                title={isCalling ? 'Appel en cours...' : 'Appel audio'}
              
              >
                <Phone className="w-5 h-5" />
              </button>

              <button
                onClick={onVideoCall}
                disabled={isCalling}
                className={`text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm shadow-md ${
                  isCalling 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'hover:bg-white/20'
                }`}
                title= {isCalling ? 'Appel en cours...' : 'Appel vidéo'}
            
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            className="text-white p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm shadow-md"
            title="Plus d'options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent"></div>
    </div>
  );
}