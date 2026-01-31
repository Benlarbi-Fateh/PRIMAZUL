"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Mail,
  Star,
  CalendarDays,
  UserPlus,
  Phone,
  MessageCircle,
  Video,
  Sparkles,
  X,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";
import api from "@/lib/api"; // Assurez-vous que le chemin est correct (alias @/)
import { searchUsers, sendInvitation, getSentInvitations } from "@/lib/api";
import { getSocket, onInvitationCancelled } from "@/services/socket";
import { useTheme } from "@/hooks/useTheme";

/* ---------------- AVATAR ---------------- */
function Avatar({ user, size = "md", showStatus = true }) {
  const { isDark } = useTheme();

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const sizes = {
    sm: "w-12 h-12 text-sm",
    md: "w-14 h-14 text-base",
    lg: "w-28 h-28 text-3xl",
  };
  const statusSizes = { sm: "w-3 h-3", md: "w-3 h-3", lg: "w-4 h-4" };

  return (
    <div className="relative">
      {user.profilePicture ? (
        <div
          className={`${sizes[size]} rounded-full overflow-hidden border-2 ${
            isDark ? "border-cyan-500/30" : "border-blue-300"
          }`}
        >
          <Image
            src={user.profilePicture}
            alt={user.name}
            width={size === "sm" ? 48 : size === "md" ? 56 : 112}
            height={size === "sm" ? 48 : size === "md" ? 56 : 112}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.name || "User",
              )}&background=${
                isDark ? "0ea5e9" : "3b82f6"
              }&color=fff&bold=true`;
            }}
            unoptimized
          />
        </div>
      ) : (
        <div
          className={`${sizes[size]} ${
            isDark
              ? "bg-gradient-to-br from-blue-600 to-cyan-600"
              : "bg-gradient-to-br from-blue-500 to-cyan-500"
          } rounded-full flex items-center justify-center text-white font-bold border-2 ${
            isDark ? "border-cyan-500/30" : "border-blue-300"
          }`}
        >
          {getInitials(user.name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-1 right-1 ${
            statusSizes[size]
          } rounded-full border-2 ${
            isDark ? "border-blue-900" : "border-white"
          } ${user.isOnline ? "bg-emerald-500" : "bg-gray-400"}`}
        />
      )}
    </div>
  );
}

/* ---------------- FAVORITES BAR ---------------- */
function FavoritesBar({ contacts, favoriteIds, setSelected, searchTerm }) {
  const { isDark } = useTheme();

  const favorites = contacts.filter(
    (c) =>
      favoriteIds.has(c.user?._id) &&
      c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (favorites.length === 0) return null;

  return (
    <div className="mb-6 max-w-2xl mx-auto">
      <h2
        className={`font-bold text-lg mb-3 ${
          isDark ? "text-cyan-50" : "text-blue-600"
        }`}
      >
        Favoris
      </h2>
      <div
        className={`flex gap-4 overflow-x-auto p-[1px] rounded-xl border-2 ${
          isDark
            ? "bg-blue-900/50 border-blue-800"
            : "bg-white/80 border-blue-100"
        }`}
      >
        {favorites.map((contact) => (
          <div
            key={contact._id}
            className={`flex flex-col items-center cursor-pointer rounded-3xl p-3 min-w-[80px] ${
              isDark ? "hover:bg-blue-800/50" : "hover:bg-blue-50"
            }`}
            onClick={() => setSelected(contact)}
          >
            <Avatar user={contact.user} size="sm" showStatus={true} />
            <p
              className={`text-xs font-medium truncate max-w-[60px] text-center mt-1 ${
                isDark ? "text-blue-200" : "text-blue-700"
              }`}
            >
              {contact.user.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- CONTACT DETAILS (AVEC CORRECTION BIO) ---------------- */
function ContactDetails({ contact, toggleFavorite, favoriteIds, onBack }) {
  const { isDark } = useTheme();
  const router = useRouter();

  // ✅ CORRECTION : État local pour stocker l'utilisateur complet (avec bio)
  const [fullUser, setFullUser] = useState(contact.user);
  const [loadingBio, setLoadingBio] = useState(true);

  const isFav = favoriteIds.has(fullUser._id);

  // 📍 États pour les boutons d'appel
  const [isCallingAudio, setIsCallingAudio] = useState(false);
  const [isCallingVideo, setIsCallingVideo] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  // ✅ CORRECTION : Récupérer les détails complets (dont la bio)
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await api.get(`/profile/${contact.user._id}`);
        if (res.data) {
          // Si l'API renvoie { user: ... } ou directement l'objet
          const userData = res.data.user || res.data;
          setFullUser(userData);
        }
      } catch (err) {
        console.error("Erreur chargement détails utilisateur:", err);
      } finally {
        setLoadingBio(false);
      }
    };

    if (contact.user?._id) {
      fetchUserDetails();
    }
  }, [contact.user._id]);

  // 📍 FONCTION POUR ALLER VERS LE PROFIL DU CONTACT
  const handleViewProfile = () => {
    router.push(`/contact/${fullUser._id}`);
  };

  // 📍 FONCTION GÉNÉRIQUE POUR OBTENIR/CRÉER LA CONVERSATION
  const getOrCreateConversation = async () => {
    const response = await api.post("/conversations/get-or-create", {
      contactId: fullUser._id,
    });

    if (response.data.conversation?._id) {
      return response.data.conversation._id;
    }

    throw new Error("Impossible de créer la conversation");
  };

  // 📍 FONCTION POUR INITIER UN APPEL (AUDIO OU VIDÉO)
  const handleCall = async (callType) => {
    const setLoading =
      callType === "audio" ? setIsCallingAudio : setIsCallingVideo;

    try {
      setLoading(true);
      console.log(`📞 Initiation appel ${callType} avec ${fullUser.name}...`);

      // 1. Obtenir ou créer la conversation
      const conversationId = await getOrCreateConversation();
      console.log(`✅ Conversation ID: ${conversationId}`);

      // 2. Rediriger vers le chat avec le paramètre d'appel
      router.push(`/chat/${conversationId}?call=${callType}`);
    } catch (error) {
      console.error(`❌ Erreur appel ${callType}:`, error);

      // Essayer de récupérer l'ID même dans l'erreur
      if (error.response?.data?.conversation?._id) {
        const conversationId = error.response.data.conversation._id;
        router.push(`/chat/${conversationId}?call=${callType}`);
        return;
      }

      alert("Erreur: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 📍 FONCTION POUR ALLER VERS LA MESSAGERIE
  const handleMessageClick = async () => {
    try {
      setIsMessaging(true);
      console.log("💬 Ouverture conversation avec", fullUser.name);

      const conversationId = await getOrCreateConversation();
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("❌ Erreur message:", error);

      if (error.response?.data?.conversation?._id) {
        const conversationId = error.response.data.conversation._id;
        router.push(`/chat/${conversationId}`);
        return;
      }

      alert("Erreur: " + (error.response?.data?.error || error.message));
    } finally {
      setIsMessaging(false);
    }
  };

  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-br from-blue-50 via-white to-cyan-50";

  const cardBg = isDark
    ? "bg-blue-900/80 border-blue-800"
    : "bg-white/80 border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";

  return (
    <div className={`min-h-screen ${pageBg} p-4`}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className={`p-3 rounded-2xl border-2 ${
                isDark
                  ? "bg-blue-800 border-blue-700"
                  : "bg-white border-blue-100"
              }`}
            >
              <ArrowLeft
                className={`w-6 h-6 ${
                  isDark ? "text-cyan-400" : "text-blue-600"
                }`}
              />
            </button>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  isDark
                    ? "text-cyan-50"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500"
                }`}
              >
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
        <div className={`rounded-3xl p-6 sm:p-8 border-2 ${cardBg} relative`}>
          {/* Bouton favori */}
          <button
            onClick={() => toggleFavorite(fullUser._id)}
            className={`absolute top-6 right-6 p-3 rounded-xl z-10 ${
              isDark
                ? "bg-blue-800/50 hover:bg-blue-700/70"
                : "bg-blue-100 hover:bg-blue-200"
            }`}
          >
            <Star
              size={28}
              className={`${
                isFav
                  ? "text-yellow-400 fill-yellow-400"
                  : isDark
                    ? "text-blue-300"
                    : "text-blue-400"
              }`}
            />
          </button>

          {/* Contenu centré : Photo -> Nom -> Statut */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar CLIQUABLE */}
            <div
              className="flex justify-center mb-6 cursor-pointer group relative"
              onClick={handleViewProfile}
              title="Voir le profil de ce contact"
            >
              <div className="relative">
                <Avatar user={fullUser} size="lg" showStatus={true} />
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">
                    Voir profil
                  </span>
                </div>
              </div>
            </div>

            {/* Nom CLIQUABLE */}
            <h1
              className={`text-2xl font-bold mb-2 ${textPrimary} cursor-pointer hover:underline hover:opacity-80 transition-all flex items-center gap-2`}
              onClick={handleViewProfile}
              title="Voir le profil de ce contact"
            >
              {fullUser.name}
              <ExternalLink className="w-4 h-4 opacity-50" />
            </h1>

            {/* Statut (Bio) avec chargement */}
            <p className={`mb-8 ${textSecondary} min-h-[24px]`}>
              {loadingBio ? (
                <span className="animate-pulse opacity-70">
                  Chargement de la bio...
                </span>
              ) : fullUser.bio?.trim() ? (
                fullUser.bio
              ) : (
                "Aucune biographie renseignée"
              )}
            </p>
          </div>

          {/* ✅ ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 📞 BOUTON APPELER */}
            <button
              onClick={() => handleCall("audio")}
              disabled={isCallingAudio || isCallingVideo || isMessaging}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? "bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-100"
                  : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? "bg-emerald-700" : "bg-emerald-200"
                }`}
              >
                {isCallingAudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Phone size={22} />
                )}
              </div>
              <span className="text-xs font-semibold">
                {isCallingAudio ? "Connexion..." : "Appeler"}
              </span>
            </button>

            {/* 💬 BOUTON MESSAGE */}
            <button
              onClick={handleMessageClick}
              disabled={isCallingAudio || isCallingVideo || isMessaging}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? "bg-blue-800 hover:bg-blue-700/80 text-blue-100"
                  : "bg-blue-100 hover:bg-blue-200 text-blue-800"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? "bg-blue-700" : "bg-blue-200"
                }`}
              >
                {isMessaging ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <MessageCircle
                    size={22}
                    className={isDark ? "text-cyan-300" : "text-blue-600"}
                  />
                )}
              </div>
              <span className="text-xs font-semibold">
                {isMessaging ? "Ouverture..." : "Message"}
              </span>
            </button>

            {/* 📹 BOUTON VIDÉO */}
            <button
              onClick={() => handleCall("video")}
              disabled={isCallingAudio || isCallingVideo || isMessaging}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? "bg-purple-800/50 hover:bg-purple-700/60 text-purple-100"
                  : "bg-purple-100 hover:bg-purple-200 text-purple-800"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isDark ? "bg-purple-700" : "bg-purple-200"
                }`}
              >
                {isCallingVideo ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Video size={22} />
                )}
              </div>
              <span className="text-xs font-semibold">
                {isCallingVideo ? "Connexion..." : "Vidéo"}
              </span>
            </button>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border-2 ${
                isDark
                  ? "bg-blue-800/50 border-blue-700"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? "bg-blue-700" : "bg-blue-100"
                  }`}
                >
                  <Mail
                    className={`w-5 h-5 ${
                      isDark ? "text-cyan-400" : "text-blue-600"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${textSecondary} mb-1`}>
                    Adresse email
                  </p>
                  <p
                    className={`font-bold ${textPrimary} truncate`}
                    title={fullUser.email}
                  >
                    {fullUser.email}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 rounded-2xl border-2 ${
                isDark
                  ? "bg-purple-900/30 border-purple-800"
                  : "bg-purple-50 border-purple-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDark ? "bg-purple-800" : "bg-purple-100"
                  }`}
                >
                  <CalendarDays
                    className={`w-5 h-5 ${
                      isDark ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                </div>
                <div>
                  <p className={`text-sm font-medium ${textSecondary}`}>
                    Ajouté le
                  </p>
                  <p className={`font-bold ${textPrimary}`}>
                    {new Date(contact.addedAt).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton "Voir le profil complet" */}
          <button
            onClick={handleViewProfile}
            className={`w-full mt-6 py-4 rounded-2xl font-bold text-white transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 ${
              isDark
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400"
                : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400"
            }`}
          >
            <ExternalLink className="w-5 h-5" />
            Voir le profil complet
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
    ? "bg-blue-900/80 border-blue-800"
    : "bg-white/80 border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";
  const textMuted = isDark ? "text-blue-400" : "text-blue-400";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700"
    : "bg-white border-blue-200";

  const inputText = isDark
    ? "text-blue-100 placeholder-blue-400"
    : "text-blue-900 placeholder-blue-400";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white";

  useEffect(() => {
    if (!searchQuery.trim()) return;
    clearTimeout(searchTimeoutRef.current);

    const performSearch = async () => {
      try {
        setSearching(true);

        const searchTerm = searchQuery.trim();
        if (searchTerm.length < 2) {
          setSearchResults([]);
          setSearching(false);
          return;
        }

        let blockedIds = new Set();
        try {
          const blockedResponse = await api.get("/message-settings/blocked");
          const blockedUsers = blockedResponse.data.blockedUsers || [];
          blockedIds = new Set(blockedUsers.map((u) => u._id.toString()));
        } catch (err) {
          console.error("Erreur chargement bloqués:", err);
        }

        const response = await searchUsers(searchTerm);

        const filteredUsers = (response.data.users || []).filter((user) => {
          const isContact = contactIds.has(user._id);
          const isBlocked = blockedIds.has(user._id.toString());

          const userName = user.name ? user.name.toLowerCase() : "";
          const searchLower = searchTerm.toLowerCase();
          const matchesName = userName.includes(searchLower);

          return !isContact && !isBlocked && matchesName;
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
        const sentUserIds = (response.data.invitations || []).map(
          (inv) => inv.receiver._id,
        );
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

  const maskEmail = (email) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email;
    const maskedLocal = "*****" + localPart.slice(-1);
    return `${maskedLocal}@${domain}`;
  };

  return (
    <div className={`min-h-screen ${pageBg} p-4`}>
      <div className="max-w-2xl mx-auto">
        {/* Search Bar */}
        <div className="pb-2">
          <div className="relative">
            <Search
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? "text-blue-400" : "text-blue-400"
              }`}
            />
            <input
              type="text"
              placeholder="Trouver de nouveaux contacts ..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`w-full pl-12 pr-10 py-4 rounded-full border-2 outline-none font-medium ${inputBg} ${inputText}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-blue-400" : "text-blue-400"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {searchResults.length > 0 && (
            <div className={`rounded-3xl p-6 border-2 ${cardBg}`}>
              <h3
                className={`text-lg font-bold mb-4 flex items-center gap-2 ${textPrimary}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDark ? "bg-blue-700" : "bg-purple-500"
                  }`}
                >
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
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                        isDark ? "border-blue-800" : "border-blue-200"
                      }`}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        <Avatar user={user} size="md" showStatus={false} />
                        <div className="ml-4 min-w-0 flex-1">
                          <p className={`font-bold truncate ${textPrimary}`}>
                            {user.name}
                          </p>
                          <p
                            className={`text-sm truncate ${textMuted}`}
                            title={user.email}
                          >
                            {maskEmail(user.email)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendInvitation(user._id)}
                        disabled={sendingTo === user._id || isInvitationSent}
                        className={`ml-3 px-4 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyle}`}
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
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? "bg-blue-800" : "bg-blue-100"
                }`}
              >
                <Search
                  className={`w-8 h-8 ${
                    isDark ? "text-blue-400" : "text-blue-400"
                  }`}
                />
              </div>
              <p className={`font-bold ${textPrimary}`}>
                Aucun utilisateur trouvé
              </p>
              <p className={`text-sm mt-2 ${textMuted}`}>
                Essayez avec un autre terme de recherche
              </p>
            </div>
          )}

          {searchQuery.length < 2 && !searching && (
            <div className={`text-center py-12 rounded-3xl border-2 ${cardBg}`}>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? "bg-blue-800" : "bg-blue-100"
                }`}
              >
                <UserPlus
                  className={`w-8 h-8 ${
                    isDark ? "text-cyan-400" : "text-blue-500"
                  }`}
                />
              </div>
              <p className={`font-bold ${textPrimary}`}>Commencez à taper...</p>
              <p className={`text-sm mt-2 ${textMuted}`}>
                Recherchez des utilisateurs
              </p>
            </div>
          )}

          {searching && (
            <div className={`text-center py-12 rounded-3xl border-2 ${cardBg}`}>
              <div className="inline-flex items-center gap-3">
                <div
                  className={`w-6 h-6 border-3 rounded-full animate-spin ${
                    isDark
                      ? "border-cyan-500 border-t-transparent"
                      : "border-blue-500 border-t-transparent"
                  }`}
                ></div>
                <span className={`font-medium ${textSecondary}`}>
                  Recherche en cours...
                </span>
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
  const searchParams = useSearchParams();

  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-br from-blue-50 via-white to-cyan-50";

  const cardBg = isDark
    ? "bg-blue-900/80 border-blue-800"
    : "bg-white/80 border-blue-100";

  const textPrimary = isDark ? "text-blue-50" : "text-blue-900";
  const textSecondary = isDark ? "text-blue-300" : "text-blue-600";
  const textMuted = isDark ? "text-blue-400" : "text-blue-400";

  const tabButtonActive = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
    : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white";

  const tabButtonInactive = isDark
    ? "bg-blue-800 text-blue-300"
    : "bg-white text-blue-700";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700"
    : "bg-white border-blue-200";

  const inputText = isDark
    ? "text-blue-100 placeholder-blue-400"
    : "text-blue-900 placeholder-blue-400";

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const response = await api.get("/message-settings/blocked");
        const blockedUsers = response.data.blockedUsers || [];
        const blockedIds = new Set(blockedUsers.map((u) => u._id.toString()));
        setBlockedUserIds(blockedIds);
      } catch (error) {
        console.error("Erreur chargement bloqués:", error);
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
        setContactIds(
          new Set(fetchedContacts.map((c) => c.user?._id).filter(Boolean)),
        );
        setFavoriteIds(
          new Set(
            fetchedContacts.filter((c) => c.isFavorite).map((c) => c.user._id),
          ),
        );
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
        const response = await api.get("/message-settings/blocked");
        const blockedUsers = response.data.blockedUsers || [];
        const blockedIds = new Set(blockedUsers.map((u) => u._id.toString()));
        setBlockedUserIds(blockedIds);

        const res = await api.get("/contacts");
        const fetchedContacts = res.data.contacts || [];
        setContacts(fetchedContacts);
        setContactIds(
          new Set(fetchedContacts.map((c) => c.user?._id).filter(Boolean)),
        );
        setFavoriteIds(
          new Set(
            fetchedContacts.filter((c) => c.isFavorite).map((c) => c.user._id),
          ),
        );
      } catch (error) {
        console.error("Erreur rechargement:", error);
      }
    };

    window.addEventListener("block-status-changed", handleBlockChange);
    return () =>
      window.removeEventListener("block-status-changed", handleBlockChange);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "add") {
      setActiveTab("add");
      setSelected(null);
    }
  }, [searchParams]);

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

    const userId = c.user?._id?.toString();
    const isBlocked = blockedUserIds.has(userId);

    return !isBlocked;
  });

  if (loading)
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${pageBg}`}
      >
        <div className="text-center">
          <div
            className={`w-16 h-16 border-4 ${
              isDark
                ? "border-cyan-500/40 border-t-cyan-500"
                : "border-blue-500/40 border-t-blue-500"
            } rounded-full animate-spin mb-4`}
          />
          <p className={`font-medium ${textSecondary}`}>
            Chargement des contacts...
          </p>
        </div>
      </div>
    );

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Tabs */}
        <div className="pb-4 pt-2">
          <div className="flex gap-3 max-w-lg mx-auto">
            <button
              onClick={() => {
                setActiveTab("contacts");
                setSelected(null);
              }}
              className={`flex-1 py-3.5 rounded-xl font-bold ${
                activeTab === "contacts" ? tabButtonActive : tabButtonInactive
              }`}
            >
              Mes Contacts
            </button>
            <button
              onClick={() => {
                setActiveTab("add");
                setSelected(null);
              }}
              className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 ${
                activeTab === "add" ? tabButtonActive : tabButtonInactive
              }`}
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
              <div className="pb-2">
                <div className="relative max-w-lg mx-auto">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? "text-blue-400" : "text-blue-400"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-12 pr-10 py-4 rounded-2xl border-2 outline-none font-medium ${inputBg} ${inputText}`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                        isDark ? "text-blue-400" : "text-blue-400"
                      }`}
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
                <h2 className={`font-bold text-lg mb-3 ${textPrimary}`}>
                  Tous les contacts ({filteredContacts.length})
                </h2>
                <div className={`rounded-3xl p-6 border-2 ${cardBg}`}>
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className={`font-medium ${textPrimary}`}>
                        Aucun contact trouvé
                      </p>
                      <p className={`text-sm mt-2 ${textMuted}`}>
                        {searchTerm
                          ? "Essayez une autre recherche"
                          : "Vous n'avez pas encore de contacts"}
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
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                              isDark
                                ? "border-blue-800 hover:bg-blue-800/50"
                                : "border-blue-200 hover:bg-blue-50"
                            }`}
                            onClick={() => setSelected(contact)}
                          >
                            <div className="flex items-center flex-1 min-w-0 pr-4">
                              <div className="relative shrink-0">
                                <Avatar
                                  user={user}
                                  size="md"
                                  showStatus={true}
                                />
                              </div>
                              <div className="ml-4 flex-1 min-w-0">
                                <p
                                  className={`font-bold text-lg truncate ${textPrimary}`}
                                >
                                  {user.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span
                                    className={`text-xs ${textMuted} truncate max-w-[150px]`}
                                  >
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(user._id);
                              }}
                              className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                isFav
                                  ? isDark
                                    ? "bg-yellow-500/20 hover:bg-yellow-500/30"
                                    : "bg-yellow-50 hover:bg-yellow-100"
                                  : isDark
                                    ? "bg-blue-800/50 hover:bg-blue-700/50"
                                    : "bg-blue-50 hover:bg-blue-100"
                              }`}
                              title={
                                isFav
                                  ? "Retirer des favoris"
                                  : "Ajouter aux favoris"
                              }
                            >
                              <Star
                                size={24}
                                className={`${
                                  isFav
                                    ? "text-yellow-400 fill-yellow-400"
                                    : isDark
                                      ? "text-blue-300"
                                      : "text-blue-400"
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
