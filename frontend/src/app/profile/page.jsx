"use client";

import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Users,
  Shield,
  Bell,
  Settings,
  Edit3,
  Check,
  Clock,
  ArrowLeft,
  Save,
  X,
  Star,
  Award,
  TrendingUp,
  Eye,
  Download,
  Calendar,
  Zap,
  Heart,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// Composant ActivityIcon séparé (nom changé pour éviter le conflit)
const ActivityIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

export default function ProfilePage() {
  const { user, updateProfile } = useContext(AuthContext);
  const router = useRouter();

  // === Thème global (clair / sombre) ===
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Classes dynamiques en fonction du thème
  const pageBg =
    (isDark
      ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50"
      : "bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100 text-slate-900") +
    " min-h-screen";

  const headerBar =
    "flex items-center justify-between mb-6 p-4 rounded-2xl border shadow-lg " +
    (isDark
      ? "bg-slate-900/90 border-slate-800 shadow-[0_18px_60px_rgba(15,23,42,0.7)]"
      : "bg-white border-blue-100 shadow-[0_18px_60px_rgba(15,23,42,0.12)]");

  const sideCard =
    "rounded-2xl shadow-lg border overflow-hidden flex-1 flex flex-col " +
    (isDark
      ? "bg-slate-900/95 border-slate-800"
      : "bg-white border-blue-100");

  const tabsCard =
    "rounded-2xl shadow-lg border p-3 mt-4 " +
    (isDark
      ? "bg-slate-900/95 border-slate-800"
      : "bg-white border-blue-100");

  const mainPanel =
    "rounded-2xl shadow-lg border overflow-hidden min-h-[600px] " +
    (isDark
      ? "bg-slate-900/95 border-slate-800"
      : "bg-white border-blue-100");

  const panelHeader =
    "p-4 border-b " +
    (isDark
      ? "bg-slate-900/95 border-slate-800"
      : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200");

  const paleCard =
    "rounded-xl p-4 border " +
    (isDark
      ? "bg-slate-900/70 border-slate-700"
      : "bg-slate-50 border-slate-200");

  const blueCard =
    "rounded-xl p-4 border " +
    (isDark
      ? "bg-slate-900/70 border-blue-700"
      : "bg-blue-50 border-blue-200");

  const notifCard =
    "rounded-xl p-4 border text-left " +
    (isDark
      ? "bg-slate-900/70 border-slate-700"
      : "bg-slate-50 border-slate-200");

  const textMuted = isDark ? "text-slate-400" : "text-slate-600";
  const textStrong = isDark ? "text-slate-50" : "text-slate-800";

  const inputBase =
    "w-full px-3 py-2 text-sm rounded-lg border outline-none ring-0 transition " +
    (isDark
      ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
      : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500");

  const textareaBase =
    "w-full px-3 py-2 text-sm rounded-lg border outline-none ring-0 transition resize-none " +
    (isDark
      ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
      : "bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500");

  const chipOnline =
    "flex items-center justify-center gap-1 mt-1 text-xs font-medium " +
    (isDark ? "text-emerald-300" : "text-emerald-600");

  const blueButton =
    "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-md " +
    (isDark
      ? "bg-sky-600 text-white hover:bg-sky-500"
      : "bg-blue-600 text-white hover:bg-blue-700");

  const ghostButton =
    "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all " +
    (isDark
      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
      : "bg-slate-100 text-slate-700 hover:bg-slate-200");

  const dangerAlert =
    "mb-4 p-3 rounded-xl flex items-center gap-3 text-sm border " +
    (isDark
      ? "bg-rose-950/60 border-rose-700 text-rose-200"
      : "bg-red-50 border-red-200 text-red-700");

  const successAlert =
    "mb-4 p-3 rounded-xl flex items-center gap-3 text-sm border " +
    (isDark
      ? "bg-emerald-950/60 border-emerald-700 text-emerald-200"
      : "bg-green-50 border-green-200 text-green-700");

  const tabActive =
    "w-full flex items-center gap-2 p-2 font-semibold rounded-lg text-sm shadow-md " +
    (isDark
      ? "bg-sky-600 text-white"
      : "bg-blue-600 text-white");

  const tabInactive =
    "w-full flex items-center gap-2 p-2 font-semibold rounded-lg text-sm transition-all " +
    (isDark
      ? "text-slate-300 hover:bg-slate-800"
      : "text-slate-600 hover:text-slate-800 hover:bg-blue-50");

  const sectionTitle =
    "flex items-center text-sm font-bold mb-3 " + textStrong;

  const smallLabel =
    "flex items-center text-sm font-medium mb-3 " +
    (isDark ? "text-slate-200" : "text-slate-700");

  const { user: _userDummy } = useContext(AuthContext); // juste pour garder le contexte tel quel

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });
  const [profilePicture, setProfilePicture] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Données simulées pour remplir l'espace
  const userStats = {};

  const recentActivity = [
    { id: 1, action: "a partagé un clip", time: "2 min", icon: Zap },
    { id: 2, action: "a rejoint un groupe", time: "1 h", icon: Users },
    { id: 3, action: "a aimé un message", time: "3 h", icon: Heart },
    { id: 4, action: "a créé un clip", time: "5 h", icon: Zap },
  ];

  const achievements = [
    { id: 1, name: "Premier clip", icon: "🎬", progress: 100 },
    { id: 2, name: "Socialite", icon: "🤝", progress: 80 },
    { id: 3, name: "Créateur", icon: "⭐", progress: 60 },
    { id: 4, name: "Viral", icon: "🚀", progress: 40 },
  ];

  // Fix hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      });
      setProfilePicture(user.profilePicture || "");
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image valide");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erreur upload image:", error);
      setError("Erreur lors de l'upload de l'image");
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const dataToUpdate = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        profilePicture: profilePicture,
      };

      const result = await updateProfile(dataToUpdate);

      if (result.success) {
        setSuccess("✅ Profil mis à jour avec succès !");
        setIsEditing(false);

        setTimeout(() => {
          setSuccess("");
        }, 3000);
      }
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      setError(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      });
      setProfilePicture(user.profilePicture || "");
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  // Loader
  if (!isMounted || !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${pageBg}`}>
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-400/30 border-t-sky-500 mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <User
                className={
                  "w-6 h-6 animate-pulse " +
                  (isDark ? "text-sky-300" : "text-blue-600")
                }
              />
            </div>
          </div>
          <p className={`mt-6 font-medium ${textMuted}`}>
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageBg}>
      {/* Container principal avec padding */}
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto h-full">
          {/* Header */}
          <div className={headerBar}>
            <button
              onClick={() => router.back()}
              className={blueButton}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            <div className="text-center">
              <h1 className={`text-xl font-bold ${textStrong}`}>Mon Profil</h1>
              <p className={`text-sm ${textMuted}`}>
                Gérez vos informations personnelles
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={blueButton}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className={ghostButton}
                  >
                    <X className="w-4 h-4" />
                    <span>Annuler</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className={
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all " +
                      (isDark
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-green-600 text-white hover:bg-green-700")
                    }
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isLoading ? "Sauvegarde..." : "Sauvegarder"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages d'alerte */}
          {error && (
            <div className={dangerAlert}>
              <span className="text-lg">❌</span>
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                className={isDark ? "text-rose-300 hover:text-rose-100" : "text-red-500 hover:text-red-700"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className={successAlert}>
              <span className="text-lg">✅</span>
              <span className="flex-1">{success}</span>
              <button
                onClick={() => setSuccess("")}
                className={isDark ? "text-emerald-300 hover:text-emerald-100" : "text-green-500 hover:text-green-700"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Contenu principal - Optimisé pour desktop et mobile */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Colonne de gauche - Profil */}
            <div className="lg:w-1/3 xl:w-1/4 flex flex-col">
              <div className={sideCard}>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-center shrink-0">
                  <div className="relative inline-block">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-2xl ring-4 ring-white/60 mx-auto">
                      {profilePicture ? (
                        <Image
                          src={profilePicture}
                          alt={user.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <label className="absolute -bottom-1 -right-1 bg-white/95 hover:bg-blue-50 text-blue-600 p-1.5 rounded-lg shadow-lg cursor-pointer transition-all border border-blue-200">
                        <Camera className="w-3 h-3" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          disabled={isLoading}
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-3">
                    <h2 className="text-lg font-bold text-white line-clamp-1">
                      {formData.name}
                    </h2>
                    <p className="text-blue-100 text-sm truncate mt-1">
                      {formData.email}
                    </p>

                    <div className={chipOnline}>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span>En ligne</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Statistiques principales */}
                    <div>
                      <h3 className={sectionTitle}>
                        <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                        Statistiques
                      </h3>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className={blueCard}>
                          <div className="text-sm font-bold text-blue-600">
                            {user.stats?.messagesCount || 0}
                          </div>
                          <div className={`text-xs ${textMuted}`}>Messages</div>
                        </div>
                        <div className={blueCard}>
                          <div className="text-sm font-bold text-blue-600">
                            {user.stats?.contactsCount || 0}
                          </div>
                          <div className={`text-xs ${textMuted}`}>Contacts</div>
                        </div>
                        <div className={blueCard}>
                          <div className="text-sm font-bold text-blue-600">
                            {user.stats?.groupsCount || 0}
                          </div>
                          <div className={`text-xs ${textMuted}`}>Groupes</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => router.push("/")}
                      className={
                        "w-full flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-all border " +
                        (isDark
                          ? "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                          : "bg-blue-50 text-slate-700 border-blue-200 hover:bg-blue-100")
                      }
                    >
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <span>Conversations</span>
                    </button>
                    <button
                      className={
                        "w-full flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-all border " +
                        (isDark
                          ? "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                          : "bg-blue-50 text-slate-700 border-blue-200 hover:bg-blue-100")
                      }
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Groupes</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation par onglets */}
              <div className={tabsCard}>
                <div className="space-y-1">
                  {[
                    { id: "profile", icon: User, label: "Profil" },
                    { id: "privacy", icon: Shield, label: "Confidentialité" },
                    {
                      id: "notifications",
                      icon: Bell,
                      label: "Notifications",
                    },
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={isActive ? tabActive : tabInactive}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Colonne de droite - Contenu principal */}
            <div className="lg:w-2/3 xl:w-3/4 flex-1">
              <div className={mainPanel}>
                {/* En-tête du contenu */}
                <div className={panelHeader}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className={`text-lg font-bold ${textStrong}`}>
                        {activeTab === "profile" && "Informations personnelles"}
                        {activeTab === "privacy" &&
                          "Paramètres de confidentialité"}
                        {activeTab === "notifications" &&
                          "Préférences de notifications"}
                      </h2>
                      <p className={`text-sm mt-1 ${textMuted}`}>
                        {activeTab === "profile" &&
                          "Gérez vos informations de profil"}
                        {activeTab === "privacy" &&
                          "Contrôlez votre confidentialité"}
                        {activeTab === "notifications" &&
                          "Contrôlez comment et quand vous recevez les notifications"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenu scrollable si nécessaire */}
                <div className="p-4">
                  {activeTab === "profile" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Colonne gauche - Informations de base */}
                      <div className="space-y-4">
                        <div className={paleCard}>
                          <label className={smallLabel}>
                            <User className="w-4 h-4 text-blue-600 mr-2" />
                            Nom complet
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className={inputBase}
                              placeholder="Votre nom complet"
                            />
                          ) : (
                            <p
                              className={
                                "text-lg font-semibold " + textStrong
                              }
                            >
                              {formData.name}
                            </p>
                          )}
                        </div>

                        <div className={paleCard}>
                          <label className={smallLabel}>
                            <Mail className="w-4 h-4 text-blue-600 mr-2" />
                            Adresse email
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={inputBase}
                              placeholder="votre@email.com"
                            />
                          ) : (
                            <p
                              className={
                                "text-lg font-semibold " + textStrong
                              }
                            >
                              {formData.email}
                            </p>
                          )}
                        </div>

                        {/* Section activité récente */}
                        <div
                          className={
                            "rounded-xl p-4 border " +
                            (isDark
                              ? "bg-slate-900/70 border-slate-700"
                              : "bg-white border-slate-200")
                          }
                        >
                          <h3 className={sectionTitle}>
                            <ActivityIcon className="w-4 h-4 text-blue-600 mr-2" />
                            Activité récente
                          </h3>
                          <div className="space-y-2">
                            {recentActivity.map((activity) => {
                              const IconComponent = activity.icon;
                              return (
                                <div
                                  key={activity.id}
                                  className={
                                    "flex items-center justify-between p-2 rounded-lg transition-colors " +
                                    (isDark
                                      ? "hover:bg-slate-800"
                                      : "hover:bg-slate-50")
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent
                                      className={
                                        "w-3 h-3 " +
                                        (isDark
                                          ? "text-slate-400"
                                          : "text-slate-500")
                                      }
                                    />
                                    <span
                                      className={
                                        "text-xs " +
                                        (isDark
                                          ? "text-slate-200"
                                          : "text-slate-700")
                                      }
                                    >
                                      {activity.action}
                                    </span>
                                  </div>
                                  <span
                                    className={
                                      "text-xs " +
                                      (isDark
                                        ? "text-slate-400"
                                        : "text-slate-500")
                                    }
                                  >
                                    {activity.time}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Colonne droite - Informations supplémentaires */}
                      <div className="space-y-4">
                        <div className={paleCard}>
                          <label className={smallLabel}>
                            <User className="w-4 h-4 text-blue-600 mr-2" />
                            Bio
                          </label>
                          {isEditing ? (
                            <textarea
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              rows={3}
                              className={textareaBase}
                              placeholder="Décrivez-vous en quelques mots..."
                            />
                          ) : (
                            <p
                              className={
                                "text-sm leading-relaxed " +
                                (isDark
                                  ? "text-slate-200"
                                  : "text-slate-700")
                              }
                            >
                              {formData.bio || "Aucune bio renseignée"}
                            </p>
                          )}
                        </div>

                        <div className={blueCard}>
                          <h3 className={sectionTitle}>
                            <Clock className="w-4 h-4 text-blue-600 mr-2" />
                            Statut et activité
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className={textMuted}>Statut :</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span
                                  className={
                                    "font-semibold " +
                                    (isDark
                                      ? "text-emerald-300"
                                      : "text-emerald-600")
                                  }
                                >
                                  En ligne
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={textMuted}>
                                Membre depuis :
                              </span>
                              <span
                                className={
                                  "font-medium " + textStrong
                                }
                              >
                                {new Date(
                                  user.createdAt || Date.now()
                                ).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={textMuted}>Série active :</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-orange-500" />
                                <span className="font-semibold text-orange-600">
                                  {userStats.streak} jours
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "privacy" && (
                    <div className="text-center w-full max-w-2xl mx-auto">
                      <div
                        className={
                          "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 " +
                          (isDark ? "bg-blue-900" : "bg-blue-100")
                        }
                      >
                        <Shield
                          className={
                            "w-8 h-8 " +
                            (isDark ? "text-blue-300" : "text-blue-600")
                          }
                        />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${textStrong}`}>
                        Paramètres de confidentialité
                      </h3>
                      <p className={`mb-6 ${textMuted}`}>
                        Gérez qui peut voir vos informations et vous contacter
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={notifCard}>
                          <h4 className={`font-semibold mb-2 ${textStrong}`}>
                            Visibilité du profil
                          </h4>
                          <p className={`text-sm mb-3 ${textMuted}`}>
                            Contrôlez qui peut voir votre profil
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name="visibility"
                                defaultChecked
                                className="text-blue-600"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Tout le monde
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name="visibility"
                                className="text-blue-600"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Contacts uniquement
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className={notifCard}>
                          <h4 className={`font-semibold mb-2 ${textStrong}`}>
                            Paramètres de contact
                          </h4>
                          <p className={`text-sm mb-3 ${textMuted}`}>
                            Gérez qui peut vous contacter
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="text-blue-600 rounded"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Accepter les messages
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="text-blue-600 rounded"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Accepter les appels
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "notifications" && (
                    <div className="text-center w-full max-w-2xl mx-auto">
                      <div
                        className={
                          "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 " +
                          (isDark ? "bg-cyan-900" : "bg-cyan-100")
                        }
                      >
                        <Bell
                          className={
                            "w-8 h-8 " +
                            (isDark ? "text-cyan-300" : "text-cyan-600")
                          }
                        />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${textStrong}`}>
                        Préférences de notifications
                      </h3>
                      <p className={`mb-6 ${textMuted}`}>
                        Contrôlez comment et quand vous recevez les
                        notifications
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={notifCard}>
                          <h4 className={`font-semibold mb-2 ${textStrong}`}>
                            Messages
                          </h4>
                          <p className={`text-sm mb-3 ${textMuted}`}>
                            Notifications de nouveaux messages
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="text-blue-600 rounded"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Nouveaux messages
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="text-blue-600 rounded"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Messages de groupe
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className={notifCard}>
                          <h4 className={`font-semibold mb-2 ${textStrong}`}>
                            Activités
                          </h4>
                          <p className={`text-sm mb-3 ${textMuted}`}>
                            Notifications d&apos;activités sociales
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="text-blue-600 rounded"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Nouveaux likes
                              </span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                defaultChecked
                                className="text-blue-600 rounded"
                              />
                              <span
                                className={
                                  isDark
                                    ? "text-slate-200"
                                    : "text-slate-700"
                                }
                              >
                                Nouveaux followers
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}