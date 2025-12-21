"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { 
  Search, ArrowLeft, Mail, Star, CalendarDays, UserPlus, 
  Phone, MessageCircle, Video, Sparkles, X, Check
} from "lucide-react";
import api from "../../lib/api";
import { searchUsers, sendInvitation, getSentInvitations } from "@/lib/api";
import { getSocket, onInvitationCancelled } from "@/services/socket";
import { useTheme } from "@/hooks/useTheme";

/* ---------------- AVATAR ---------------- */
function Avatar({ user, size = "md", showStatus = true }) {
  const { isDark } = useTheme();
  
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const sizes = { sm: "w-12 h-12 text-sm", md: "w-14 h-14 text-base", lg: "w-28 h-28 text-3xl" };
  const statusSizes = { sm: "w-3 h-3", md: "w-3 h-3", lg: "w-4 h-4" };

  return (
    <div className="relative group">
      {user.profilePicture ? (
        <div className={`${sizes[size]} rounded-full overflow-hidden border-2 ${isDark ? 'border-cyan-500/30' : 'border-blue-300'} shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300`}>
          <Image
            src={user.profilePicture}
            alt={user.name}
            width={size === "sm" ? 48 : size === "md" ? 56 : 112}
            height={size === "sm" ? 48 : size === "md" ? 56 : 112}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.name || "User"
              )}&background=${isDark ? '0ea5e9' : '3b82f6'}&color=fff&bold=true`;
            }}
            unoptimized
          />
        </div>
      ) : (
        <div
          className={`${sizes[size]} ${isDark ? 'bg-gradient-to-br from-blue-600 to-cyan-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'} rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 ${isDark ? 'border-cyan-500/30' : 'border-blue-300'} group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 animate-glow-pulse`}
        >
          {getInitials(user.name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-1 right-1 ${statusSizes[size]} rounded-full border-2 ${isDark ? "border-blue-900" : "border-white"} ${user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-gray-400"} shadow-lg`}
        />
      )}
    </div>
  );
}

/* ---------------- FAVORITES BAR ---------------- */
function FavoritesBar({ contacts, favoriteIds, setSelected, searchTerm }) {
  const { isDark } = useTheme();
  
  const favorites = contacts.filter(
    (c) => favoriteIds.has(c.user?._id) && c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (favorites.length === 0) return null;

  return (
    <div className="mb-6 max-w-2xl mx-auto">
      <h2 className={`font-bold text-lg mb-3 flex items-center gap-2 ${isDark ? "text-cyan-50" : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500"}`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-blue-700 to-cyan-700' : 'bg-gradient-to-br from-purple-500 to-pink-500'} shadow-lg animate-glow-pulse`}>
          <Star className="w-4 h-4 text-white" />
        </div>
        Favoris
      </h2>
      <div className={`flex gap-4 overflow-x-auto p-4 rounded-3xl border-2 shadow-xl hover:shadow-2xl transition-all ${isDark ? "bg-blue-900/50 border-blue-800" : "bg-white/80 border-blue-100"} backdrop-blur-md`}>
        {favorites.map((contact) => (
          <div
            key={contact._id}
            className={`flex flex-col items-center cursor-pointer transition-all transform hover:scale-110 active:scale-95 rounded-2xl p-3 min-w-[80px] ${isDark ? "hover:bg-blue-800/50" : "hover:bg-blue-50"} animate-float`}
            style={{ animationDelay: `${Math.random() * 2}s` }}
            onClick={() => setSelected(contact)}
          >
            <Avatar user={contact.user} size="sm" showStatus={true} />
            <p className={`text-xs font-medium truncate max-w-[60px] text-center mt-2 ${isDark ? "text-blue-200" : "text-blue-700"}`}>
              {contact.user.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* CONTACT DETAILS */
function ContactDetails({ contact, toggleFavorite, favoriteIds, onBack }) {
  const { isDark } = useTheme();
  const user = contact.user;
  const isFav = favoriteIds.has(user._id);

  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-br from-blue-50 via-white to-cyan-50";

  const cardBg = isDark
    ? "bg-blue-900/80 backdrop-blur-xl border-blue-800"
    : "bg-white/80 backdrop-blur-xl border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";
  const textMuted = isDark ? "text-blue-400" : "text-blue-400";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white shadow-2xl hover:shadow-blue-500/50";

  const actionButtonStyle = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-100"
    : "bg-blue-100 hover:bg-blue-200 text-blue-800";

  return (
    <div className={`min-h-screen ${pageBg} relative overflow-hidden p-4`}>
      {/* Background décoratif */}
      {!isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
      )}

      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className={`p-3 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 shadow-md ${isDark ? "bg-blue-800 hover:bg-blue-700 border-blue-700" : "bg-white hover:bg-blue-50 border-blue-100 hover:border-blue-300"}`}
            >
              <ArrowLeft className={`w-6 h-6 ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-cyan-50' : 'text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500'}`}>
                Détails du contact
              </h1>
              <p className={`text-sm flex items-center gap-1 ${textSecondary}`}>
                <Sparkles className="w-3 h-3" />
                Informations complètes
              </p>
            </div>
          </div>
        </div>

        {/* Carte principale */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl border-2 hover:shadow-2xl transition-all ${cardBg}`}>
          {/* Favorite button */}
          <button 
            onClick={() => toggleFavorite(user._id)} 
            className="absolute top-6 right-6 transform hover:scale-110 transition-transform"
          >
            <Star
              size={30}
              className={`transition-all ${isFav 
                ? "text-yellow-400 fill-yellow-400 drop-shadow-lg" 
                : isDark 
                  ? "text-blue-400 hover:text-yellow-400" 
                  : "text-blue-300 hover:text-yellow-400"
              }`}
            />
          </button>

          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center mb-8">
            <Avatar user={user} size="lg" showStatus={true} />
            <h1 className={`text-2xl font-bold mt-6 ${textPrimary}`}>{user.name}</h1>
            <p className={`mt-2 ${textSecondary}`}>
              {user.status || "Aucun statut défini"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-4 mb-8">
  <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all transform hover:scale-110 active:scale-95 group ${actionButtonStyle} shadow-lg hover:shadow-xl`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-700 group-hover:bg-cyan-600' : 'bg-blue-200 group-hover:bg-blue-300'} transition-colors`}>
      <Phone size={22} className="group-hover:animate-bounce" />
    </div>
    <span className="text-xs font-semibold">Appeler</span>
  </button>
  <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all transform hover:scale-110 active:scale-95 group ${actionButtonStyle} shadow-lg hover:shadow-xl`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-700 group-hover:bg-cyan-600' : 'bg-blue-200 group-hover:bg-blue-300'} transition-colors`}>
      <MessageCircle size={22} className="group-hover:animate-bounce" />
    </div>
    <span className="text-xs font-semibold">Message</span>
  </button>
  <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all transform hover:scale-110 active:scale-95 group ${actionButtonStyle} shadow-lg hover:shadow-xl`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-700 group-hover:bg-cyan-600' : 'bg-blue-200 group-hover:bg-blue-300'} transition-colors`}>
      <Video size={22} className="group-hover:animate-bounce" />
    </div>
    <span className="text-xs font-semibold">Vidéo</span>
  </button>
</div>

          {/* Informations */}
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-blue-800/50 border-blue-700" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-700" : "bg-blue-100"}`}>
                  <Mail className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-blue-600"}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${textSecondary}`}>Adresse email</p>
                  <p className={`font-bold ${textPrimary}`}>{user.email}</p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border-2 ${isDark ? "bg-purple-900/30 border-purple-800" : "bg-purple-50 border-purple-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-purple-800" : "bg-purple-100"}`}>
                  <CalendarDays className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${textSecondary}`}>Ajouté le</p>
                  <p className={`font-bold ${textPrimary}`}>
                    {new Date(contact.addedAt).toLocaleDateString("fr-FR", {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton message */}
          <button className={`w-full mt-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 ${buttonStyle}`}>
            <MessageCircle className="w-5 h-5" />
            Envoyer un message
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADD CONTACT TAB ---------------- */
function AddContactTab({ contactIds }) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState(null);
  const [sentInvitations, setSentInvitations] = useState(new Set());
  const searchTimeoutRef = useRef(null);

  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-br from-blue-50 via-white to-cyan-50";

  const cardBg = isDark
    ? "bg-blue-900/80 backdrop-blur-xl border-blue-800"
    : "bg-white/80 backdrop-blur-xl border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";
  const textMuted = isDark ? "text-blue-400" : "text-blue-400";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700 focus:ring-cyan-500 focus:border-cyan-400"
    : "bg-white border-blue-200 focus:ring-blue-300 focus:border-blue-400";

  const inputText = isDark ? "text-blue-100 placeholder-blue-400" : "text-blue-900 placeholder-blue-400";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white shadow-2xl hover:shadow-blue-500/50";

  // APRÈS (avec filtrage des bloqués)
useEffect(() => {
  if (!searchQuery.trim()) return;
  clearTimeout(searchTimeoutRef.current);

  const performSearch = async () => {
    try {
      setSearching(true);
      
      // ✅ 1. Charger les utilisateurs bloqués
      let blockedIds = new Set();
      try {
        const blockedResponse = await api.get('/message-settings/blocked');
        const blockedUsers = blockedResponse.data.blockedUsers || [];
        blockedIds = new Set(blockedUsers.map(u => u._id.toString()));
      } catch (err) {
        console.error('Erreur chargement bloqués:', err);
      }
      
      // ✅ 2. Rechercher les utilisateurs
      const response = await searchUsers(searchQuery);
      
      // ✅ 3. Filtrer : exclure contacts existants ET bloqués
      const filteredUsers = (response.data.users || []).filter((user) => {
        const isContact = contactIds.has(user._id);
        const isBlocked = blockedIds.has(user._id.toString());
        
        if (isBlocked) {
          console.log(`⚠️ Utilisateur ${user.name} exclu (bloqué)`);
        }
        
        return !isContact && !isBlocked;
      });
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  searchTimeoutRef.current = setTimeout(performSearch, 500);
  return () => clearTimeout(searchTimeoutRef.current);
}, [searchQuery, contactIds]);

  useEffect(() => {
    const fetchSentInvitations = async () => {
      try {
        const response = await getSentInvitations();
        const sentUserIds = (response.data.invitations || []).map((inv) => inv.receiver._id);
        setSentInvitations(new Set(sentUserIds));
      } catch (error) {
        console.error(error);
      }
    };
    fetchSentInvitations();
  }, []);

  useEffect(() => {
    const handleCancelled = (data) => {
      setSentInvitations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.receiverId);
        return newSet;
      });
    };
    onInvitationCancelled(handleCancelled);
    return () => {
      const socket = getSocket();
      if (socket) socket.off("invitation-cancelled", handleCancelled);
    };
  }, []);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (!value.trim()) setSearchResults([]);
  };

  const handleSendInvitation = async (userId) => {
    setSendingTo(userId);
    try {
      await sendInvitation({ receiverId: userId });
      setSentInvitations((prev) => new Set([...prev, userId]));
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className={`min-h-screen ${pageBg} p-4`}>
      {/* Background décoratif */}
      {!isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
      )}

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-cyan-50' : 'text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500'}`}>
              Ajouter un contact
            </h1>
          </div>
          <p className={`flex items-center gap-2 ${textSecondary}`}>
            <Sparkles className="w-4 h-4" />
            Recherchez et invitez de nouvelles personnes
          </p>
        </div>

        {/* Search Bar */}
        <div className={`sticky top-0 z-40 pb-2 ${isDark ? "bg-linear-to-b from-blue-950 to-transparent" : "bg-linear-to-b from-white/80 to-transparent backdrop-blur-sm"}`}>
          <div className="relative group">
            {!isDark && (
              <div className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-sm group-focus-within:blur-md transition-all"></div>
            )}
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${isDark ? "text-blue-400" : "text-blue-400"}`} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`relative w-full pl-12 pr-10 py-4 rounded-2xl border-2 focus:ring-4 outline-none font-medium transition-all ${inputBg} ${inputText}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 ${isDark ? "text-blue-400 hover:text-cyan-300" : "text-blue-400 hover:text-blue-600"}`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {searchResults.length > 0 && (
            <div className={`rounded-3xl p-6 shadow-xl border-2 animate-scale-in ${cardBg}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${textPrimary}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-linear-to-br from-blue-700 to-cyan-700' : 'bg-linear-to-br from-purple-500 to-pink-500'}`}>
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                Résultats ({searchResults.length})
              </h3>
              <ul className="space-y-3">
                {searchResults.map((user) => {
                  const isInvitationSent = sentInvitations.has(user._id);
                  return (
                    <li
                      key={user._id}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${isDark ? "hover:bg-blue-800/50 border-blue-800" : "hover:bg-blue-50 border-blue-200"}`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Avatar user={user} size="md" showStatus={false} />
                        <div className="ml-4 min-w-0 flex-1">
                          <p className={`font-bold truncate ${textPrimary}`}>
                            {user.name}
                          </p>
                          <p className={`text-sm truncate ${textMuted}`}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendInvitation(user._id)}
                        disabled={sendingTo === user._id || isInvitationSent}
                        className={`ml-3 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyle}`}
                      >
                        {sendingTo === user._id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Envoi...
                          </div>
                        ) : isInvitationSent ? (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Envoyé
                          </div>
                        ) : (
                          "Inviter"
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className={`text-center py-12 rounded-3xl border-2 ${cardBg}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-blue-800" : "bg-blue-100"}`}>
                <Search className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-blue-400"}`} />
              </div>
              <p className={`font-bold ${textPrimary}`}>Aucun utilisateur trouvé</p>
              <p className={`text-sm mt-2 ${textMuted}`}>Essayez avec un autre nom ou email</p>
            </div>
          )}

          {searchQuery.length < 2 && !searching && (
            <div className={`text-center py-12 rounded-3xl border-2 ${cardBg}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-linear-to-br from-blue-800 to-cyan-800" : "bg-linear-to-br from-blue-100 to-cyan-100"}`}>
                <UserPlus className={`w-8 h-8 ${isDark ? "text-cyan-400" : "text-blue-500"}`} />
              </div>
              <p className={`font-bold ${textPrimary}`}>Commencez à taper...</p>
              <p className={`text-sm mt-2 ${textMuted}`}>Recherchez des utilisateurs par nom ou email</p>
            </div>
          )}

          {searching && (
            <div className={`text-center py-12 rounded-3xl border-2 ${cardBg}`}>
              <div className="inline-flex items-center gap-3">
                <div className={`w-6 h-6 border-3 rounded-full animate-spin ${isDark ? "border-cyan-500 border-t-transparent" : "border-blue-500 border-t-transparent"}`}></div>
                <span className={`font-medium ${textSecondary}`}>Recherche en cours...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- MAIN CONTACTS PAGE ---------------- */
export default function ContactsPage() {
  const { isDark } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("contacts");
  const [contactIds, setContactIds] = useState(new Set());
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState(new Set());


  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-br from-blue-50 via-white to-cyan-50";

  const cardBg = isDark
    ? "bg-blue-900/80 backdrop-blur-xl border-blue-800"
    : "bg-white/80 backdrop-blur-xl border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";
  const textMuted = isDark ? "text-blue-400" : "text-blue-400";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 hover:from-blue-700 hover:via-blue-800 hover:to-cyan-700 text-white shadow-2xl hover:shadow-blue-500/50";

  const tabButtonActive = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
    : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg";

  const tabButtonInactive = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-300"
    : "bg-white hover:bg-blue-50 text-blue-700";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700 focus:ring-cyan-500 focus:border-cyan-400"
    : "bg-white border-blue-200 focus:ring-blue-300 focus:border-blue-400";

  const inputText = isDark ? "text-blue-100 placeholder-blue-400" : "text-blue-900 placeholder-blue-400";

useEffect(() => {
  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get('/message-settings/blocked');
      const blockedUsers = response.data.blockedUsers || [];
      const blockedIds = new Set(blockedUsers.map(u => u._id.toString()));
      setBlockedUserIds(blockedIds);
      console.log('🚫 Utilisateurs bloqués chargés:', blockedIds.size);
    } catch (error) {
      console.error('❌ Erreur chargement bloqués:', error);
    }
  };
  
  fetchBlockedUsers();
}, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get("/contacts");
        const fetchedContacts = res.data.contacts || [];
        setContacts(fetchedContacts);
        setContactIds(new Set(fetchedContacts.map((c) => c.user?._id).filter(Boolean)));
        setFavoriteIds(new Set(fetchedContacts.filter((c) => c.isFavorite).map((c) => c.user._id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  useEffect(() => {
  const handleBlockChange = async () => {
    try {
      const response = await api.get('/message-settings/blocked');
      const blockedUsers = response.data.blockedUsers || [];
      const blockedIds = new Set(blockedUsers.map(u => u._id.toString()));
      setBlockedUserIds(blockedIds);
      console.log('🔄 Liste bloqués mise à jour');
      
      // ✅ Recharger les contacts pour mettre à jour la liste
      const res = await api.get("/contacts");
      const fetchedContacts = res.data.contacts || [];
      setContacts(fetchedContacts);
      setContactIds(new Set(fetchedContacts.map((c) => c.user?._id).filter(Boolean)));
      setFavoriteIds(new Set(fetchedContacts.filter((c) => c.isFavorite).map((c) => c.user._id)));
    } catch (error) {
      console.error('❌ Erreur rechargement:', error);
    }
  };

  window.addEventListener('block-status-changed', handleBlockChange);
  return () => window.removeEventListener('block-status-changed', handleBlockChange);
}, []);

  const toggleFavorite = async (userId) => {
    const wasFavorite = favoriteIds.has(userId);

    setFavoriteIds((prev) => {
      const newSet = new Set(prev);
      if (wasFavorite) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });

    try {
      await api.put(`/contacts/${userId}/favorite`, { favorite: !wasFavorite });
    } catch (err) {
      console.error(err);
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        if (wasFavorite) newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    }
  };

  const filteredContacts = contacts.filter((c) => {
  if (!c?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
    return false;
  }
  
  // ✅ EXCLURE LES UTILISATEURS BLOQUÉS
  const userId = c.user?._id?.toString();
  const isBlocked = blockedUserIds.has(userId);
  
  if (isBlocked) {
    console.log(`⚠️ Contact ${c.user?.name} exclu (bloqué)`);
  }
  
  return !isBlocked;
});

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${pageBg}`}>
      <div className="text-center">
        <div className={`w-16 h-16 border-4 ${isDark ? "border-cyan-500/40 border-t-cyan-500" : "border-blue-500/40 border-t-blue-500"} rounded-full animate-spin mb-4`} />
        <p className={`font-medium ${textSecondary}`}>Chargement des contacts...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${pageBg} relative overflow-hidden`}>
      {/* Background décoratif */}
      {!isDark && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6 relative z-10">
        
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-cyan-50' : 'text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-cyan-500'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? 'bg-linear-to-br from-blue-700 to-cyan-700' : 'bg-linear-to-br from-purple-500 to-pink-500'}`}>
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            Contacts
          </h1>
          <p className={`mt-1 ml-1 flex items-center gap-2 ${textSecondary}`}>
            <Sparkles className="w-4 h-4" />
            Gérez vos contacts et favorites
          </p>
        </div>

        {/* Tabs */}
        <div className={`sticky top-0 z-50 pb-4 pt-2 ${isDark ? "bg-linear-to-b from-blue-950 to-transparent" : "bg-linear-to-b from-white/80 to-transparent backdrop-blur-sm"}`}>
          <div className="flex gap-3 max-w-lg mx-auto">
            <button
              onClick={() => { setActiveTab("contacts"); setSelected(null); }}
              className={`flex-1 py-3.5 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${activeTab === "contacts" ? tabButtonActive : tabButtonInactive}`}
            >
              Mes Contacts
            </button>
            <button
              onClick={() => { setActiveTab("add"); setSelected(null); }}
              className={`flex-1 py-3.5 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${activeTab === "add" ? tabButtonActive : tabButtonInactive}`}
            >
              <UserPlus className="w-5 h-5" />
              Ajouter
            </button>
          </div>
        </div>

        <div className="mt-4">
          {activeTab === "add" ? (
            <AddContactTab contactIds={contactIds} />
          ) : selected ? (
            <ContactDetails 
              contact={selected} 
              toggleFavorite={toggleFavorite} 
              favoriteIds={favoriteIds} 
              onBack={() => setSelected(null)} 
            />
          ) : (
            <>
              {/* Search Bar */}
              <div className={`sticky top-0 z-40 pb-2 ${isDark ? "bg-gradient-to-b from-blue-950 to-transparent" : "bg-gradient-to-b from-white/80 to-transparent backdrop-blur-sm"}`}>
  <div className="relative group max-w-lg mx-auto">
    {/* Effet de lueur au focus */}
    <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300 ${isDark ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'} opacity-0 group-focus-within:opacity-100`}></div>
    
    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10 transition-colors ${isDark ? "text-blue-400 group-focus-within:text-cyan-400" : "text-blue-400 group-focus-within:text-blue-600"}`} />
    <input
      type="text"
      placeholder="Rechercher un contact..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className={`relative w-full pl-12 pr-10 py-4 rounded-2xl border-2 focus:ring-4 outline-none font-medium transition-all ${inputBg} ${inputText}`}
    />
    {searchTerm && (
      <button
        onClick={() => setSearchTerm('')}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 transform hover:scale-110 hover:rotate-90 transition-all ${isDark ? "text-blue-400 hover:text-cyan-300" : "text-blue-400 hover:text-blue-600"}`}
      >
        <X className="w-5 h-5" />
      </button>
    )}
  </div>
</div>

              {/* Favorites */}
              <FavoritesBar 
                contacts={contacts} 
                favoriteIds={favoriteIds} 
                setSelected={setSelected} 
                searchTerm={searchTerm} 
              />

              {/* Contact List */}
              <div className="max-w-2xl mx-auto">
                <h2 className={`font-bold text-lg mb-3 flex items-center gap-2 ${textPrimary}`}>
                  Tous les contacts ({filteredContacts.length})
                </h2>
                <div className={`rounded-3xl p-6 shadow-xl border-2 animate-slide-in-up ${cardBg}`}>
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className={`font-medium ${textPrimary}`}>Aucun contact trouvé</p>
                      <p className={`text-sm mt-2 ${textMuted}`}>
                        {searchTerm ? "Essayez une autre recherche" : "Vous n'avez pas encore de contacts"}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {filteredContacts.map((contact) => {
                        const user = contact.user;
                        if (!user) return null;
                        const isFav = favoriteIds.has(user._id);

                        return (
                          <li
  key={contact._id}
  className={`contact-card-glow flex items-center justify-between p-4 rounded-2xl border-2 transition-all transform hover:scale-[1.02] cursor-pointer group ${isDark ? "hover:bg-blue-800/50 border-blue-800 hover:border-cyan-600" : "hover:bg-blue-50 border-blue-200 hover:border-blue-400"} backdrop-blur-sm relative`}
  onClick={() => setSelected(contact)}
>
  <div className="flex items-center flex-1 min-w-0 pr-4">
    <div className="relative shrink-0">
      <Avatar user={user} size="md" showStatus={true} />
    </div>
    <div className="ml-4 flex-1 min-w-0">
      <p className={`font-bold text-lg truncate ${textPrimary} group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-cyan-500 transition-all`}>
        {user.name}
      </p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${user.isOnline ? (isDark ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700") : (isDark ? "bg-blue-800/50 text-blue-300" : "bg-blue-100 text-blue-600")} shadow-sm`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></span>
          {user.isOnline ? "En ligne" : "Hors ligne"}
        </span>
        <span className={`text-xs ${textMuted} truncate max-w-[150px]`}>
          {user.email}
        </span>
      </div>
    </div>
  </div>

  {/* Bouton étoile - repositionné avec meilleure visibilité */}
  <button 
    onClick={(e) => { 
      e.stopPropagation(); 
      toggleFavorite(user._id); 
    }}
    className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-125 hover:rotate-12 z-10 ${
      isFav 
        ? (isDark 
          ? 'bg-yellow-500/20 hover:bg-yellow-500/30' 
          : 'bg-yellow-50 hover:bg-yellow-100')
        : (isDark 
          ? 'bg-blue-800/50 hover:bg-blue-700/70' 
          : 'bg-blue-50 hover:bg-blue-100')
    }`}
    title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
  >
    <Star
      size={24}
      className={`transition-all duration-300 ${isFav 
        ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" 
        : isDark 
          ? "text-blue-300 hover:text-yellow-400" 
          : "text-blue-400 hover:text-yellow-400"
      }`}
    />
  </button>
</li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}