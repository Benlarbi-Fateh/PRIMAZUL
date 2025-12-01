'use client'

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthProvider';
import { onOnlineUsersUpdate, requestOnlineUsers } from '@/services/socket';
import { ArrowLeft, MoreVertical, Phone, Video, Users, Info } from 'lucide-react';
import { formatMessageDate } from '@/utils/dateFormatter';
import Image from 'next/image';

export default function ChatHeader({ contact, conversation, onBack }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState(new Set());

useEffect(() => {
    if (!user) return;
    const unsubscribe = onOnlineUsersUpdate((userIds) => {
      setOnlineUsers(new Set(userIds));
    });
    requestOnlineUsers();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  // Fonction pour obtenir l'autre participant
  const getOtherParticipant = (conv) => {
    const userId = user?._id || user?.id;
    return conv.participants?.find(p => (p._id || p.id) !== userId);
  };

  // Fonction pour gérer le clic sur la photo
  const handleProfileClick = () => {
    if (!contact && !conversation) {
      router.push('/profile');
    } else if (conversation?.isGroup) {
      // router.push(`/group/${conversation._id}`);
    } else {
      const contactUser = contact || getOtherParticipant(conversation);
      if (contactUser?._id) {
        router.push(`/profile/${contactUser._id}`);
      }
    }
  };

  // Fonction pour obtenir le titre de l'info-bulle
  const getProfileTitle = () => {
    if (!contact && !conversation) return "Voir mon profil";
    if (conversation?.isGroup) return "Voir les détails du groupe";
    return "Voir le profil";
  };

  if (!contact && !conversation) {
    return (
      <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative p-4">
          <div className="flex items-center gap-3">
            {/* VOTRE photo de profil */}
            <div 
              className="relative shrink-0 cursor-pointer group" 
              onClick={handleProfileClick}
              title={getProfileTitle()}
            >
              <div className="w-10 h-10 rounded-xl ring-2 ring-white/50 shadow-lg overflow-hidden group-hover:ring-white/70 transition-all">
                <Image
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3b82f6&color=fff&bold=true`}
                  alt={user?.name || 'Utilisateur'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-blue-700"></div>
            </div>
            <div className="text-white flex-1 min-w-0">
              <h2 className="font-bold text-base drop-shadow truncate">
                {user?.name}
              </h2>
              <p className="text-xs text-blue-100 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                En ligne
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isGroup = conversation?.isGroup || false;
  const displayName = isGroup 
    ? (conversation?.groupName || 'Groupe sans nom')
    : (contact?.name || 'Utilisateur');
  
  const displayImage = isGroup
    ? (conversation?.groupImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation?.groupName || 'Groupe')}&background=6366f1&color=fff&bold=true`)
    : (contact?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}&background=3b82f6&color=fff&bold=true`);

  const participantsCount = isGroup ? (conversation?.participants?.length || 0) : null;
  
  // Vérifier le statut en ligne en temps réel
  const contactIsOnline = !isGroup && contact?._id && isUserOnline(contact._id);

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 shadow-lg">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack || (() => router.push('/'))}
            className="text-white p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Photo du CONTACT ou GROUPE */}
          <div 
            className="relative shrink-0 cursor-pointer group"
            onClick={handleProfileClick}
            title={getProfileTitle()}
          >
            <div className="w-10 h-10 rounded-xl ring-2 ring-white/50 shadow-lg overflow-hidden group-hover:ring-white/70 transition-all">
              <Image
                src={displayImage}
                alt={displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized={true}
                onError={(e) => {
                  e.target.src = isGroup
                    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&bold=true`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&bold=true`;
                }}
              />
            </div>
            {isGroup && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-linear-to-br from-purple-500 to-pink-500 rounded-full border-2 border-blue-700 flex items-center justify-center">
                <Users className="w-2 h-2 text-white" />
              </div>
            )}
            {!isGroup && contactIsOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-blue-700"></div>
            )}
          </div>

          <div className="text-white flex-1 min-w-0">
            <h2 className="font-bold text-base drop-shadow truncate">
              {displayName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {isGroup ? (
                <p className="text-xs text-blue-100 font-medium truncate">
                  {participantsCount} participant{participantsCount > 1 ? 's' : ''}
                </p>
              ) : (
                <>
                  {contactIsOnline ? (
                    <>
                      <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span>
                      <p className="text-xs text-blue-100 font-medium truncate">
                        En ligne
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-blue-100 truncate">
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
                className="text-white p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm"
                title="Appel audio"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                className="text-white p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm"
                title="Appel vidéo"
              >
                <Video className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            className="text-white p-2 hover:bg-white/20 rounded-xl transition-all active:scale-95 backdrop-blur-sm"
            title="Plus d'options"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}