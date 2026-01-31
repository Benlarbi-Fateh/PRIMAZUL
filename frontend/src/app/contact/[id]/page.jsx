"use client";

import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Users,
  Shield,
  ArrowLeft,
  Calendar,
  Clock,
  Heart,
  Zap,
  Ban,
  UserMinus,
  Flag,
  MoreVertical,
  Send,
  Video,
  PhoneCall,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// Composant pour les informations du contact
const InfoItem = ({ icon: Icon, label, value, isDark }) => (
  <div
    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
      isDark
        ? "bg-blue-900/30 border border-blue-700/30"
        : "bg-slate-50 border border-slate-200"
    }`}
  >
    <div
      className={`p-3 rounded-xl ${isDark ? "bg-blue-800/50" : "bg-blue-100"}`}
    >
      <Icon
        className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-blue-600"}`}
      />
    </div>
    <div className="flex-1">
      <p
        className={`text-xs font-medium ${
          isDark ? "text-blue-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${
          isDark ? "text-white" : "text-slate-800"
        }`}
      >
        {value || "Non renseigné"}
      </p>
    </div>
  </div>
);

export default function ContactProfilePage() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id;

  const [contact, setContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [conversation, setConversation] = useState(null);

  // Styles dynamiques
  const pageBg = isDark
    ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-black"
    : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-white";

  const cardBg = isDark
    ? "bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-transparent backdrop-blur-xl border-slate-700/50"
    : "bg-white/90 backdrop-blur-xl border-slate-200";

  const headerBg = isDark
    ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600"
    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600";

  const buttonPrimary = isDark
    ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30"
    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30";

  // Charger les infos du contact
  useEffect(() => {
    if (!contactId) return;

    const fetchContactProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Récupérer le profil du contact
        const response = await api.get(`/profile/${contactId}`);

        if (response.data.success) {
          setContact(response.data.user);
        } else {
          setError("Impossible de charger le profil");
        }

        // Vérifier si le contact est bloqué
        try {
          const blockedResponse = await api.get("/message-settings/blocked");
          if (blockedResponse.data.success) {
            const blockedIds =
              blockedResponse.data.blockedUsers?.map((u) => u._id) || [];
            setIsBlocked(blockedIds.includes(contactId));
          }
        } catch (e) {
          console.log("Erreur vérification blocage:", e);
        }

        // Chercher la conversation existante
        try {
          const convResponse = await api.get(
            `/conversations/with/${contactId}`
          );
          if (convResponse.data.success && convResponse.data.conversation) {
            setConversation(convResponse.data.conversation);
          }
        } catch (e) {
          console.log("Pas de conversation existante");
        }
      } catch (error) {
        console.error("Erreur chargement profil:", error);
        setError(error.response?.data?.message || "Utilisateur introuvable");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactProfile();
  }, [contactId]);

  // Actions
    const handleSendMessage = async () => {
    try {
      setIsMessaging(true);
      
      // 1. Appel API pour obtenir/créer la conversation
      const response = await api.post("/conversations/get-or-create", {
        contactId: fullUser._id, // Utilisez fullUser._id (ou user._id)
      });

      const conversationId = response.data.conversation?._id;

      if (conversationId) {
        // 2. Redirection vers la conversation existante ou créée
        router.push(`/chat/${conversationId}`);
      } else {
        throw new Error("ID de conversation manquant");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ouverture du chat:", error);
      alert("Impossible d'ouvrir la conversation.");
    } finally {
      setIsMessaging(false);
    }
  };

  const handleVideoCall = () => {
    if (conversation) {
      router.push(`/chat/${conversation._id}?action=video`);
    }
  };

  const handleAudioCall = () => {
    if (conversation) {
      router.push(`/chat/${conversation._id}?action=audio`);
    }
  };

  const handleBlock = async () => {
    if (!confirm(`Voulez-vous vraiment bloquer ${contact?.name} ?`)) return;

    try {
      await api.post("/message-settings/block", { targetUserId: contactId });
      setIsBlocked(true);
      setShowOptions(false);
    } catch (error) {
      console.error("Erreur blocage:", error);
      alert("Erreur lors du blocage");
    }
  };

  const handleUnblock = async () => {
    try {
      await api.post("/message-settings/unblock", { targetUserId: contactId });
      setIsBlocked(false);
      setShowOptions(false);
    } catch (error) {
      console.error("Erreur déblocage:", error);
      alert("Erreur lors du déblocage");
    }
  };

  // Formater la date
  const formatDate = (date) => {
    if (!date) return "Inconnue";
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Formater le statut en ligne
  const getOnlineStatus = () => {
    if (!contact) return null;

    if (contact.isOnline) {
      return {
        text: "En ligne",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500",
      };
    }

    if (contact.lastSeen) {
      const lastSeen = new Date(contact.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

      if (diffMinutes < 5) {
        return {
          text: "En ligne récemment",
          color: "text-cyan-400",
          bgColor: "bg-cyan-500",
        };
      } else if (diffMinutes < 60) {
        return {
          text: `Vu il y a ${diffMinutes} min`,
          color: isDark ? "text-slate-400" : "text-slate-500",
          bgColor: "bg-slate-400",
        };
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        return {
          text: `Vu il y a ${hours}h`,
          color: isDark ? "text-slate-400" : "text-slate-500",
          bgColor: "bg-slate-400",
        };
      } else {
        return {
          text: `Vu le ${formatDate(contact.lastSeen)}`,
          color: isDark ? "text-slate-500" : "text-slate-400",
          bgColor: "bg-slate-400",
        };
      }
    }

    return {
      text: "Hors ligne",
      color: isDark ? "text-slate-500" : "text-slate-400",
      bgColor: "bg-slate-400",
    };
  };

  // Affichage chargement
  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${pageBg} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div
              className={`absolute inset-0 rounded-full border-4 ${
                isDark ? "border-slate-700" : "border-slate-200"
              }`}
            ></div>
            <div
              className={`absolute inset-0 rounded-full border-4 border-transparent ${
                isDark ? "border-t-cyan-400" : "border-t-blue-600"
              } animate-spin`}
            ></div>
            <User
              className={`absolute inset-0 m-auto w-8 h-8 ${
                isDark ? "text-cyan-400" : "text-blue-600"
              }`}
            />
          </div>
          <p
            className={`mt-6 font-semibold ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  // Affichage erreur
  if (error || !contact) {
    return (
      <div
        className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}
      >
        <div
          className={`text-center max-w-md p-8 rounded-3xl border ${cardBg}`}
        >
          <div
            className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 ${
              isDark ? "bg-red-500/20" : "bg-red-100"
            }`}
          >
            <AlertTriangle
              className={`w-10 h-10 ${
                isDark ? "text-red-400" : "text-red-500"
              }`}
            />
          </div>
          <h2
            className={`text-2xl font-bold mb-3 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Profil introuvable
          </h2>
          <p className={`mb-6 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {error ||
              "Cet utilisateur n'existe pas ou son profil n'est pas accessible."}
          </p>
          <button
            onClick={() => router.back()}
            className={`px-6 py-3 rounded-xl font-semibold ${buttonPrimary}`}
          >
            <ArrowLeft className="w-5 h-5 inline mr-2" />
            Retour
          </button>
        </div>
      </div>
    );
  }

  const onlineStatus = getOnlineStatus();

  return (
    <div className={`min-h-screen ${pageBg} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
            }`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>

          {/* Menu options */}
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`p-3 rounded-xl transition-all ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm"
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showOptions && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-xl overflow-hidden z-50 ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                {isBlocked ? (
                  <button
                    onClick={handleUnblock}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                      isDark
                        ? "hover:bg-slate-700 text-emerald-400"
                        : "hover:bg-slate-50 text-emerald-600"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Débloquer
                  </button>
                ) : (
                  <button
                    onClick={handleBlock}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                      isDark
                        ? "hover:bg-slate-700 text-red-400"
                        : "hover:bg-slate-50 text-red-600"
                    }`}
                  >
                    <Ban className="w-5 h-5" />
                    Bloquer
                  </button>
                )}
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                    isDark
                      ? "hover:bg-slate-700 text-amber-400"
                      : "hover:bg-slate-50 text-amber-600"
                  }`}
                >
                  <Flag className="w-5 h-5" />
                  Signaler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alerte si bloqué */}
        {isBlocked && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              isDark
                ? "bg-red-500/10 border border-red-500/30 text-red-300"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <Ban className="w-5 h-5 shrink-0" />
            <span>Vous avez bloqué cet utilisateur</span>
          </div>
        )}

        {/* Card Profil Principal */}
        <div className={`rounded-3xl overflow-hidden border ${cardBg}`}>
          {/* Header avec dégradé */}
          <div className={`relative h-40 ${headerBg}`}>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-60 h-60 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Photo de profil */}
          <div className="relative px-6 -mt-20">
            <div className="relative w-36 h-36 mx-auto">
              <div
                className={`absolute inset-0 rounded-3xl ${
                  isDark
                    ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                } p-1 shadow-2xl`}
              >
                <div className="w-full h-full rounded-3xl overflow-hidden bg-slate-800">
                  {contact.profilePicture ? (
                    <Image
                      src={contact.profilePicture}
                      alt={contact.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600">
                      <span className="text-5xl font-bold text-white">
                        {contact.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicateur en ligne */}
              {contact.isOnline && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
              )}
            </div>

            {/* Nom et statut */}
            <div className="text-center mt-6 mb-6">
              <h1
                className={`text-3xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {contact.name}
              </h1>

              {/* Statut en ligne */}
              {onlineStatus && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span
                    className={`w-2 h-2 rounded-full ${onlineStatus.bgColor} ${
                      contact.isOnline ? "animate-pulse" : ""
                    }`}
                  ></span>
                  <span className={`text-sm font-medium ${onlineStatus.color}`}>
                    {onlineStatus.text}
                  </span>
                </div>
              )}

              {/* Bio */}
              {contact.bio && (
                <p
                  className={`mt-4 text-sm max-w-md mx-auto leading-relaxed ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {contact.bio}
                </p>
              )}
            </div>

            {/* Actions rapides */}
            {!isBlocked && (
              <div className="flex justify-center gap-4 pb-6">
                
                {conversation && (
                  <>
                    <button
                      onClick={handleAudioCall}
                      className={`p-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                        isDark
                          ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <PhoneCall className="w-5 h-5" />
                    </button>

                    <button
                      onClick={handleVideoCall}
                      className={`p-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                        isDark
                          ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                          : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
                      }`}
                    >
                      <Video className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Informations */}
        <div className={`mt-6 rounded-2xl border p-6 ${cardBg}`}>
          <h2
            className={`text-lg font-bold mb-4 flex items-center gap-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            <User className="w-5 h-5" />
            Informations
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem
              icon={Mail}
              label="Email"
              value={contact.email}
              isDark={isDark}
            />
            <InfoItem
              icon={Phone}
              label="Téléphone"
              value={contact.phoneNumber || contact.phone}
              isDark={isDark}
            />
            <InfoItem
              icon={MapPin}
              label="Localisation"
              value={contact.location}
              isDark={isDark}
            />
            <InfoItem
              icon={Calendar}
              label="Membre depuis"
              value={formatDate(contact.createdAt)}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Médias partagés (optionnel) */}
        {conversation && (
          <div className={`mt-6 rounded-2xl border p-6 ${cardBg}`}>
            <h2
              className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              Conversation
            </h2>

            <div
              className={`p-4 rounded-xl ${
                isDark ? "bg-slate-800/50" : "bg-slate-50"
              }`}
            >
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Vous avez une conversation active avec {contact.name}.
              </p>
              <button
                onClick={handleSendMessage}
                className={`mt-3 text-sm font-semibold ${
                  isDark
                    ? "text-cyan-400 hover:text-cyan-300"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                Voir la conversation →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay pour fermer le menu */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        ></div>
      )}
    </div>
  );
}
