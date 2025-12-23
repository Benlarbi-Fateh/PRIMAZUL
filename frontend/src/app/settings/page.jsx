"use client";

import { useState, useContext, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Globe,
  Lock,
  Moon,
  LogOut,
  ArrowLeft,
  Key,
  Settings as SettingsIcon,
  Check,
  AlertCircle,
  Sparkles,
  Search,
  UserX,
  Unlock,
  Loader,
  Archive,
  RefreshCcw
} from "lucide-react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api, {
  sendPasswordOtp,
  verifyChangePassword,
  getArchivedConversations,   // ✅ API archives
  unarchiveConversation       // ✅ API désarchiver
} from "@/lib/api";

// ✅ 1. IMPORTER LA SIDEBAR
import MainSidebar from "@/components/Layout/MainSidebar.client";

export default function SettingsPage() {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  // === ETATS SETTINGS ===
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // === ETATS BLOCKAGE ===
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // === ETATS ARCHIVES (NOUVEAU) ===
  const [showArchivedModal, setShowArchivedModal] = useState(false);
  const [archivedChats, setArchivedChats] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const [userData, setUserData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    notifications: true,
    language: "fr",
    privacy: "public",
  });

  // Styles
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

  const backButtonBg = isDark
    ? "bg-blue-800 hover:bg-blue-700 border-blue-700"
    : "bg-white hover:bg-blue-50 border-blue-100 hover:border-blue-300";

  const backButtonText = isDark ? "text-cyan-400" : "text-blue-600";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700 focus:ring-cyan-500 focus:border-cyan-400"
    : "bg-white border-blue-200 focus:ring-blue-300 focus:border-blue-400";

  const inputText = isDark ? "text-blue-100 placeholder-blue-400" : "text-blue-900 placeholder-blue-400";

  const errorBg = isDark ? "bg-red-900/30 border-red-800" : "bg-red-50 border-red-200";
  const errorText = isDark ? "text-red-300" : "text-red-700";
  const successBg = isDark ? "bg-green-900/30 border-green-800" : "bg-green-50 border-green-200";
  const successText = isDark ? "text-green-300" : "text-green-700";

  const sectionIconBg = (color) => {
    const colors = {
      blue: isDark ? "bg-blue-700" : "bg-blue-100",
      purple: isDark ? "bg-purple-700" : "bg-purple-100",
      green: isDark ? "bg-green-700" : "bg-green-100",
      orange: isDark ? "bg-orange-700" : "bg-orange-100",
      pink: isDark ? "bg-pink-700" : "bg-pink-100",
      cyan: isDark ? "bg-cyan-700" : "bg-cyan-100",
      red: isDark ? "bg-red-900/40" : "bg-red-100",
      yellow: isDark ? "bg-yellow-900/40" : "bg-yellow-100",
    };
    return colors[color] || colors.blue;
  };

  const sectionIconText = (color) => {
    const colors = {
      blue: isDark ? "text-cyan-400" : "text-blue-600",
      purple: isDark ? "text-purple-400" : "text-purple-600",
      green: isDark ? "text-green-400" : "text-green-600",
      orange: isDark ? "text-orange-400" : "text-orange-600",
      pink: isDark ? "text-pink-400" : "text-pink-600",
      cyan: isDark ? "text-cyan-400" : "text-cyan-600",
      red: isDark ? "text-red-400" : "text-red-600",
      yellow: isDark ? "text-yellow-400" : "text-yellow-600",
    };
    return colors[color] || colors.blue;
  };

  // === LOGIQUE DE BLOCAGE ===
  useEffect(() => {
    if (showBlockedModal) {
      fetchBlockedUsers();
    }
  }, [showBlockedModal]);

  // === LOGIQUE D'ARCHIVAGE (NOUVEAU) ===
  useEffect(() => {
    if (showArchivedModal) {
      fetchArchivedChats();
    }
  }, [showArchivedModal]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setAvailableUsers([]);
    }
  }, [searchQuery]);

  const fetchBlockedUsers = async () => {
    try {
      setLoadingBlocked(true);
      const response = await api.get('/message-settings/blocked');
      if (response.data.success) {
        setBlockedUsers(response.data.blockedUsers || []);
      }
    } catch (error) {
      console.error('Erreur chargement bloqués:', error);
    } finally {
      setLoadingBlocked(false);
    }
  };

  // === FONCTIONS ARCHIVAGE (NOUVEAU) ===
  const fetchArchivedChats = async () => {
    try {
      setLoadingArchived(true);
      // ✅ Utilise l'API officielle des archives
      const response = await getArchivedConversations();
      if (response.data.success) {
        // Le contrôleur renvoie: { success, conversations: [...] }
        setArchivedChats(response.data.conversations || []);
      }
    } catch (error) {
      console.error('Erreur chargement archives:', error);
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleUnarchive = async (conversationId) => {
    try {
      setActionLoading(conversationId);

      // ✅ Appel API correct
      const response = await unarchiveConversation(conversationId);

      if (response.data.success) {
        // Retirer de la liste locale des archives
        setArchivedChats(prev => prev.filter(c => c._id !== conversationId));

        // 🔄 Demander au Sidebar de rafraîchir la liste des conversations
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('refresh-sidebar-conversations')
          );
        }
      }
    } catch (error) {
      console.error('Erreur désarchivage:', error);
      alert('Erreur lors du désarchivage');
    } finally {
      setActionLoading(null);
    }
  };

  const searchUsers = async () => {
    try {
      setSearching(true);
      const response = await api.get('/profile/search', {
        params: { query: searchQuery }
      });
      if (response.data.success) {
        const filtered = response.data.users.filter(
          user => !blockedUsers.some(blocked => blocked._id === user._id)
        );
        setAvailableUsers(filtered);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setAvailableUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleBlock = async (userId) => {
    const user = availableUsers.find(u => u._id === userId);
    if (!confirm(`Bloquer ${user?.name} ?\n\n⚠️ Il sera retiré de vos contacts et ne pourra plus vous contacter.`)) {
      return;
    }
    try {
      setActionLoading(userId);
      const response = await api.post('/message-settings/block', {
        targetUserId: userId
      });
      if (response.data.success) {
        await fetchBlockedUsers();
        setSearchQuery('');
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('Erreur blocage:', error);
      alert('Erreur lors du blocage');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (userId, userName) => {
    if (!confirm(`Débloquer ${userName} ?\n\n💡 Important :\n- ${userName} ne sera PAS automatiquement rajouté à vos contacts\n- Vous devrez lui renvoyer une invitation`)) {
      return;
    }
    try {
      setActionLoading(userId);
      const response = await api.post('/message-settings/unblock', {
        targetUserId: userId
      });
      if (response.data.success) {
        await fetchBlockedUsers();
      }
    } catch (error) {
      console.error('Erreur déblocage:', error);
      alert('Erreur lors du déblocage');
    } finally {
      setActionLoading(null);
    }
  };

  // === LOGIQUE PASSWORD ===
  const startChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return setMessage("❌ Remplissez tous les champs");
    }
    if (newPassword !== confirmPassword) {
      return setMessage("❌ Les nouveaux mots de passe ne correspondent pas");
    }
    if (oldPassword === newPassword) {
      return setMessage("❌ Le nouveau mot de passe doit être différent de l'ancien");
    }
    try {
      setLoading(true);
      await sendPasswordOtp({ oldPassword, newPassword });
      setMessage("✅ Code de vérification envoyé à votre email");
      setStep(2);
    } catch (error) {
      if (error.response?.status === 400) {
        setMessage("❌ Ancien mot de passe incorrect");
      } else {
        setMessage("❌ Erreur lors de l'envoi du code");
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmChangePassword = async () => {
    if (!otp) {
      return setMessage("❌ Veuillez saisir le code de vérification");
    }
    try {
      setLoading(true);
      await verifyChangePassword({ code: otp, newPassword });
      setMessage("✅ Mot de passe changé avec succès");
      setTimeout(() => {
        setShowModal(false);
        setStep(1);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
        setMessage("");
      }, 2000);
    } catch (error) {
      setMessage("❌ Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // 🔹 Helpers pour l'affichage des archives
  const getArchivedChatName = (chat) => {
    if (chat.isGroup) {
      return chat.groupName || "Groupe sans nom";
    }
    const myId = user?._id || user?.id;
    const other = (chat.participants || []).find(
      (p) => p._id?.toString() !== myId?.toString()
    );
    return other?.name || "Discussion";
  };

  const getArchivedLastMessage = (chat) => {
    const last = chat.lastMessage;
    if (!last) return "Aucun message";

    if (last.type === "image") return "🖼️ Image";
    if (last.type === "video") return "🎬 Vidéo";
    if (last.type === "file") return `📄 ${last.fileName || "Fichier"}`;
    if (last.type === "voice" || last.type === "audio") return "🎤 Audio";

    const content = last.content || "";
    return content.length > 40 ? content.slice(0, 40) + "..." : content;
  };

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-blue-950" : "bg-gradient-to-br from-blue-50 via-white to-cyan-50"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400/40 border-t-cyan-500" />
          <p className={`mt-4 text-sm ${isDark ? "text-blue-400" : "text-blue-500"}`}>
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${pageBg}`}>
      <MainSidebar />

      <div className="flex-1 overflow-y-auto relative w-full">
        {!isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          </div>
        )}

        <div className="max-w-6xl mx-auto p-4 sm:p-6 relative z-10">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className={`p-3 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 shadow-md ${backButtonBg}`}
              >
                <ArrowLeft className={`w-6 h-6 ${backButtonText}`} />
              </button>

              <div className="flex-1">
                <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? "text-cyan-50" : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500"}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isDark ? "bg-gradient-to-br from-blue-700 to-cyan-700" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}>
                    <SettingsIcon className="w-6 h-6 text-white" />
                  </div>
                  Paramètres
                </h1>
                <p className={`mt-1 ml-1 flex items-center gap-2 ${textSecondary}`}>
                  <Sparkles className="w-4 h-4" />
                  Gérez votre compte et vos préférences
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl border-2 mb-8 animate-slide-in-left hover:shadow-2xl transition-all ${cardBg}`}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className={`w-24 h-24 rounded-3xl overflow-hidden border-4 ${isDark ? "border-cyan-500/50" : "border-blue-400/50"} shadow-2xl`}>
                  {user.profilePicture ? (
                    <Image src={user.profilePicture} alt={user.name} width={96} height={96} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center ${isDark ? "bg-gradient-to-br from-blue-600 to-cyan-600" : "bg-gradient-to-br from-blue-500 to-cyan-500"}`}>
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 ${isDark ? "border-blue-900 bg-cyan-500" : "border-white bg-green-500"} shadow-lg`}>
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${isDark ? "bg-blue-800 text-cyan-300" : "bg-blue-100 text-blue-700"}`}>
                  COMPTE VERIFIÉ
                </div>
                <h2 className="text-2xl font-bold mb-2 text-primary">
                  {user.name || user.email?.split("@")[0]}
                </h2>
                <p className={`mb-3 ${textSecondary}`}>{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? "bg-blue-800 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                    Membre depuis 2024
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push("/profile")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 hover:shadow-lg ${buttonStyle}`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Modifier le profil
                </span>
              </button>
            </div>
          </div>

          {/* ✅ LA GRILLE QUI CONTIENT MAINTENANT TOUTES LES CARTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Section Notifications */}
            <div className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg("orange")}`}>
                  <Bell className={`w-6 h-6 ${sectionIconText("orange")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Notifications</h3>
                  <p className={`text-sm ${textMuted}`}>Contrôlez les alertes</p>
                </div>
              </div>
              <label className={`flex items-center justify-between cursor-pointer ${textPrimary}`}>
                <span className="font-medium">Notifications actives</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={userData.notifications}
                    onChange={(e) => setUserData({ ...userData, notifications: e.target.checked })}
                  />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${userData.notifications ? (isDark ? "bg-cyan-500" : "bg-blue-500") : (isDark ? "bg-blue-700" : "bg-blue-200")}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${userData.notifications ? "transform translate-x-6" : ""}`}></div>
                </div>
              </label>
            </div>

            {/* Section Apparence */}
            <div className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg("purple")}`}>
                  <Moon className={`w-6 h-6 ${sectionIconText("purple")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Apparence</h3>
                  <p className={`text-sm ${textMuted}`}>Thème clair/sombre</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between ${isDark ? "bg-blue-800 hover:bg-blue-700 text-blue-100" : "bg-blue-100 hover:bg-blue-200 text-blue-800"}`}
              >
                <span>Mode {isDark ? "Sombre" : "Clair"}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-cyan-500" : "bg-blue-500"}`}>
                  <Moon className="w-4 h-4 text-white" />
                </div>
              </button>
            </div>

            {/* Section Langue */}
            <div className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg("green")}`}>
                  <Globe className={`w-6 h-6 ${sectionIconText("green")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Langue</h3>
                  <p className={`text-sm ${textMuted}`}>Langue de l&apos;interface</p>
                </div>
              </div>
              <select
                value={userData.language}
                onChange={(e) => setUserData({ ...userData, language: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${inputBg} ${inputText}`}
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
              </select>
            </div>

            {/* Section Sécurité */}
            <div className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg("pink")}`}>
                  <Key className={`w-6 h-6 ${sectionIconText("pink")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Sécurité</h3>
                  <p className={`text-sm ${textMuted}`}>Protégez votre compte</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${buttonStyle}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Key className="w-4 h-4" />
                  Changer le mot de passe
                </span>
              </button>
            </div>

            {/* ✅ Section Discussions Archivées (NOUVEAU) */}
            <div className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg("yellow")}`}>
                  <Archive className={`w-6 h-6 ${sectionIconText("yellow")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Archives</h3>
                  <p className={`text-sm ${textMuted}`}>Conversations masquées</p>
                </div>
              </div>
              <button
                onClick={() => setShowArchivedModal(true)}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  isDark 
                    ? "bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-300 border border-yellow-800" 
                    : "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Archive className="w-4 h-4" />
                  Voir les archives
                </span>
              </button>
            </div>

            {/* Section Contacts bloqués */}
            <div className={`rounded-3xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all transform hover:-translate-y-1 ${cardBg}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sectionIconBg("red")}`}>
                  <Lock className={`w-6 h-6 ${sectionIconText("red")}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>Contacts bloqués</h3>
                  <p className={`text-sm ${textMuted}`}>Gérez vos restrictions</p>
                </div>
              </div>
              <button
                onClick={() => setShowBlockedModal(true)}
                className={`w-full px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  isDark 
                    ? "bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-800" 
                    : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <UserX className="w-4 h-4" />
                  Voir la liste
                </span>
              </button>
            </div>

          </div>
          {/* FIN DE LA GRILLE */}

          {/* Bouton Déconnexion */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleLogout}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 ${isDark ? "bg-gradient-to-r from-red-800 to-pink-800 hover:from-red-700 hover:to-pink-700 text-red-100" : "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white"} shadow-2xl`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <LogOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </button>
          </div>

          <p className={`text-center text-sm mt-8 flex items-center justify-center gap-2 ${textSecondary}`}>
            <Sparkles className="w-4 h-4" />
            Vos paramètres sont synchronisés sur tous vos appareils
          </p>
        </div>
      </div>

      {/* Modal Changement Mot de Passe */}
      {showModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? "bg-blue-950/70" : "bg-black/30"}`}>
          <div className={`w-full max-w-md rounded-3xl border-2 p-6 shadow-2xl ${isDark ? "bg-blue-900 border-blue-800" : "bg-white border-blue-100"}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className={`text-sm font-bold ${textSecondary}`}>SÉCURITÉ</p>
                <h2 className={`text-xl font-bold mt-1 ${textPrimary}`}>
                  {step === 1 ? "Changer le mot de passe" : "Vérification"}
                </h2>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-cyan-700" : "bg-cyan-100"}`}>
                <Key className={`w-5 h-5 ${isDark ? "text-cyan-300" : "text-cyan-600"}`} />
              </div>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-xl border-2 flex items-center gap-3 ${message.includes("✅") ? successBg : errorBg}`}>
                <p className={`text-sm font-medium ${message.includes("✅") ? successText : errorText}`}>{message}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <input type="password" placeholder="Ancien mot de passe" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={`w-full px-4 py-3 rounded-xl border-2 outline-none ${inputBg} ${inputText}`} />
                <input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full px-4 py-3 rounded-xl border-2 outline-none ${inputBg} ${inputText}`} />
                <input type="password" placeholder="Confirmer" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-4 py-3 rounded-xl border-2 outline-none ${inputBg} ${inputText}`} />
                <button onClick={startChangePassword} disabled={loading} className={`w-full py-3.5 rounded-xl font-semibold ${buttonStyle}`}>
                  {loading ? "Envoi..." : "Envoyer le code"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <input type="text" placeholder="Code de vérification" value={otp} onChange={(e) => setOtp(e.target.value)} className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-center ${inputBg} ${inputText}`} />
                <button onClick={confirmChangePassword} disabled={loading} className={`w-full py-3.5 rounded-xl font-semibold ${buttonStyle}`}>
                  {loading ? "Vérification..." : "Confirmer"}
                </button>
              </div>
            )}

            <button onClick={() => { setShowModal(false); setStep(1); setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setOtp(""); setMessage(""); }} className={`w-full mt-4 text-center font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal Contacts Bloqués */}
      {showBlockedModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? "bg-blue-950/70" : "bg-black/30"}`}>
          <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border-2 shadow-2xl ${isDark ? "bg-blue-900 border-blue-800" : "bg-white border-blue-100"}`}>
            <div className="p-6 border-b border-gray-200/20 flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${textPrimary}`}>Gestion des blocages</h2>
                <p className={`text-sm ${textSecondary}`}>Bloquez ou débloquez des utilisateurs</p>
              </div>
              <button onClick={() => setShowBlockedModal(false)} className={`p-2 rounded-lg hover:bg-gray-500/10 ${textSecondary}`}>
                Fermer
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              <div className={`rounded-2xl p-6 border-2 ${isDark ? 'border-blue-800 bg-blue-950/30' : 'border-blue-100 bg-blue-50/50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h3 className={`font-semibold ${textPrimary}`}>Bloquer un contact</h3>
                </div>
                <div className="relative mb-4">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textMuted}`} />
                  <input type="text" placeholder="Rechercher un utilisateur à bloquer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${inputBg} ${inputText}`} />
                  {searching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />}
                </div>
                {searchQuery && (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {availableUsers.length > 0 ? (
                      availableUsers.map(user => (
                        <div key={user._id} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'border-blue-800 bg-blue-900/50' : 'border-blue-100 bg-white'}`}>
                          <div className="flex items-center gap-3">
                            {user.profilePicture ? (
                              <Image src={user.profilePicture} alt={user.name} width={40} height={40} className="rounded-full object-cover" />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                {user.name ? user.name[0].toUpperCase() : '?'}
                              </div>
                            )}
                            <div>
                              <p className={`font-medium ${textPrimary}`}>{user.name}</p>
                              <p className={`text-xs ${textMuted}`}>{user.email}</p>
                            </div>
                          </div>
                          <button onClick={() => handleBlock(user._id)} disabled={actionLoading === user._id} className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm flex items-center gap-2">
                            {actionLoading === user._id ? <Loader className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                            Bloquer
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className={`text-center py-2 text-sm ${textMuted}`}>{searching ? 'Recherche...' : 'Aucun utilisateur trouvé'}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <UserX className="w-5 h-5 text-red-500" />
                  <h3 className={`font-semibold ${textPrimary}`}>Utilisateurs bloqués ({blockedUsers.length})</h3>
                </div>
                {loadingBlocked ? (
                  <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : blockedUsers.length > 0 ? (
                  <div className="space-y-2">
                    {blockedUsers.map(user => (
                      <div key={user._id} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'border-blue-800 bg-blue-900/50' : 'border-blue-100 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <Image src={user.profilePicture} alt={user.name} width={48} height={48} className="rounded-full object-cover" />
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              {user.name ? user.name[0].toUpperCase() : '?'}
                            </div>
                          )}
                          <div>
                            <p className={`font-medium ${textPrimary}`}>{user.name}</p>
                            <p className={`text-sm ${textMuted}`}>{user.email}</p>
                          </div>
                        </div>
                        <button onClick={() => handleUnblock(user._id, user.name)} disabled={actionLoading === user._id} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}>
                          {actionLoading === user._id ? <Loader className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                          Débloquer
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-xl border-gray-500/20">
                    <p className={textMuted}>Aucun utilisateur bloqué.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL ARCHIVES (NOUVEAU) */}
      {/* ✅ MODAL ARCHIVES (NOUVEAU) */}
{showArchivedModal && (
  <div
    className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
      isDark ? "bg-blue-950/70" : "bg-black/30"
    }`}
  >
    <div
      className={`w-full max-w-lg max-h-[80vh] flex flex-col rounded-3xl border-2 shadow-2xl ${
        isDark ? "bg-blue-900 border-blue-800" : "bg-white border-blue-100"
      }`}
    >
      {/* Header du modal */}
      <div className="p-6 border-b border-gray-200/20 flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${textPrimary}`}>Archives</h2>
          <p className={`text-sm ${textSecondary}`}>Discussions archivées</p>
        </div>
        <button
          onClick={() => setShowArchivedModal(false)}
          className={`p-2 rounded-lg hover:bg-gray-500/10 ${textSecondary}`}
        >
          Fermer
        </button>
      </div>

      {/* Contenu */}
      <div className="p-6 overflow-y-auto custom-scrollbar">
        {loadingArchived ? (
          <div className="flex justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : archivedChats.length > 0 ? (
          <div className="space-y-3">
            {archivedChats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => router.push(`/chat/${chat._id}`)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${
                  isDark
                    ? "border-blue-800 bg-blue-900/50"
                    : "border-blue-100 bg-white"
                }`}
              >
                {/* Partie gauche : nom + dernier message */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isDark
                        ? "bg-yellow-900 text-yellow-100"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-medium ${textPrimary}`}>
                      {getArchivedChatName(chat)}
                    </p>
                    <p className={`text-xs ${textMuted}`}>
                      {getArchivedLastMessage(chat)}
                    </p>
                  </div>
                </div>

                {/* Partie droite : état + bouton Restaurer (ou pas) */}
                <div className="flex flex-col items-end gap-1">
                  {/* 🔒 Si la conversation est avec un utilisateur bloqué */}
                  {chat.isBlockedWithUser && (
                    <span
                      className={`text-xs font-medium ${
                        isDark ? "text-red-300" : "text-red-600"
                      }`}
                    >
                      Contact bloqué
                    </span>
                  )}

                  {/* Bouton Restaurer SEULEMENT si ce n'est pas une conv bloquée */}
                  {!chat.isBlockedWithUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnarchive(chat._id);
                      }}
                      disabled={actionLoading === chat._id}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                        isDark
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                      }`}
                    >
                      {actionLoading === chat._id ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-3 h-3" />
                      )}
                      Restaurer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-xl border-gray-500/20">
            <Archive className={`w-10 h-10 mx-auto mb-2 ${textMuted}`} />
            <p className={textMuted}>Aucune discussion archivée.</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

    </div>
  );
}