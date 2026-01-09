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
  Lock,
  Globe,
  Briefcase,
  Home,
} from "lucide-react";
import VerifyCode from "@/components/Auth/VerifyCode";
import { requestEmailChange, confirmEmailChange } from "@/lib/api";

// Composant Badge animé
const AnimatedBadge = ({ icon: Icon, label, value, color, isDark }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
      isDark
        ? "bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 hover:border-cyan-500/50"
        : "bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:border-blue-400"
    }`}
  >
    {/* Effet de brillance au survol */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div
        className={`absolute inset-0 bg-gradient-to-r ${color} opacity-5`}
      ></div>
    </div>

    <div className="relative flex items-center gap-3">
      <div
        className={`p-3 rounded-xl ${
          isDark ? "bg-blue-800/50" : "bg-blue-100"
        } transition-transform group-hover:scale-110`}
      >
        <Icon
          className={`w-5 h-5 ${color.replace("from-", "text-").split(" ")[0]}`}
        />
      </div>
      <div>
        <p
          className={`text-xs font-medium ${
            isDark ? "text-blue-300" : "text-slate-500"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-lg font-bold ${
            isDark ? "text-white" : "text-slate-800"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  </div>
);

// Composant Activité avec animation
const ActivityItem = ({ activity, isDark }) => {
  const Icon = activity.icon;
  return (
    <div
      className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
        isDark
          ? "bg-blue-800/30 hover:bg-blue-800/50 border border-blue-700/50"
          : "bg-white hover:bg-blue-50 border border-blue-100"
      }`}
    >
      <div
        className={`p-2 rounded-lg transition-all duration-300 ${
          isDark
            ? "bg-cyan-500/20 group-hover:bg-cyan-500/30"
            : "bg-cyan-100 group-hover:bg-cyan-200"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}
        />
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            isDark ? "text-blue-100" : "text-slate-700"
          }`}
        >
          {activity.action}
        </p>
        <p className={`text-xs ${isDark ? "text-blue-400" : "text-slate-500"}`}>
          Il y a {activity.time}
        </p>
      </div>
      <div
        className={`w-2 h-2 rounded-full ${
          isDark ? "bg-cyan-400/50" : "bg-cyan-500/50"
        } group-hover:scale-150 transition-transform`}
      ></div>
    </div>
  );
};

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
  const [showVerify, setShowVerify] = useState(false);
  const [tempEmail, setTempEmail] = useState("");

  // Styles dynamiques améliorés
  const pageBg = isDark
    ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-slate-900 to-black"
    : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-white";

  const cardBg = isDark
    ? "bg-gradient-to-br from-blue-900/40 via-blue-900/20 to-transparent backdrop-blur-xl border-blue-700/30 shadow-2xl"
    : "bg-white/80 backdrop-blur-xl border-blue-100 shadow-xl";

  const headerBg = isDark
    ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-[length:200%_100%] animate-gradient"
    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_100%] animate-gradient";

  const buttonPrimary = isDark
    ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50";

  const inputStyle = isDark
    ? "bg-blue-900/30 border-blue-700/50 text-white placeholder-blue-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
    : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  const recentActivity = [
    { id: 1, action: "A partagé un clip", time: "2 min", icon: Zap },
    { id: 2, action: "A rejoint un groupe", time: "1 h", icon: Users },
    { id: 3, action: "A aimé un message", time: "3 h", icon: Heart },
    { id: 4, action: "A créé un clip", time: "5 h", icon: Zap },
  ];

  const userStats = {
    posts: 142,
    followers: 1248,
    following: 432,
    likes: 3891,
  };

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target.result);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError("Erreur lors de l'upload");
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (formData.email !== user.email) {
        await requestEmailChange(formData.email);
        setTempEmail(formData.email);
        setShowVerify(true);
        setIsLoading(false);
        return;
      }

      const dataToUpdate = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        profilePicture,
      };

      await updateProfile(dataToUpdate);
      setSuccess("✅ Profil mis à jour avec succès !");
      setIsEditing(false);
    } catch (error) {
      setError("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (code) => {
    try {
      const result = await confirmEmailChange(code);
      setUser({ ...user, email: result.data.email });
      setShowVerify(false);
      setIsEditing(false);
      setSuccess("Email mis à jour !");
    } catch (error) {
      setError("Code incorrect");
    }
  };

  if (showVerify) {
    return (
      <div
        className={`min-h-screen ${pageBg} flex items-center justify-center p-4`}
      >
        <VerifyCode
          email={tempEmail}
          type="email-change"
          onVerify={handleVerify}
          onResend={() => requestEmailChange(tempEmail)}
          onBack={() => setShowVerify(false)}
        />
      </div>
    );
  }

  if (!isMounted || !user) {
    return (
      <div
        className={`min-h-screen ${pageBg} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div
              className={`absolute inset-0 rounded-full border-4 ${
                isDark ? "border-blue-800/30" : "border-blue-200"
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
    <div className={`min-h-screen ${pageBg} transition-colors duration-300`}>
      {/* Animation CSS pour le gradient */}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header avec bouton retour */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${buttonPrimary}`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${buttonPrimary}`}
            >
              <Edit3 className="w-5 h-5" />
              Modifier le profil
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${buttonPrimary} disabled:opacity-50`}
              >
                <Save className="w-5 h-5" />
                {isLoading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}
        </div>

        {/* Alertes */}
        {(error || success) && (
          <div
            className={`mb-6 p-4 rounded-xl border-l-4 animate-in slide-in-from-top ${
              error
                ? isDark
                  ? "bg-red-900/20 border-red-500 text-red-300"
                  : "bg-red-50 border-red-500 text-red-700"
                : isDark
                ? "bg-green-900/20 border-green-500 text-green-300"
                : "bg-green-50 border-green-500 text-green-700"
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Card Profil Principal */}
            <div className={`rounded-3xl overflow-hidden border ${cardBg}`}>
              {/* Header avec dégradé */}
              <div className={`relative h-32 ${headerBg}`}>
                <div className="absolute inset-0 bg-black/10"></div>
                {/* Pattern décoratif */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                </div>
              </div>

              {/* Photo de profil */}
              <div className="relative px-6 -mt-16 mb-4">
                <div className="relative w-32 h-32 mx-auto">
                  <div
                    className={`absolute inset-0 rounded-2xl ${
                      isDark
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                        : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    } p-1 shadow-2xl`}
                  >
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-800">
                      {profilePicture ? (
                        <Image
                          src={profilePicture}
                          alt={user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600">
                          <User className="w-16 h-16 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badge en ligne */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>

                  {/* Bouton Camera */}
                  {isEditing && (
                    <label
                      className={`absolute top-0 right-0 p-2 rounded-xl cursor-pointer shadow-lg transition-all hover:scale-110 ${
                        isDark
                          ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                          : "bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-200"
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                      />
                    </label>
                  )}
                </div>

                {/* Nom et email */}
                <div className="text-center mt-4">
                  <h2
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {formData.name}
                  </h2>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-blue-300" : "text-slate-600"
                    }`}
                  >
                    {formData.email}
                  </p>

                  {/* Badge vérifié */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        isDark
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-cyan-100 text-cyan-700"
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      Vérifié
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-6">
                  <p
                    className={`text-sm text-center leading-relaxed ${
                      isDark ? "text-blue-200" : "text-slate-600"
                    }`}
                  >
                    {formData.bio || "Aucune bio renseignée"}
                  </p>
                </div>
              </div>

              {/* Action rapides */}
              <div className="p-6 pt-0 space-y-3">
                <div className="grid grid-cols gap-3">
                  <button
                    onClick={() => router.push("/")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                      isDark
                        ? "bg-blue-800/50 hover:bg-blue-800 text-blue-200"
                        : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Accueil
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Contenu Principal */}
          <main className="space-y-6">
            {/* Tabs */}
            <div className={`rounded-2xl p-2 border ${cardBg}`}>
              <div className="flex gap-2">
                {[{ id: "profile", label: "Informations", icon: User }].map(
                  (tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                          activeTab === tab.id
                            ? isDark
                              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                            : isDark
                            ? "text-blue-300 hover:bg-blue-800/50"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Contenu des tabs */}
            {activeTab === "profile" && (
              <div className={`rounded-2xl border ${cardBg}`}>
                <div
                  className={`p-6 border-b ${
                    isDark ? "border-blue-700/30" : "border-slate-200"
                  }`}
                >
                  <h2
                    className={`text-xl font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Informations personnelles
                  </h2>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-blue-300" : "text-slate-600"
                    }`}
                  >
                    Gérez vos informations de profil
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Champs de formulaire stylés */}
                  {[
                    {
                      label: "Nom complet",
                      name: "name",
                      type: "text",
                      icon: User,
                    },
                    {
                      label: "Adresse email",
                      name: "email",
                      type: "email",
                      icon: Mail,
                    },
                    {
                      label: "Téléphone",
                      name: "phone",
                      type: "tel",
                      icon: Phone,
                    },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.name} className="space-y-2">
                        <label
                          className={`flex items-center gap-2 text-sm font-semibold ${
                            isDark ? "text-blue-200" : "text-slate-700"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {field.label}
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type={field.type}
                              name={field.name}
                              value={formData[field.name]}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none ${inputStyle}`}
                              placeholder={`Entrez votre ${field.label.toLowerCase()}`}
                            />
                          </div>
                        ) : (
                          <div
                            className={`px-4 py-3 rounded-xl border ${
                              isDark
                                ? "bg-blue-900/20 border-blue-700/30 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-900"
                            }`}
                          >
                            {formData[field.name] || "Non renseigné"}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bio */}
                  <div className="space-y-2">
                    <label
                      className={`flex items-center gap-2 text-sm font-semibold ${
                        isDark ? "text-blue-200" : "text-slate-700"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Biographie
                    </label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none resize-none ${inputStyle}`}
                        placeholder="Parlez-nous de vous..."
                      />
                    ) : (
                      <div
                        className={`px-4 py-3 rounded-xl border ${
                          isDark
                            ? "bg-blue-900/20 border-blue-700/30 text-blue-100"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        {formData.bio || "Aucune biographie"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
