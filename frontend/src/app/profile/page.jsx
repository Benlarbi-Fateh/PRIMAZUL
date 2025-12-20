"use client";

import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthProvider";
import { useTheme } from "@/hooks/useTheme";
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

// ✅ 1. IMPORTER LA SIDEBAR
import MainSidebar from "@/components/Layout/MainSidebar.client";

// Composant ActivityIcon séparé
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
  const { user, updateProfile, setUser } = useContext(AuthContext);
  const { isDark } = useTheme();
  const router = useRouter();

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

  // Styles basés sur le thème
  const pageBg = isDark
    ? "bg-gradient-to-b from-blue-950 via-blue-950 to-blue-950"
    : "bg-gradient-to-b from-blue-50 to-indigo-100";

  const cardBg = isDark
    ? "bg-gradient-to-b from-blue-900/90 via-blue-900/80 to-blue-900/90 border-blue-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    : "bg-white border-blue-100 shadow-lg";

  const headerBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950 border-blue-800"
    : "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-blue-200";

  const textPrimary = isDark ? "text-blue-50" : "text-slate-800";
  const textSecondary = isDark ? "text-blue-200" : "text-slate-600";
  const textMuted = isDark ? "text-blue-300" : "text-slate-500";

  const buttonStyle = isDark
    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-cyan-500/20"
    : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-blue-500/20";

  const statCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-blue-50 border-blue-200";

  const detailCardBg = isDark
    ? "bg-blue-800/50 border-blue-700"
    : "bg-slate-50 border-slate-200";

  const activityCardBg = isDark
    ? "bg-blue-800/70 border-blue-700"
    : "bg-white border-slate-200";

  const profileHeaderBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-blue-900 to-blue-950"
    : "bg-gradient-to-r from-blue-600 to-indigo-600";

  const profileRing = isDark ? "ring-blue-700/50" : "ring-white/50";

  const cameraButton = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-200 border-blue-600"
    : "bg-white hover:bg-blue-50 text-blue-600 border-blue-200";

  const quickActionBg = isDark
    ? "bg-blue-800 hover:bg-blue-700 text-blue-200 border-blue-700"
    : "bg-blue-50 hover:bg-blue-100 text-slate-700 border-blue-200";

  const inputBg = isDark
    ? "bg-blue-800 border-blue-700 text-blue-100 placeholder-blue-400 focus:ring-cyan-500"
    : "bg-white border-slate-300 text-slate-800 placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500";

  const contentHeaderBg = isDark
    ? "bg-blue-900/50 border-blue-800"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";

  const userStats = { streak: 12 };

  const recentActivity = [
    { id: 1, action: "a partagé un clip", time: "2 min", icon: Zap },
    { id: 2, action: "a rejoint un groupe", time: "1 h", icon: Users },
    { id: 3, action: "a aimé un message", time: "3 h", icon: Heart },
    { id: 4, action: "a créé un clip", time: "5 h", icon: Zap },
  ];

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

  if (!isMounted || !user) {
    return (
      <div
        className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}
      >
        <div className="text-center">
          <div className="relative">
            <div
              className={`animate-spin rounded-full h-16 w-16 border-4 mx-auto ${
                isDark
                  ? "border-blue-800/50 border-t-cyan-400"
                  : "border-blue-600/20 border-t-blue-600"
              }`}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <User
                className={`w-6 h-6 animate-pulse ${
                  isDark ? "text-cyan-400" : "text-blue-600"
                }`}
              />
            </div>
          </div>
          <p
            className={`mt-6 font-medium ${
              isDark ? "text-blue-300" : "text-blue-600"
            }`}
          >
            Chargement du profil...
          </p>
        </div>
      </div>
    );
  }

  return (
    // ✅ 2. STRUCTURE FLEXBOX POUR LA SIDEBAR ET LE CONTENU
    <div className={`flex h-screen ${pageBg}`}>
      <MainSidebar />

      {/* ✅ 3. CONTENEUR SCROLLABLE POUR LE CONTENU DROIT */}
      <div className="flex-1 overflow-y-auto w-full relative">
        {/* Le padding du container principal */}
        <div className="min-h-full p-4">
          <div className="max-w-7xl mx-auto h-full">
            {/* Header */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 rounded-2xl shadow-lg border ${headerBg}`}
            >
              <button
                onClick={() => router.back()}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${buttonStyle}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <div className="text-center">
                <h1 className={`text-xl font-bold ${textPrimary}`}>
                  Mon Profil
                </h1>
                <p className={`text-sm ${textSecondary}`}>
                  Gérez vos informations personnelles
                </p>
              </div>

              <div className="flex items-center gap:2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${buttonStyle}`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                        isDark
                          ? "bg-blue-800 text-blue-200 hover:bg-blue-700"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>Annuler</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${
                        isDark
                          ? "bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white"
                          : "bg-linear-to-r from-green-600 to-cyan-500 hover:from-green-700 hover:to-cyan-600 text-white"
                      }`}
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
              <div
                className={`mb-4 p-3 rounded-xl flex items-center gap-3 text-sm ${
                  isDark
                    ? "bg-red-900/30 border border-red-800 text-red-300"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                <span className="text-lg">❌</span>
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError("")}
                  className={
                    isDark
                      ? "text-red-400 hover:text-red-300"
                      : "text-red-500 hover:text-red-700"
                  }
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {success && (
              <div
                className={`mb-4 p-3 rounded-xl flex items-center gap-3 text-sm ${
                  isDark
                    ? "bg-green-900/30 border border-green-800 text-green-300"
                    : "bg-green-50 border border-green-200 text-green-700"
                }`}
              >
                <span className="text-lg">✅</span>
                <span className="flex-1">{success}</span>
                <button
                  onClick={() => setSuccess("")}
                  className={
                    isDark
                      ? "text-green-400 hover:text-green-300"
                      : "text-green-500 hover:text-green-700"
                  }
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Contenu principal */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Colonne de gauche - Profil */}
              <div className="lg:w-1/3 xl:w-1/4 flex flex-col">
                <div
                  className={`rounded-2xl shadow-lg border overflow-hidden flex-1 flex flex-col ${cardBg}`}
                >
                  <div
                    className={`p-4 text-center shrink-0 ${profileHeaderBg}`}
                  >
                    <div className="relative inline-block">
                      <div
                        className={`relative w-20 h-20 rounded-xl overflow-hidden shadow-2xl ring-4 mx-auto ${profileRing}`}
                      >
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
                          <div
                            className={`w-full h-full flex items-center justify-center ${
                              isDark ? "bg-blue-800" : "bg-blue-500"
                            }`}
                          >
                            <User
                              className={`w-8 h-8 ${
                                isDark ? "text-blue-200" : "text-white"
                              }`}
                            />
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <label
                          className={`absolute -bottom-1 -right-1 p-1.5 rounded-lg shadow-lg cursor-pointer transition-all border ${cameraButton}`}
                        >
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
                      <h2
                        className={`text-lg font-bold line-clamp-1 ${
                          isDark ? "text-blue-50" : "text-white"
                        }`}
                      >
                        {formData.name}
                      </h2>
                      <p
                        className={`text-sm truncate mt-1 ${
                          isDark ? "text-blue-200" : "text-blue-100"
                        }`}
                      >
                        {formData.email}
                      </p>

                      <div className="flex items-center justify-center gap-1 mt-1">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                        <span
                          className={`text-xs font-medium ${
                            isDark ? "text-cyan-300" : "text-cyan-100"
                          }`}
                        >
                          En ligne
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Statistiques principales */}
                      <div>
                        <h3
                          className={`flex items-center text-xs font-bold mb-3 ${
                            isDark ? "text-blue-200" : "text-slate-800"
                          }`}
                        >
                          <TrendingUp
                            className={`w-4 h-4 mr-2 ${
                              isDark ? "text-cyan-400" : "text-blue-600"
                            }`}
                          />
                          Statistiques
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div
                            className={`rounded-lg p-2 border ${statCardBg}`}
                          >
                            <div
                              className={`text-sm font-bold ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            >
                              {user.stats?.messagesCount || 0}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-blue-300" : "text-slate-600"
                              }`}
                            >
                              Messages
                            </div>
                          </div>
                          <div
                            className={`rounded-lg p-2 border ${statCardBg}`}
                          >
                            <div
                              className={`text-sm font-bold ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            >
                              {user.stats?.contactsCount || 0}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-blue-300" : "text-slate-600"
                              }`}
                            >
                              Contacts
                            </div>
                          </div>
                          <div
                            className={`rounded-lg p-2 border ${statCardBg}`}
                          >
                            <div
                              className={`text-sm font-bold ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            >
                              {user.stats?.groupsCount || 0}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-blue-300" : "text-slate-600"
                              }`}
                            >
                              Groupes
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="space-y-2 pt-3 border-t border-blue-700/30">
                      <button
                        onClick={() => router.push("/")}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-sm font-medium border ${quickActionBg}`}
                      >
                        <MessageCircle
                          className={`w-4 h-4 ${
                            isDark ? "text-cyan-400" : "text-blue-600"
                          }`}
                        />
                        <span>Conversations</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne de droite - Contenu principal */}
              <div className="lg:w-2/3 xl:w-3/4 flex-1">
                <div
                  className={`rounded-2xl shadow-lg border overflow-hidden min-h-[600px] ${cardBg}`}
                >
                  {/* En-tête du contenu */}
                  <div className={`p-4 border-b ${contentHeaderBg}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className={`text-lg font-bold ${textPrimary}`}>
                          Informations personnelles
                        </h2>
                        <p className={`text-sm mt-1 ${textSecondary}`}>
                          Gérez vos informations de profil
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contenu scrollable */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Colonne gauche - Informations de base */}
                      <div className="space-y-4">
                        <div
                          className={`rounded-xl p-4 border ${detailCardBg}`}
                        >
                          <label
                            className={`flex items-center text-sm font-medium mb-3 ${
                              isDark ? "text-blue-200" : "text-slate-700"
                            }`}
                          >
                            <User
                              className={`w-4 h-4 mr-2 ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            />
                            Nom complet
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm ${inputBg}`}
                              placeholder="Votre nom complet"
                            />
                          ) : (
                            <p
                              className={`font-semibold text-lg ${textPrimary}`}
                            >
                              {formData.name}
                            </p>
                          )}
                        </div>

                        <div
                          className={`rounded-xl p-4 border ${detailCardBg}`}
                        >
                          <label
                            className={`flex items-center text-sm font-medium mb-3 ${
                              isDark ? "text-blue-200" : "text-slate-700"
                            }`}
                          >
                            <Mail
                              className={`w-4 h-4 mr-2 ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            />
                            Adresse email
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm ${inputBg}`}
                              placeholder="votre@email.com"
                            />
                          ) : (
                            <p
                              className={`font-semibold text-lg ${textPrimary}`}
                            >
                              {formData.email}
                            </p>
                          )}
                        </div>

                        {/* Section activité récente */}
                        <div
                          className={`rounded-xl p-4 border ${activityCardBg}`}
                        >
                          <h3
                            className={`flex items-center text-sm font-bold mb-3 ${
                              isDark ? "text-blue-200" : "text-slate-800"
                            }`}
                          >
                            <ActivityIcon
                              className={`w-4 h-4 mr-2 ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            />
                            Activité récente
                          </h3>
                          <div className="space-y-2">
                            {recentActivity.map((activity) => {
                              const IconComponent = activity.icon;
                              return (
                                <div
                                  key={activity.id}
                                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                                    isDark
                                      ? "hover:bg-blue-800/50"
                                      : "hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent
                                      className={`w-3 h-3 ${
                                        isDark
                                          ? "text-blue-400"
                                          : "text-slate-500"
                                      }`}
                                    />
                                    <span
                                      className={`text-xs ${
                                        isDark
                                          ? "text-blue-300"
                                          : "text-slate-700"
                                      }`}
                                    >
                                      {activity.action}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-xs ${
                                      isDark
                                        ? "text-blue-400"
                                        : "text-slate-500"
                                    }`}
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
                        <div
                          className={`rounded-xl p-4 border ${detailCardBg}`}
                        >
                          <label
                            className={`flex items-center text-sm font-medium mb-3 ${
                              isDark ? "text-blue-200" : "text-slate-700"
                            }`}
                          >
                            <User
                              className={`w-4 h-4 mr-2 ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            />
                            Bio
                          </label>
                          {isEditing ? (
                            <textarea
                              name="bio"
                              value={formData.bio}
                              onChange={handleInputChange}
                              rows={3}
                              className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent transition-all text-sm resize-none ${inputBg}`}
                              placeholder="Décrivez-vous en quelques mots..."
                            />
                          ) : (
                            <p
                              className={`leading-relaxed text-sm ${
                                isDark ? "text-blue-300" : "text-slate-700"
                              }`}
                            >
                              {formData.bio || "Aucune bio renseignée"}
                            </p>
                          )}
                        </div>

                        <div className={`rounded-xl p-4 border ${statCardBg}`}>
                          <h3
                            className={`flex items-center text-sm font-bold mb-3 ${
                              isDark ? "text-blue-200" : "text-slate-800"
                            }`}
                          >
                            <Clock
                              className={`w-4 h-4 mr-2 ${
                                isDark ? "text-cyan-400" : "text-blue-600"
                              }`}
                            />
                            Statut et activité
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span
                                className={
                                  isDark ? "text-blue-300" : "text-slate-600"
                                }
                              >
                                Statut:
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                                <span
                                  className={`font-semibold ${
                                    isDark ? "text-cyan-400" : "text-cyan-600"
                                  }`}
                                >
                                  En ligne
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className={
                                  isDark ? "text-blue-300" : "text-slate-600"
                                }
                              >
                                Membre depuis:
                              </span>
                              <span
                                className={`font-medium ${
                                  isDark ? "text-blue-200" : "text-slate-700"
                                }`}
                              >
                                {new Date(
                                  user.createdAt || Date.now()
                                ).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className={
                                  isDark ? "text-blue-300" : "text-slate-600"
                                }
                              >
                                Série active:
                              </span>
                              <div className="flex items-center gap-1">
                                <Calendar
                                  className={`w-3 h-3 ${
                                    isDark
                                      ? "text-orange-400"
                                      : "text-orange-500"
                                  }`}
                                />
                                <span
                                  className={`font-semibold ${
                                    isDark
                                      ? "text-orange-400"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {userStats.streak} jours
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
